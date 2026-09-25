// Helper utility to convert Base64 raw PCM (16-bit little endian, mono, 24kHz) to a valid standard WAV Blob

export function pcmBase64ToWavBlob(base64Data: string, sampleRate = 24000, numChannels = 1): Blob {
  const binaryString = window.atob(base64Data);
  const len = binaryString.length;
  const pcmBytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    pcmBytes[i] = binaryString.charCodeAt(i);
  }

  const byteRate = sampleRate * numChannels * 2; // 16-bit = 2 bytes per sample
  const blockAlign = numChannels * 2;
  const dataSize = pcmBytes.length;
  const headerSize = 44;
  const totalSize = headerSize + dataSize;

  const wavBuffer = new ArrayBuffer(totalSize);
  const view = new DataView(wavBuffer);

  // RIFF identifier
  writeString(view, 0, 'RIFF');
  // RIFF chunk length (file size - 8)
  view.setUint32(4, 36 + dataSize, true);
  // RIFF type
  writeString(view, 8, 'WAVE');
  // format chunk identifier
  writeString(view, 12, 'fmt ');
  // format chunk length
  view.setUint32(16, 16, true);
  // sample format (1 = PCM)
  view.setUint16(20, 1, true);
  // channel count
  view.setUint16(22, numChannels, true);
  // sample rate
  view.setUint32(24, sampleRate, true);
  // byte rate (sample rate * block align)
  view.setUint32(28, byteRate, true);
  // block align (channel count * bytes per sample)
  view.setUint16(32, blockAlign, true);
  // bits per sample
  view.setUint16(34, 16, true);
  // data chunk identifier
  writeString(view, 36, 'data');
  // data chunk length
  view.setUint32(40, dataSize, true);

  // Copy raw PCM bytes
  new Uint8Array(wavBuffer, headerSize).set(pcmBytes);

  return new Blob([wavBuffer], { type: 'audio/wav' });
}

/**
 * Calculates exact audio duration in seconds from Base64 PCM data
 */
export function getPcmDuration(base64Data: string, sampleRate = 24000, numChannels = 1): number {
  try {
    const binaryString = window.atob(base64Data);
    const dataSize = binaryString.length;
    const bytesPerSample = 2 * numChannels; // 16-bit PCM
    return dataSize / (sampleRate * bytesPerSample);
  } catch {
    return 0;
  }
}

function writeString(view: DataView, offset: number, string: string): void {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

/**
 * Trigger browser file download from Blob
 */
export function triggerFileDownload(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 500);
}

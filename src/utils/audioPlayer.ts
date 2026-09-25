// Advanced audio service supporting Gemini TTS with:
// 1. Permanent filesystem caching in /audio/*.wav
// 2. Client-side IndexedDB caching as local instant backup
// 3. Audio downloading as standard .wav file
// 4. Time tracking & persistent state across tabs
// 5. Browser Arabic Web Speech fallback

import { pcmBase64ToWavBlob, triggerFileDownload, getPcmDuration } from './wavConverter.ts';
import { aiUsageService } from './aiUsageService.ts';

const DB_NAME = 'selah_audio_cache_db';
const STORE_NAME = 'audio_wav_store';

function openAudioDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'key' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export interface VoiceOption {
  id: string;
  nameAr: string;
  nameEn: string;
  badge: string;
  description: string;
  gender: 'male' | 'female';
  tone: string;
}

export const PRESET_VOICES: VoiceOption[] = [
  {
    id: 'Zephyr',
    nameAr: 'سلمى',
    nameEn: 'Salma',
    badge: 'فصيحة وهادئة',
    description: 'صوت نسائي هادئ ونقي، مخارج حروف واضحة جداً، مثالي لنصوص القراءة والدروس النموذجية والقواعد.',
    gender: 'female',
    tone: 'متزن وتعليمي',
  },
  {
    id: 'Puck',
    nameAr: 'بلال',
    nameEn: 'Bilal',
    badge: 'شاب حيوي ومعبر',
    description: 'صوت شبابي مفعم بالحيوية والتشويق، رائع لقصص الأطفال ومحاكاة نبرة التلاميذ والتفاعل القصصي.',
    gender: 'male',
    tone: 'حيوي ومشوق',
  },
  {
    id: 'Charon',
    nameAr: 'فاروق',
    nameEn: 'Farouq',
    badge: 'وقور وجهوري',
    description: 'صوت رخيم عميق ودافئ، يعبر ببراعة عن نبرة المعلم الحكيم والنصوص التراثية والخطب والآباء.',
    gender: 'male',
    tone: 'وقور ورصين',
  },
  {
    id: 'Kore',
    nameAr: 'فاطمة',
    nameEn: 'Fatima',
    badge: 'إيضاحية متزنة',
    description: 'صوت نسائي مهني فصيح، مناسب للشرح المدرسي والتعليمات والإملاء والتدريبات اللغوية.',
    gender: 'female',
    tone: 'واضح وشرحي',
  },
  {
    id: 'Fenrir',
    nameAr: 'حمزة',
    nameEn: 'Hamza',
    badge: 'قوي وحماسي',
    description: 'صوت فخم ذو طاقة عالية، ممتاز للأشعار الحماسية والنصوص الوطنية والمواقف البطولية.',
    gender: 'male',
    tone: 'قوي ومؤثر',
  },
];

async function deleteFromIDB(key: string): Promise<void> {
  try {
    const db = await openAudioDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.delete(key);
  } catch (e) {
    console.warn('IDB delete failed:', e);
  }
}

async function getFromIDB(key: string): Promise<Blob | null> {
  try {
    const db = await openAudioDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(key);
      req.onsuccess = () => {
        resolve(req.result ? req.result.blob : null);
      };
      req.onerror = () => resolve(null);
    });
  } catch (e) {
    return null;
  }
}

async function saveToIDB(key: string, blob: Blob): Promise<void> {
  try {
    const db = await openAudioDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.put({ key, blob, timestamp: Date.now() });
  } catch (e) {
    console.warn('IDB audio save failed:', e);
  }
}

export interface CustomTextSegmentOption {
  id?: string;
  text: string;
  speaker: string;
  voice: string;
}

export interface SpeakOptions {
  voice?: string;
  lessonId?: string;
  lessonTitle?: string;
  isVocabulary?: boolean; // When true, plays discretely without triggering the global lesson player
  word?: string;          // Specific word token being pronounced
  rate?: number;          // Reading speed (0.8, 1.0, 1.2)
  forceRegenerate?: boolean; // Clear cache and re-synthesize fresh audio
  multiSpeaker?: boolean; // Multi-voice expressive reading between characters
  speaker1Voice?: string; // Voice for Narrator / Teacher
  speaker2Voice?: string; // Voice for Character / Student
  customSegments?: CustomTextSegmentOption[]; // Dynamic parts of text mapped to character voices
  characterVoiceMap?: Record<string, string>; // Mapping of character name to voice
  activeSpeakerName?: string;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (err: any) => void;
  onProgress?: (currentTime: number, duration: number) => void;
}

export interface QuotaExceededDetails {
  service: 'tts';
  message?: string;
  retryDelay?: string;
  lessonTitle?: string;
  text?: string;
}

export type QuotaExceededHandler = (details: QuotaExceededDetails) => Promise<boolean>;

export interface AudioPlaybackState {
  isPlaying: boolean;
  isLoading: boolean;
  lessonTitle: string;
  currentTime: number;
  duration: number;
  engine: 'gemini' | 'browser' | 'saved_file' | null;
  hasCachedAudio: boolean;
  audioUrl?: string;
  isVocabulary?: boolean; // Indicates if current playback is a discrete dictionary word
  activeWord?: string;    // The active dictionary word if any
  voice?: string;
  rate?: number;
  isMultiSpeaker?: boolean;
  activeSpeakerName?: string;
  activeSpeakerVoice?: string;
  currentSegmentIndex?: number;
  totalSegments?: number;
  isQuotaFallback?: boolean; // True when falling back to browser due to Gemini quota exhaustion
}

type AudioStateListener = (state: AudioPlaybackState) => void;

class GeminiAudioService {
  private audioContext: AudioContext | null = null;
  private currentSource: AudioBufferSourceNode | null = null;
  private currentHtmlAudio: HTMLAudioElement | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;

  private quotaExceededHandler: QuotaExceededHandler | null = null;
  private isQuotaFallbackActive: boolean = false;

  private isPlayingAudio: boolean = false;
  private isLoadingAudio: boolean = false;
  private isVocabularyAudio: boolean = false;
  private currentActiveWord: string = '';
  private currentLessonTitle: string = '';
  private currentText: string = '';
  private currentLessonId: string = '';
  private currentVoice: string = 'Zephyr';
  private currentRate: number = 1.0;
  private isMultiSpeakerMode: boolean = false;
  private currentSpeaker1Voice: string = 'Charon';
  private currentSpeaker2Voice: string = 'Puck';
  private currentDuration: number = 0;
  private currentPosition: number = 0;
  private currentEngine: 'gemini' | 'browser' | 'saved_file' | null = null;
  private currentActiveSpeakerName: string = '';
  private currentActiveSpeakerVoice: string = '';
  private currentSegmentIndex: number = 0;
  private totalSegments: number = 0;
  private segmentTimeout: any = null;
  private progressInterval: any = null;

  // Concurrency and race-condition guards to prevent multiple sounds and guarantee replacement
  private currentRequestId: number = 0;
  private currentAbortController: AbortController | null = null;

  private listeners: Set<AudioStateListener> = new Set();

  // Isolated dedicated channel for vocabulary words - NEVER affects global player
  private vocabAudioElement: HTMLAudioElement | null = null;
  private vocabUtterance: SpeechSynthesisUtterance | null = null;
  private activeVocabWord: string | null = null;
  private isVocabPlaying: boolean = false;
  private vocabRequestId: number = 0;
  private vocabListeners: Set<(word: string | null, isPlaying: boolean) => void> = new Set();

  private getAudioContext(): AudioContext {
    if (!this.audioContext) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.audioContext = new AudioCtx({ sampleRate: 24000 });
    }
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
    return this.audioContext;
  }

  public subscribe(listener: AudioStateListener): () => void {
    this.listeners.add(listener);
    // Send initial state asynchronously on next microtask to prevent React synchronous setState render loop
    Promise.resolve().then(() => {
      if (this.listeners.has(listener)) {
        try {
          listener(this.getState());
        } catch (err) {
          console.error('Audio listener error:', err);
        }
      }
    });
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(): void {
    const state = this.getState();
    this.listeners.forEach((fn) => {
      try {
        fn(state);
      } catch (err) {
        console.error('Audio listener error:', err);
      }
    });
  }

  public setQuotaExceededHandler(handler: QuotaExceededHandler | null): void {
    this.quotaExceededHandler = handler;
  }

  public getState(): AudioPlaybackState {
    return {
      isPlaying: this.isPlayingAudio,
      isLoading: this.isLoadingAudio,
      lessonTitle: this.currentLessonTitle,
      currentTime: this.currentPosition,
      duration: this.currentDuration,
      engine: this.currentEngine,
      hasCachedAudio: false,
      audioUrl: this.currentHtmlAudio?.src || undefined,
      isVocabulary: this.isVocabularyAudio,
      activeWord: this.currentActiveWord,
      voice: this.currentVoice,
      rate: this.currentRate,
      isMultiSpeaker: this.isMultiSpeakerMode,
      activeSpeakerName: this.currentActiveSpeakerName,
      activeSpeakerVoice: this.currentActiveSpeakerVoice,
      currentSegmentIndex: this.currentSegmentIndex,
      totalSegments: this.totalSegments,
      isQuotaFallback: this.isQuotaFallbackActive,
    };
  }

  public setRate(rate: number): void {
    this.currentRate = rate;
    if (this.currentHtmlAudio) {
      this.currentHtmlAudio.playbackRate = rate;
    }
    this.notify();
  }

  // Quick voice preview without opening or affecting the main player
  public async previewVoice(voiceName: string): Promise<void> {
    const samples: Record<string, string> = {
      Zephyr: 'مَرْحَبًا بِكُمْ، أَنَا صَوْتُ سَلْمَى الفَصِيحُ الهَادِئُ لِسِلَاحِ التِّلْمِيذِ.',
      Puck: 'أَهْلًا يَا أَصْدِقَائِي! أَنَا بِلَال، هَيَّا بِنَا نَقْرَأُ القِصَّةَ بِنَبْرَةٍ حَيَوِيَّةٍ وَمُشَوِّقَةٍ!',
      Charon: 'أَهْلًا بِكُم، أَنَا فَارُوق، صَوْتٌ وَقُورٌ وَرَصِينٌ لِلْحِكَمِ وَالنُّصُوصِ التُّرَاثِيَّةِ.',
      Aoede: 'مَرْحَبًا بِكُمْ، أَنَا مَرْيَم، صَوْتٌ رَقِيقٌ وَعَذْبٌ لِلأَشْعَارِ وَالأَنَاشِيدِ الجَمِيلَةِ.',
      Kore: 'مَرْحَبًا يَا أَبْطَالَ اللُّغَةِ العَرَبِيَّةِ، أَنَا فَاطِمَة، مَعًا نَشْرَحُ قَوَاعِدَ الدَّرْسِ بِوُضُوحٍ.',
      Fenrir: 'أَنَا حَمْزَة! بِالعَزِيمَةِ وَالإِصْرَارِ نَصْنَعُ مَجْدَ لُغَتِنَا العَرَبِيَّةِ الخَالِدَةِ!',
    };
    const phrase = samples[voiceName] || 'مَرْحَبًا بِكُمْ فِي مَنَصَّةِ سِلَاحِ التِّلْمِيذِ!';
    await this.speakWord(phrase, { voice: voiceName });
  }

  // Quick segment preview with character-specific voice
  public async previewSegment(text: string, voiceName: string): Promise<void> {
    const previewText = text.slice(0, 140);
    await this.speakWord(previewText, { voice: voiceName });
  }

  private startProgressTimer(getDuration: () => number, getCurrentTime: () => number): void {
    this.stopProgressTimer();
    this.progressInterval = setInterval(() => {
      const dur = getDuration();
      if (dur !== undefined && !isNaN(dur) && isFinite(dur) && dur > 0) {
        this.currentDuration = dur;
      }
      const cur = getCurrentTime();
      if (cur !== undefined && !isNaN(cur) && isFinite(cur)) {
        this.currentPosition = cur;
      }
      this.notify();
    }, 150);
  }

  private stopProgressTimer(): void {
    if (this.progressInterval) {
      clearInterval(this.progressInterval);
      this.progressInterval = null;
    }
  }

  // Convert Base64 raw PCM (16-bit little endian, mono, 24kHz) to AudioBuffer
  public pcmToAudioBuffer(base64Data: string, sampleRate = 24000): AudioBuffer {
    const binary = window.atob(base64Data);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }

    const int16Array = new Int16Array(bytes.buffer);
    const float32Array = new Float32Array(int16Array.length);

    for (let i = 0; i < int16Array.length; i++) {
      float32Array[i] = int16Array[i] / 32768;
    }

    const ctx = this.getAudioContext();
    const audioBuffer = ctx.createBuffer(1, float32Array.length, sampleRate);
    audioBuffer.getChannelData(0).set(float32Array);
    return audioBuffer;
  }

  // Expressive multi-character speech synthesis: dynamically switches voices, pitch, and timbre per character role
  private playExpressiveSegments(
    segments: CustomTextSegmentOption[],
    options?: SpeakOptions,
    requestId?: number
  ): void {
    if (requestId !== undefined && requestId !== this.currentRequestId) {
      return;
    }
    if (!('speechSynthesis' in window)) {
      if (options?.onEnd) options.onEnd();
      return;
    }

    try {
      window.speechSynthesis.cancel();
    } catch (e) {
      // ignore
    }

    if (this.segmentTimeout) {
      clearTimeout(this.segmentTimeout);
      this.segmentTimeout = null;
    }

    const validSegments = segments.filter((s) => s.text && s.text.trim().length > 0);
    if (validSegments.length === 0) {
      if (options?.onEnd) options.onEnd();
      return;
    }

    this.totalSegments = validSegments.length;
    this.currentSegmentIndex = 0;
    this.currentEngine = 'browser';
    this.isMultiSpeakerMode = true;
    this.isPlayingAudio = true;
    this.isLoadingAudio = false;

    // Approximate duration: ~0.12 sec per character
    const totalChars = validSegments.reduce((acc, s) => acc + (s.text || '').length, 0);
    this.currentDuration = Math.max(10, Math.round(totalChars * 0.12));
    this.currentPosition = 0;

    const voices = window.speechSynthesis.getVoices();
    const arVoices = voices.filter(
      (v) => v.lang.startsWith('ar') || v.name.includes('Arabic') || v.name.includes('عربي')
    );

    const femaleVoice =
      arVoices.find((v) => /female|salma|zari|laila|mariam|hoda/i.test(v.name)) || arVoices[0];
    const maleVoice =
      arVoices.find((v) => /male|shakir|maged|tarik|naayf|hamza/i.test(v.name)) ||
      (arVoices.length > 1 ? arVoices[1] : arVoices[0]);

    const playSegmentAtIndex = (index: number) => {
      if (requestId !== undefined && requestId !== this.currentRequestId) {
        return;
      }
      if (index >= validSegments.length) {
        // Finished all segments
        this.isPlayingAudio = false;
        this.currentActiveSpeakerName = '';
        this.currentActiveSpeakerVoice = '';
        this.stopProgressTimer();
        this.notify();
        if (options?.onEnd) options.onEnd();
        return;
      }

      this.currentSegmentIndex = index;
      const seg = validSegments[index];
      const speakerName = (seg.speaker || 'الراوي').trim();
      const voiceName = seg.voice || 'Zephyr';

      this.currentActiveSpeakerName = speakerName;
      this.currentActiveSpeakerVoice = voiceName;
      this.notify();

      const cleanText = (seg.text || '').replace(/[*#_~]/g, '').trim();
      if (!cleanText) {
        playSegmentAtIndex(index + 1);
        return;
      }

      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = 'ar-SA';

      // Expressive persona adaptation: customize pitch & speed to mimic character personality
      const baseRate = options?.rate || this.currentRate || 1.0;
      switch (voiceName) {
        case 'Charon': // فاروق - وقور ورصين وعميق
          utterance.pitch = 0.72;
          utterance.rate = baseRate * 0.88;
          if (maleVoice) utterance.voice = maleVoice;
          break;
        case 'Fenrir': // حمزة - جهوري وحماسي وقوي
          utterance.pitch = 0.82;
          utterance.rate = baseRate * 0.96;
          if (maleVoice) utterance.voice = maleVoice;
          break;
        case 'Puck': // بلال - تلميذ حيوي وشبابي ومشوق
          utterance.pitch = 1.32;
          utterance.rate = baseRate * 1.05;
          if (maleVoice) utterance.voice = maleVoice;
          break;
        case 'Aoede': // مريم - رقيقة وشاعرية وهادئة
          utterance.pitch = 1.20;
          utterance.rate = baseRate * 0.88;
          if (femaleVoice) utterance.voice = femaleVoice;
          break;
        case 'Kore': // فاطمة - إيضاحية وتعليمية متزنة
          utterance.pitch = 1.08;
          utterance.rate = baseRate * 0.95;
          if (femaleVoice) utterance.voice = femaleVoice;
          break;
        case 'Zephyr': // سلمى - فصيحة وهادئة
        default:
          utterance.pitch = 0.98;
          utterance.rate = baseRate * 0.92;
          if (femaleVoice) utterance.voice = femaleVoice;
          break;
      }

      utterance.onstart = () => {
        if (requestId !== undefined && requestId !== this.currentRequestId) {
          try {
            window.speechSynthesis.cancel();
          } catch (e) {}
          return;
        }
        if (index === 0 && options?.onStart) {
          options.onStart();
        }
      };

      utterance.onend = () => {
        if (requestId !== undefined && requestId !== this.currentRequestId) return;
        // Natural dialogue turn pause ~180ms
        this.segmentTimeout = setTimeout(() => {
          playSegmentAtIndex(index + 1);
        }, 180);
      };

      utterance.onerror = (e) => {
        console.warn('Expressive segment playback error:', e);
        if (requestId !== undefined && requestId !== this.currentRequestId) return;
        playSegmentAtIndex(index + 1);
      };

      this.currentUtterance = utterance;
      window.speechSynthesis.speak(utterance);
    };

    if (options?.onStart) options.onStart();
    this.startProgressTimer(
      () => this.currentDuration,
      () => {
        return Math.min(
          this.currentDuration,
          (this.currentSegmentIndex / Math.max(1, validSegments.length)) * this.currentDuration
        );
      }
    );

    playSegmentAtIndex(0);
  }

  // Fallback to browser Arabic Speech Synthesis
  private playWebSpeech(text: string, onStart?: () => void, onEnd?: () => void, requestId?: number): void {
    if (requestId !== undefined && requestId !== this.currentRequestId) {
      return;
    }
    if (!('speechSynthesis' in window)) {
      if (onEnd) onEnd();
      return;
    }

    try {
      window.speechSynthesis.cancel();
    } catch (e) {
      // ignore
    }

    const cleanText = text.replace(/[*#_~]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'ar-SA';
    utterance.rate = 0.9;

    const voices = window.speechSynthesis.getVoices();
    const arVoice = voices.find(
      (v) => v.lang.startsWith('ar') || v.name.includes('Arabic') || v.name.includes('عربي')
    );
    if (arVoice) {
      utterance.voice = arVoice;
    }

    utterance.onstart = () => {
      if (requestId !== undefined && requestId !== this.currentRequestId) {
        try { window.speechSynthesis.cancel(); } catch (e) {}
        return;
      }
      this.isPlayingAudio = true;
      this.isLoadingAudio = false;
      this.currentEngine = 'browser';
      this.notify();
      if (onStart) onStart();
    };

    utterance.onend = () => {
      if (requestId === undefined || this.currentRequestId === requestId) {
        this.isPlayingAudio = false;
        this.isVocabularyAudio = false;
        this.currentActiveWord = '';
        this.currentUtterance = null;
        this.stopProgressTimer();
        this.notify();
      }
      if (onEnd) onEnd();
    };

    utterance.onerror = () => {
      if (requestId === undefined || this.currentRequestId === requestId) {
        this.isPlayingAudio = false;
        this.isVocabularyAudio = false;
        this.currentActiveWord = '';
        this.currentUtterance = null;
        this.stopProgressTimer();
        this.notify();
      }
      if (onEnd) onEnd();
    };

    this.currentUtterance = utterance;
    window.speechSynthesis.speak(utterance);
  }

  // Check if an audio file is already cached either on server filesystem or local browser store
  public async checkAudioCached(
    text: string,
    voice = 'Zephyr',
    lessonId?: string
  ): Promise<{ cached: boolean; audioUrl?: string }> {
    // 1. Check local IDB first
    const localKey = `${lessonId || 'general'}_${voice}_${text.slice(0, 40)}`;
    const localBlob = await getFromIDB(localKey);
    if (localBlob) {
      return { cached: true, audioUrl: URL.createObjectURL(localBlob) };
    }

    // 2. Check server /api/audio-status
    try {
      const resp = await fetch('/api/audio-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voice, lessonId }),
      });
      if (resp.ok) {
        const data = await resp.json();
        if (data.exists && data.audioUrl) {
          return { cached: true, audioUrl: data.audioUrl };
        }
      }
    } catch (e) {
      // offline or silent
    }

    return { cached: false };
  }

  // Vocabulary-specific subscription and notification
  public subscribeVocab(listener: (word: string | null, isPlaying: boolean) => void): () => void {
    this.vocabListeners.add(listener);
    Promise.resolve().then(() => {
      if (this.vocabListeners.has(listener)) {
        try {
          listener(this.activeVocabWord, this.isVocabPlaying);
        } catch (e) {
          console.error('Vocab listener error:', e);
        }
      }
    });
    return () => {
      this.vocabListeners.delete(listener);
    };
  }

  private notifyVocab(): void {
    this.vocabListeners.forEach((fn) => {
      try {
        fn(this.activeVocabWord, this.isVocabPlaying);
      } catch (e) {
        console.error('Vocab listener error:', e);
      }
    });
  }

  public stopWord(): void {
    this.vocabRequestId++;
    if (this.vocabAudioElement) {
      try {
        this.vocabAudioElement.pause();
        this.vocabAudioElement.removeAttribute('src');
        this.vocabAudioElement.load();
      } catch (e) {
        // ignore
      }
      this.vocabAudioElement = null;
    }
    if (this.vocabUtterance && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch (e) {
        // ignore
      }
      this.vocabUtterance = null;
    }
    this.activeVocabWord = null;
    this.isVocabPlaying = false;
    this.notifyVocab();
  }

  // Dedicated discrete vocabulary pronunciation (does not open or affect the global audio player)
  public async speakWord(
    wordOrPhrase: string,
    options?: {
      voice?: string;
      lessonId?: string;
      word?: string;
      onStart?: () => void;
      onEnd?: () => void;
      onError?: () => void;
    }
  ): Promise<'gemini' | 'browser' | 'saved_file'> {
    this.stopWord();
    const reqId = ++this.vocabRequestId;
    const wordKey = options?.word || wordOrPhrase;
    this.activeVocabWord = wordKey;
    this.isVocabPlaying = true;
    this.notifyVocab();

    if (options?.onStart) options.onStart();

    const voice = options?.voice || this.currentVoice || 'Zephyr';
    const lessonId = options?.lessonId || 'vocab';

    const handleEnded = () => {
      if (this.vocabRequestId === reqId) {
        this.isVocabPlaying = false;
        this.activeVocabWord = null;
        this.notifyVocab();
      }
      if (options?.onEnd) options.onEnd();
    };

    const handleError = () => {
      if (this.vocabRequestId === reqId) {
        this.isVocabPlaying = false;
        this.activeVocabWord = null;
        this.notifyVocab();
      }
      if (options?.onError) options.onError();
    };

    // 1. Check local IDB cache
    const localKey = `${lessonId}_${voice}_${wordOrPhrase.slice(0, 40)}`;
    try {
      const cachedBlob = await getFromIDB(localKey);
      if (this.vocabRequestId !== reqId) return 'saved_file';

      if (cachedBlob) {
        const blobUrl = URL.createObjectURL(cachedBlob);
        return this.playVocabAudioUrl(blobUrl, reqId, handleEnded, handleError);
      }
    } catch {
      // ignore
    }

    // 2. Fetch from /api/tts
    try {
      const resp = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: wordOrPhrase.slice(0, 500),
          voice,
          lessonId,
        }),
      });

      if (this.vocabRequestId !== reqId) return 'gemini';

      if (resp.ok) {
        const data = await resp.json();
        if (this.vocabRequestId !== reqId) return 'gemini';

        const targetAudioUrl = data.dataUrl || data.audioUrl;
        if (data.cached && targetAudioUrl) {
          return this.playVocabAudioUrl(targetAudioUrl, reqId, handleEnded, handleError);
        }

        if (data?.usage) {
          aiUsageService.updateFromServerPayload(data.usage);
        } else if (!data.cached && !data.fallback) {
          aiUsageService.recordUsage('tts');
        }

        if (data.audio) {
          const wavBlob = pcmBase64ToWavBlob(data.audio, data.rate || 24000);
          saveToIDB(localKey, wavBlob);
          const blobUrl = targetAudioUrl || URL.createObjectURL(wavBlob);
          return this.playVocabAudioUrl(blobUrl, reqId, handleEnded, handleError);
        } else if (targetAudioUrl) {
          return this.playVocabAudioUrl(targetAudioUrl, reqId, handleEnded, handleError);
        }
      }
    } catch {
      // fallback to browser synthesis
    }

    if (this.vocabRequestId !== reqId) return 'browser';

    // 3. Fallback to SpeechSynthesis
    this.playVocabSpeechSynthesis(wordOrPhrase, reqId, handleEnded, handleError);
    return 'browser';
  }

  private playVocabAudioUrl(
    url: string,
    reqId: number,
    onEnd: () => void,
    onError: () => void
  ): Promise<'gemini' | 'saved_file'> {
    return new Promise((resolve) => {
      const audio = new Audio();
      audio.preload = 'auto';
      audio.src = url;

      audio.onended = () => {
        onEnd();
      };

      audio.onerror = () => {
        onError();
        resolve('saved_file');
      };

      audio.onplay = () => {
        resolve('saved_file');
      };

      this.vocabAudioElement = audio;
      audio.play().catch((err) => {
        console.warn('Vocab audio play error, falling back to speech synthesis:', err);
        this.playVocabSpeechSynthesis(this.activeVocabWord || '', reqId, onEnd, onError);
        resolve('saved_file');
      });
    });
  }

  private playVocabSpeechSynthesis(
    text: string,
    reqId: number,
    onEnd: () => void,
    onError: () => void
  ): void {
    if (!('speechSynthesis' in window)) {
      onEnd();
      return;
    }
    try {
      window.speechSynthesis.cancel();
    } catch (e) {
      // ignore
    }

    const clean = text.replace(/[*#_~]/g, '');
    const utt = new SpeechSynthesisUtterance(clean);
    utt.lang = 'ar-SA';
    utt.rate = 0.9;
    const voices = window.speechSynthesis.getVoices();
    const arVoice = voices.find(
      (v) => v.lang.startsWith('ar') || v.name.includes('Arabic') || v.name.includes('عربي')
    );
    if (arVoice) utt.voice = arVoice;

    utt.onend = () => {
      if (this.vocabRequestId === reqId) {
        onEnd();
      }
    };
    utt.onerror = () => {
      if (this.vocabRequestId === reqId) {
        onError();
      }
    };

    this.vocabUtterance = utt;
    window.speechSynthesis.speak(utt);
  }

  // Main Speak function
  public async speakText(text: string, options?: SpeakOptions): Promise<'gemini' | 'browser' | 'saved_file'> {
    // Immediately stop and invalidate any previous audio or in-flight request
    this.stop();

    const requestId = ++this.currentRequestId;
    this.currentAbortController = new AbortController();
    const abortSignal = this.currentAbortController.signal;

    const isVocab = !!options?.isVocabulary;
    this.isVocabularyAudio = isVocab;
    this.currentActiveWord = options?.word || (isVocab ? text : '');

    this.currentText = text;
    if (!isVocab) {
      this.currentLessonTitle = options?.lessonTitle || '';
      this.currentLessonId = options?.lessonId || '';
    } else if (options?.lessonId) {
      this.currentLessonId = options.lessonId;
    }
    this.currentVoice = options?.voice || this.currentVoice || 'Zephyr';
    if (options?.rate !== undefined) this.currentRate = options.rate;
    if (options?.multiSpeaker !== undefined) this.isMultiSpeakerMode = options.multiSpeaker;
    if (options?.speaker1Voice) this.currentSpeaker1Voice = options.speaker1Voice;
    if (options?.speaker2Voice) this.currentSpeaker2Voice = options.speaker2Voice;

    this.isLoadingAudio = true;
    this.isPlayingAudio = false;
    this.notify();

    if (options?.onStart) options.onStart();

    const isMulti = options?.multiSpeaker ?? this.isMultiSpeakerMode;
    const hasCustomSegments = !!(options?.customSegments && options.customSegments.length > 0);

    let voiceKey = this.currentVoice;
    if (hasCustomSegments) {
      const segTokens = options!.customSegments!
        .map((s) => `${s.speaker}:${s.voice}`)
        .join('-');
      voiceKey = `char_${segTokens.slice(0, 80)}`;
    } else if (isMulti) {
      voiceKey = `multi_${options?.speaker1Voice || this.currentSpeaker1Voice}_${options?.speaker2Voice || this.currentSpeaker2Voice}`;
    }

    const localKey = `${this.currentLessonId || 'general'}_${voiceKey}_${text.slice(0, 40)}`;

    // If forceRegenerate is requested, remove any existing local IDB cache
    if (options?.forceRegenerate) {
      await deleteFromIDB(localKey);
    } else {
      // 1. Try local IndexedDB cached WAV
      const cachedBlob = await getFromIDB(localKey);
      if (this.currentRequestId !== requestId) return 'saved_file';

      if (cachedBlob) {
        const blobUrl = URL.createObjectURL(cachedBlob);
        return this.playAudioElement(blobUrl, options, 'saved_file', requestId);
      }
    }

    // 2. Request from server with TTS / file cache
    try {
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: text.slice(0, 1800), // generous educational chunk
          voice: this.currentVoice,
          lessonId: this.currentLessonId,
          forceRegenerate: !!options?.forceRegenerate,
          multiSpeaker: isMulti || hasCustomSegments,
          speaker1Voice: options?.speaker1Voice || this.currentSpeaker1Voice,
          speaker2Voice: options?.speaker2Voice || this.currentSpeaker2Voice,
          customSegments: options?.customSegments,
          characterVoiceMap: options?.characterVoiceMap,
        }),
        signal: abortSignal,
      });

      if (this.currentRequestId !== requestId) return 'gemini';

      if (!response.ok) {
        throw new Error('TTS server returned non-ok response');
      }

      const data = await response.json();
      if (this.currentRequestId !== requestId) return 'gemini';

      if (data?.usage) {
        aiUsageService.updateFromServerPayload(data.usage);
      } else if (!data.cached && !data.fallback) {
        aiUsageService.recordUsage('tts');
      }

      // If server returned fallback (e.g. quota limit or missing key)
      if (data.fallback) {
        const isQuota = Boolean(
          data.quotaExceeded ||
          data.usage?.quotaWarning?.service === 'tts' ||
          (data.usage?.breakdown?.tts && data.usage.breakdown.tts.queries >= data.usage.breakdown.tts.limit)
        );

        if (isQuota) {
          aiUsageService.recordQuotaExceeded('tts', data?.usage?.quotaWarning?.retryDelay, data?.message);
          this.isQuotaFallbackActive = true;
          this.isLoadingAudio = false;
          this.isPlayingAudio = false;
          this.notify();

          let shouldProceedWithBrowser = true;
          if (this.quotaExceededHandler) {
            shouldProceedWithBrowser = await this.quotaExceededHandler({
              service: 'tts',
              message: data.message || 'انتهت حصة توليد الأصوات بالذكاء الاصطناعي لليوم (10 من 10 طلبات)',
              retryDelay: data.usage?.quotaWarning?.retryDelay,
              lessonTitle: this.currentLessonTitle || options?.lessonTitle,
              text,
            });
          } else if (typeof window !== 'undefined') {
            shouldProceedWithBrowser = window.confirm(
              'تنبيه: لقد استُنفدت حصة الذكاء الاصطناعي اليومية لتوليد الأصوات (Gemini Quota Limit).\n\nهل ترغب في قراءة النص عبر قارئ المتصفح الصوتي البديل؟'
            );
          }

          if (!shouldProceedWithBrowser || this.currentRequestId !== requestId) {
            this.stop();
            return 'browser';
          }
        } else {
          this.isQuotaFallbackActive = false;
        }

        if (hasCustomSegments && options?.customSegments && options.customSegments.length > 0) {
          this.playExpressiveSegments(options.customSegments, options, requestId);
        } else {
          this.playWebSpeech(text, options?.onStart, options?.onEnd, requestId);
        }
        return 'browser';
      }

      // If server returned an existing cached file URL or dataUrl directly
      const targetAudioUrl = data.audioUrl || data.dataUrl;
      if (data.cached && targetAudioUrl) {
        this.isQuotaFallbackActive = false;
        return this.playAudioElement(targetAudioUrl, options, 'saved_file', requestId);
      }

      // If server generated new raw audio
      if (data.audio) {
        this.isQuotaFallbackActive = false;
        // Convert to WAV Blob for local IDB cache & download support
        const wavBlob = pcmBase64ToWavBlob(data.audio, data.rate || 24000);
        saveToIDB(localKey, wavBlob);

        if (this.currentRequestId !== requestId) return 'gemini';

        const exactDuration = getPcmDuration(data.audio, data.rate || 24000);

        // If server provided an audioUrl or dataUrl, use it directly (ideal for Vercel)
        if (targetAudioUrl) {
          return this.playAudioElement(targetAudioUrl, options, 'gemini', requestId, exactDuration);
        }

        // Play standard WAV Blob URL through HTMLAudioElement with full seeking & scrubbing support
        const blobUrl = URL.createObjectURL(wavBlob);
        return this.playAudioElement(blobUrl, options, 'gemini', requestId, exactDuration);
      }

      // Fallback to browser synthesis
      if (hasCustomSegments && options?.customSegments && options.customSegments.length > 0) {
        this.playExpressiveSegments(options.customSegments, options, requestId);
      } else {
        this.playWebSpeech(text, options?.onStart, options?.onEnd, requestId);
      }
      return 'browser';
    } catch (err: any) {
      if (abortSignal.aborted || this.currentRequestId !== requestId) {
        return 'gemini';
      }
      console.warn('Gemini TTS failed or offline, switching to expressive character speech synthesis:', err);

      const isQuotaErr =
        err?.status === 429 ||
        String(err?.message || '').toLowerCase().includes('429') ||
        String(err?.message || '').toLowerCase().includes('quota') ||
        String(err?.message || '').toLowerCase().includes('resource_exhausted');

      if (isQuotaErr) {
        aiUsageService.recordQuotaExceeded('tts', undefined, 'انتهت حصة توليد الأصوات اليومية');
        this.isQuotaFallbackActive = true;
        this.isLoadingAudio = false;
        this.isPlayingAudio = false;
        this.notify();

        let shouldProceedWithBrowser = true;
        if (this.quotaExceededHandler) {
          shouldProceedWithBrowser = await this.quotaExceededHandler({
            service: 'tts',
            message: 'انتهت حصة توليد الأصوات بالذكاء الاصطناعي لليوم (Gemini Quota Exceeded)',
            lessonTitle: this.currentLessonTitle || options?.lessonTitle,
            text,
          });
        } else if (typeof window !== 'undefined') {
          shouldProceedWithBrowser = window.confirm(
            'تنبيه: لقد استُنفدت حصة الذكاء الاصطناعي اليومية لتوليد الأصوات (Gemini Quota Limit).\n\nهل ترغب في قراءة النص عبر قارئ المتصفح الصوتي البديل؟'
          );
        }

        if (!shouldProceedWithBrowser || this.currentRequestId !== requestId) {
          this.stop();
          return 'browser';
        }
      } else {
        this.isQuotaFallbackActive = false;
      }

      if (hasCustomSegments && options?.customSegments && options.customSegments.length > 0) {
        this.playExpressiveSegments(options.customSegments, options, requestId);
      } else {
        this.playWebSpeech(text, options?.onStart, options?.onEnd, requestId);
      }
      return 'browser';
    }
  }

  // Play standard audio URL via HTML5 Audio element (supports seeking, pause/resume, caching)
  private playAudioElement(
    url: string,
    options?: SpeakOptions,
    engine: 'gemini' | 'saved_file' = 'saved_file',
    requestId?: number,
    knownDuration?: number
  ): Promise<'gemini' | 'saved_file'> {
    if (requestId !== undefined && requestId !== this.currentRequestId) {
      return Promise.resolve(engine);
    }

    // Ensure any existing audio element is stopped before mounting new one
    if (this.currentHtmlAudio) {
      try {
        this.currentHtmlAudio.pause();
        this.currentHtmlAudio.removeAttribute('src');
        this.currentHtmlAudio.load();
      } catch (e) {
        // ignore
      }
      this.currentHtmlAudio = null;
    }

    if (knownDuration && knownDuration > 0) {
      this.currentDuration = knownDuration;
    }

    return new Promise((resolve) => {
      const audio = new Audio();
      audio.preload = 'auto';
      audio.src = url;

      const updateDuration = () => {
        if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration) && audio.duration > 0) {
          this.currentDuration = audio.duration;
        } else if (knownDuration && knownDuration > 0) {
          this.currentDuration = knownDuration;
        }
      };

      audio.onloadedmetadata = () => {
        if (requestId !== undefined && requestId !== this.currentRequestId) return;
        updateDuration();
        this.notify();
      };

      audio.ondurationchange = () => {
        if (requestId !== undefined && requestId !== this.currentRequestId) return;
        updateDuration();
        this.notify();
      };

      audio.ontimeupdate = () => {
        if (requestId !== undefined && requestId !== this.currentRequestId) return;
        this.currentPosition = audio.currentTime || 0;
        updateDuration();
        this.notify();
      };

      audio.onseeking = () => {
        if (requestId !== undefined && requestId !== this.currentRequestId) return;
        this.currentPosition = audio.currentTime || 0;
        this.notify();
      };

      audio.onseeked = () => {
        if (requestId !== undefined && requestId !== this.currentRequestId) return;
        this.currentPosition = audio.currentTime || 0;
        this.notify();
      };

      audio.onplay = () => {
        if (requestId !== undefined && requestId !== this.currentRequestId) {
          try { audio.pause(); } catch (e) {}
          return;
        }
        updateDuration();
        this.isPlayingAudio = true;
        this.isLoadingAudio = false;
        this.currentEngine = engine;
        this.notify();
        if (options?.onStart) options.onStart();
        resolve(engine);
      };

      audio.onended = () => {
        if (requestId === undefined || this.currentRequestId === requestId) {
          this.isPlayingAudio = false;
          this.isVocabularyAudio = false;
          this.currentActiveWord = '';
          this.currentHtmlAudio = null;
          this.stopProgressTimer();
          this.notify();
        }
        if (options?.onEnd) options.onEnd();
      };

      audio.onerror = () => {
        if (requestId === undefined || this.currentRequestId === requestId) {
          this.isPlayingAudio = false;
          this.isLoadingAudio = false;
          this.isVocabularyAudio = false;
          this.currentActiveWord = '';
          this.currentHtmlAudio = null;
          this.stopProgressTimer();
          this.notify();
        }
        if (options?.onEnd) options.onEnd();
        resolve(engine);
      };

      this.currentHtmlAudio = audio;
      audio.playbackRate = options?.rate || this.currentRate || 1.0;
      audio.play().catch((err) => {
        if (requestId !== undefined && requestId !== this.currentRequestId) return;
        console.warn('Audio play() failed:', err);
        this.playWebSpeech(this.currentText, options?.onStart, options?.onEnd, requestId);
      });

      this.startProgressTimer(
        () => (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration) && audio.duration > 0 ? audio.duration : this.currentDuration),
        () => audio.currentTime || 0
      );
    });
  }

  // Download the current audio as a WAV file to user's computer or phone
  public async downloadLessonAudio(
    text: string,
    lessonTitle: string,
    lessonId: string,
    voice = 'Zephyr'
  ): Promise<{ success: boolean; message: string }> {
    const fileName = `درس_${lessonTitle.replace(/[/\\?%*:|"<> ]/g, '_')}_سلاح_التلميذ.wav`;

    // 1. Try local IDB
    const localKey = `${lessonId || 'general'}_${voice}_${text.slice(0, 40)}`;
    const cachedBlob = await getFromIDB(localKey);
    if (cachedBlob) {
      triggerFileDownload(cachedBlob, fileName);
      return { success: true, message: 'تم تحميل الملف الصوتي المحفوظ بنجاح' };
    }

    // 2. Try server file if exists
    try {
      const statusResp = await fetch('/api/audio-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voice, lessonId }),
      });
      if (statusResp.ok) {
        const sData = await statusResp.json();
        if (sData.exists && sData.audioUrl) {
          const fileResp = await fetch(sData.audioUrl);
          const blob = await fileResp.blob();
          triggerFileDownload(blob, fileName);
          return { success: true, message: 'تم تحميل الملف الصوتي من سيرفر النظام بنجاح' };
        }
      }
    } catch (e) {
      // proceed to generate
    }

    // 3. If not cached anywhere, request from Gemini TTS and save
    try {
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: text.slice(0, 1800),
          voice,
          lessonId,
        }),
      });

      if (!response.ok) {
        throw new Error('فشل الاتصال بمولد الصوت');
      }

      const data = await response.json();
      if (data?.usage) {
        aiUsageService.updateFromServerPayload(data.usage);
      } else if (!data.cached && !data.fallback) {
        aiUsageService.recordUsage('tts');
      }

      if (data.audio) {
        const wavBlob = pcmBase64ToWavBlob(data.audio, data.rate || 24000);
        saveToIDB(localKey, wavBlob);
        triggerFileDownload(wavBlob, fileName);
        return { success: true, message: 'تم توليد الصوت الفصيح وتحميله وحفظه في النظام بنجاح' };
      }

      if (data.audioUrl) {
        const fileResp = await fetch(data.audioUrl);
        const blob = await fileResp.blob();
        triggerFileDownload(blob, fileName);
        return { success: true, message: 'تم تحميل الملف الصوتي بنجاح' };
      }

      return { success: false, message: 'تعذر توليد ملف الصوت، يرجى المحاولة لاحقاً' };
    } catch (err: any) {
      return { success: false, message: err?.message || 'حدث خطأ أثناء تحميل الصوت' };
    }
  }

  public hasLoadedAudio(): boolean {
    return Boolean(this.currentHtmlAudio || this.currentUtterance || (this.currentDuration > 0));
  }

  public pause(): void {
    if (this.currentHtmlAudio && !this.currentHtmlAudio.paused) {
      this.currentHtmlAudio.pause();
      this.currentPosition = this.currentHtmlAudio.currentTime;
      this.isPlayingAudio = false;
      this.stopProgressTimer();
      this.notify();
    } else if (this.currentSource) {
      this.stop();
    } else if (this.currentUtterance && 'speechSynthesis' in window) {
      window.speechSynthesis.pause();
      this.isPlayingAudio = false;
      this.notify();
    }
  }

  public resume(): void {
    if (this.currentHtmlAudio) {
      if (this.currentHtmlAudio.ended) {
        this.currentHtmlAudio.currentTime = 0;
      }
      this.currentHtmlAudio.play().catch((err) => {
        console.warn('Audio resume playback error:', err);
      });
      this.isPlayingAudio = true;
      this.notify();
      this.startProgressTimer(
        () => (this.currentHtmlAudio?.duration && isFinite(this.currentHtmlAudio.duration) && this.currentHtmlAudio.duration > 0
          ? this.currentHtmlAudio.duration
          : this.currentDuration),
        () => this.currentHtmlAudio?.currentTime || this.currentPosition || 0
      );
    } else if (this.currentUtterance && 'speechSynthesis' in window) {
      window.speechSynthesis.resume();
      this.isPlayingAudio = true;
      this.notify();
    }
  }

  public seek(seconds: number): void {
    const maxDur = (this.currentDuration && isFinite(this.currentDuration) && this.currentDuration > 0)
      ? this.currentDuration
      : (this.currentHtmlAudio?.duration && isFinite(this.currentHtmlAudio.duration) && this.currentHtmlAudio.duration > 0
        ? this.currentHtmlAudio.duration
        : 1000);
    const target = Math.max(0, Math.min(seconds, maxDur));
    if (this.currentHtmlAudio) {
      try {
        this.currentHtmlAudio.currentTime = target;
      } catch (e) {
        console.warn('Seek error:', e);
      }
    }
    this.currentPosition = target;
    this.notify();
  }

  public stop(): void {
    // Invalidate any pending asynchronous audio load/fetch
    this.currentRequestId++;
    if (this.currentAbortController) {
      try {
        this.currentAbortController.abort();
      } catch (e) {
        // ignore
      }
      this.currentAbortController = null;
    }

    if (this.currentHtmlAudio) {
      try {
        this.currentHtmlAudio.pause();
        this.currentHtmlAudio.currentTime = 0;
        this.currentHtmlAudio.removeAttribute('src');
        this.currentHtmlAudio.load();
      } catch (e) {
        // ignore
      }
      this.currentHtmlAudio = null;
    }

    if (this.currentSource) {
      try {
        this.currentSource.stop();
        this.currentSource.disconnect();
      } catch (e) {
        // ignore
      }
      this.currentSource = null;
    }

    if ('speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch (e) {
        // ignore
      }
    }

    if (this.segmentTimeout) {
      clearTimeout(this.segmentTimeout);
      this.segmentTimeout = null;
    }

    this.stopProgressTimer();
    this.isPlayingAudio = false;
    this.isLoadingAudio = false;
    this.isVocabularyAudio = false;
    this.currentActiveWord = '';
    this.currentPosition = 0;
    this.currentUtterance = null;
    this.currentActiveSpeakerName = '';
    this.currentActiveSpeakerVoice = '';
    this.currentSegmentIndex = 0;
    this.totalSegments = 0;
    this.notify();
  }

  public isPlaying(): boolean {
    return this.isPlayingAudio;
  }
}

export const audioService = new GeminiAudioService();

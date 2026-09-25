import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  Square, 
  Volume2, 
  Sparkles, 
  RotateCcw,
  RotateCw,
  Settings2,
  Loader2,
  Download,
  Check,
  HardDrive,
  Users
} from 'lucide-react';
import { audioService } from '../utils/audioPlayer.ts';
import { useAudioPlayer } from '../context/AudioContext.tsx';
import { AiUsageBar } from './AiUsageBar.tsx';
import { AiUsageModal } from './AiUsageModal.tsx';

interface AudioControlBarProps {
  textToRead: string;
  lessonTitle: string;
  lessonId?: string;
  voice: string;
  label?: string;
  onAudioStateChange?: (playing: boolean) => void;
}

export const AudioControlBar: React.FC<AudioControlBarProps> = ({
  textToRead,
  lessonTitle,
  lessonId,
  voice,
  label = 'استمع للقراءة الفصيحة الدقيقة',
  onAudioStateChange,
}) => {
  const {
    playbackState,
    seekAudio,
    pauseAudio,
    resumeAudio,
    downloadAudio,
    regenerateAudio,
    isRegenerating,
    setIsSettingsOpen,
    textCharacters,
    textSegments,
    setIsCharactersModalOpen,
    openAudioPlayer,
    preferredVoice,
    speechSpeed,
    isMultiSpeaker,
    speaker1Voice,
    speaker2Voice,
  } = useAudioPlayer();

  const effectiveVoice = preferredVoice || voice || 'Zephyr';

  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [engineType, setEngineType] = useState<'gemini' | 'browser' | 'saved_file' | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [isCachedOnSystem, setIsCachedOnSystem] = useState(false);
  const [isUsageModalOpen, setIsUsageModalOpen] = useState(false);

  // Local scrub state for the inline seek bar
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [scrubValue, setScrubValue] = useState(0);

  // Check if this audio is already cached in system
  useEffect(() => {
    let isMounted = true;
    audioService.checkAudioCached(textToRead, effectiveVoice, lessonId).then((res) => {
      if (isMounted && res.cached) {
        setIsCachedOnSystem(true);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [textToRead, effectiveVoice, lessonId]);

  // Subscribe to audioService so local buttons reflect global playing state
  useEffect(() => {
    const unsubscribe = audioService.subscribe((state) => {
      const match = state.lessonTitle === lessonTitle;
      setIsPlaying(match && state.isPlaying);
      setIsLoading(match && state.isLoading);
      if (match && state.engine) {
        setEngineType(state.engine);
      }
    });
    return () => unsubscribe();
  }, [lessonTitle]);

  const isCurrentTrack = playbackState.lessonTitle === lessonTitle;
  const totalDuration = (isCurrentTrack && playbackState.duration && isFinite(playbackState.duration) && playbackState.duration > 0)
    ? playbackState.duration
    : 0;
  const currentPos = (isCurrentTrack && playbackState.currentTime && isFinite(playbackState.currentTime))
    ? playbackState.currentTime
    : 0;
  const displayTime = isScrubbing ? scrubValue : currentPos;
  const progressPercent = totalDuration > 0
    ? Math.min(100, Math.max(0, (displayTime / totalDuration) * 100))
    : 0;

  const formatTime = (secs: number) => {
    if (!secs || isNaN(secs) || secs < 0) return '00:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleTogglePlay = async () => {
    if (isPlaying) {
      pauseAudio();
      setIsPlaying(false);
      if (onAudioStateChange) onAudioStateChange(false);
      return;
    }

    // إظهار المشغل الصوتي فوراً عند الضغط على الاستماع
    openAudioPlayer();

    // If audio for this lesson was already paused, resume it directly from the current position!
    if (isCurrentTrack && (playbackState.currentTime > 0 || audioService.hasLoadedAudio())) {
      resumeAudio();
      setIsPlaying(true);
      if (onAudioStateChange) onAudioStateChange(true);
      return;
    }

    setIsLoading(true);

    const customSegments = isMultiSpeaker && textSegments && textSegments.length > 0
      ? textSegments.map((s) => ({
          id: s.id,
          text: s.text,
          speaker: s.characterName,
          voice: s.voice,
        }))
      : undefined;

    const characterVoiceMap: Record<string, string> = {};
    if (isMultiSpeaker && textCharacters) {
      textCharacters.forEach((c) => {
        characterVoiceMap[c.name] = c.voice;
      });
    }

    try {
      const engine = await audioService.speakText(textToRead, {
        voice: effectiveVoice,
        lessonId,
        lessonTitle,
        rate: speechSpeed,
        multiSpeaker: isMultiSpeaker,
        speaker1Voice,
        speaker2Voice,
        customSegments,
        characterVoiceMap: isMultiSpeaker ? characterVoiceMap : undefined,
        onStart: () => {
          setIsLoading(false);
          setIsPlaying(true);
          if (onAudioStateChange) onAudioStateChange(true);
        },
        onEnd: () => {
          setIsPlaying(false);
          if (onAudioStateChange) onAudioStateChange(false);
        },
        onError: () => {
          setIsLoading(false);
          setIsPlaying(false);
          if (onAudioStateChange) onAudioStateChange(false);
        },
      });
      setEngineType(engine);
      if (engine === 'saved_file') {
        setIsCachedOnSystem(true);
      }
    } catch (err) {
      console.error(err);
      setIsLoading(false);
      setIsPlaying(false);
      if (onAudioStateChange) onAudioStateChange(false);
    }
  };

  const handleStop = () => {
    audioService.stop();
    setIsPlaying(false);
    setIsLoading(false);
    if (onAudioStateChange) onAudioStateChange(false);
  };

  const handleReplay = () => {
    handleStop();
    setTimeout(() => {
      handleTogglePlay();
    }, 150);
  };

  const handleDownloadAndSave = async () => {
    if (isDownloading) return;
    setIsDownloading(true);
    setStatusMessage('');
    try {
      const res = await downloadAudio(textToRead, lessonTitle, lessonId || 'general', effectiveVoice);
      if (res.success) {
        setDownloadSuccess(true);
        setIsCachedOnSystem(true);
        setStatusMessage(res.message);
        setTimeout(() => {
          setDownloadSuccess(false);
          setStatusMessage('');
        }, 4000);
      } else {
        setStatusMessage(res.message);
        setTimeout(() => setStatusMessage(''), 4000);
      }
    } catch (err: any) {
      setStatusMessage('حدث خطأ أثناء حفظ الملف');
      setTimeout(() => setStatusMessage(''), 4000);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleScrubStart = () => {
    setIsScrubbing(true);
    setScrubValue(currentPos);
  };

  const handleScrubChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setScrubValue(val);
  };

  const handleScrubCommit = (val: number) => {
    setIsScrubbing(false);
    seekAudio(val);
  };

  return (
    <div className="bg-linear-to-r from-emerald-50 via-teal-50 to-emerald-50 border border-emerald-200/90 rounded-3xl p-4 shadow-sm transition-all">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Text description and badges */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-sm shrink-0">
            <Volume2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="font-bold text-slate-900 text-sm">{label}</h4>
              <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full border border-emerald-300">
                <Sparkles className="w-3 h-3 text-amber-500" />
                {engineType === 'saved_file' || isCachedOnSystem
                  ? 'محفوظ بالنظام (تشغيل فوري)'
                  : engineType === 'browser'
                  ? 'صوت فصيح مباشر'
                  : 'محرك جيمناي الصوتي الفصيح'}
              </span>

              {isCachedOnSystem && (
                <span className="inline-flex items-center gap-1 text-[10px] bg-teal-100 text-teal-800 font-bold px-2 py-0.5 rounded-full border border-teal-300">
                  <HardDrive className="w-2.5 h-2.5 text-teal-700" />
                  ملف النظام جاهز
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              قراءة مشكولة تراعي مخارج الحروف وقواعد التجويد واللغة العربية الفصحى
            </p>
          </div>
        </div>

        {/* Action Controls Toolbar - Clean Icons with Tooltips */}
        <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto justify-end pt-1 sm:pt-0">
          
          {/* Download & Save Icon Button (Replaces old text button) */}
          <button
            onClick={handleDownloadAndSave}
            disabled={isDownloading}
            className={`p-2.5 rounded-2xl transition-all border shadow-2xs cursor-pointer active:scale-95 ${
              downloadSuccess
                ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                : isCachedOnSystem
                ? 'bg-white hover:bg-slate-50 text-slate-700 hover:text-emerald-700 border-slate-200'
                : 'bg-white hover:bg-emerald-50 text-emerald-700 border-emerald-200 hover:border-emerald-300'
            }`}
            title="تحميل وحفظ الملف الصوتي (WAV) للنظام"
            aria-label="تحميل وحفظ الصوت"
          >
            {isDownloading ? (
              <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
            ) : downloadSuccess ? (
              <Check className="w-4 h-4 text-emerald-600" />
            ) : (
              <Download className="w-4 h-4 text-emerald-600" />
            )}
          </button>

          {/* Regenerate Audio Icon Button */}
          <button
            onClick={async () => {
              await regenerateAudio(textToRead, lessonTitle, lessonId);
            }}
            disabled={isRegenerating || isLoading}
            className="p-2.5 rounded-2xl transition-all border border-amber-200 bg-white hover:bg-amber-50 text-amber-700 shadow-2xs cursor-pointer active:scale-95 disabled:opacity-50"
            title="إعادة توليد الصوت وتطبيق أحدث الإعدادات والأصوات"
            aria-label="إعادة توليد الصوت"
          >
            <RotateCw className={`w-4 h-4 ${isRegenerating ? 'animate-spin text-amber-600' : ''}`} />
          </button>

          {/* Text Characters Voice Customization Button */}
          <button
            onClick={() => setIsCharactersModalOpen(true)}
            className="relative p-2.5 rounded-2xl transition-all border border-cyan-200 bg-white hover:bg-cyan-50 text-cyan-800 shadow-2xs cursor-pointer active:scale-95"
            title="تخصيص شخصيات هذا النص وتعيين صوت مخصص لكل جزء"
            aria-label="شخصيات النص"
          >
            <Users className="w-4 h-4 text-cyan-600" />
            {textCharacters.length > 0 && (
              <span className="absolute -top-1 -right-1 px-1 rounded-full bg-cyan-600 text-white text-[9px] font-black">
                {textCharacters.length}
              </span>
            )}
          </button>

          {/* Audio Settings Button */}
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="p-2.5 rounded-2xl transition-all border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 hover:text-emerald-700 shadow-2xs cursor-pointer active:scale-95"
            title="إعدادات الصوت واختيار النبرة والقراءة متعددة الأصوات"
            aria-label="إعدادات الصوت"
          >
            <Settings2 className="w-4 h-4 text-emerald-600" />
          </button>

          {isPlaying && (
            <button
              onClick={handleReplay}
              className="p-2.5 rounded-2xl bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 shadow-2xs transition-colors shrink-0 cursor-pointer active:scale-95"
              title="إعادة الاستماع من البداية"
              aria-label="إعادة الاستماع"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}

          {isPlaying && (
            <button
              onClick={handleStop}
              className="p-2.5 rounded-2xl bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 shadow-2xs transition-colors shrink-0 cursor-pointer active:scale-95"
              title="إيقاف التسجيل"
              aria-label="إيقاف"
            >
              <Square className="w-4 h-4 fill-current" />
            </button>
          )}

          {/* Primary Play / Pause Button (Icon Only) */}
          <button
            onClick={handleTogglePlay}
            disabled={isLoading}
            title={isPlaying ? 'إيقاف مؤقت' : 'تشغيل القراءة'}
            aria-label={isPlaying ? 'إيقاف مؤقت' : 'تشغيل'}
            className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-sm transition-all cursor-pointer shrink-0 ${
              isPlaying
                ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/20 active:scale-95'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20 active:scale-95'
            }`}
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin text-white shrink-0" />
            ) : isPlaying ? (
              <Pause className="w-4 h-4 fill-current shrink-0" />
            ) : (
              <Play className="w-4 h-4 fill-current shrink-0" />
            )}
          </button>
        </div>
      </div>

      {/* Real Gemini AI Voice Quota & Consumption Status Ribbon */}
      <div className="mt-3">
        <AiUsageBar
          variant="audio-strip-light"
          focusTts={true}
          onOpenDetails={() => setIsUsageModalOpen(true)}
        />
      </div>

      {/* Embedded Seek & Reading Progress Bar with Seconds Counter */}
      {(isPlaying || currentPos > 0 || totalDuration > 0) && (
        <div className="mt-3 pt-3 border-t border-emerald-200/70 flex items-center gap-2 sm:gap-3 animate-fade-in">
          {/* Quick 5s Rewind */}
          <button
            onClick={() => seekAudio(Math.max(0, currentPos - 5))}
            title="رجوع 5 ثوانٍ للخلف"
            aria-label="رجوع 5 ثوانٍ"
            className="p-1.5 rounded-xl bg-white text-slate-600 hover:text-emerald-700 border border-slate-200 transition-all cursor-pointer active:scale-95 shrink-0 flex items-center gap-0.5 text-[10px] font-bold"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">5- ث</span>
          </button>

          {/* Current Position Counter */}
          <span className="text-xs font-mono font-bold text-emerald-800 min-w-[42px] text-left shrink-0">
            {formatTime(displayTime)}
          </span>

          {/* Interactive Range Slider */}
          <div className="flex-1 relative flex items-center group">
            <input
              type="range"
              min="0"
              max={totalDuration > 0 ? totalDuration : 100}
              step="0.25"
              value={displayTime}
              onMouseDown={handleScrubStart}
              onTouchStart={handleScrubStart}
              onChange={handleScrubChange}
              onMouseUp={(e) => handleScrubCommit(parseFloat((e.target as HTMLInputElement).value))}
              onTouchEnd={() => handleScrubCommit(scrubValue)}
              disabled={totalDuration <= 0 && currentPos <= 0}
              aria-label="شريط التنقل والتحريك في الصوت"
              title={`التقدم: ${Math.round(progressPercent)}%`}
              className="w-full h-2 rounded-lg appearance-none cursor-pointer accent-emerald-600 focus:outline-hidden transition-all bg-emerald-200/80"
              style={{
                background: `linear-gradient(to left, #059669 ${progressPercent}%, #cbd5e1 ${progressPercent}%)`
              }}
            />
          </div>

          {/* Total Duration Counter */}
          <span className="text-xs font-mono font-bold text-slate-500 min-w-[42px] text-right shrink-0">
            {formatTime(totalDuration)}
          </span>

          {/* Quick 5s Fast-Forward */}
          <button
            onClick={() => seekAudio(Math.min(totalDuration || 9999, currentPos + 5))}
            title="تقديم 5 ثوانٍ للأمام"
            aria-label="تقديم 5 ثوانٍ"
            className="p-1.5 rounded-xl bg-white text-slate-600 hover:text-emerald-700 border border-slate-200 transition-all cursor-pointer active:scale-95 shrink-0 flex items-center gap-0.5 text-[10px] font-bold"
          >
            <span className="hidden sm:inline">5+ ث</span>
            <RotateCw className="w-3.5 h-3.5" />
          </button>

          {/* Progress Percentage Badge */}
          {totalDuration > 0 && (
            <span className="text-[10px] font-black font-mono px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 shrink-0 hidden sm:inline">
              {Math.round(progressPercent)}%
            </span>
          )}
        </div>
      )}

      {/* Dynamic Status message feedback if any */}
      {statusMessage && (
        <div className="mt-2.5 pt-2 border-t border-emerald-200/60 flex items-center gap-2 text-xs font-semibold text-emerald-800 animate-fade-in">
          <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* AI Usage & Quota Details Modal */}
      <AiUsageModal
        isOpen={isUsageModalOpen}
        onClose={() => setIsUsageModalOpen(false)}
      />
    </div>
  );
};

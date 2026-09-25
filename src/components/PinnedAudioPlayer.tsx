import React, { useState } from 'react';
import { 
  Play, 
  Pause, 
  Square, 
  Volume2, 
  Sparkles, 
  AlertTriangle,
  Download, 
  Pin, 
  PinOff, 
  Check, 
  Loader2, 
  RotateCcw, 
  RotateCw, 
  X, 
  Minimize2, 
  Maximize2, 
  Settings2, 
  Users 
} from 'lucide-react';
import { useAudioPlayer } from '../context/AudioContext.tsx';
import { audioService } from '../utils/audioPlayer.ts';
import { AiUsageBar } from './AiUsageBar.tsx';
import { AiUsageModal } from './AiUsageModal.tsx';

interface PinnedAudioPlayerProps {
  currentLessonTitle?: string;
  currentLessonId?: string;
  currentText?: string;
  currentVoice?: string;
}

export const PinnedAudioPlayer: React.FC<PinnedAudioPlayerProps> = ({
  currentLessonTitle,
  currentLessonId,
  currentText,
  currentVoice = 'Zephyr',
}) => {
  const {
    playbackState,
    pauseAudio,
    resumeAudio,
    stopAudio,
    seekAudio,
    downloadAudio,
    isAudioBarPinned,
    setIsAudioBarPinned,
    isPlayerClosed,
    isPlayerMinimized,
    minimizeAudioPlayer,
    expandAudioPlayer,
    closeAudioPlayer,
    openAudioPlayer,
    playLesson,
    regenerateAudio,
    isRegenerating,
    isMultiSpeaker,
    currentLessonText,
    textCharacters,
    setIsSettingsOpen,
    setIsCharactersModalOpen,
  } = useAudioPlayer();

  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [downloadMsg, setDownloadMsg] = useState('');
  const [isUsageModalOpen, setIsUsageModalOpen] = useState(false);

  // Scrubbing & seeking interaction states
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [scrubValue, setScrubValue] = useState(0);

  const titleToDisplay = currentLessonTitle || playbackState.lessonTitle || 'الدرس المختار';
  const effectiveText = currentText || currentLessonText || '';
  const effectiveLessonId = currentLessonId || 'general';

  const formatTime = (secs: number) => {
    if (!secs || isNaN(secs) || secs < 0) return '00:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const totalDuration = (playbackState.duration && isFinite(playbackState.duration) && playbackState.duration > 0)
    ? playbackState.duration
    : 0;

  const displayTime = isScrubbing ? scrubValue : (playbackState.currentTime || 0);

  const progressPercent = totalDuration > 0
    ? Math.min(100, Math.max(0, (displayTime / totalDuration) * 100))
    : 0;

  const handleDownload = async () => {
    if (!effectiveText || isDownloading) return;
    setIsDownloading(true);
    setDownloadMsg('');
    try {
      const res = await downloadAudio(
        effectiveText,
        titleToDisplay,
        effectiveLessonId,
        currentVoice
      );
      if (res.success) {
        setDownloadSuccess(true);
        setDownloadMsg(res.message);
        setTimeout(() => {
          setDownloadSuccess(false);
          setDownloadMsg('');
        }, 4000);
      } else {
        setDownloadMsg(res.message);
        setTimeout(() => setDownloadMsg(''), 4000);
      }
    } catch (err: any) {
      setDownloadMsg('فشل التحميل، يرجى المحاولة لاحقاً');
      setTimeout(() => setDownloadMsg(''), 4000);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleTogglePlay = () => {
    if (playbackState.isPlaying) {
      // Pause does NOT close the player!
      pauseAudio();
    } else {
      // Check if paused audio corresponds to the active lesson
      const isSameLesson = !playbackState.lessonTitle || playbackState.lessonTitle === titleToDisplay;
      if (isSameLesson && (playbackState.currentTime > 0 || audioService.hasLoadedAudio())) {
        resumeAudio();
      } else if (effectiveText) {
        playLesson(effectiveText, titleToDisplay, effectiveLessonId, currentVoice);
      } else {
        resumeAudio();
      }
    }
  };

  const handleScrubStart = () => {
    setIsScrubbing(true);
    setScrubValue(playbackState.currentTime || 0);
  };

  const handleScrubChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setScrubValue(val);
  };

  const handleScrubCommit = (val: number) => {
    setIsScrubbing(false);
    seekAudio(val);
  };

  // Jump 5 seconds forward/backward
  const jumpAudio = (secondsDelta: number) => {
    const current = playbackState.currentTime || 0;
    const target = Math.max(0, Math.min(totalDuration || 9999, current + secondsDelta));
    seekAudio(target);
  };

  // 1. Minimized floating pill: audio continues playing in background with quick restore
  if (isPlayerMinimized && !isPlayerClosed) {
    return (
      <div
        className="fixed bottom-4 left-4 sm:bottom-6 sm:left-6 z-50 flex items-center gap-2.5 bg-slate-900/90 hover:bg-slate-900 text-white p-2.5 sm:px-3.5 sm:py-2.5 rounded-3xl shadow-[0_12px_40px_rgba(0,0,0,0.5)] border border-emerald-500/40 backdrop-blur-xl cursor-pointer transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] group max-w-[calc(100vw-2rem)] sm:max-w-md animate-fade-in ring-1 ring-white/10"
        onClick={expandAudioPlayer}
        dir="rtl"
        title="اضغط لتكبير المشغل الصوتي"
      >
        <div className="relative shrink-0">
          <div className="w-8 h-8 rounded-xl bg-linear-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-xs">
            {playbackState.isPlaying ? (
              <Volume2 className="w-4 h-4 animate-pulse text-amber-200" />
            ) : (
              <Volume2 className="w-4 h-4 text-white" />
            )}
          </div>
          {playbackState.isPlaying && (
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full animate-ping" />
          )}
        </div>

        <div className="min-w-0 flex-1 pr-1">
          <div className="flex items-center gap-1.5">
            <h5 className="text-xs font-bold text-white truncate max-w-[130px] sm:max-w-[180px]">
              {titleToDisplay}
            </h5>
            <span className="text-[10px] text-emerald-400 font-mono font-bold shrink-0">
              {formatTime(displayTime)}
            </span>
          </div>
          <span className="text-[10px] text-slate-300 flex items-center gap-1">
            <Sparkles className="w-2.5 h-2.5 text-amber-400" />
            {playbackState.isPlaying ? 'جاري الاستماع...' : 'متوقف مؤقتاً'}
          </span>
        </div>

        <div className="flex items-center gap-1 shrink-0 mr-1" onClick={(e) => e.stopPropagation()}>
          {/* Quick Play/Pause in minimized mode */}
          <button
            onClick={handleTogglePlay}
            disabled={playbackState.isLoading}
            title={playbackState.isPlaying ? 'إيقاف مؤقت' : 'استئناف'}
            className="w-8 h-8 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center transition-all cursor-pointer active:scale-95 shadow-xs"
          >
            {playbackState.isLoading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : playbackState.isPlaying ? (
              <Pause className="w-3.5 h-3.5 fill-current" />
            ) : (
              <Play className="w-3.5 h-3.5 fill-current" />
            )}
          </button>

          {/* Quick Expand Button */}
          <button
            onClick={expandAudioPlayer}
            title="تكبير المشغل الصوتي"
            className="w-8 h-8 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-emerald-300 flex items-center justify-center transition-all cursor-pointer active:scale-95 border border-slate-700"
          >
            <Maximize2 className="w-3.5 h-3.5 text-emerald-400" />
          </button>

          {/* Quick Close & Stop Button */}
          <button
            onClick={closeAudioPlayer}
            title="إغلاق وإيقاف الصوت"
            className="w-8 h-8 rounded-xl bg-slate-800/80 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 flex items-center justify-center transition-all cursor-pointer active:scale-95 border border-slate-700"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Thin bottom progress bar */}
        {totalDuration > 0 && (
          <div className="absolute bottom-0 left-3 right-3 h-0.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-400 transition-all duration-200"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        )}
      </div>
    );
  }

  // 2. If user closed the player, show a small floating restore button only if audio was playing/paused
  if (isPlayerClosed) {
    const hasActiveAudio = playbackState.isPlaying || playbackState.currentTime > 0;
    if (!hasActiveAudio) return null;
    return (
      <button
        onClick={openAudioPlayer}
        className="fixed bottom-4 left-4 z-40 flex items-center gap-2 bg-slate-900/90 hover:bg-slate-850 text-white px-3.5 py-2.5 rounded-3xl shadow-2xl border border-emerald-500/40 text-xs font-bold transition-all cursor-pointer hover:scale-105 active:scale-95 group backdrop-blur-xl ring-1 ring-white/10"
        title="إظهار مشغل الصوت المثبت"
      >
        <div className="w-6 h-6 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
          <Volume2 className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
        </div>
        <span>مشغل الصوت</span>
      </button>
    );
  }

  // 3. Keep player open whenever a track is loaded/active (even when paused!)
  // It only closes when the user explicitly clicks the close button (isPlayerClosed === true)
  const hasActiveTrack = Boolean(
    playbackState.isPlaying ||
    playbackState.isLoading ||
    playbackState.currentTime > 0 ||
    (playbackState.duration > 0 && playbackState.lessonTitle)
  );

  if (!hasActiveTrack) return null;

  return (
    <div 
      className="fixed bottom-3 sm:bottom-5 inset-x-3 sm:inset-x-6 max-w-4xl mx-auto z-50 transition-all duration-300 pointer-events-auto"
      dir="rtl"
    >
      {/* Visual notification banner for download/feedback */}
      {downloadMsg && (
        <div className="max-w-md mx-auto mb-2 px-2 animate-fade-in">
          <div className="bg-slate-900/95 text-white text-xs font-bold py-2 px-4 rounded-2xl shadow-xl border border-emerald-500/50 flex items-center justify-between gap-2 backdrop-blur-xl">
            <span className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{downloadMsg}</span>
            </span>
            <span className="text-[10px] text-slate-400 shrink-0">حُفظت في ملفات النظام</span>
          </div>
        </div>
      )}

      {/* Main Curved Floating Glass Window */}
      <div className="rounded-3xl bg-slate-900/90 backdrop-blur-2xl text-white border border-emerald-500/40 shadow-[0_20px_50px_rgba(0,0,0,0.6),0_0_35px_rgba(16,185,129,0.2)] ring-1 ring-white/10 overflow-hidden">
        
        {/* Top Dedicated Status Ribbon: Real Gemini AI Voice Quota & Window Controls */}
        <div className="px-3 sm:px-4 py-1.5 bg-slate-950/85 border-b border-slate-800/80 flex items-center justify-between gap-2.5">
          <AiUsageBar
            variant="player-strip-dark"
            focusTts={true}
            onOpenDetails={() => setIsUsageModalOpen(true)}
          />

          <div className="flex items-center gap-1 bg-slate-900/90 p-0.5 rounded-xl border border-slate-800/70 shrink-0">
            {/* Pin / Unpin Button */}
            <button
              onClick={() => setIsAudioBarPinned(!isAudioBarPinned)}
              title={isAudioBarPinned ? 'إلغاء تثبيت المشغل' : 'تثبيت مشغل الصوت بالأسفل'}
              aria-label={isAudioBarPinned ? 'إلغاء التثبيت' : 'تثبيت المشغل'}
              className={`p-1.5 rounded-lg transition-all cursor-pointer active:scale-95 ${
                isAudioBarPinned
                  ? 'text-emerald-400 bg-emerald-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {isAudioBarPinned ? (
                <Pin className="w-3.5 h-3.5 fill-current" />
              ) : (
                <PinOff className="w-3.5 h-3.5" />
              )}
            </button>

            {/* Minimize to Background Button */}
            <button
              onClick={minimizeAudioPlayer}
              title="تصغير المشغل وتشغيله بالخلفية"
              aria-label="تصغير للخلفية"
              className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-300 hover:bg-slate-800 transition-all cursor-pointer active:scale-95"
            >
              <Minimize2 className="w-3.5 h-3.5" />
            </button>

            {/* Close / Lock Player Button */}
            <button
              onClick={closeAudioPlayer}
              title="إغلاق المشغل وإيقاف الصوت"
              aria-label="إغلاق المشغل"
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/20 transition-all cursor-pointer active:scale-95"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="p-3 sm:p-4 flex flex-col gap-2.5 sm:gap-3">
          
          {/* Main Track Info Row: Audio Icon + Title & Badges */}
          <div className="flex items-center justify-between gap-3 w-full">
            
            {/* Right: Audio Icon + Title & Badges */}
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
              <div className="relative shrink-0">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-linear-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-md">
                  {playbackState.isPlaying ? (
                    <Volume2 className="w-5 h-5 animate-pulse text-amber-200" />
                  ) : (
                    <Volume2 className="w-5 h-5 text-white" />
                  )}
                </div>
                {playbackState.isPlaying && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full animate-ping" />
                )}
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                  <h4 className="text-xs sm:text-sm font-black text-white truncate max-w-[170px] sm:max-w-xs md:max-w-md">
                    {titleToDisplay}
                  </h4>
                  {playbackState.isQuotaFallback ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-950/80 text-amber-300 border border-amber-600/40 shrink-0">
                      <AlertTriangle className="w-2.5 h-2.5 text-amber-400" />
                      قارئ المتصفح (انتهاء حصة AI)
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-600/40 shrink-0">
                      <Sparkles className="w-2.5 h-2.5 text-amber-400" />
                      {playbackState.engine === 'saved_file'
                        ? 'ملف النظام'
                        : playbackState.engine === 'browser'
                        ? (playbackState.activeSpeakerName || isMultiSpeaker ? 'محاكاة شخصيات النص' : 'قارئ المتصفح')
                        : 'محرك جيمناي'}
                    </span>
                  )}
                  {playbackState.activeSpeakerName ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-black px-2.5 py-0.5 rounded-full bg-amber-500/25 text-amber-300 border border-amber-500/40 animate-pulse shrink-0">
                      <Users className="w-2.5 h-2.5 text-amber-400" />
                      <span>الشخصية: {playbackState.activeSpeakerName}</span>
                    </span>
                  ) : isMultiSpeaker ? (
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 shrink-0">
                      قراءة تعبيرية
                    </span>
                  ) : null}
                </div>
              </div>
            </div>

          </div>

          {/* Middle Row: Progress Scrubber Timeline & Exact Seconds Counter */}
          <div className="w-full flex items-center gap-2 sm:gap-3 py-0.5">
            {/* Current Position Counter */}
            <span className="text-xs font-mono font-bold text-emerald-400 min-w-[42px] text-center shrink-0">
              {formatTime(displayTime)}
            </span>

            {/* Range Slider Scrubber */}
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
                disabled={totalDuration <= 0 && displayTime <= 0}
                aria-label="شريط التنقل في التسجيل الصوتي"
                title={`التقدم: ${Math.round(progressPercent)}%`}
                className="w-full h-2 rounded-lg appearance-none cursor-pointer accent-emerald-400 focus:outline-none transition-all bg-slate-800"
                style={{
                  background: `linear-gradient(to left, #10b981 ${progressPercent}%, #334155 ${progressPercent}%)`
                }}
              />
            </div>

            {/* Total Duration Counter */}
            <span className="text-xs font-mono font-bold text-slate-400 min-w-[42px] text-center shrink-0">
              {formatTime(totalDuration)}
            </span>

            {/* Progress Percentage */}
            {totalDuration > 0 && (
              <span className="text-[10px] font-black font-mono px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-600/40 shrink-0 hidden sm:inline">
                {Math.round(progressPercent)}%
              </span>
            )}
          </div>

          {/* Bottom Row: Centered Playback Controls & Feature Buttons (أزرار المشغل بالأسفل في الوسط) */}
          <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2.5 w-full pt-1">
            
            {/* Rewind 5s */}
            <button
              onClick={() => jumpAudio(-5)}
              title="رجوع 5 ثوانٍ للخلف"
              aria-label="رجوع 5 ثوانٍ"
              className="p-2 sm:px-2.5 sm:py-2 rounded-2xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-emerald-300 border border-slate-700/60 transition-all cursor-pointer active:scale-95 shrink-0 flex items-center gap-1 text-[11px] font-bold"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">5- ث</span>
            </button>

            {/* Stop Button */}
            <button
              onClick={stopAudio}
              disabled={!playbackState.isPlaying && displayTime === 0}
              title="إيقاف التسجيل تماماً"
              aria-label="إيقاف التسجيل"
              className="p-2 sm:p-2.5 rounded-2xl bg-slate-800/80 hover:bg-rose-950/80 text-slate-300 hover:text-rose-400 border border-slate-700/80 transition-all cursor-pointer active:scale-95 disabled:opacity-40 disabled:pointer-events-none shrink-0"
            >
              <Square className="w-4 h-4 fill-current" />
            </button>

            {/* Main Central Play / Pause / Resume Button (Icon Only) */}
            <button
              onClick={handleTogglePlay}
              disabled={playbackState.isLoading}
              title={playbackState.isPlaying ? 'إيقاف مؤقت' : displayTime > 0 ? 'استئناف القراءة' : 'تشغيل القراءة'}
              aria-label={playbackState.isPlaying ? 'إيقاف مؤقت' : 'تشغيل'}
              className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-linear-to-tr from-emerald-500 to-teal-400 text-slate-950 hover:brightness-110 active:scale-95 shadow-lg shadow-emerald-500/25 flex items-center justify-center shrink-0 cursor-pointer"
            >
              {playbackState.isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin text-slate-950" />
              ) : playbackState.isPlaying ? (
                <Pause className="w-5 h-5 fill-current text-slate-950" />
              ) : (
                <Play className="w-5 h-5 fill-current text-slate-950 translate-x-[-1px]" />
              )}
            </button>

            {/* Fast-Forward 5s */}
            <button
              onClick={() => jumpAudio(5)}
              title="تقديم 5 ثوانٍ للأمام"
              aria-label="تقديم 5 ثوانٍ"
              className="p-2 sm:px-2.5 sm:py-2 rounded-2xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-emerald-300 border border-slate-700/60 transition-all cursor-pointer active:scale-95 shrink-0 flex items-center gap-1 text-[11px] font-bold"
            >
              <span className="hidden sm:inline">5+ ث</span>
              <RotateCw className="w-3.5 h-3.5" />
            </button>

            {/* Divider */}
            <div className="h-6 w-px bg-slate-700/60 mx-0.5 sm:mx-1 shrink-0" />

            {/* Download Icon Button */}
            <button
              onClick={handleDownload}
              disabled={isDownloading || !effectiveText}
              title="تحميل وحفظ الملف الصوتي (WAV) للنظام"
              aria-label="تحميل وحفظ الصوت"
              className={`p-2 sm:p-2.5 rounded-2xl border transition-all cursor-pointer active:scale-95 shrink-0 ${
                downloadSuccess
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500'
                  : 'bg-slate-800/80 hover:bg-slate-700 text-emerald-400 hover:text-emerald-300 border-slate-700/80 hover:border-emerald-500/40'
              }`}
            >
              {isDownloading ? (
                <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
              ) : downloadSuccess ? (
                <Check className="w-4 h-4 text-emerald-400" />
              ) : (
                <Download className="w-4 h-4" />
              )}
            </button>

            {/* Regenerate Audio Button */}
            <button
              id="regenerate-audio-btn"
              onClick={() => regenerateAudio()}
              disabled={isRegenerating || playbackState.isLoading || !effectiveText}
              title="إعادة توليد الصوت وتطبيق أحدث الإعدادات"
              aria-label="إعادة توليد الصوت"
              className="p-2 sm:p-2.5 rounded-2xl bg-slate-800/80 hover:bg-slate-700 text-amber-300 hover:text-amber-200 border border-slate-700/80 hover:border-amber-500/40 transition-all cursor-pointer active:scale-95 disabled:opacity-50 shrink-0"
            >
              <RotateCw className={`w-4 h-4 ${isRegenerating ? 'animate-spin text-amber-400' : ''}`} />
            </button>

            {/* Text Characters Voice Customization Button */}
            <button
              id="open-text-characters-btn"
              onClick={() => setIsCharactersModalOpen(true)}
              title="شخصيات النص وتوزيع أصوات الحوار"
              aria-label="شخصيات النص"
              className={`relative p-2 sm:p-2.5 rounded-2xl border transition-all cursor-pointer active:scale-95 shrink-0 ${
                textCharacters.length > 0
                  ? 'bg-cyan-950/80 hover:bg-cyan-900/80 text-cyan-300 border-cyan-500/50 shadow-sm'
                  : 'bg-slate-800/80 hover:bg-slate-700 text-slate-200 hover:text-cyan-300 border-slate-700/80'
              }`}
            >
              <Users className="w-4 h-4 text-cyan-400" />
              {textCharacters.length > 0 && (
                <span className="absolute -top-1 -right-1 px-1 rounded-full bg-cyan-500 text-slate-950 text-[9px] font-black border border-slate-900">
                  {textCharacters.length}
                </span>
              )}
            </button>

            {/* Audio Settings Button */}
            <button
              id="open-audio-settings-btn"
              onClick={() => setIsSettingsOpen(true)}
              title="إعدادات الصوت واختيار النبرة"
              aria-label="إعدادات الصوت"
              className="p-2 sm:p-2.5 rounded-2xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 hover:text-emerald-400 border border-slate-700/80 hover:border-emerald-500/40 transition-all cursor-pointer active:scale-95 shrink-0"
            >
              <Settings2 className="w-4 h-4 text-emerald-400" />
            </button>

          </div>

        </div>
      </div>

      {/* AI Usage & Quota Modal */}
      <AiUsageModal
        isOpen={isUsageModalOpen}
        onClose={() => setIsUsageModalOpen(false)}
      />
    </div>
  );
};

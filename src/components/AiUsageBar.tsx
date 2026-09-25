import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Clock, 
  RefreshCw, 
  BrainCircuit, 
  Volume2, 
  CheckCircle2, 
  Info,
  ChevronLeft,
  AlertTriangle
} from 'lucide-react';
import { aiUsageService } from '../utils/aiUsageService.ts';
import { AiUsageStats } from '../types.ts';

interface AiUsageBarProps {
  variant?: 'compact' | 'full' | 'header-badge' | 'audio-pill' | 'audio-dark' | 'audio-compact' | 'player-strip-dark' | 'audio-strip-light';
  onOpenDetails?: () => void;
  className?: string;
  focusTts?: boolean;
}

export const AiUsageBar: React.FC<AiUsageBarProps> = ({
  variant = 'full',
  onOpenDetails,
  className = '',
  focusTts = false,
}) => {
  const [stats, setStats] = useState<AiUsageStats>(aiUsageService.getStats());

  useEffect(() => {
    const unsubscribe = aiUsageService.subscribe((updated) => {
      setStats(updated);
    });
    return () => unsubscribe();
  }, []);

  const {
    used,
    limit,
    remaining,
    percent,
    resetTimeFormatted,
    resetCountdown,
    breakdown,
    isExceeded,
    totalTokens,
  } = stats;

  // Specific metrics for TTS audio operations
  const isTtsExceeded = Boolean(
    stats.quotaWarning?.service === 'tts' ||
    stats.breakdown.tts?.isExceeded ||
    (stats.breakdown.tts?.queries ?? 0) >= (stats.breakdown.tts?.limit ?? 10)
  );

  const ttsLimit = stats.breakdown.tts?.limit ?? 10;
  const ttsQueries = isTtsExceeded
    ? Math.max(stats.breakdown.tts?.queries ?? 0, ttsLimit)
    : (stats.breakdown.tts?.queries ?? stats.breakdown.ttsGenerations ?? 0);
  const ttsTokens = stats.breakdown.tts?.tokens ?? (ttsQueries * 340);
  const ttsPercent = isTtsExceeded ? 100 : Math.min(100, Math.round((ttsQueries / ttsLimit) * 100));
  const ttsRemaining = isTtsExceeded ? 0 : Math.max(0, ttsLimit - ttsQueries);

  // Format 2-digit countdown string: HH:MM:SS
  const formatTimer = () => {
    const h = String(resetCountdown.hours).padStart(2, '0');
    const m = String(resetCountdown.minutes).padStart(2, '0');
    const s = String(resetCountdown.seconds).padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  // Color dynamics based on quota consumption
  const getProgressColor = (customPercent?: number) => {
    const p = customPercent !== undefined ? customPercent : percent;
    if (p >= 90) return 'from-rose-500 to-red-600';
    if (p >= 70) return 'from-amber-500 to-orange-500';
    return 'from-emerald-500 via-teal-500 to-emerald-600';
  };

  const getBadgeStyle = () => {
    if (percent >= 90) return 'bg-rose-50 border-rose-200 text-rose-800';
    if (percent >= 70) return 'bg-amber-50 border-amber-200 text-amber-800';
    return 'bg-emerald-50/90 border-emerald-200/90 text-emerald-900';
  };

  // 1. Dedicated Floating Audio Player Top Strip (المشغل الصوتي العائم - الشريط العلوي المخصص)
  if (variant === 'player-strip-dark') {
    return (
      <div className={`flex items-center gap-2 sm:gap-3 flex-1 min-w-0 text-slate-300 text-[11px] ${className}`}>
        {/* Clickable Badge */}
        <button
          onClick={onOpenDetails}
          className="flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer group shrink-0"
          title="عرض تفاصيل رصيد أصوات جيمناي الفصيحة والتوكنز المستهلكة"
        >
          <div className={`w-5 h-5 rounded-lg flex items-center justify-center border transition-colors ${
            isTtsExceeded 
              ? 'bg-rose-500/20 text-rose-400 border-rose-500/40 group-hover:bg-rose-500/30' 
              : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 group-hover:bg-emerald-500/30'
          }`}>
            <Volume2 className="w-3 h-3" />
          </div>
          <span className="font-bold text-slate-200">أصوات جيمناي:</span>
        </button>

        {/* Real Requests & Token Count */}
        <div className="flex items-center gap-1.5 min-w-0 shrink-0">
          <span className={`font-mono font-bold px-1.5 py-0.5 rounded-md border ${
            isTtsExceeded
              ? 'text-rose-400 bg-rose-950/90 border-rose-700/80 animate-pulse'
              : 'text-emerald-400 bg-slate-900/90 border-slate-700'
          }`}>
            {ttsQueries}/{ttsLimit} تلاوة {isTtsExceeded && '(انتهت الحصة)'}
          </span>
          <span className="text-[10px] text-slate-400 font-mono hidden md:inline">
            ({ttsTokens.toLocaleString('ar-EG')} توكن)
          </span>
        </div>

        {/* Visual Mini Progress Bar */}
        <div className="w-12 sm:w-20 h-1.5 bg-slate-800 rounded-full overflow-hidden shrink-0 hidden xs:block">
          <div
            className={`h-full bg-linear-to-r ${getProgressColor(ttsPercent)} transition-all duration-500`}
            style={{ width: `${ttsPercent}%` }}
          />
        </div>

        {/* Live Countdown & Info */}
        <div className="flex items-center gap-2 mr-auto shrink-0">
          <div className="flex items-center gap-1 text-[10px] text-slate-400 font-mono">
            <Clock className={`w-2.5 h-2.5 ${isTtsExceeded ? 'text-amber-400' : 'text-emerald-400'}`} />
            <span className="hidden sm:inline">تجدد:</span>
            <span className="text-slate-300 font-bold">{formatTimer()}</span>
          </div>

          {onOpenDetails && (
            <button
              onClick={onOpenDetails}
              className="p-1 rounded-lg text-slate-400 hover:text-emerald-300 hover:bg-slate-800 transition-colors cursor-pointer"
              title="عرض التفاصيل الكاملة للحصة والتوكنز"
              aria-label="تفاصيل الحصة"
            >
              <Info className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
    );
  }

  // 2. Dedicated Lesson Audio Control Bar Strip (شريط استهلاك الصوت المدمج بصفحة الدرس)
  if (variant === 'audio-strip-light') {
    return (
      <div className={`p-2 sm:px-3 sm:py-2 rounded-2xl bg-white/95 border ${isTtsExceeded ? 'border-rose-200' : 'border-emerald-200/90'} shadow-2xs flex flex-wrap items-center justify-between gap-2.5 text-xs ${className}`}>
        <div className="flex items-center gap-2.5 min-w-0">
          <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 shadow-xs text-white ${
            isTtsExceeded
              ? 'bg-linear-to-br from-rose-500 to-red-600'
              : 'bg-linear-to-br from-emerald-500 to-teal-600'
          }`}>
            {isTtsExceeded ? <AlertTriangle className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-bold text-slate-800 text-xs">استهلاك قارئ جيمناي الفصيح:</span>
              <span className={`font-mono font-black text-xs px-2 py-0.5 rounded-md border ${
                isTtsExceeded
                  ? 'text-rose-800 bg-rose-50 border-rose-300'
                  : 'text-emerald-800 bg-emerald-50 border-emerald-200'
              }`}>
                {ttsQueries} من {ttsLimit} تلاوة {isTtsExceeded && '(نفدت الحصة اليومية)'}
              </span>
              <span className="text-[10px] font-medium">
                {isTtsExceeded ? (
                  <span className="text-rose-600 font-bold">
                    (المتبقي: 0 • القارئ البديل متاح)
                  </span>
                ) : (
                  <span className="text-slate-500">
                    (المتبقي: <strong className="text-emerald-700 font-mono">{ttsRemaining}</strong> • <span className="font-mono text-slate-600">{ttsTokens.toLocaleString('ar-EG')} توكن مستهلكة</span>)
                  </span>
                )}
              </span>
            </div>
            {/* Visual Bar */}
            <div className="w-36 sm:w-60 h-1.5 bg-slate-100 rounded-full overflow-hidden mt-1.5 border border-slate-200/60">
              <div
                className={`h-full bg-linear-to-r ${getProgressColor(ttsPercent)} transition-all duration-500`}
                style={{ width: `${ttsPercent}%` }}
              />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 mr-auto">
          <div className="text-right">
            <div className="text-[10px] text-slate-500 flex items-center gap-1 justify-end font-medium">
              <Clock className="w-3 h-3 text-emerald-600 animate-pulse" />
              <span>تجدد الحصة:</span>
              <strong className="text-slate-800 font-mono font-bold">{formatTimer()}</strong>
            </div>
            <span className="text-[9px] text-slate-400 block text-left font-mono">
              {resetTimeFormatted}
            </span>
          </div>

          {onOpenDetails && (
            <button
              onClick={onOpenDetails}
              className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-bold text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100/80 rounded-xl transition-colors cursor-pointer border border-emerald-200/80 active:scale-95"
              title="عرض تقرير استهلاك الذكاء الاصطناعي وتفاصيل التوكنز"
            >
              <span>التفاصيل</span>
              <Info className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
    );
  }

  // 3. Audio-Pill Variant (Compact pill for audio player bars)
  if (variant === 'audio-pill') {
    const isExceededPill = focusTts ? isTtsExceeded : isExceeded;
    const displayUsed = focusTts ? ttsQueries : used;
    const displayLimit = focusTts ? ttsLimit : limit;
    const displayPercent = focusTts ? ttsPercent : percent;

    return (
      <button
        onClick={onOpenDetails}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border transition-all cursor-pointer shadow-2xs hover:shadow-xs active:scale-95 ${
          isExceededPill || displayPercent >= 90
            ? 'bg-rose-50 text-rose-800 border-rose-300'
            : displayPercent >= 70
            ? 'bg-amber-50 text-amber-800 border-amber-300'
            : 'bg-emerald-100/90 text-emerald-900 border-emerald-300'
        } ${className}`}
        title={`استهلاك الصوت والذكاء الاصطناعي: ${displayUsed}/${displayLimit} • تجديد الحصة: ${resetTimeFormatted} (${resetCountdown.formattedArabic})`}
      >
        <Volume2 className={`w-3 h-3 shrink-0 ${isExceededPill ? 'text-rose-700' : 'text-emerald-700'}`} />
        <span className="font-medium text-slate-700">رصيد الصوت:</span>
        <span className={`font-mono font-black ${isExceededPill ? 'text-rose-700' : 'text-emerald-800'}`}>
          {displayUsed}/{displayLimit} {isExceededPill && '(نفد)'}
        </span>
        <div className="w-8 sm:w-12 h-1.5 bg-slate-200 rounded-full overflow-hidden shrink-0 hidden xs:block">
          <div
            className={`h-full bg-linear-to-r ${getProgressColor(displayPercent)}`}
            style={{ width: `${displayPercent}%` }}
          />
        </div>
        <span className="text-[10px] text-slate-500 hidden sm:inline font-mono">
          ({formatTimer()})
        </span>
      </button>
    );
  }

  // 4. Audio-Dark Variant (Styled specifically for dark floating audio player)
  if (variant === 'audio-dark') {
    const isExceededDark = focusTts ? isTtsExceeded : isExceeded;
    const displayUsed = focusTts ? ttsQueries : used;
    const displayLimit = focusTts ? ttsLimit : limit;
    const displayPercent = focusTts ? ttsPercent : percent;

    return (
      <button
        onClick={onOpenDetails}
        className={`flex items-center gap-2 px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer shadow-xs active:scale-95 ${
          isExceededDark
            ? 'bg-rose-950/80 text-rose-200 border border-rose-700/80'
            : 'bg-slate-950/80 hover:bg-slate-800/90 text-slate-200 border border-slate-700/80 hover:border-emerald-500/50'
        } ${className}`}
        title={`استهلاك الذكاء الاصطناعي وتوليد الأصوات: ${displayUsed}/${displayLimit} • التجديد بعد: ${resetCountdown.formattedArabic}`}
      >
        <div className="flex items-center gap-1.5">
          <Sparkles className={`w-3 h-3 shrink-0 ${isExceededDark ? 'text-rose-400' : 'text-amber-400 animate-pulse'}`} />
          <span className="text-slate-400 hidden sm:inline">رصيد الصوت:</span>
          <span className={`font-mono font-black ${isExceededDark ? 'text-rose-400' : 'text-emerald-400'}`}>
            {displayUsed}/{displayLimit} {isExceededDark && '(نفد)'}
          </span>
        </div>

        {/* Mini sleek progress bar */}
        <div className="w-12 sm:w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden shrink-0">
          <div
            className={`h-full bg-linear-to-r ${getProgressColor(displayPercent)}`}
            style={{ width: `${displayPercent}%` }}
          />
        </div>

        {/* Countdown */}
        <div className="flex items-center gap-1 text-[10px] text-slate-400 border-r border-slate-700 pr-1.5 font-mono">
          <Clock className="w-2.5 h-2.5 text-emerald-400" />
          <span>{formatTimer()}</span>
        </div>
      </button>
    );
  }

  // 5. Audio-Compact Variant (Dedicated for inside AudioSettingsModal)
  if (variant === 'audio-compact') {
    const isExceededCompact = focusTts ? isTtsExceeded : isExceeded;
    const displayUsed = focusTts ? ttsQueries : used;
    const displayLimit = focusTts ? ttsLimit : limit;
    const displayRemaining = focusTts ? ttsRemaining : remaining;
    const displayPercent = focusTts ? ttsPercent : percent;

    return (
      <div className={`p-2.5 rounded-2xl bg-white/95 border ${isExceededCompact ? 'border-rose-200' : 'border-emerald-200/90'} shadow-2xs flex flex-wrap items-center justify-between gap-2.5 text-xs ${className}`}>
        <div className="flex items-center gap-2.5 min-w-0">
          <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${isExceededCompact ? 'bg-rose-100 text-rose-800' : 'bg-teal-100 text-teal-800'}`}>
            <Volume2 className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-bold text-slate-800 text-xs">استهلاك توليد الأصوات اليومي:</span>
              <span className={`font-mono font-black text-xs px-2 py-0.5 rounded-md border ${
                isExceededCompact
                  ? 'text-rose-800 bg-rose-50 border-rose-300'
                  : 'text-emerald-800 bg-emerald-50 border-emerald-200'
              }`}>
                {displayUsed} من {displayLimit}
              </span>
              <span className="text-[10px] font-medium">
                {isExceededCompact ? (
                  <span className="text-rose-600 font-bold">
                    (نفدت الحصة اليومية • المتبقي: 0)
                  </span>
                ) : (
                  <span className="text-slate-500">
                    (المتبقي: <strong className="text-emerald-700 font-mono">{displayRemaining}</strong> • <span className="font-mono text-slate-600">{ttsTokens.toLocaleString('ar-EG')} توكن</span>)
                  </span>
                )}
              </span>
            </div>
            {/* Visual Bar */}
            <div className="w-36 sm:w-56 h-1.5 bg-slate-200 rounded-full overflow-hidden mt-1.5">
              <div
                className={`h-full bg-linear-to-r ${getProgressColor(displayPercent)} transition-all duration-500`}
                style={{ width: `${displayPercent}%` }}
              />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="text-right">
            <div className="text-[10px] text-slate-500 flex items-center gap-1 justify-end font-medium">
              <RefreshCw className="w-3 h-3 text-emerald-600 animate-spin-slow" />
              <span>تجدد الحصة:</span>
              <strong className="text-slate-800 font-mono font-bold">{formatTimer()}</strong>
            </div>
            <span className="text-[9px] text-slate-400 block text-left">
              {resetTimeFormatted}
            </span>
          </div>

          {onOpenDetails && (
            <button
              onClick={onOpenDetails}
              className="p-1.5 text-emerald-700 hover:text-emerald-900 hover:bg-emerald-50 rounded-xl transition-colors cursor-pointer border border-emerald-200/80 active:scale-95"
              title="عرض تفاصيل الحصة وتوزيع الاستهلاك"
              aria-label="تفاصيل الحصة"
            >
              <Info className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    );
  }

  // 1. Header Badge Variant (Designed for Top Navigation Header)
  if (variant === 'header-badge') {
    const badgeStyle = isExceeded
      ? 'bg-rose-50 border-rose-300 text-rose-800'
      : isTtsExceeded
      ? 'bg-amber-50 border-amber-300 text-amber-900'
      : getBadgeStyle();

    return (
      <button
        onClick={onOpenDetails}
        className={`flex items-center gap-1.5 sm:gap-2 px-2 sm:px-2.5 py-1.5 rounded-xl border text-xs font-bold transition-all hover:shadow-xs active:scale-95 cursor-pointer ${badgeStyle} ${className}`}
        title={`استهلاك الذكاء الاصطناعي: ${used}/${limit} • أصوات: ${ttsQueries}/${ttsLimit} • موعد التجديد: ${resetTimeFormatted} (${resetCountdown.formattedArabic})`}
      >
        <div className="relative flex items-center justify-center shrink-0">
          {isTtsExceeded ? (
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          ) : (
            <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0 animate-pulse" />
          )}
        </div>

        <div className="flex items-center gap-1 min-w-0">
          <span className="font-mono text-[11px] sm:text-xs font-black">
            {used}/{limit}
          </span>
          {isTtsExceeded ? (
            <span className="text-[10px] text-amber-800 font-bold hidden sm:inline">
              (حصة الصوت نفدت)
            </span>
          ) : (
            <span className="text-[10px] opacity-75 hidden md:inline">استهلاك</span>
          )}
        </div>

        {/* Mini progress dot / bar */}
        <div className="w-10 sm:w-14 h-2 bg-slate-200/80 rounded-full overflow-hidden shrink-0 hidden xs:block">
          <div
            className={`h-full bg-linear-to-r ${getProgressColor(isTtsExceeded ? 100 : percent)} transition-all duration-500`}
            style={{ width: `${isTtsExceeded ? 100 : percent}%` }}
          />
        </div>

        {/* Live renewal indicator */}
        <div className="hidden lg:flex items-center gap-1 text-[10px] text-slate-500 border-r border-slate-200/80 pr-1.5 font-medium">
          <Clock className="w-2.5 h-2.5 text-slate-400" />
          <span className="font-mono dir-ltr">{formatTimer()}</span>
        </div>
      </button>
    );
  }

  // 2. Compact Variant (For chat headers or sub-bars)
  if (variant === 'compact') {
    return (
      <div className={`bg-slate-50/95 border border-slate-200/80 rounded-xl p-2 sm:p-2.5 flex items-center justify-between gap-3 text-xs ${className}`}>
        <div className="flex items-center gap-2 min-w-0">
          <div className="p-1 rounded-lg bg-emerald-100 text-emerald-700 shrink-0">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-slate-800 text-[11px] sm:text-xs">رصيد الذكاء الاصطناعي:</span>
              <span className="font-mono font-black text-emerald-800">{used} من {limit}</span>
              <span className="text-[10px] text-slate-400">({percent}%)</span>
            </div>
            <div className="w-32 sm:w-48 h-1.5 bg-slate-200 rounded-full overflow-hidden mt-1">
              <div
                className={`h-full bg-linear-to-r ${getProgressColor()} transition-all duration-500`}
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="text-right">
            <div className="text-[10px] text-slate-500 flex items-center gap-1 justify-end">
              <Clock className="w-3 h-3 text-emerald-600" />
              <span>موعد التجديد:</span>
              <strong className="text-slate-700 font-mono">{formatTimer()}</strong>
            </div>
          </div>
          {onOpenDetails && (
            <button
              onClick={onOpenDetails}
              className="p-1 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
              title="عرض التفاصيل"
            >
              <Info className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    );
  }

  // 3. Full Variant (Prominently shown in AiTutorModal and AiUsageModal)
  return (
    <div className={`bg-linear-to-br from-slate-50 via-emerald-50/30 to-teal-50/20 border border-emerald-100/90 rounded-2xl p-3 sm:p-4 shadow-2xs ${className}`}>
      {/* Header Info Row */}
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-xl bg-linear-to-tr from-emerald-600 to-teal-600 flex items-center justify-center text-white shadow-2xs shadow-emerald-600/30 shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-bold text-xs sm:text-sm text-slate-900 flex items-center gap-1.5">
              <span>شريط استهلاك الذكاء الاصطناعي اليومي</span>
              {isExceeded && (
                <span className="text-[10px] bg-rose-100 text-rose-700 px-1.5 py-0.2 rounded-full font-bold">
                  اكتملت الحصة
                </span>
              )}
            </h4>
            <p className="text-[11px] text-slate-500">
              حصة مجانية يومية مخصصة للأسئلة والإعراب والتوليد الصوتي
            </p>
          </div>
        </div>

        {/* Renewal Badge */}
        <div className="bg-white border border-emerald-200/80 px-2.5 py-1 rounded-xl shadow-2xs flex items-center gap-1.5 text-xs text-emerald-900 shrink-0">
          <RefreshCw className="w-3.5 h-3.5 text-emerald-600 animate-spin-slow" />
          <div className="text-right">
            <span className="text-[10px] text-slate-500 block leading-tight">التجديد القادم</span>
            <span className="font-mono font-bold text-emerald-800 text-[11px]">
              {formatTimer()}
            </span>
          </div>
        </div>
      </div>

      {/* Progress Bar Container */}
      <div className="space-y-1.5 my-3">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-700 px-0.5">
          <span className="flex items-center gap-1 text-[11px] sm:text-xs">
            <span>المستهلك اليوم:</span>
            <strong className="text-emerald-800 font-mono font-bold">{used}</strong>
            <span className="text-slate-400">/</span>
            <span className="font-mono text-slate-600">{limit} استفساراً</span>
          </span>
          <span className="text-[11px] font-bold text-emerald-700">
            المتبقي: <span className="font-mono">{remaining}</span> استهلاك ({100 - percent}%)
          </span>
        </div>

        {/* Visual Bar */}
        <div className="w-full h-3 sm:h-3.5 bg-slate-200/90 rounded-full p-0.5 overflow-hidden shadow-inner relative">
          <div
            className={`h-full rounded-full bg-linear-to-r ${getProgressColor()} transition-all duration-700 ease-out relative`}
            style={{ width: `${percent}%` }}
          >
            {/* Shimmer Light effect */}
            <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/25 to-transparent animate-shimmer" />
          </div>
        </div>
      </div>

      {/* Breakdown & Renewal Details */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 border-t border-emerald-100/70 text-xs">
        {/* Tutor Queries */}
        <div className="bg-white/80 border border-slate-200/70 rounded-xl p-2 flex items-center gap-2">
          <BrainCircuit className="w-4 h-4 text-emerald-600 shrink-0" />
          <div className="min-w-0">
            <span className="text-[10px] text-slate-500 block truncate">معلم لغتي الذكي</span>
            <span className="font-bold text-slate-800 font-mono text-xs">{breakdown.tutorQueries} سؤال</span>
          </div>
        </div>

        {/* TTS Generations */}
        <div className="bg-white/80 border border-slate-200/70 rounded-xl p-2 flex items-center gap-2">
          <Volume2 className="w-4 h-4 text-teal-600 shrink-0" />
          <div className="min-w-0">
            <span className="text-[10px] text-slate-500 block truncate">القراءة الصوتية</span>
            <span className="font-bold text-slate-800 font-mono text-xs">{breakdown.ttsGenerations} استماع</span>
          </div>
        </div>

        {/* Reset Policy & Time */}
        <div className="col-span-2 sm:col-span-1 bg-white/80 border border-slate-200/70 rounded-xl p-2 flex items-center gap-2">
          <Clock className="w-4 h-4 text-amber-600 shrink-0" />
          <div className="min-w-0">
            <span className="text-[10px] text-slate-500 block truncate">موعد التجديد التلقائي</span>
            <span className="font-bold text-emerald-800 text-[11px] truncate block" title={resetCountdown.formattedArabic}>
              {resetTimeFormatted} ({resetCountdown.formattedArabic})
            </span>
          </div>
        </div>
      </div>

      {onOpenDetails && (
        <div className="mt-2.5 pt-2 flex items-center justify-between text-[11px] text-slate-500">
          <span className="flex items-center gap-1 text-emerald-700 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5" />
            تتجدد الحصة تلقائيًا كل ليلة عند منتصف الليل بدون أي تكلفة
          </span>
          <button
            onClick={onOpenDetails}
            className="inline-flex items-center gap-0.5 text-emerald-700 hover:text-emerald-900 font-bold hover:underline cursor-pointer"
          >
            <span>تفاصيل الحصة</span>
            <ChevronLeft className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  );
};

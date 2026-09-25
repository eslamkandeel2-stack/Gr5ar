import React, { useState, useEffect } from 'react';
import { 
  X, 
  Sparkles, 
  Clock, 
  RefreshCw, 
  BrainCircuit, 
  Volume2, 
  Calendar, 
  ShieldCheck, 
  Zap,
  HelpCircle,
  Lightbulb
} from 'lucide-react';
import { aiUsageService } from '../utils/aiUsageService.ts';
import { AiUsageStats } from '../types.ts';

interface AiUsageModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AiUsageModal: React.FC<AiUsageModalProps> = ({ isOpen, onClose }) => {
  const [stats, setStats] = useState<AiUsageStats>(aiUsageService.getStats());

  useEffect(() => {
    if (!isOpen) return;
    // Refresh stats from server upon modal opening
    aiUsageService.refreshFromServer();

    const unsubscribe = aiUsageService.subscribe((updated) => {
      setStats(updated);
    });
    return () => unsubscribe();
  }, [isOpen]);

  if (!isOpen) return null;

  const {
    used,
    limit,
    remaining,
    percent,
    resetTimeFormatted,
    resetCountdown,
    breakdown,
    date,
    totalTokens = 0,
    promptTokens = 0,
    candidatesTokens = 0,
    tokensLimit = 250000,
    tokensPercent = 0,
    quotaWarning,
  } = stats;

  const isTtsExceeded = Boolean(
    quotaWarning?.service === 'tts' ||
    breakdown.tts?.isExceeded ||
    (breakdown.tts?.queries ?? 0) >= (breakdown.tts?.limit ?? 10)
  );

  const ttsLimit = breakdown.tts?.limit ?? 10;
  const ttsQueries = isTtsExceeded
    ? Math.max(breakdown.tts?.queries ?? 0, ttsLimit)
    : (breakdown.tts?.queries ?? breakdown.ttsGenerations ?? 0);
  const ttsTokens = breakdown.tts?.tokens ?? (ttsQueries * 340);
  const ttsModel = breakdown.tts?.lastModel ?? 'gemini-3.1-flash-tts-preview';

  const isTutorExceeded = Boolean(
    quotaWarning?.service === 'tutor' ||
    breakdown.tutor?.isExceeded ||
    (breakdown.tutor?.queries ?? 0) >= (breakdown.tutor?.limit ?? 20)
  );

  const tutorLimit = breakdown.tutor?.limit ?? 20;
  const tutorQueries = isTutorExceeded
    ? Math.max(breakdown.tutor?.queries ?? 0, tutorLimit)
    : (breakdown.tutor?.queries ?? breakdown.tutorQueries ?? 0);
  const tutorTokens = breakdown.tutor?.tokens ?? (tutorQueries * 750);
  const tutorModel = breakdown.tutor?.lastModel ?? 'gemini-3.8-flash';

  const formatTimer = () => {
    const h = String(resetCountdown.hours).padStart(2, '0');
    const m = String(resetCountdown.minutes).padStart(2, '0');
    const s = String(resetCountdown.seconds).padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  const getProgressColor = () => {
    if (percent >= 90) return 'from-rose-500 to-red-600';
    if (percent >= 70) return 'from-amber-500 to-orange-500';
    return 'from-emerald-500 via-teal-500 to-emerald-600';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200" dir="rtl">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-linear-to-r from-emerald-800 via-teal-800 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-emerald-200 shadow-inner">
              <Zap className="w-5 h-5 text-amber-300 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base sm:text-lg tracking-tight">استهلاك الذكاء الاصطناعي الفعلي</h3>
                <span className="bg-emerald-500/30 text-emerald-200 border border-emerald-400/30 text-[10px] px-2 py-0.5 rounded-full font-bold">
                  Gemini API Live
                </span>
              </div>
              <p className="text-xs text-emerald-100 mt-0.5">
                بيانات استهلاك حقيقية ومباشرة من Gemini API Usage Metadata
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-emerald-100 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="إغلاق النافذة"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4">

          {/* Quota warning banner if active */}
          {quotaWarning && (
            <div className="bg-amber-50 border border-amber-300 rounded-2xl p-3.5 text-xs text-amber-900 flex items-start gap-2.5">
              <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-bold">تنبيه الحصة من Google Gemini:</strong>
                <span>{quotaWarning.message || 'تم بلوغ الحد الأقصى للطلبات المجانية المؤقتة.'}</span>
                {quotaWarning.retryDelay && (
                  <span className="block mt-1 font-mono font-bold text-amber-800">
                    يمكن المحاولة بعد: {quotaWarning.retryDelay}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Main Visual Gauge / Card */}
          <div className="bg-linear-to-br from-slate-50 to-emerald-50/50 border border-emerald-100 rounded-2xl p-4 sm:p-5 shadow-xs">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
              <span className="flex items-center gap-1.5 font-medium">
                <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                استهلاك اليوم ({date})
              </span>
              <span className="font-bold text-emerald-800 font-mono text-sm">
                {percent}% مستهلك
              </span>
            </div>

            {/* Big Numbers */}
            <div className="flex items-baseline justify-between gap-4 mb-3">
              <div>
                <span className="text-3xl sm:text-4xl font-black text-slate-900 font-mono">
                  {used}
                </span>
                <span className="text-xs sm:text-sm text-slate-500 font-bold mr-1.5">
                  من {limit} طلب إجمالي
                </span>
              </div>

              <div className="text-left">
                <span className="text-xs text-slate-500 block">المتبقي:</span>
                <span className="text-xl sm:text-2xl font-black text-emerald-700 font-mono">
                  {remaining} <span className="text-xs font-bold">عملية</span>
                </span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-4 bg-slate-200/90 rounded-full p-0.5 overflow-hidden shadow-inner relative">
              <div
                className={`h-full rounded-full bg-linear-to-r ${getProgressColor()} transition-all duration-700 ease-out`}
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>

          {/* Real Token Consumption Box (التوكنز المستهلكة فعلياً من Gemini) */}
          <div className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-2xs">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center font-black text-xs">
                  T
                </div>
                <span className="text-xs font-bold text-slate-800">إجمالي التوكنز الفعلية (Gemini Tokens):</span>
              </div>
              <span className="font-mono font-black text-sm text-teal-800 bg-teal-50 px-2 py-0.5 rounded-lg border border-teal-200">
                {totalTokens.toLocaleString('ar-EG')} توكن
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-slate-100">
              <div className="bg-slate-50 p-2 rounded-xl">
                <span className="text-slate-500 block">توكنز المدخلات (Prompt):</span>
                <strong className="font-mono text-slate-800 font-bold">{promptTokens.toLocaleString('ar-EG')}</strong>
              </div>
              <div className="bg-slate-50 p-2 rounded-xl">
                <span className="text-slate-500 block">توكنز المخرجات (Response):</span>
                <strong className="font-mono text-slate-800 font-bold">{candidatesTokens.toLocaleString('ar-EG')}</strong>
              </div>
            </div>
          </div>

          {/* Service Breakdown */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>تفاصيل استهلاك الخدمات التفاعلية من نماذج Gemini:</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Tutor */}
              <div className="bg-white border border-slate-200 rounded-2xl p-3 flex flex-col justify-between gap-2 shadow-2xs">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
                      <BrainCircuit className="w-4 h-4" />
                    </div>
                    <div>
                      <strong className="text-xs text-slate-800 block">معلم لغتي الذكي</strong>
                      <span className="text-[10px] text-slate-400 font-mono">{tutorModel}</span>
                    </div>
                  </div>
                  <span className="font-mono font-black text-xs text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100">
                    {tutorQueries} / {tutorLimit}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-100">
                  <span>التوكنز المستهلكة:</span>
                  <strong className="font-mono text-emerald-700 font-bold">{tutorTokens.toLocaleString('ar-EG')}</strong>
                </div>
              </div>

              {/* TTS */}
              <div className={`bg-white border rounded-2xl p-3 flex flex-col justify-between gap-2 shadow-2xs ${
                isTtsExceeded ? 'border-rose-300 bg-rose-50/20' : 'border-slate-200'
              }`}>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className={`p-2 rounded-xl ${isTtsExceeded ? 'bg-rose-100 text-rose-700' : 'bg-teal-50 text-teal-700'}`}>
                      <Volume2 className="w-4 h-4" />
                    </div>
                    <div>
                      <strong className="text-xs text-slate-800 block">قارئ الأصوات الفصيح</strong>
                      <span className="text-[10px] text-slate-400 font-mono">{ttsModel}</span>
                    </div>
                  </div>
                  <span className={`font-mono font-black text-xs px-2 py-0.5 rounded-lg border ${
                    isTtsExceeded 
                      ? 'text-rose-800 bg-rose-50 border-rose-300' 
                      : 'text-teal-800 bg-teal-50 border-teal-100'
                  }`}>
                    {ttsQueries} / {ttsLimit} {isTtsExceeded && '(انتهت الحصة)'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-100">
                  <span>التوكنز المستهلكة:</span>
                  <strong className="font-mono text-teal-700 font-bold">{ttsTokens.toLocaleString('ar-EG')}</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Renewal Countdown Box (موعد التجديد) */}
          <div className="bg-amber-50/80 border border-amber-200/90 rounded-2xl p-3.5 flex items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm shadow-amber-500/30">
                <Clock className="w-4 h-4 animate-pulse" />
              </div>
              <div className="min-w-0">
                <span className="text-xs font-bold text-amber-900 block">
                  موعد التجديد التلقائي القادم
                </span>
                <p className="text-[11px] text-amber-700 font-medium">
                  يتجدد الرصيد بالكامل مجانًا كل ليلة عند {resetTimeFormatted}
                </p>
              </div>
            </div>

            {/* Live Timer Counter */}
            <div className="bg-white border border-amber-300/80 px-2.5 py-1 rounded-xl text-center shrink-0 shadow-2xs">
              <span className="text-[9px] text-slate-400 block font-bold leading-tight">متبقي</span>
              <span className="font-mono font-black text-sm sm:text-base text-amber-900 tracking-tight dir-ltr block">
                {formatTimer()}
              </span>
            </div>
          </div>

          {/* Educational Notes */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 space-y-1.5 text-xs text-slate-600">
            <div className="flex items-center gap-1.5 font-bold text-slate-800">
              <Lightbulb className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span>ملاحظات الاستهلاك المنهجي:</span>
            </div>
            <ul className="space-y-1 text-[11px] list-disc list-inside leading-relaxed text-slate-600">
              <li>
                <strong>تخزين فوري مجاني:</strong> الملفات الصوتية المسجلة مسبقاً تعمل مباشرة من النظام دون استهلاك أي رصيد.
              </li>
              <li>
                <strong>استمرارية التعليم:</strong> في حال استنفاد الحصة اليومية، تستمر جميع الدروس والشروحات النحوية وجداول المفردات في العمل بكفاءة كاملة.
              </li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>حصة تعليمية آمنة مخصصة لمرحلة التعليم الابتدائي</span>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white transition-all cursor-pointer shadow-xs"
          >
            حسناً، فهمت
          </button>
        </div>
      </div>
    </div>
  );
};

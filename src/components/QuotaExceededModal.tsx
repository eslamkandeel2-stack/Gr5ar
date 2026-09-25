import React, { useState } from 'react';
import { AlertTriangle, Volume2, Sparkles, X, Clock, Play } from 'lucide-react';
import { aiUsageService } from '../utils/aiUsageService.ts';

export interface QuotaExceededDetails {
  service: 'tts';
  message?: string;
  retryDelay?: string;
  lessonTitle?: string;
  text?: string;
}

interface QuotaExceededModalProps {
  isOpen: boolean;
  details: QuotaExceededDetails | null;
  onConfirm: (rememberChoice: boolean) => void;
  onCancel: () => void;
}

export const QuotaExceededModal: React.FC<QuotaExceededModalProps> = ({
  isOpen,
  details,
  onConfirm,
  onCancel,
}) => {
  const [rememberChoice, setRememberChoice] = useState<boolean>(false);

  if (!isOpen) return null;

  const usageStats = aiUsageService.getStats();
  const ttsUsage = usageStats.breakdown.tts;
  const countdown = usageStats.resetCountdown;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fadeIn"
      dir="rtl"
      role="dialog"
      aria-modal="true"
      aria-labelledby="quota-modal-title"
    >
      <div className="bg-slate-900 border border-amber-500/40 rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden text-white relative">
        {/* Glow Header Accent */}
        <div className="h-2 bg-linear-to-r from-amber-500 via-rose-500 to-amber-600" />

        {/* Close Button */}
        <button
          onClick={onCancel}
          className="absolute top-4 left-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-all cursor-pointer"
          title="إغلاق التنبيه وإلغاء التشغيل"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 sm:p-7 space-y-5">
          {/* Header Icon + Title */}
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0 text-amber-400 shadow-inner">
              <AlertTriangle className="w-6 h-6 animate-pulse" />
            </div>
            <div className="space-y-1 min-w-0 flex-1">
              <span className="text-[11px] font-bold text-amber-400 tracking-wider uppercase flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                تنبيه حصة الذكاء الاصطناعي (Gemini Quota)
              </span>
              <h3 id="quota-modal-title" className="text-lg sm:text-xl font-black text-white font-['Cairo',sans-serif]">
                استُنفدت حصة توليد الأصوات اليومية
              </h3>
            </div>
          </div>

          {/* Explanation Text */}
          <div className="bg-slate-800/60 rounded-2xl p-4 border border-slate-700/60 text-sm leading-relaxed text-slate-300 space-y-3">
            <p>
              لقد وصل استهلاك خدمة توليد الأصوات الفائقة عبر ذكاء <strong className="text-amber-300">Gemini 3.1 Flash TTS</strong> إلى الحد الأقصى المسموح به مجاناً لهذا اليوم.
            </p>

            {/* Quota Details Box */}
            <div className="grid grid-cols-2 gap-2 text-xs bg-slate-900/80 p-3 rounded-xl border border-slate-700/80">
              <div className="flex flex-col">
                <span className="text-slate-400">الطلبات المستهلكة:</span>
                <span className="font-bold text-amber-400 font-mono text-sm">
                  {Math.max(ttsUsage?.queries ?? 10, ttsUsage?.limit ?? 10)} / {ttsUsage?.limit ?? 10} طلبات
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-slate-400 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-400" />
                  تجديد الحصة:
                </span>
                <span className="font-bold text-emerald-400 text-xs">
                  {countdown?.formattedArabic || 'منتصف الليل (12:00 ص)'}
                </span>
              </div>
            </div>

            {details?.lessonTitle && (
              <div className="text-xs text-slate-400 pt-1 border-t border-slate-700/50 flex items-center gap-1.5">
                <span>النص المطلوب:</span>
                <span className="text-slate-200 font-bold truncate">{details.lessonTitle}</span>
              </div>
            )}
          </div>

          {/* Fallback Option Prompt */}
          <div className="bg-emerald-950/30 border border-emerald-500/30 rounded-2xl p-4 space-y-2">
            <div className="flex items-center gap-2 text-emerald-300 font-bold text-xs sm:text-sm">
              <Volume2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>هل ترغب في قراءة النص عبر قارئ المتصفح البديل؟</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              يتوفر الآن خيار الاستماع للنص مجاناً وبلا حدود عبر <strong>قارئ المتصفح الصوتي المدمج (Web Speech)</strong>، علماً بأن نبرته آلية وتختلف عن فصاحة أصوات الذكاء الاصطناعي الطبيعية.
            </p>
          </div>

          {/* Remember Choice Checkbox */}
          <label className="flex items-center gap-2.5 text-xs text-slate-400 hover:text-slate-200 cursor-pointer select-none transition-colors">
            <input
              type="checkbox"
              checked={rememberChoice}
              onChange={(e) => setRememberChoice(e.target.checked)}
              className="w-4 h-4 rounded-md border-slate-700 bg-slate-800 text-emerald-500 focus:ring-emerald-400/40 cursor-pointer"
            />
            <span>المتابعة التلقائية بقارئ المتصفح لبقية اليوم دون إظهار هذا التنبيه</span>
          </label>

          {/* Action Buttons */}
          <div className="flex flex-col-reverse sm:flex-row items-center gap-2.5 pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="w-full sm:w-1/2 py-3 px-4 rounded-xl text-xs font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-750 border border-slate-700 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <X className="w-4 h-4 text-slate-400" />
              <span>إلغاء الأمر وعدم التشغيل</span>
            </button>

            <button
              type="button"
              onClick={() => onConfirm(rememberChoice)}
              className="w-full sm:w-1/2 py-3 px-4 rounded-xl text-xs font-bold text-white bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 border border-emerald-400/30 shadow-lg shadow-emerald-950/40 transition-all cursor-pointer flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>تشغيل بقارئ المتصفح</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

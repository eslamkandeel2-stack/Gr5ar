import React from 'react';
import { GrammarLesson } from '../types.ts';
import { 
  Sparkles, 
  Check, 
  Lightbulb, 
  GraduationCap
} from 'lucide-react';

interface GrammarTabProps {
  grammarLessons: GrammarLesson[];
}

export const GrammarTab: React.FC<GrammarTabProps> = ({ grammarLessons }) => {
  if (!grammarLessons || grammarLessons.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-8 text-center border border-slate-200">
        <GraduationCap className="w-10 h-10 text-slate-300 mx-auto mb-2" />
        <p className="text-slate-600 font-bold text-sm">هذا الدرس يركز على النص القرائي والمفردات.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {grammarLessons.map((lesson, idx) => (
        <div
          key={idx}
          className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden"
        >
          {/* Header */}
          <div className="p-5 bg-linear-to-r from-emerald-50 via-teal-50 to-emerald-50 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-black tracking-wider uppercase px-2 py-0.5 rounded bg-emerald-200/80 text-emerald-900">
                  {lesson.category === 'نحو' ? 'قَوَاعِد نَحْوِيَّة' : lesson.category === 'إملاء' ? 'قَوَاعِد إِمْلَائِيَّة' : 'قَوَاعِد لُغَوِيَّة'}
                </span>
                <h3 className="font-extrabold text-slate-900 text-base mt-1">
                  {lesson.title}
                </h3>
              </div>
            </div>
          </div>

          <div className="p-5 sm:p-6 space-y-6">
            {/* Rules list */}
            <div className="space-y-2.5">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-800">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span>القَاعِدَةُ اللُّغَوِيَّةُ:</span>
              </div>
              <ul className="space-y-2">
                {lesson.rules.map((rule, rIdx) => (
                  <li
                    key={rIdx}
                    className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700 bg-slate-50/80 p-3 rounded-xl border border-slate-100"
                  >
                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {rIdx + 1}
                    </span>
                    <span className="leading-relaxed font-medium">{rule}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Examples with grammar notes */}
            {lesson.examples && lesson.examples.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                  <Lightbulb className="w-4 h-4 text-amber-500" />
                  <span>أَمْثِلَةٌ تَطْبِيقِيَّةٌ وَإِعْرَابٌ نَمُوذَجِيٌّ:</span>
                </div>

                <div className="grid gap-2.5 sm:grid-cols-1">
                  {lesson.examples.map((ex, exIdx) => (
                    <div
                      key={exIdx}
                      className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-white transition-colors"
                    >
                      <p className="font-bold text-base text-slate-900 font-['Amiri',serif] border-b border-slate-100 pb-2 mb-2">
                        {ex.text}
                      </p>
                      {ex.note && (
                        <p className="text-xs text-emerald-800 font-medium">
                          <span className="font-bold text-slate-700">ملاحظة إعرابية: </span>
                          {ex.note}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

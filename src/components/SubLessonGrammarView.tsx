import React from 'react';
import { GrammarLesson } from '../types.ts';
import { 
  GraduationCap, 
  Sparkles, 
  Lightbulb, 
  AlertTriangle, 
  CheckCircle2, 
  BookOpen, 
  HelpCircle,
  Table,
  Check
} from 'lucide-react';
import { SubLessonQuiz } from './SubLessonQuiz.tsx';

interface SubLessonGrammarViewProps {
  lesson: GrammarLesson;
  onAddScore?: (points: number) => void;
}

export const SubLessonGrammarView: React.FC<SubLessonGrammarViewProps> = ({
  lesson,
  onAddScore
}) => {
  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl border border-indigo-100 shadow-xs overflow-hidden">
        <div className="p-6 sm:p-7 bg-linear-to-r from-indigo-800 via-indigo-700 to-indigo-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-xs flex items-center justify-center text-amber-300 shrink-0 shadow-inner">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-500/50 text-indigo-100 border border-indigo-400/30">
                  القَوَاعِدُ النَّحْوِيَّةُ المُقَرَّرَةُ
                </span>
                {lesson.subTitle && (
                  <span className="text-xs text-amber-300 font-bold">
                    {lesson.subTitle}
                  </span>
                )}
              </div>
              <h2 className="text-xl sm:text-2xl font-black mt-1">
                {lesson.title}
              </h2>
            </div>
          </div>

          {lesson.objective && (
            <div className="bg-indigo-900/60 border border-indigo-400/30 rounded-2xl p-3 max-w-sm text-xs text-indigo-100">
              <span className="font-bold text-amber-300 block mb-0.5">الهدف التعليمي:</span>
              {lesson.objective}
            </div>
          )}
        </div>

        {/* Rules Section */}
        <div className="p-6 sm:p-8 space-y-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-indigo-900 font-black text-sm">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span>القَوَاعِدُ النَّحْوِيَّةُ الأَسَاسِيَّةُ:</span>
            </div>

            <div className="grid gap-3 sm:grid-cols-1">
              {lesson.rules.map((rule, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 p-4 rounded-2xl bg-indigo-50/40 border border-indigo-100/80 hover:bg-indigo-50/70 transition-colors"
                >
                  <div className="w-6 h-6 rounded-full bg-indigo-600 text-white font-mono font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                    {idx + 1}
                  </div>
                  <p className="text-sm sm:text-base text-slate-800 font-medium leading-relaxed">
                    {rule}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Detailed Sub-Sections if present */}
          {lesson.detailedSections && lesson.detailedSections.length > 0 && (
            <div className="space-y-4 pt-2">
              <div className="flex items-center gap-2 text-indigo-900 font-black text-sm">
                <BookOpen className="w-4 h-4 text-indigo-600" />
                <span>الشَّرْحُ التَّفْصِيلِيُّ لِلْمَفَاهِيمِ:</span>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {lesson.detailedSections.map((sec, sIdx) => (
                  <div
                    key={sIdx}
                    className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-2.5"
                  >
                    <h4 className="font-extrabold text-indigo-900 text-sm flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-indigo-500" />
                      <span>{sec.title}</span>
                    </h4>
                    <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-normal">
                      {sec.content}
                    </p>
                    {sec.keyPoints && sec.keyPoints.length > 0 && (
                      <ul className="space-y-1.5 pt-1">
                        {sec.keyPoints.map((pt, pIdx) => (
                          <li key={pIdx} className="text-xs text-slate-600 flex items-start gap-2">
                            <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
                            <span>{pt}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                    {sec.alert && (
                      <div className="bg-amber-50 border border-amber-200/80 rounded-xl p-2.5 text-xs text-amber-900 font-medium flex items-start gap-2 mt-2">
                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <span>{sec.alert}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Infographic Tables */}
          {lesson.tables && lesson.tables.length > 0 && (
            <div className="space-y-3 pt-2">
              {lesson.tables.map((tbl, tIdx) => (
                <div key={tIdx} className="space-y-2">
                  {tbl.title && (
                    <div className="flex items-center gap-2 text-indigo-900 font-bold text-xs sm:text-sm">
                      <Table className="w-4 h-4 text-indigo-600" />
                      <span>{tbl.title}</span>
                    </div>
                  )}
                  <div className="overflow-x-auto rounded-2xl border border-indigo-100">
                    <table className="w-full text-right text-xs sm:text-sm">
                      <thead className="bg-indigo-100/70 text-indigo-950 font-black">
                        <tr>
                          {tbl.headers.map((h, hIdx) => (
                            <th key={hIdx} className="p-3 border-b border-indigo-200">
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {tbl.rows.map((row, rIdx) => (
                          <tr key={rIdx} className="hover:bg-indigo-50/30 transition-colors">
                            {row.map((cell, cIdx) => (
                              <td key={cIdx} className="p-3 text-slate-700 font-medium">
                                {cell}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Parsed Sentences & Examples */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-2 text-slate-900 font-black text-sm">
              <Lightbulb className="w-4 h-4 text-amber-500" />
              <span>نَمَاذِجُ مُعْرَبَةٌ وَأَمْثِلَةٌ تَطْبِيقِيَّةٌ:</span>
            </div>

            <div className="grid gap-3 sm:grid-cols-1">
              {lesson.examples.map((ex, eIdx) => (
                <div
                  key={eIdx}
                  className="p-4 sm:p-5 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-indigo-200 transition-all space-y-2"
                >
                  <div className="flex items-center justify-between gap-2 border-b border-slate-200/80 pb-2">
                    <span className="text-base sm:text-lg font-black text-slate-900 font-['Amiri',serif]">
                      {ex.text}
                    </span>
                    <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200/60">
                      نموذج {eIdx + 1}
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm text-indigo-950 leading-relaxed font-medium">
                    <span className="font-bold text-slate-700">الإعراب والملاحظة: </span>
                    {ex.note}
                  </p>

                  {/* Word-by-word syntax chips if present */}
                  {ex.analysis && ex.analysis.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-2">
                      {ex.analysis.map((an, aIdx) => (
                        <div
                          key={aIdx}
                          className="bg-white border border-indigo-100 rounded-xl p-2 text-xs flex flex-col shadow-2xs min-w-28"
                        >
                          <span className="font-black text-slate-900 text-sm font-['Amiri',serif] border-b border-slate-100 pb-0.5 mb-1">
                            {an.word}
                          </span>
                          <span className="text-indigo-700 font-bold">{an.role}</span>
                          <span className="text-slate-500 text-[11px]">{an.marker}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Golden Warnings / Common Mistakes */}
          {lesson.commonMistakes && lesson.commonMistakes.length > 0 && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-2 text-amber-900 font-black text-sm">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>انْتَبِهْ مَعَ سِلَاحِ التِّلْمِيذِ (أَخْطَاءٌ شَائِعَةٌ وَتَصْوِيبُهَا):</span>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {lesson.commonMistakes.map((m, mIdx) => (
                  <div
                    key={mIdx}
                    className="p-4 rounded-2xl bg-linear-to-br from-rose-50/50 to-amber-50/50 border border-amber-200/80 space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-xs font-bold text-rose-700 flex items-center gap-1.5">
                        <span className="w-4 h-4 rounded-full bg-rose-200 text-rose-800 text-[10px] font-black flex items-center justify-center">✕</span>
                        <span>خطأ: {m.wrong}</span>
                      </div>
                      <div className="text-xs font-bold text-emerald-700 flex items-center gap-1.5">
                        <span className="w-4 h-4 rounded-full bg-emerald-200 text-emerald-800 text-[10px] font-black flex items-center justify-center">✓</span>
                        <span>صواب: {m.right}</span>
                      </div>
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed pt-1 border-t border-amber-200/60">
                      <span className="font-bold text-amber-950">السبب: </span>
                      {m.reason}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tips */}
          {lesson.tips && lesson.tips.length > 0 && (
            <div className="bg-linear-to-r from-indigo-50 to-teal-50 border border-indigo-200/80 rounded-2xl p-4 space-y-2">
              <h5 className="font-extrabold text-indigo-950 text-xs sm:text-sm flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-amber-500" />
                <span>نَصَائِحُ سِلَاحِ التِّلْمِيذِ الذَّهَبِيَّةُ لِلْإِعْرَابِ:</span>
              </h5>
              <ul className="space-y-1 text-xs sm:text-sm text-indigo-900 list-disc list-inside">
                {lesson.tips.map((t, idx) => (
                  <li key={idx} className="leading-relaxed">{t}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Interactive Sub-Lesson Exercises */}
      {lesson.exercises && lesson.exercises.length > 0 && (
        <SubLessonQuiz
          exercises={lesson.exercises}
          title={lesson.title}
          categoryLabel="قواعد نحوية"
          onAddScore={onAddScore}
        />
      )}
    </div>
  );
};

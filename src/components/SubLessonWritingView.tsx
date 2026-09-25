import React, { useState, useEffect } from 'react';
import { WritingTopic } from '../types.ts';
import { 
  PenTool, 
  Sparkles, 
  CheckCircle2, 
  Lightbulb, 
  BookOpen, 
  Save, 
  RotateCcw, 
  FileText,
  HelpCircle,
  Award
} from 'lucide-react';
import { SubLessonQuiz } from './SubLessonQuiz.tsx';

interface SubLessonWritingViewProps {
  topic: WritingTopic;
  lessonId?: string;
  onAddScore?: (points: number) => void;
}

export const SubLessonWritingView: React.FC<SubLessonWritingViewProps> = ({
  topic,
  lessonId = 'writing-default',
  onAddScore
}) => {
  const storageKey = `writing_draft_${lessonId}_${topic.type}`;
  const [draft, setDraft] = useState('');
  const [isSaved, setIsSaved] = useState(false);
  const [activeElementTag, setActiveElementTag] = useState<string | null>(null);

  // Load saved draft
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        setDraft(saved);
      }
    } catch (e) {
      console.error(e);
    }
  }, [storageKey]);

  const handleSaveDraft = () => {
    try {
      localStorage.setItem(storageKey, draft);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2500);
      if (onAddScore && draft.trim().length > 30) {
        onAddScore(10);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleClearDraft = () => {
    if (window.confirm('هل تريد مسح المسودة والبدء من جديد؟')) {
      setDraft('');
      localStorage.removeItem(storageKey);
    }
  };

  const wordCount = draft.trim() ? draft.trim().split(/\s+/).length : 0;
  const charCount = draft.length;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl border border-teal-100 shadow-xs overflow-hidden">
        <div className="p-6 sm:p-7 bg-linear-to-r from-teal-800 via-emerald-800 to-teal-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-xs flex items-center justify-center text-amber-300 shrink-0 shadow-inner">
              <PenTool className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-teal-500/50 text-teal-100 border border-teal-400/30">
                  التَّعْبِيرُ الكِتَابِيُّ التَّطْبِيقِيُّ
                </span>
                <span className="text-xs text-amber-300 font-bold">
                  {topic.type}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black mt-1">
                {topic.title}
              </h2>
            </div>
          </div>

          {topic.objective && (
            <div className="bg-teal-900/60 border border-teal-400/30 rounded-2xl p-3 max-w-sm text-xs text-teal-100">
              <span className="font-bold text-amber-300 block mb-0.5">الهدف من كتابة هذا الموضوع:</span>
              {topic.objective}
            </div>
          )}
        </div>

        {/* Structural Elements Breakdown */}
        <div className="p-6 sm:p-8 space-y-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-teal-950 font-black text-sm">
              <Sparkles className="w-4 h-4 text-teal-600" />
              <span>عَنَاصِرُ بِنَاءِ المَوْضُوعِ الرَّئِيسَةُ:</span>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {topic.elements.map((el, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl bg-teal-50/40 border border-teal-100/90 space-y-1.5 hover:bg-teal-50/70 transition-all shadow-2xs"
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-mono font-black text-teal-700 bg-teal-100 px-2 py-0.5 rounded-md">
                      عنصر ٠{idx + 1}
                    </span>
                    <span className="font-extrabold text-sm text-slate-900">
                      {el.name}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {el.desc}
                  </p>
                  {el.sample && (
                    <div className="mt-2 pt-2 border-t border-teal-100/80 text-[11px] text-teal-950 bg-white/80 p-2 rounded-xl border border-teal-100">
                      <span className="font-bold text-teal-800">مثال توضيحي: </span>
                      «{el.sample}»
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Model Text & Detailed Breakdown if present */}
          {topic.modelText && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-slate-900 font-black text-sm">
                  <FileText className="w-4 h-4 text-teal-600" />
                  <span>نَمُوذَجٌ تَطْبِيقِيٌّ مُحَلَّلٌ وَمَشْرُوحٌ بِالكِتَابِ:</span>
                </div>
                <span className="text-[11px] font-bold text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200">
                  {topic.modelText.context}
                </span>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-3xl p-5 sm:p-7 space-y-4">
                <h4 className="font-extrabold text-slate-900 text-base border-b border-slate-200/80 pb-2">
                  {topic.modelText.title}
                </h4>

                <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 text-sm sm:text-base leading-loose font-['Amiri',serif] text-slate-800 whitespace-pre-line shadow-2xs">
                  {topic.modelText.content}
                </div>

                {/* Analytical breakdown */}
                {topic.modelText.breakdown && topic.modelText.breakdown.length > 0 && (
                  <div className="space-y-3 pt-3 border-t border-slate-200/80">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-4 rounded-full bg-teal-600 inline-block"></span>
                      <h5 className="text-xs sm:text-sm font-extrabold text-slate-900">
                        التحليل التفصيلي لعناصر النموذج السابق:
                      </h5>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {topic.modelText.breakdown.map((b, bIdx) => (
                        <div
                          key={bIdx}
                          className="bg-white p-3.5 sm:p-4 rounded-2xl border border-teal-100 shadow-2xs hover:border-teal-300 transition-all flex flex-col justify-between"
                        >
                          {/* السطر الأول: اسم العنصر في سطر مستقل */}
                          <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-teal-100/70 mb-2.5">
                            <div className="flex items-center gap-2">
                              <span className="w-5 h-5 rounded-md bg-teal-600 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-2xs">
                                {bIdx + 1}
                              </span>
                              <span className="font-extrabold text-xs sm:text-sm text-teal-950">
                                {b.element}
                              </span>
                            </div>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200/60 shrink-0">
                              عنصر {bIdx + 1}
                            </span>
                          </div>

                          {/* السطر التالي: نص التحليل والشرح */}
                          <div className="space-y-2">
                            <div className="bg-slate-50/80 p-2.5 rounded-xl border border-slate-200/60 text-xs sm:text-sm text-slate-800 leading-relaxed font-['Amiri',serif]">
                              <span className="text-teal-600 font-bold ml-1">«</span>
                              <span className="font-bold text-slate-900">{b.text}</span>
                              <span className="text-teal-600 font-bold mr-1">»</span>
                            </div>

                            {b.note && (
                              <div className="text-[11px] sm:text-xs text-teal-800 bg-teal-50/60 p-2 rounded-lg border border-teal-100/80 flex items-start gap-1.5">
                                <span className="font-bold text-teal-900 shrink-0">توضيح:</span>
                                <span className="leading-relaxed">{b.note}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Instructions */}
          {topic.instructions && topic.instructions.length > 0 && (
            <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4 sm:p-5 space-y-2">
              <h5 className="font-extrabold text-amber-950 text-xs sm:text-sm flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-amber-600" />
                <span>إِرْشَادَاتُ الكِتَابَةِ لِلتِّلْمِيذِ:</span>
              </h5>
              <ul className="space-y-1.5 text-xs sm:text-sm text-amber-900 list-disc list-inside">
                {topic.instructions.map((inst, idx) => (
                  <li key={idx} className="leading-relaxed">{inst}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Interactive Sub-Lesson Exercises for Writing */}
      {topic.exercises && topic.exercises.length > 0 && (
        <SubLessonQuiz
          exercises={topic.exercises}
          title={topic.title}
          categoryLabel="تعبير كتابي"
          onAddScore={onAddScore}
        />
      )}

      {/* Interactive Writing Workshop */}
      <div className="bg-white rounded-3xl border border-teal-200 shadow-sm p-6 sm:p-8 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-teal-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <PenTool className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">
                وَرْشَةُ الكِتَابَةِ التَّفَاعُلِيَّةُ لِلتِّلْمِيذِ
              </h3>
              <p className="text-xs text-slate-500">
                اكتب موضوعك مستوفياً العناصر، وسيتم حفظ مسودتك تلقائياً في جهازك.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <span className="text-xs font-mono font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg">
              {wordCount} كلمة • {charCount} حرف
            </span>
          </div>
        </div>

        {/* Text Area */}
        <div className="space-y-2">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="ابدأ بكتابة موضوعك هنا مسترشداً بالعناصر السابقة (مثلاً: التحية، المقدمة، الغرض، الخاتمة...)"
            rows={8}
            className="w-full p-4 sm:p-5 rounded-2xl border border-slate-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 text-sm sm:text-base leading-loose font-['Amiri',serif] resize-y placeholder:text-slate-400 outline-none transition-all shadow-inner"
          />
        </div>

        {/* Workshop Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <div className="flex items-center gap-2">
            <button
              onClick={handleSaveDraft}
              disabled={draft.trim().length === 0}
              className="bg-teal-600 hover:bg-teal-700 disabled:opacity-40 disabled:pointer-events-none text-white px-5 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center gap-2 shadow-xs cursor-pointer active:scale-95"
            >
              <Save className="w-4 h-4" />
              <span>حفظ المسودة وتثبيت الإنجاز</span>
            </button>

            {isSaved && (
              <span className="text-xs font-bold text-emerald-600 flex items-center gap-1 animate-fadeIn">
                <CheckCircle2 className="w-4 h-4" />
                <span>تم الحفظ بنجاح!</span>
              </span>
            )}
          </div>

          {draft.trim().length > 0 && (
            <button
              onClick={handleClearDraft}
              className="text-xs text-slate-500 hover:text-rose-600 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>مسح والبدء من جديد</span>
            </button>
          )}
        </div>

        {/* Self Assessment Rubric */}
        {topic.rubric && topic.rubric.length > 0 && (
          <div className="pt-4 border-t border-slate-100 space-y-3">
            <div className="flex items-center gap-2 text-slate-900 font-black text-xs sm:text-sm">
              <Award className="w-4 h-4 text-amber-500" />
              <span>مَعَايِيرُ التَّقْيِيمِ الذَّاتِيِّ (تَأَكَّدْ مِنْ تَوَافُرِهَا فِي مَوْضُوعِكَ):</span>
            </div>

            <div className="grid gap-2.5 sm:grid-cols-2">
              {topic.rubric.map((rub, rIdx) => (
                <div
                  key={rIdx}
                  className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-start gap-2.5 text-xs"
                >
                  <span className="w-5 h-5 rounded-full bg-teal-100 text-teal-800 font-bold flex items-center justify-center shrink-0 mt-0.5">
                    ✓
                  </span>
                  <div>
                    <span className="font-extrabold text-slate-800 block">
                      {rub.criteria} ({rub.points})
                    </span>
                    <span className="text-slate-500 text-[11px] block mt-0.5">
                      {rub.tip}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

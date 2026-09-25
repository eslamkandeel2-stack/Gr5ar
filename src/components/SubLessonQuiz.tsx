import React, { useState } from 'react';
import { Question } from '../types.ts';
import { 
  CheckCircle2, 
  XCircle, 
  HelpCircle, 
  Sparkles, 
  RotateCcw, 
  Trophy, 
  ArrowLeft,
  ArrowRight,
  FileText,
  Check,
  AlertTriangle,
  Eye
} from 'lucide-react';

interface SubLessonQuizProps {
  exercises: Question[];
  title: string;
  categoryLabel: string;
  onAddScore?: (points: number) => void;
}

export const SubLessonQuiz: React.FC<SubLessonQuizProps> = ({
  exercises,
  title,
  categoryLabel,
  onAddScore
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, any>>({});
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [reportFilter, setReportFilter] = useState<'all' | 'mistakes'>('mistakes');
  const [reviewOnCards, setReviewOnCards] = useState<boolean>(false);

  if (!exercises || exercises.length === 0) {
    return null;
  }

  const currentQ = exercises[currentIndex];
  const qId = currentQ.id;
  const currentAnswer = selectedAnswers[qId];

  // Number of answered questions
  const answeredCount = Object.keys(selectedAnswers).filter(k => selectedAnswers[k] !== undefined).length;

  // Calculate score after submission
  const correctCount = exercises.filter(q => {
    if (selectedAnswers[q.id] === undefined) return false;
    return String(selectedAnswers[q.id]).trim().toLowerCase() === String(q.correctAnswer).trim().toLowerCase();
  }).length;

  const mistakes = exercises.filter(q => {
    return String(selectedAnswers[q.id]).trim().toLowerCase() !== String(q.correctAnswer).trim().toLowerCase();
  });

  const percentage = Math.round((correctCount / exercises.length) * 100);

  const handleSelectOption = (opt: string) => {
    if (isSubmitted) return;
    setSelectedAnswers(prev => ({ ...prev, [qId]: opt }));
  };

  const handleSelectBoolean = (val: boolean) => {
    if (isSubmitted) return;
    setSelectedAnswers(prev => ({ ...prev, [qId]: val }));
  };

  const handleRequestSubmit = () => {
    if (answeredCount < exercises.length) {
      setShowConfirmModal(true);
    } else {
      executeSubmit();
    }
  };

  const executeSubmit = () => {
    setIsSubmitted(true);
    setShowConfirmModal(false);
    setReviewOnCards(false);
    if (onAddScore) {
      onAddScore(correctCount * 5);
    }
  };

  const handleReset = () => {
    setSelectedAnswers({});
    setIsSubmitted(false);
    setCurrentIndex(0);
    setShowConfirmModal(false);
    setReviewOnCards(false);
    setReportFilter('mistakes');
  };

  // 1. END-OF-TEST REPORT VIEW (Shown after submitting)
  if (isSubmitted && !reviewOnCards) {
    return (
      <div className="bg-white rounded-3xl border border-emerald-100 shadow-sm overflow-hidden mt-8">
        {/* Report Top Header */}
        <div className="p-6 sm:p-7 bg-linear-to-r from-slate-900 via-indigo-950 to-slate-900 text-white">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-amber-300 shrink-0">
                <Trophy className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-black tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-200 border border-amber-400/30">
                  تَقْرِيرُ نَتِيجَةِ الِاخْتِبَارِ وَتَحْلِيلُ الأَخْطَاءِ
                </span>
                <h3 className="text-lg sm:text-xl font-black mt-1 text-white">
                  {title} • {categoryLabel}
                </h3>
              </div>
            </div>

            {/* Score Ring / Badge */}
            <div className="bg-white/10 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/20 text-center sm:text-right shrink-0">
              <div className="text-xs text-slate-300">الدرجة النهائية</div>
              <div className="text-2xl sm:text-3xl font-black text-amber-300 font-mono">
                {correctCount} <span className="text-sm text-slate-300">/ {exercises.length}</span>
                <span className="text-xs font-bold text-emerald-400 mr-2">({percentage}%)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Report Controls & Filters */}
        <div className="p-5 sm:p-6 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setReportFilter('mistakes')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                reportFilter === 'mistakes'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              <XCircle className="w-4 h-4" />
              <span>الأخطاء فقط ({mistakes.length})</span>
            </button>

            <button
              onClick={() => setReportFilter('all')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                reportFilter === 'all'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>جميع الأسئلة ({exercises.length})</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setReviewOnCards(true)}
              className="bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Eye className="w-4 h-4 text-emerald-600" />
              <span>مراجعة الأسئلة سؤالاً بسؤال</span>
            </button>

            <button
              onClick={handleReset}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
            >
              <RotateCcw className="w-4 h-4" />
              <span>إعادة الاختبار</span>
            </button>
          </div>
        </div>

        {/* Report Content List */}
        <div className="p-5 sm:p-7 space-y-4 max-h-[600px] overflow-y-auto">
          {reportFilter === 'mistakes' && mistakes.length === 0 ? (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-8 text-center space-y-2">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h4 className="font-extrabold text-emerald-950 text-base">
                أداء عبقري! لا توجد أي أخطاء في هذا الاختبار
              </h4>
              <p className="text-xs text-emerald-800">
                لقد أجبت على جميع الأسئلة بصورة صحيحة ومثالية بنسبة 100%. بارك الله في تفوقك!
              </p>
            </div>
          ) : (
            (reportFilter === 'mistakes' ? mistakes : exercises).map((q, idx) => {
              const uAns = selectedAnswers[q.id];
              const isCorr = String(uAns).trim().toLowerCase() === String(q.correctAnswer).trim().toLowerCase();
              const originalIndex = exercises.findIndex(ex => ex.id === q.id) + 1;

              return (
                <div
                  key={q.id}
                  className={`rounded-2xl p-4 sm:p-5 border transition-all ${
                    isCorr
                      ? 'bg-emerald-50/50 border-emerald-200'
                      : 'bg-rose-50/40 border-rose-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-2.5">
                    <div className="flex items-start gap-2">
                      <span className={`w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center shrink-0 mt-0.5 ${
                        isCorr ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
                      }`}>
                        {originalIndex}
                      </span>
                      <h4 className="font-bold text-slate-900 text-sm sm:text-base leading-relaxed">
                        {q.prompt}
                      </h4>
                    </div>

                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold shrink-0 flex items-center gap-1 ${
                      isCorr ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                    }`}>
                      {isCorr ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>صحيحة</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3.5 h-3.5" />
                          <span>خطأ</span>
                        </>
                      )}
                    </span>
                  </div>

                  {/* Answers Comparison */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-3 pt-3 border-t border-slate-200/60 text-xs">
                    <div className={`p-2.5 rounded-xl border flex items-center justify-between ${
                      isCorr 
                        ? 'bg-emerald-100/70 border-emerald-300 text-emerald-950 font-bold' 
                        : 'bg-rose-100/70 border-rose-300 text-rose-950 font-bold'
                    }`}>
                      <div>
                        <span className="text-[10px] text-slate-500 block">إجابتك:</span>
                        <span>{uAns === undefined ? 'لم تتم الإجابة' : (typeof uAns === 'boolean' ? (uAns ? 'صواب' : 'خطأ') : String(uAns))}</span>
                      </div>
                      {isCorr ? <Check className="w-4 h-4 text-emerald-600" /> : <XCircle className="w-4 h-4 text-rose-600" />}
                    </div>

                    {!isCorr && (
                      <div className="p-2.5 rounded-xl border bg-emerald-100/70 border-emerald-300 text-emerald-950 font-bold flex items-center justify-between">
                        <div>
                          <span className="text-[10px] text-emerald-800 block">الإجابة النموذجية الصحيحة:</span>
                          <span>{typeof q.correctAnswer === 'boolean' ? (q.correctAnswer ? 'صواب' : 'خطأ') : String(q.correctAnswer)}</span>
                        </div>
                        <Check className="w-4 h-4 text-emerald-600" />
                      </div>
                    )}
                  </div>

                  {/* Pedagogical Explanation */}
                  {q.explanation && (
                    <div className="mt-3 p-3 rounded-xl bg-white/90 border border-slate-200 text-xs text-slate-700 flex items-start gap-2">
                      <HelpCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-emerald-900 block mb-0.5">التوجيه وسر القاعدة:</span>
                        <p className="leading-relaxed">{q.explanation}</p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  }

  // 2. ACTIVE SOLVING OR IN-CARD REVIEW MODE
  return (
    <div className="bg-white rounded-3xl border border-emerald-100 shadow-sm overflow-hidden mt-8">
      {/* Header */}
      <div className="p-5 sm:p-6 bg-linear-to-r from-emerald-800 via-teal-800 to-emerald-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-xs flex items-center justify-center text-amber-300 shrink-0">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black tracking-wider uppercase px-2 py-0.5 rounded bg-emerald-700/80 text-emerald-100">
                تدريبات تفاعلية تطبيقية
              </span>
              <span className="text-[10px] font-bold text-amber-200">
                {categoryLabel}
              </span>
            </div>
            <h4 className="text-base sm:text-lg font-black mt-0.5">
              اختبر فهمك: {title}
            </h4>
          </div>
        </div>

        <div className="flex items-center gap-3 self-end sm:self-auto">
          <div className="text-left sm:text-right">
            <div className="text-xs text-emerald-200">السؤال الحالي</div>
            <div className="font-mono font-black text-sm sm:text-base text-amber-300">
              {currentIndex + 1} / {exercises.length}
            </div>
          </div>
        </div>
      </div>

      {/* Progress Dots Bar */}
      <div className="bg-slate-50 px-5 py-3 border-b border-slate-100 flex items-center justify-between gap-2 overflow-x-auto">
        <div className="flex items-center gap-1.5 sm:gap-2">
          {exercises.map((q, idx) => {
            const hasAns = selectedAnswers[q.id] !== undefined;
            const isAct = idx === currentIndex;
            const isCorr = isSubmitted && String(selectedAnswers[q.id]).trim().toLowerCase() === String(q.correctAnswer).trim().toLowerCase();

            let dotStyle = 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100';
            if (isSubmitted) {
              dotStyle = isCorr
                ? 'bg-emerald-600 text-white border-emerald-700 font-bold'
                : 'bg-rose-600 text-white border-rose-700 font-bold';
            } else if (hasAns) {
              dotStyle = 'bg-emerald-600 text-white border-emerald-700 font-bold';
            }

            if (isAct) {
              dotStyle += ' ring-2 ring-emerald-500 ring-offset-1 scale-105';
            }

            return (
              <button
                key={q.id}
                onClick={() => setCurrentIndex(idx)}
                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl text-xs font-mono transition-all flex items-center justify-center cursor-pointer ${dotStyle}`}
                title={`السؤال ${idx + 1}`}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>

        <div className="text-xs font-bold text-slate-600 shrink-0">
          {!isSubmitted ? (
            <span>أجبت على: <span className="font-mono font-black text-emerald-700">{answeredCount}</span> من <span className="font-mono">{exercises.length}</span></span>
          ) : (
            <span>الصحيحة: <span className="font-mono font-black text-emerald-700">{correctCount}</span> من <span className="font-mono">{exercises.length}</span></span>
          )}
        </div>
      </div>

      {/* Active Question Body */}
      <div className="p-5 sm:p-8 space-y-6">
        <div>
          <span className="text-[11px] font-black text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200/80 mb-2.5 inline-block">
            السؤال رقم ({currentIndex + 1})
          </span>
          <h3 className="text-base sm:text-lg font-black text-slate-900 leading-relaxed font-['Amiri',serif]">
            {currentQ.prompt}
          </h3>
        </div>

        {/* Options Selection (Without revealing right/wrong before submit) */}
        {currentQ.type === 'mcq' && currentQ.options && (
          <div className="grid gap-3 sm:grid-cols-2">
            {currentQ.options.map((opt, oIdx) => {
              const isChosen = currentAnswer === opt;
              const isCorrectOpt = String(opt).trim().toLowerCase() === String(currentQ.correctAnswer).trim().toLowerCase();

              let optClass = 'bg-slate-50/70 border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/40 text-slate-800';

              if (!isSubmitted) {
                if (isChosen) {
                  optClass = 'bg-emerald-50 border-emerald-500 text-emerald-950 font-bold ring-2 ring-emerald-400 shadow-xs';
                }
              } else {
                // Post submission review
                if (isCorrectOpt) {
                  optClass = 'bg-emerald-100 border-emerald-500 text-emerald-950 font-black ring-2 ring-emerald-500';
                } else if (isChosen && !isCorrectOpt) {
                  optClass = 'bg-rose-100 border-rose-400 text-rose-950 font-bold';
                } else {
                  optClass = 'opacity-50 bg-slate-50 border-slate-200 text-slate-500';
                }
              }

              return (
                <button
                  key={oIdx}
                  disabled={isSubmitted}
                  onClick={() => handleSelectOption(opt)}
                  className={`p-4 rounded-2xl border text-right transition-all flex items-center justify-between gap-3 text-sm cursor-pointer ${optClass}`}
                >
                  <span className="font-medium text-sm sm:text-base leading-snug">{opt}</span>
                  {!isSubmitted && isChosen && (
                    <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs">
                      ✓
                    </span>
                  )}
                  {isSubmitted && isCorrectOpt && (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  )}
                  {isSubmitted && isChosen && !isCorrectOpt && (
                    <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Boolean Selection (Without revealing right/wrong before submit) */}
        {currentQ.type === 'boolean' && (
          <div className="grid grid-cols-2 gap-3 max-w-md">
            {[
              { label: 'صَوَاب (صح)', val: true },
              { label: 'خَطَأ', val: false }
            ].map(b => {
              const isChosen = currentAnswer === b.val;
              const isCorrectOpt = b.val === currentQ.correctAnswer;

              let btnClass = 'bg-slate-50 border-slate-200 hover:bg-emerald-50/50 hover:border-emerald-300 text-slate-800';

              if (!isSubmitted) {
                if (isChosen) {
                  btnClass = 'bg-emerald-50 border-emerald-500 text-emerald-950 font-bold ring-2 ring-emerald-400 shadow-xs';
                }
              } else {
                if (isCorrectOpt) {
                  btnClass = 'bg-emerald-100 border-emerald-500 text-emerald-950 font-black ring-2 ring-emerald-500';
                } else if (isChosen && !isCorrectOpt) {
                  btnClass = 'bg-rose-100 border-rose-400 text-rose-950 font-bold';
                } else {
                  btnClass = 'opacity-50 bg-slate-50 border-slate-200 text-slate-500';
                }
              }

              return (
                <button
                  key={String(b.val)}
                  disabled={isSubmitted}
                  onClick={() => handleSelectBoolean(b.val)}
                  className={`py-3.5 px-4 rounded-2xl border text-center font-bold text-sm transition-all cursor-pointer ${btnClass}`}
                >
                  {b.label}
                </button>
              );
            })}
          </div>
        )}

        {/* Post-submission only: Show Explanation */}
        {isSubmitted && (
          <div
            className={`p-4 sm:p-5 rounded-2xl border ${
              String(currentAnswer).trim().toLowerCase() === String(currentQ.correctAnswer).trim().toLowerCase()
                ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
                : 'bg-rose-50/80 border-rose-200 text-rose-950'
            }`}
          >
            <div className="flex items-center gap-2 font-black text-sm mb-1.5">
              {String(currentAnswer).trim().toLowerCase() === String(currentQ.correctAnswer).trim().toLowerCase() ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span>إجابة صحيحة وموفقة! أحسنت صنعاً.</span>
                </>
              ) : (
                <>
                  <XCircle className="w-5 h-5 text-rose-600" />
                  <span>إجابة غير دقيقة. الإجابة الصحيحة هي: «{String(currentQ.correctAnswer)}»</span>
                </>
              )}
            </div>

            {currentQ.explanation && (
              <p className="text-xs sm:text-sm leading-relaxed mt-1 text-slate-700 bg-white/70 p-3 rounded-xl border border-emerald-100/60">
                <span className="font-bold text-slate-900">توضيح سلاح التلميذ: </span>
                {currentQ.explanation}
              </p>
            )}
          </div>
        )}

        {/* Navigation & Submission Controls */}
        <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              disabled={currentIndex === 0}
              onClick={() => setCurrentIndex(prev => prev - 1)}
              className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowRight className="w-4 h-4" />
              <span>السابق</span>
            </button>

            <button
              disabled={currentIndex === exercises.length - 1}
              onClick={() => setCurrentIndex(prev => prev + 1)}
              className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <span>التالي</span>
              <ArrowLeft className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            {!isSubmitted ? (
              <button
                onClick={handleRequestSubmit}
                disabled={answeredCount === 0}
                className="bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-slate-950 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all shadow-sm cursor-pointer active:scale-95 flex items-center gap-2"
              >
                <FileText className="w-4 h-4" />
                <span>تسليم الحل وإنهاء الاختبار ({answeredCount}/{exercises.length})</span>
              </button>
            ) : (
              <button
                onClick={() => setReviewOnCards(false)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all shadow-xs cursor-pointer active:scale-95 flex items-center gap-2"
              >
                <FileText className="w-4 h-4" />
                <span>العودة لتقرير الأخطاء الكامل</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Modal if Unanswered Questions Exist */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h4 className="text-base font-black text-slate-900">
                تأكيد تسليم الاختبار
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                لقد أجبت على <span className="font-bold text-amber-700">{answeredCount}</span> من أصل <span className="font-bold">{exercises.length}</span> سؤالاً.
                توجد <span className="font-bold text-rose-600">{exercises.length - answeredCount}</span> أسئلة لم تتم الإجابة عليها بعد.
                هل ترغب في تسليم الحل وعرض تقرير الأخطاء الآن؟
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="py-2.5 px-4 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                العودة لإكمال الحل
              </button>
              <button
                onClick={executeSubmit}
                className="py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black cursor-pointer shadow-xs active:scale-95"
              >
                تأكيد التسليم والتقرير
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

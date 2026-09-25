import React, { useState, useMemo, useEffect } from 'react';
import { Question, TestRecord } from '../types.ts';
import { getLessonFullExercises } from '../data/index.ts';
import { 
  saveLessonProgress, 
  getLessonProgress, 
  clearLessonProgress, 
  saveTestRecord 
} from '../utils/testStorage.ts';
import { TestReportModal } from './TestReportModal.tsx';
import { 
  CheckCircle2, 
  XCircle, 
  HelpCircle, 
  Award, 
  RotateCcw, 
  Sparkles, 
  Check, 
  FileText, 
  BookmarkCheck, 
  AlertTriangle,
  ArrowRight,
  BookOpen
} from 'lucide-react';

interface LessonExercisesTabProps {
  lessonId: string;
  lessonTitle: string;
  unitTitle?: string;
  onAddScore: (points: number) => void;
  onViewHistory?: () => void;
}

export const LessonExercisesTab: React.FC<LessonExercisesTabProps> = ({
  lessonId,
  lessonTitle,
  unitTitle,
  onAddScore,
  onViewHistory,
}) => {
  // Load full deduplicated exercises for this specific lesson
  const allLessonExercises = useMemo(() => getLessonFullExercises(lessonId), [lessonId]);

  // User state
  const [userAnswers, setUserAnswers] = useState<Record<string, any>>({});
  const [submitted, setSubmitted] = useState<Record<string, boolean>>({});
  const [correctCount, setCorrectCount] = useState<number>(0);
  const [isTestSubmitted, setIsTestSubmitted] = useState<boolean>(false);
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);

  // Filters within this lesson
  const [selectedCategory, setSelectedCategory] = useState<string>('الكل');

  // Report modal
  const [latestRecord, setLatestRecord] = useState<TestRecord | null>(null);
  const [isReportOpen, setIsReportOpen] = useState<boolean>(false);
  const [savedNotice, setSavedNotice] = useState<string | null>(null);

  // Restore saved draft/completed progress for this lesson
  useEffect(() => {
    const saved = getLessonProgress(lessonId);
    if (saved && (Object.keys(saved.userAnswers || {}).length > 0 || saved.isSubmitted)) {
      setUserAnswers(saved.userAnswers || {});
      if (saved.isSubmitted) {
        setSubmitted(saved.submitted || {});
        setCorrectCount(saved.correctCount || 0);
        setIsTestSubmitted(true);
      } else {
        setSubmitted({});
        setCorrectCount(0);
        setIsTestSubmitted(false);
      }
      setSavedNotice(`تمت استعادة إجاباتك السابقة في تدريبات هذا الدرس (${Object.keys(saved.userAnswers || {}).length} إجابة)`);
      const timer = setTimeout(() => setSavedNotice(null), 4000);
      return () => clearTimeout(timer);
    } else {
      setUserAnswers({});
      setSubmitted({});
      setCorrectCount(0);
      setIsTestSubmitted(false);
    }
  }, [lessonId]);

  // Categories available in this specific lesson
  const availableCategories = useMemo(() => {
    const cats = new Set<string>();
    allLessonExercises.forEach(q => {
      if (q.category) cats.add(q.category);
    });
    return ['الكل', ...Array.from(cats)];
  }, [allLessonExercises]);

  // Filtered exercises for display
  const displayExercises = useMemo(() => {
    if (selectedCategory === 'الكل') return allLessonExercises;
    return allLessonExercises.filter(q => q.category === selectedCategory);
  }, [allLessonExercises, selectedCategory]);

  const answeredCount = useMemo(() => {
    return allLessonExercises.filter(q => userAnswers[q.id] !== undefined).length;
  }, [allLessonExercises, userAnswers]);

  // Handle option select
  const handleSelectOption = (questionId: string, option: any) => {
    if (isTestSubmitted) return;
    const nextAnswers = { ...userAnswers, [questionId]: option };
    setUserAnswers(nextAnswers);

    // Auto-save draft
    saveLessonProgress(lessonId, {
      userAnswers: nextAnswers,
      submitted: {},
      correctCount: 0,
      isSubmitted: false,
      lastUpdated: Date.now(),
    });
  };

  // Submit flow
  const handleRequestSubmit = () => {
    if (allLessonExercises.length === 0) return;
    if (answeredCount < allLessonExercises.length) {
      setShowConfirmModal(true);
    } else {
      executeSubmit();
    }
  };

  const executeSubmit = () => {
    setShowConfirmModal(false);
    if (allLessonExercises.length === 0) return;

    const subMap: Record<string, boolean> = {};
    let totalCorrect = 0;

    const testQuestionRecords = allLessonExercises.map(q => {
      subMap[q.id] = true;
      const userAns = userAnswers[q.id];
      const isCorrect = userAns !== undefined && userAns === q.correctAnswer;
      if (isCorrect) totalCorrect++;

      return {
        questionId: q.id,
        prompt: q.prompt,
        type: q.type || 'mcq',
        options: q.options || [],
        userAnswer: userAns,
        correctAnswer: q.correctAnswer,
        isCorrect,
        explanation: q.explanation || '',
        category: q.category || 'تدريب عام',
      };
    });

    setSubmitted(subMap);
    setCorrectCount(totalCorrect);
    setIsTestSubmitted(true);

    if (totalCorrect > 0) {
      onAddScore(totalCorrect * 10);
    }

    // Save final graded progress
    saveLessonProgress(lessonId, {
      userAnswers,
      submitted: subMap,
      correctCount: totalCorrect,
      isSubmitted: true,
      lastUpdated: Date.now(),
    });

    // Save test record to history
    const scorePercentage = Math.round((totalCorrect / allLessonExercises.length) * 100);
    const record: TestRecord = {
      id: `lesson-${lessonId}-${Date.now()}`,
      title: `تدريبات درس: ${lessonTitle}`,
      scope: 'lesson',
      lessonId,
      timestamp: Date.now(),
      formattedDate: new Date().toLocaleDateString('ar-EG', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      scorePercentage,
      totalQuestions: allLessonExercises.length,
      correctCount: totalCorrect,
      answeredCount,
      questions: testQuestionRecords,
    };

    saveTestRecord(record);
    setLatestRecord(record);
    setIsReportOpen(true);
  };

  // Reset quiz
  const handleResetQuiz = () => {
    if (window.confirm('هل تريد إعادة حل تدريبات هذا الدرس ومسح الإجابات المحفوظة؟')) {
      clearLessonProgress(lessonId);
      setUserAnswers({});
      setSubmitted({});
      setCorrectCount(0);
      setIsTestSubmitted(false);
    }
  };

  const percentage = allLessonExercises.length > 0
    ? Math.round((correctCount / allLessonExercises.length) * 100)
    : 0;

  return (
    <div className="space-y-5">
      {/* Lesson Header Banner */}
      <div className="bg-linear-to-r from-emerald-700 via-emerald-600 to-teal-700 text-white rounded-3xl p-5 sm:p-6 shadow-sm border border-emerald-500/30 relative overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0 shadow-inner">
              <Award className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-black px-2.5 py-0.5 rounded-full bg-white/20 text-white">
                  تدريبات الدرس الخاصة
                </span>
                {unitTitle && (
                  <span className="text-xs text-emerald-100 font-medium">
                    {unitTitle}
                  </span>
                )}
              </div>
              <h2 className="text-xl sm:text-2xl font-black mt-1">
                تدريبات: {lessonTitle}
              </h2>
              <p className="text-xs text-emerald-100 mt-0.5">
                تقتصر هذه الصفحة على أسئلة وتدريبات هذا الدرس وقواعده النحوية والإملائية فقط ({allLessonExercises.length} سؤالاً).
              </p>
            </div>
          </div>

          {/* Action buttons on banner */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="bg-white/20 backdrop-blur-xs px-3.5 py-2 rounded-xl text-xs font-bold font-mono">
              {isTestSubmitted ? (
                <span>النتيجة: {correctCount} / {allLessonExercises.length} ({percentage}%)</span>
              ) : (
                <span>تم حل: {answeredCount} / {allLessonExercises.length}</span>
              )}
            </div>

            {!isTestSubmitted ? (
              answeredCount > 0 && (
                <button
                  onClick={handleRequestSubmit}
                  className="flex items-center gap-1.5 bg-amber-400 hover:bg-amber-300 text-amber-950 px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition-all shadow-xs cursor-pointer active:scale-95 border border-amber-300"
                >
                  <FileText className="w-4 h-4 text-amber-950" />
                  <span>تسليم الحل وعرض التقرير</span>
                </button>
              )
            ) : (
              <button
                onClick={() => setIsReportOpen(true)}
                className="flex items-center gap-1.5 bg-amber-400 hover:bg-amber-300 text-amber-950 px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition-all shadow-xs cursor-pointer active:scale-95 border border-amber-300"
              >
                <FileText className="w-4 h-4 text-amber-950" />
                <span>عرض تقرير الأخطاء</span>
              </button>
            )}

            {(answeredCount > 0 || isTestSubmitted) && (
              <button
                onClick={handleResetQuiz}
                className="flex items-center gap-1.5 bg-white text-emerald-900 hover:bg-emerald-50 px-3 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-2xs"
                title="إعادة المحاولة ومسح الإجابات"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{isTestSubmitted ? 'إعادة التدريب' : 'مسح الإجابات'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4 pt-3 border-t border-white/15">
          <div className="flex items-center justify-between text-xs text-emerald-100 mb-1.5 font-medium">
            <span>نسبة إنجاز تدريبات الدرس</span>
            <span className="font-mono">{Math.round((answeredCount / (allLessonExercises.length || 1)) * 100)}%</span>
          </div>
          <div className="w-full bg-black/20 rounded-full h-2 overflow-hidden">
            <div
              className="bg-amber-300 h-full rounded-full transition-all duration-300"
              style={{ width: `${Math.round((answeredCount / (allLessonExercises.length || 1)) * 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Auto-restored notice */}
      {savedNotice && (
        <div className="bg-teal-50 border border-teal-200 text-teal-950 px-4 py-3 rounded-2xl text-xs font-bold flex items-center justify-between gap-2 shadow-2xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <BookmarkCheck className="w-4 h-4 text-teal-600 shrink-0" />
            <span>{savedNotice}</span>
          </div>
          <button
            onClick={() => setSavedNotice(null)}
            className="text-slate-400 hover:text-slate-700 font-mono text-xs cursor-pointer p-0.5"
          >
            ✕
          </button>
        </div>
      )}

      {/* Categories Filter Pills */}
      {availableCategories.length > 2 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-xs font-bold text-slate-500 ml-2 shrink-0">تصفية حسب:</span>
          {availableCategories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
              }`}
            >
              {cat}
              {cat !== 'الكل' && (
                <span className="mr-1.5 text-[10px] opacity-80">
                  ({allLessonExercises.filter(q => q.category === cat).length})
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Result Card when Submitted */}
      {isTestSubmitted && (
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-5 animate-in fade-in">
          <div className="flex items-center gap-4">
            <div className={`w-16 h-16 rounded-2xl flex flex-col items-center justify-center font-mono font-black border shadow-2xs ${
              percentage >= 85
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                : percentage >= 65
                ? 'bg-amber-50 text-amber-800 border-amber-300'
                : 'bg-rose-50 text-rose-800 border-rose-300'
            }`}>
              <span className="text-xl leading-none">{percentage}%</span>
              <span className="text-[9px] font-sans font-bold text-slate-500 mt-0.5">
                {percentage >= 85 ? 'ممتاز' : percentage >= 65 ? 'جيد جداً' : 'يحتاج مراجعة'}
              </span>
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900">
                {percentage >= 85 ? 'أحسنت صنعاً! أداء متميز' : 'تم تصحيح تدريبات الدرس'}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                حصلت على <strong className="text-emerald-700 font-bold">{correctCount}</strong> إجابة صحيحة من إجمالي <strong className="text-slate-800 font-bold">{allLessonExercises.length}</strong> سؤالاً (+{correctCount * 10} نقطة).
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-end">
            <button
              onClick={() => setIsReportOpen(true)}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold shadow-xs transition-all cursor-pointer"
            >
              <FileText className="w-4 h-4" />
              <span>مراجعة الأخطاء والشرح</span>
            </button>

            {onViewHistory && (
              <button
                onClick={onViewHistory}
                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold border border-slate-200 transition-all cursor-pointer"
              >
                <span>سجل الاختبارات</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Questions List */}
      <div className="space-y-4">
        {displayExercises.map((q, index) => {
          const isSubmittedQuestion = !!submitted[q.id];
          const userAns = userAnswers[q.id];
          const isCorrect = userAns !== undefined && userAns === q.correctAnswer;
          const isAnswered = userAns !== undefined;

          return (
            <div
              key={q.id}
              className={`bg-white rounded-2xl p-4 sm:p-5 border transition-all duration-200 shadow-2xs ${
                isSubmittedQuestion
                  ? isCorrect
                    ? 'border-emerald-300 bg-emerald-50/20'
                    : 'border-rose-300 bg-rose-50/20'
                  : isAnswered
                  ? 'border-slate-300 ring-1 ring-slate-200'
                  : 'border-slate-200'
              }`}
            >
              {/* Question Header */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-slate-100 text-slate-700 font-mono text-xs font-black flex items-center justify-center shrink-0">
                    {index + 1}
                  </span>
                  {q.category && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                      {q.category}
                    </span>
                  )}
                </div>

                {isSubmittedQuestion && (
                  <div className="flex items-center gap-1">
                    {isCorrect ? (
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        صحيحة (+10)
                      </span>
                    ) : (
                      <span className="text-xs font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                        <XCircle className="w-3.5 h-3.5" />
                        غير صحيحة
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Question Prompt */}
              <p className="text-sm sm:text-base font-bold text-slate-900 leading-relaxed mb-4">
                {q.prompt}
              </p>

              {/* Options */}
              {q.type === 'boolean' ? (
                <div className="grid grid-cols-2 gap-2.5 max-w-sm">
                  {[true, false].map((val) => {
                    const isSelected = userAns === val;
                    const isCorrectChoice = isSubmittedQuestion && q.correctAnswer === val;
                    const isWrongChoice = isSubmittedQuestion && isSelected && !isCorrectChoice;

                    return (
                      <button
                        key={String(val)}
                        type="button"
                        disabled={isTestSubmitted}
                        onClick={() => handleSelectOption(q.id, val)}
                        className={`p-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 border transition-all cursor-pointer ${
                          isCorrectChoice
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                            : isWrongChoice
                            ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                            : isSelected
                            ? 'bg-emerald-50 text-emerald-900 border-emerald-500 ring-2 ring-emerald-200'
                            : 'bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200'
                        } ${isTestSubmitted ? 'cursor-default' : ''}`}
                      >
                        {val ? 'صَوَاب (✓)' : 'خَطَأ (✕)'}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {q.options?.map((opt, optIndex) => {
                    const isSelected = userAns === opt;
                    const isCorrectChoice = isSubmittedQuestion && q.correctAnswer === opt;
                    const isWrongChoice = isSubmittedQuestion && isSelected && !isCorrectChoice;

                    return (
                      <button
                        key={optIndex}
                        type="button"
                        disabled={isTestSubmitted}
                        onClick={() => handleSelectOption(q.id, opt)}
                        className={`p-3 rounded-xl text-xs sm:text-sm font-bold text-right flex items-center justify-between gap-2 border transition-all cursor-pointer ${
                          isCorrectChoice
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                            : isWrongChoice
                            ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                            : isSelected
                            ? 'bg-emerald-50 text-emerald-900 border-emerald-500 ring-2 ring-emerald-200'
                            : 'bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200'
                        } ${isTestSubmitted ? 'cursor-default' : ''}`}
                      >
                        <span className="flex-1 leading-relaxed">{opt}</span>
                        {isCorrectChoice && <Check className="w-4 h-4 text-white shrink-0" />}
                        {isWrongChoice && <XCircle className="w-4 h-4 text-white shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Explanation Box when submitted */}
              {isSubmittedQuestion && q.explanation && (
                <div className="mt-3.5 pt-3 border-t border-slate-100 bg-slate-50/80 rounded-xl p-3 text-xs leading-relaxed flex items-start gap-2 text-slate-700">
                  <HelpCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-emerald-800 block mb-0.5">الشرح والقاعدة المقررة:</strong>
                    <span>{q.explanation}</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Bottom Floating/Fixed Submission Bar */}
      {!isTestSubmitted && answeredCount > 0 && (
        <div className="sticky bottom-4 z-20 bg-white/95 backdrop-blur-md p-4 rounded-2xl border border-slate-200/90 shadow-lg flex flex-wrap items-center justify-between gap-3 animate-in slide-in-from-bottom duration-200">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs sm:text-sm font-bold text-slate-800">
              أجبت على <strong className="text-emerald-700 font-mono">{answeredCount}</strong> من أصل <strong className="font-mono">{allLessonExercises.length}</strong> سؤالاً
            </span>
          </div>

          <button
            onClick={handleRequestSubmit}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all shadow-md cursor-pointer active:scale-95"
          >
            تسليم الحل وإظهار النتيجة والتقرير
          </button>
        </div>
      )}

      {/* Confirmation Modal if Unfinished */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 text-center space-y-4 animate-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-lg font-black text-slate-900">
                لم تجب على كافة أسئلة الدرس بعد!
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                أجبت على ({answeredCount}) سؤالاً، ويتبقى ({allLessonExercises.length - answeredCount}) سؤالاً دون إجابة. هل تريد تسليم الحل الآن ورؤية نتيجتك وتقييمك؟
              </p>
            </div>
            <div className="flex items-center gap-2.5 pt-2">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 cursor-pointer"
              >
                متابعة الحل
              </button>
              <button
                onClick={executeSubmit}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 shadow-xs cursor-pointer"
              >
                نعم، تسليم الحل
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Test Report Modal */}
      <TestReportModal
        testRecord={latestRecord}
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        onRetake={() => {
          setIsReportOpen(false);
          handleResetQuiz();
        }}
      />
    </div>
  );
};

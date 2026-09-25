import React, { useState } from 'react';
import { TestRecord, TestQuestionResult } from '../types.ts';
import { 
  CheckCircle2, 
  XCircle, 
  HelpCircle, 
  Trophy, 
  Award, 
  RotateCcw, 
  Printer, 
  X, 
  Filter, 
  BookOpen, 
  Sparkles,
  Calendar,
  Clock,
  Check,
  Flame,
  ArrowRight
} from 'lucide-react';

interface TestReportModalProps {
  testRecord: TestRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onRetake?: (record: TestRecord) => void;
}

export const TestReportModal: React.FC<TestReportModalProps> = ({
  testRecord,
  isOpen,
  onClose,
  onRetake,
}) => {
  if (!isOpen || !testRecord) return null;

  // Filter mode: 'all' | 'mistakes' | 'correct'
  const mistakes = testRecord.questions.filter(q => !q.isCorrect);
  const correctOnes = testRecord.questions.filter(q => q.isCorrect);

  const [activeFilter, setActiveFilter] = useState<'all' | 'mistakes' | 'correct'>(
    mistakes.length > 0 ? 'mistakes' : 'all'
  );

  // Allow inline interactive retrying of mistakes to learn and correct
  const [retriedQuestions, setRetriedQuestions] = useState<Record<string, any>>({});
  const [correctedMistakes, setCorrectedMistakes] = useState<Record<string, boolean>>({});

  const handleRetryChoice = (questionId: string, choice: any, correctAnswer: any) => {
    setRetriedQuestions(prev => ({ ...prev, [questionId]: choice }));
    if (choice === correctAnswer) {
      setCorrectedMistakes(prev => ({ ...prev, [questionId]: true }));
    }
  };

  // Group questions by category for performance breakdown
  const categoryStats = React.useMemo(() => {
    const stats: Record<string, { total: number; correct: number }> = {};
    testRecord.questions.forEach(q => {
      const cat = q.category || 'عام';
      if (!stats[cat]) {
        stats[cat] = { total: 0, correct: 0 };
      }
      stats[cat].total++;
      if (q.isCorrect) {
        stats[cat].correct++;
      }
    });
    return stats;
  }, [testRecord]);

  const displayedQuestions = testRecord.questions.filter(q => {
    if (activeFilter === 'mistakes') return !q.isCorrect;
    if (activeFilter === 'correct') return q.isCorrect;
    return true;
  });

  // Calculate score rating text and badge
  const getScoreBadge = (percent: number) => {
    if (percent === 100) {
      return {
        label: 'ممتاز مع مرتبة الشرف 🌟',
        color: 'bg-emerald-500 text-white border-emerald-600',
        textColor: 'text-emerald-700',
        message: 'أداء عبقري ومبهر! لقد أجبت على جميع الأسئلة بصورة نموذجية دون أي خطأ.',
      };
    }
    if (percent >= 85) {
      return {
        label: 'رائع جداً ومتميز ✨',
        color: 'bg-teal-600 text-white border-teal-700',
        textColor: 'text-teal-700',
        message: 'مستوى استيعاب ممتاز! راجع الملاحظات البسيطة أدناه لترسيخ الإجابة الكاملة.',
      };
    }
    if (percent >= 65) {
      return {
        label: 'جيد جداً، واصل التقدم 👍',
        color: 'bg-amber-500 text-slate-950 border-amber-600 font-extrabold',
        textColor: 'text-amber-700',
        message: 'إجابات جيدة! لديك بعض الأخطاء التي يمكنك مراجعتها وتصحيحها الآن مباشرة.',
      };
    }
    return {
      label: 'فرصة للمراجعة والتعلم 📖',
      color: 'bg-rose-500 text-white border-rose-600',
      textColor: 'text-rose-700',
      message: 'لا بأس يا بطل، الأخطاء هي أول خطوة نحو التفوق. راجع توضيحات الأسئلة وأعد المحاولة.',
    };
  };

  const badgeInfo = getScoreBadge(testRecord.scorePercentage);

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200"
      dir="rtl"
    >
      <div 
        className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto max-h-[92vh]"
      >
        {/* Modal Top Header */}
        <div className="bg-linear-to-r from-slate-900 via-slate-800 to-emerald-950 text-white px-4 sm:px-6 py-3.5 sm:py-4 flex items-center justify-between gap-3 border-b border-slate-700 shrink-0 min-w-0">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
              <Trophy className="w-5 h-5 text-amber-300" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-300 border border-emerald-400/30">
                  تقرير تقييم الاختبار
                </span>
                <span className="text-xs text-slate-400 hidden sm:inline">•</span>
                <span className="text-xs text-slate-300 hidden sm:inline flex items-center gap-1 font-mono">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  {testRecord.formattedDate}
                </span>
              </div>
              <h3 className="text-sm sm:text-base md:text-lg font-black text-white mt-0.5 break-words line-clamp-2 leading-snug">
                {testRecord.title}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => window.print()}
              title="طباعة التقرير"
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer border border-slate-700"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              title="إغلاق التقرير"
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-rose-900/40 text-slate-300 hover:text-rose-300 transition-colors cursor-pointer border border-slate-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto overflow-x-hidden space-y-5 w-full">
          {/* Main Result Card */}
          <div className="bg-linear-to-br from-slate-50 to-emerald-50/40 rounded-3xl p-4 sm:p-6 border border-slate-200/90 shadow-xs">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
              
              {/* Score Circular Badge / Percentage */}
              <div className="md:col-span-4 flex flex-col items-center justify-center text-center p-3 bg-white rounded-2xl border border-slate-200 shadow-2xs">
                <div className="relative w-28 h-28 flex items-center justify-center">
                  <div className={`w-28 h-28 rounded-full border-8 flex flex-col items-center justify-center shadow-inner ${
                    testRecord.scorePercentage >= 85
                      ? 'border-emerald-500 bg-emerald-50/30'
                      : testRecord.scorePercentage >= 65
                      ? 'border-amber-500 bg-amber-50/30'
                      : 'border-rose-500 bg-rose-50/30'
                  }`}>
                    <span className="text-3xl font-black font-mono text-slate-900 leading-none">
                      {testRecord.scorePercentage}%
                    </span>
                    <span className="text-[10px] text-slate-500 font-bold mt-1">النتيجة النهائية</span>
                  </div>
                </div>

                <div className="mt-3">
                  <span className={`inline-block px-3 py-1 rounded-xl text-xs font-black border shadow-2xs ${badgeInfo.color}`}>
                    {badgeInfo.label}
                  </span>
                </div>
              </div>

              {/* Stats Breakdown */}
              <div className="md:col-span-8 space-y-4 min-w-0">
                <div>
                  <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                    <span>تقييم الأداء والملاحظات:</span>
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed break-words">
                    {badgeInfo.message}
                  </p>
                </div>

                {/* Metrics 4-Box Row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                  <div className="bg-white p-3 rounded-xl border border-slate-200 text-center">
                    <div className="text-[11px] text-slate-500 font-bold truncate">مجموع الأسئلة</div>
                    <div className="text-lg font-black text-slate-900 font-mono mt-0.5">
                      {testRecord.totalQuestions}
                    </div>
                  </div>

                  <div className="bg-emerald-50/60 p-3 rounded-xl border border-emerald-200 text-center">
                    <div className="text-[11px] text-emerald-800 font-bold flex items-center justify-center gap-1 truncate">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>صحيحة</span>
                    </div>
                    <div className="text-lg font-black text-emerald-700 font-mono mt-0.5">
                      {testRecord.correctCount}
                    </div>
                  </div>

                  <div className="bg-rose-50/60 p-3 rounded-xl border border-rose-200 text-center">
                    <div className="text-[11px] text-rose-800 font-bold flex items-center justify-center gap-1 truncate">
                      <XCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                      <span>الأخطاء</span>
                    </div>
                    <div className="text-lg font-black text-rose-700 font-mono mt-0.5">
                      {mistakes.length}
                    </div>
                  </div>

                  <div className="bg-amber-50/60 p-3 rounded-xl border border-amber-200 text-center">
                    <div className="text-[11px] text-amber-800 font-bold flex items-center justify-center gap-1 truncate">
                      <Award className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>النقاط</span>
                    </div>
                    <div className="text-lg font-black text-amber-700 font-mono mt-0.5">
                      +{testRecord.correctCount * 10}
                    </div>
                  </div>
                </div>

                {/* Category Bars Breakdown */}
                {Object.keys(categoryStats).length > 1 && (
                  <div className="pt-2 border-t border-slate-200/80">
                    <div className="text-xs font-bold text-slate-700 mb-2">
                      نسبة الإتقان حسب المهارة:
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {Object.entries(categoryStats).map(([cat, data]) => {
                        const percent = Math.round((data.correct / data.total) * 100);
                        return (
                          <div key={cat} className="bg-white p-2.5 rounded-xl border border-slate-200 text-xs min-w-0">
                            <div className="flex justify-between items-center mb-1 gap-2">
                              <span className="font-bold text-slate-800 truncate">{cat}</span>
                              <span className="font-mono font-bold text-slate-600 text-[11px] shrink-0">
                                {data.correct}/{data.total} ({percent}%)
                              </span>
                            </div>
                            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${
                                  percent >= 80 ? 'bg-emerald-500' : percent >= 50 ? 'bg-amber-500' : 'bg-rose-500'
                                }`}
                                style={{ width: `${percent}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

              </div>
            </div>
          </div>

          {/* Questions Review Section */}
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-emerald-600" />
                <h4 className="font-black text-slate-900 text-sm sm:text-base">
                  مراجعة تفاصيل الأسئلة والأخطاء:
                </h4>
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
                <button
                  onClick={() => setActiveFilter('mistakes')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    activeFilter === 'mistakes'
                      ? 'bg-rose-600 text-white shadow-2xs font-extrabold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>الأخطاء فقط</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    activeFilter === 'mistakes' ? 'bg-white/25 text-white' : 'bg-rose-100 text-rose-800'
                  }`}>
                    {mistakes.length}
                  </span>
                </button>

                <button
                  onClick={() => setActiveFilter('all')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    activeFilter === 'all'
                      ? 'bg-slate-900 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span>جميع الأسئلة</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    activeFilter === 'all' ? 'bg-white/25 text-white' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {testRecord.questions.length}
                  </span>
                </button>

                <button
                  onClick={() => setActiveFilter('correct')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    activeFilter === 'correct'
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>الصحيحة</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    activeFilter === 'correct' ? 'bg-white/25 text-white' : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    {correctOnes.length}
                  </span>
                </button>
              </div>
            </div>

            {/* Questions List */}
            <div className="space-y-3.5">
              {displayedQuestions.length === 0 ? (
                <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-6 text-center text-emerald-900 space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                  <p className="font-extrabold text-sm">
                    {activeFilter === 'mistakes' 
                      ? 'لا توجد أخطاء في هذا الاختبار! كل إجاباتك صحيحة ومتقنة تماماً 🌟' 
                      : 'لا توجد أسئلة في هذا القسم'}
                  </p>
                </div>
              ) : (
                displayedQuestions.map((q, idx) => {
                  const isCorrectInitial = q.isCorrect;
                  const isRetriedNow = retriedQuestions[q.questionId] !== undefined;
                  const isNowCorrect = correctedMistakes[q.questionId];

                  return (
                    <div
                      key={q.questionId || idx}
                      className={`rounded-2xl p-4 sm:p-5 border transition-all shadow-2xs ${
                        isNowCorrect
                          ? 'bg-teal-50/40 border-teal-300 ring-2 ring-teal-500/20'
                          : isCorrectInitial
                          ? 'bg-emerald-50/20 border-emerald-200'
                          : 'bg-rose-50/20 border-rose-200'
                      }`}
                    >
                      {/* Question Header & Category */}
                      <div className="flex items-start justify-between gap-3 mb-2.5">
                        <div className="flex items-center gap-2">
                          <span className={`w-6 h-6 rounded-lg text-xs font-mono font-black flex items-center justify-center shrink-0 ${
                            isNowCorrect || isCorrectInitial
                              ? 'bg-emerald-600 text-white'
                              : 'bg-rose-600 text-white'
                          }`}>
                            {idx + 1}
                          </span>
                          {q.category && (
                            <span className="text-[11px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md">
                              {q.category}
                            </span>
                          )}
                          {q.lessonTitle && (
                            <span className="text-[10px] text-slate-400 hidden sm:inline">
                              • {q.lessonTitle}
                            </span>
                          )}
                        </div>

                        <div>
                          {isNowCorrect ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-teal-800 bg-teal-100 px-2.5 py-0.5 rounded-full border border-teal-300 animate-in fade-in">
                              <Check className="w-3 h-3 text-teal-600" />
                              <span>تم تصحيح الخطأ وتثبيت الفهم!</span>
                            </span>
                          ) : isCorrectInitial ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-300">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>صحيحة (+10)</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-800 bg-rose-100 px-2.5 py-0.5 rounded-full border border-rose-300">
                              <XCircle className="w-3 h-3 text-rose-600" />
                              <span>إجابة خاطئة</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Question Prompt */}
                      <h5 className="font-bold text-slate-900 text-sm sm:text-base leading-relaxed mb-3 break-words">
                        {q.prompt}
                      </h5>

                      {/* Options & Choices Comparison */}
                      <div className="space-y-2 mb-3">
                        {/* If question has options (MCQ), show them with clear highlighting and responsive layout */}
                        {q.options && q.options.length > 0 ? (
                          <div className="grid grid-cols-1 gap-2.5">
                            {q.options.map((opt, optIdx) => {
                              const isUserPick = q.userAnswer === opt;
                              const isCorrectAnswer = q.correctAnswer === opt;
                              const isRetriedPick = retriedQuestions[q.questionId] === opt;

                              let optClass = 'bg-white border-slate-200 text-slate-700';

                              if (isCorrectAnswer) {
                                optClass = 'bg-emerald-100/80 border-emerald-500 text-emerald-950 font-bold ring-2 ring-emerald-500/20';
                              } else if (isUserPick && !isCorrectInitial) {
                                optClass = 'bg-rose-100/90 border-rose-400 text-rose-950 font-bold';
                              } else if (isRetriedPick && !isCorrectAnswer) {
                                optClass = 'bg-amber-100 border-amber-400 text-amber-950 font-bold';
                              }

                              return (
                                <button
                                  key={optIdx}
                                  onClick={() => {
                                    if (!isCorrectInitial && !isNowCorrect) {
                                      handleRetryChoice(q.questionId, opt, q.correctAnswer);
                                    }
                                  }}
                                  disabled={isCorrectInitial || isNowCorrect}
                                  className={`p-3 rounded-xl border text-xs sm:text-sm text-right flex flex-col sm:flex-row sm:items-center justify-between gap-2 transition-all w-full min-w-0 break-words ${optClass} ${
                                    !isCorrectInitial && !isNowCorrect ? 'cursor-pointer hover:border-amber-400' : 'cursor-default'
                                  }`}
                                >
                                  <span className="break-words min-w-0 flex-1 leading-relaxed text-right">{opt}</span>
                                  <div className="flex items-center gap-1.5 shrink-0 self-start sm:self-center mr-auto sm:mr-2">
                                    {isCorrectAnswer && (
                                      <span className="text-[10px] bg-emerald-600 text-white font-black px-2 py-0.5 rounded-md flex items-center gap-1 shrink-0">
                                        <Check className="w-3 h-3" />
                                        الإجابة النموذجية
                                      </span>
                                    )}
                                    {isUserPick && !isCorrectInitial && (
                                      <span className="text-[10px] bg-rose-600 text-white font-bold px-2 py-0.5 rounded-md flex items-center gap-1 shrink-0">
                                        <X className="w-3 h-3" />
                                        إجابتك السابقة
                                      </span>
                                    )}
                                    {isUserPick && isCorrectInitial && (
                                      <span className="text-[10px] bg-emerald-600 text-white font-bold px-2 py-0.5 rounded-md shrink-0">
                                        إجابتك الصحيحة
                                      </span>
                                    )}
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        ) : (
                          // For boolean / text questions
                          <div className="flex flex-wrap items-center gap-3 bg-white p-3 rounded-xl border border-slate-200 text-xs w-full min-w-0 break-words">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-slate-500 font-bold shrink-0">إجابتك:</span>
                              <span className={`font-black px-2.5 py-0.5 rounded-md break-words ${
                                isCorrectInitial ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                              }`}>
                                {typeof q.userAnswer === 'boolean' 
                                  ? (q.userAnswer ? 'صواب (✔)' : 'خطأ (✖)') 
                                  : String(q.userAnswer || 'لم يُجب')}
                              </span>
                            </div>

                            <span className="text-slate-300 hidden sm:inline">|</span>

                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-slate-500 font-bold shrink-0">الإجابة النموذجية:</span>
                              <span className="bg-emerald-100 text-emerald-900 font-black px-2.5 py-0.5 rounded-md break-words">
                                {typeof q.correctAnswer === 'boolean' 
                                  ? (q.correctAnswer ? 'صواب (✔)' : 'خطأ (✖)') 
                                  : String(q.correctAnswer)}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Educational Rule / Explanation */}
                      {q.explanation && (
                        <div className="p-3.5 bg-amber-50/80 border border-amber-200/80 rounded-xl text-xs text-amber-950 flex items-start gap-2.5 break-words overflow-hidden">
                          <HelpCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                          <div className="leading-relaxed min-w-0 flex-1 break-words">
                            <span className="font-extrabold text-amber-900 block sm:inline sm:ml-1">
                              الشرح والتوضيح من سلاح التلميذ:
                            </span>
                            <span className="break-words">{q.explanation}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Modal Bottom Actions Bar */}
        <div className="bg-slate-50 border-t border-slate-200 px-5 sm:px-7 py-4 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            {onRetake && (
              <button
                onClick={() => {
                  onClose();
                  onRetake(testRecord);
                }}
                className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all shadow-xs cursor-pointer active:scale-95"
              >
                <RotateCcw className="w-4 h-4" />
                <span>إعادة خوض هذا الاختبار</span>
              </button>
            )}
          </div>

          <button
            onClick={onClose}
            className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer shadow-xs"
          >
            إغلاق التقرير
          </button>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useMemo, useEffect } from 'react';
import { Question, TestRecord } from '../types.ts';
import { 
  getAllExercises, 
  generateTargetedQuiz, 
  allUnits,
  QuizQuestion 
} from '../data/index.ts';
import { shuffleQuestionOptions } from '../utils/shuffle.ts';
import { saveTestRecord } from '../utils/testStorage.ts';
import { TestReportModal } from './TestReportModal.tsx';
import { 
  Trophy, 
  Sparkles, 
  Dices, 
  LayoutGrid, 
  Search, 
  Filter, 
  CheckCircle2, 
  XCircle, 
  RotateCcw, 
  HelpCircle, 
  ArrowLeft, 
  ArrowRight, 
  Check, 
  FileText, 
  Clock, 
  Award,
  BookOpen,
  Sliders,
  CheckCheck
} from 'lucide-react';

interface QuestionBankViewProps {
  onAddScore: (points: number) => void;
  onViewHistory?: () => void;
}

export const QuestionBankView: React.FC<QuestionBankViewProps> = ({
  onAddScore,
  onViewHistory,
}) => {
  // Main view mode: 'generator' (Quiz Generator & Live Test) | 'repository' (Open browsable bank)
  const [activeSubMode, setActiveSubMode] = useState<'generator' | 'repository'>('generator');

  // Generator configuration
  const [selectedScope, setSelectedScope] = useState<'all' | 'unit-revision' | 'unit-1' | 'unit-2' | 'unit-3' | 'grammar' | 'spelling' | 'reading'>('all');
  const [questionCount, setQuestionCount] = useState<number>(20);
  const [displayStyle, setDisplayStyle] = useState<'single' | 'list'>('single');

  // Live Exam state
  const [isExamActive, setIsExamActive] = useState<boolean>(false);
  const [examQuestions, setExamQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, any>>({});
  const [submittedAnswers, setSubmittedAnswers] = useState<Record<string, boolean>>({});
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [correctCount, setCorrectCount] = useState<number>(0);

  // Timer
  const [secondsElapsed, setSecondsElapsed] = useState<number>(0);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);

  // Report Modal
  const [latestRecord, setLatestRecord] = useState<TestRecord | null>(null);
  const [isReportOpen, setIsReportOpen] = useState<boolean>(false);

  // All repository exercises
  const allQuestions = useMemo(() => getAllExercises(), []);

  // Repository search & filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [repoUnitFilter, setRepoUnitFilter] = useState<string>('الكل');
  const [repoCategoryFilter, setRepoCategoryFilter] = useState<string>('الكل');
  const [revealedAnswers, setRevealedAnswers] = useState<Record<string, boolean>>({});

  // Timer tick
  useEffect(() => {
    let interval: any = null;
    if (isExamActive && isTimerRunning && !isSubmitted) {
      interval = setInterval(() => {
        setSecondsElapsed(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isExamActive, isTimerRunning, isSubmitted]);

  // Start a new generated quiz
  const handleStartQuiz = () => {
    let generated: QuizQuestion[] = [];

    if (selectedScope === 'all') {
      generated = generateTargetedQuiz({ scope: 'all', count: questionCount });
    } else if (selectedScope === 'unit-revision' || selectedScope === 'unit-1' || selectedScope === 'unit-2' || selectedScope === 'unit-3') {
      generated = generateTargetedQuiz({ scope: 'unit', unitId: selectedScope, count: questionCount });
    } else if (selectedScope === 'grammar') {
      // Filter grammar across all
      const grammarPool = allQuestions.filter(q => q.category === 'قواعد نحوية' || q.category === 'نحو');
      const shuffled = [...grammarPool].sort(() => 0.5 - Math.random());
      generated = shuffled.slice(0, Math.min(questionCount, shuffled.length));
    } else if (selectedScope === 'spelling') {
      // Filter spelling across all
      const spellingPool = allQuestions.filter(q => q.category === 'قواعد إملائية' || q.category === 'إملاء');
      const shuffled = [...spellingPool].sort(() => 0.5 - Math.random());
      generated = shuffled.slice(0, Math.min(questionCount, shuffled.length));
    } else if (selectedScope === 'reading') {
      // Filter reading/vocab
      const readPool = allQuestions.filter(q => q.category === 'فهم واستيعاب' || q.category === 'مفردات ولغويات' || q.category === 'تذوق بلاغي');
      const shuffled = [...readPool].sort(() => 0.5 - Math.random());
      generated = shuffled.slice(0, Math.min(questionCount, shuffled.length));
    }

    // Ensure questions have randomized options
    const finalized = generated.map(q => shuffleQuestionOptions(q) as QuizQuestion);
    setExamQuestions(finalized);
    setUserAnswers({});
    setSubmittedAnswers({});
    setCurrentIndex(0);
    setIsSubmitted(false);
    setCorrectCount(0);
    setSecondsElapsed(0);
    setIsTimerRunning(true);
    setIsExamActive(true);
  };

  // Handle option click
  const handleSelectOption = (questionId: string, option: any) => {
    if (isSubmitted) return;
    setUserAnswers(prev => ({ ...prev, [questionId]: option }));
  };

  // Submit live exam
  const handleSubmitExam = () => {
    if (examQuestions.length === 0) return;

    const subMap: Record<string, boolean> = {};
    let totalCorrect = 0;

    const questionRecords = examQuestions.map(q => {
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
        category: q.category || 'تحدي شامل',
      };
    });

    setSubmittedAnswers(subMap);
    setCorrectCount(totalCorrect);
    setIsSubmitted(true);
    setIsTimerRunning(false);

    if (totalCorrect > 0) {
      onAddScore(totalCorrect * 10);
    }

    // Determine readable title
    let scopeName = 'شامل لكل المنهج';
    if (selectedScope === 'unit-revision') scopeName = 'مراجعة ما سبق دراسته';
    if (selectedScope === 'unit-1') scopeName = 'الوحدة الأولى: نيلنا أمانة';
    if (selectedScope === 'unit-2') scopeName = 'الوحدة الثانية: فن التواصل';
    if (selectedScope === 'unit-3') scopeName = 'الوحدة الثالثة: جمال الاختلاف';
    if (selectedScope === 'grammar') scopeName = 'تحدي القواعد النحوية';
    if (selectedScope === 'spelling') scopeName = 'تحدي القواعد الإملائية';
    if (selectedScope === 'reading') scopeName = 'تحدي الفهم واللغويات';

    const scorePercentage = Math.round((totalCorrect / examQuestions.length) * 100);

    const record: TestRecord = {
      id: `quiz-bank-${Date.now()}`,
      title: `اختبار بنك الأسئلة (${scopeName})`,
      scope: 'quiz',
      timestamp: Date.now(),
      formattedDate: new Date().toLocaleDateString('ar-EG', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      scorePercentage,
      totalQuestions: examQuestions.length,
      correctCount: totalCorrect,
      answeredCount: Object.keys(userAnswers).length,
      questions: questionRecords,
    };

    saveTestRecord(record);
    setLatestRecord(record);
    setIsReportOpen(true);
  };

  // Exit active exam
  const handleExitExam = () => {
    if (isSubmitted || window.confirm('هل تريد إنهاء الاختبار الحالي والعودة لصفحة بنك الأسئلة؟')) {
      setIsExamActive(false);
      setIsTimerRunning(false);
    }
  };

  // Format timer seconds
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Filtered repository questions
  const filteredRepoQuestions = useMemo(() => {
    return allQuestions.filter(q => {
      const matchUnit = repoUnitFilter === 'الكل' || q.unitId === repoUnitFilter;
      const matchCat = repoCategoryFilter === 'الكل' || q.category === repoCategoryFilter;
      const query = searchQuery.trim().toLowerCase();
      const matchSearch = !query ||
        q.prompt.toLowerCase().includes(query) ||
        q.options?.some(o => o.toLowerCase().includes(query)) ||
        (q.explanation && q.explanation.toLowerCase().includes(query));
      return matchUnit && matchCat && matchSearch;
    });
  }, [allQuestions, repoUnitFilter, repoCategoryFilter, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Top Main Banner */}
      <div className="bg-linear-to-r from-amber-600 via-amber-700 to-orange-700 text-white rounded-3xl p-5 sm:p-7 shadow-md border border-amber-500/40 relative overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0 shadow-inner">
              <Trophy className="w-7 h-7 text-amber-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-black px-2.5 py-0.5 rounded-full bg-white/20 text-white">
                  تبويب مستقل خارج الدروس
                </span>
                <span className="text-xs text-amber-100 font-medium font-mono">
                  {allQuestions.length}+ سؤالاً معتمداً
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black mt-1">
                بَنْكُ الأَسْئِلَةِ الشَّامِلُ وَتَوْلِيدُ الِاخْتِبَارَاتِ
              </h2>
              <p className="text-xs text-amber-100 mt-1 max-w-xl leading-relaxed">
                أنشئ اختبارات مخصصة بدون تكرار في أي وحدة أو مادة نحوية أو إملائية، أو تصفح المستودع الشامل لجميع تدريبات المنهج.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onViewHistory && (
              <button
                onClick={onViewHistory}
                className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs"
              >
                <FileText className="w-4 h-4" />
                <span>سجل الاختبارات والتقارير</span>
              </button>
            )}
          </div>
        </div>

        {/* Sub-Tabs Selector */}
        {!isExamActive && (
          <div className="mt-5 pt-4 border-t border-white/20 flex flex-wrap items-center gap-2">
            <button
              onClick={() => setActiveSubMode('generator')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeSubMode === 'generator'
                  ? 'bg-white text-amber-950 shadow-xs'
                  : 'bg-black/20 text-white hover:bg-black/30'
              }`}
            >
              <Dices className="w-4 h-4 text-amber-600" />
              <span>مُوَلِّدُ الِاخْتِبَارَاتِ الذَّكِيُّ وَالتَّحَدِّي</span>
            </button>

            <button
              onClick={() => setActiveSubMode('repository')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeSubMode === 'repository'
                  ? 'bg-white text-amber-950 shadow-xs'
                  : 'bg-black/20 text-white hover:bg-black/30'
              }`}
            >
              <LayoutGrid className="w-4 h-4 text-amber-600" />
              <span>المُسْتَوْدَعُ الشَّامِلُ المَفْتُوحُ (تصفح وبحث)</span>
              <span className="text-[10px] bg-amber-200 text-amber-950 px-1.5 py-0.5 rounded-full font-mono font-bold">
                {allQuestions.length}
              </span>
            </button>
          </div>
        )}
      </div>

      {/* VIEW 1: ACTIVE EXAM RUNNER */}
      {isExamActive ? (
        <div className="space-y-5">
          {/* Exam Status Bar */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-slate-500">التقدم:</span>
              <span className="text-sm font-black text-slate-900 font-mono">
                {Object.keys(userAnswers).length} / {examQuestions.length} سؤالاً
              </span>
              <div className="h-4 w-px bg-slate-200" />
              <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg">
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                <span>{formatTime(secondsElapsed)}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setDisplayStyle(prev => prev === 'single' ? 'list' : 'single')}
                className="text-xs font-bold px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                {displayStyle === 'single' ? 'عرض القائمة كاملة' : 'عرض سؤال بسؤال'}
              </button>

              <button
                onClick={handleExitExam}
                className="text-xs font-bold px-3 py-1.5 rounded-xl text-rose-700 bg-rose-50 hover:bg-rose-100 transition-colors cursor-pointer"
              >
                إنهاء / خروج
              </button>

              {!isSubmitted ? (
                <button
                  onClick={handleSubmitExam}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-1.5 rounded-xl text-xs font-black shadow-xs transition-all cursor-pointer"
                >
                  تسليم الاختبار والتقرير
                </button>
              ) : (
                <button
                  onClick={() => setIsReportOpen(true)}
                  className="bg-amber-500 hover:bg-amber-600 text-amber-950 px-4 py-1.5 rounded-xl text-xs font-black shadow-xs transition-all cursor-pointer"
                >
                  عرض تقرير الأخطاء
                </button>
              )}
            </div>
          </div>

          {/* Question Navigator Dots (Single Mode) */}
          {displayStyle === 'single' && (
            <div className="bg-white rounded-2xl p-3 border border-slate-200 shadow-2xs overflow-x-auto scrollbar-none flex items-center gap-1.5">
              {examQuestions.map((q, idx) => {
                const isCurrent = idx === currentIndex;
                const isAnswered = userAnswers[q.id] !== undefined;
                const isAnsCorrect = isSubmitted && userAnswers[q.id] === q.correctAnswer;
                const isAnsWrong = isSubmitted && isAnswered && !isAnsCorrect;

                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentIndex(idx)}
                    className={`w-7 h-7 rounded-lg text-xs font-mono font-bold flex items-center justify-center shrink-0 transition-all cursor-pointer ${
                      isCurrent
                        ? 'ring-2 ring-amber-500 bg-amber-500 text-white'
                        : isSubmitted
                        ? isAnsCorrect
                          ? 'bg-emerald-500 text-white'
                          : isAnsWrong
                          ? 'bg-rose-500 text-white'
                          : 'bg-slate-100 text-slate-500'
                        : isAnswered
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
          )}

          {/* Questions Container */}
          {displayStyle === 'single' ? (
            // SINGLE QUESTION VIEW
            examQuestions[currentIndex] && (
              <div className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200 shadow-sm space-y-5 animate-in fade-in">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="bg-amber-100 text-amber-900 font-bold px-3 py-1 rounded-xl text-xs font-mono">
                      السؤال {currentIndex + 1} من {examQuestions.length}
                    </span>
                    {examQuestions[currentIndex].category && (
                      <span className="text-[11px] font-bold px-2.5 py-1 rounded-xl bg-slate-100 text-slate-700">
                        {examQuestions[currentIndex].category}
                      </span>
                    )}
                  </div>

                  {isSubmitted && (
                    <div>
                      {userAnswers[examQuestions[currentIndex].id] === examQuestions[currentIndex].correctAnswer ? (
                        <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-3 py-1 rounded-xl flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4" />
                          صحيحة (+10)
                        </span>
                      ) : (
                        <span className="text-xs font-bold text-rose-700 bg-rose-100 px-3 py-1 rounded-xl flex items-center gap-1">
                          <XCircle className="w-4 h-4" />
                          غير صحيحة
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <h3 className="text-base sm:text-lg font-black text-slate-900 leading-relaxed">
                  {examQuestions[currentIndex].prompt}
                </h3>

                {/* Options */}
                {examQuestions[currentIndex].type === 'boolean' ? (
                  <div className="grid grid-cols-2 gap-3 max-w-md">
                    {[true, false].map((val) => {
                      const userAns = userAnswers[examQuestions[currentIndex].id];
                      const isSelected = userAns === val;
                      const isCorrectChoice = isSubmitted && examQuestions[currentIndex].correctAnswer === val;
                      const isWrongChoice = isSubmitted && isSelected && !isCorrectChoice;

                      return (
                        <button
                          key={String(val)}
                          type="button"
                          disabled={isSubmitted}
                          onClick={() => handleSelectOption(examQuestions[currentIndex].id, val)}
                          className={`p-4 rounded-2xl text-sm font-black flex items-center justify-center gap-2 border transition-all cursor-pointer ${
                            isCorrectChoice
                              ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                              : isWrongChoice
                              ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                              : isSelected
                              ? 'bg-amber-50 text-amber-950 border-amber-500 ring-2 ring-amber-300'
                              : 'bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200'
                          }`}
                        >
                          {val ? 'صَوَاب (✓)' : 'خَطَأ (✕)'}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {examQuestions[currentIndex].options?.map((opt, optIdx) => {
                      const userAns = userAnswers[examQuestions[currentIndex].id];
                      const isSelected = userAns === opt;
                      const isCorrectChoice = isSubmitted && examQuestions[currentIndex].correctAnswer === opt;
                      const isWrongChoice = isSubmitted && isSelected && !isCorrectChoice;

                      return (
                        <button
                          key={optIdx}
                          type="button"
                          disabled={isSubmitted}
                          onClick={() => handleSelectOption(examQuestions[currentIndex].id, opt)}
                          className={`p-4 rounded-2xl text-sm font-bold text-right flex items-center justify-between gap-2 border transition-all cursor-pointer ${
                            isCorrectChoice
                              ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                              : isWrongChoice
                              ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                              : isSelected
                              ? 'bg-amber-50 text-amber-950 border-amber-500 ring-2 ring-amber-300'
                              : 'bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200'
                          }`}
                        >
                          <span className="flex-1 leading-relaxed">{opt}</span>
                          {isCorrectChoice && <Check className="w-5 h-5 text-white shrink-0" />}
                          {isWrongChoice && <XCircle className="w-5 h-5 text-white shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Explanation */}
                {isSubmitted && examQuestions[currentIndex].explanation && (
                  <div className="mt-4 p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs leading-relaxed flex items-start gap-2.5 text-slate-700">
                    <HelpCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-emerald-800 block mb-0.5">الشرح التعليمي والقاعدة:</strong>
                      <span>{examQuestions[currentIndex].explanation}</span>
                    </div>
                  </div>
                )}

                {/* Prev / Next controls */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                  <button
                    disabled={currentIndex === 0}
                    onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
                  >
                    <ArrowRight className="w-4 h-4" />
                    <span>السابق</span>
                  </button>

                  <div className="text-xs text-slate-500 font-mono font-bold">
                    {currentIndex + 1} / {examQuestions.length}
                  </div>

                  <button
                    disabled={currentIndex === examQuestions.length - 1}
                    onClick={() => setCurrentIndex(prev => Math.min(examQuestions.length - 1, prev + 1))}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
                  >
                    <span>التالي</span>
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )
          ) : (
            // LIST VIEW (ALL QUESTIONS)
            <div className="space-y-4">
              {examQuestions.map((q, idx) => {
                const userAns = userAnswers[q.id];
                const isAnswered = userAns !== undefined;
                const isCorrect = userAns === q.correctAnswer;

                return (
                  <div
                    key={q.id}
                    className={`bg-white rounded-2xl p-4 sm:p-5 border transition-all ${
                      isSubmitted
                        ? isCorrect
                          ? 'border-emerald-300 bg-emerald-50/20'
                          : 'border-rose-300 bg-rose-50/20'
                        : isAnswered
                        ? 'border-slate-300 ring-1 ring-slate-200'
                        : 'border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-amber-100 text-amber-900 font-mono text-xs font-black flex items-center justify-center">
                          {idx + 1}
                        </span>
                        {q.category && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                            {q.category}
                          </span>
                        )}
                      </div>

                      {isSubmitted && (
                        <div>
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

                    <p className="text-sm font-bold text-slate-900 mb-3">{q.prompt}</p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {q.options?.map((opt, optIdx) => {
                        const isSelected = userAns === opt;
                        const isCorrectChoice = isSubmitted && q.correctAnswer === opt;
                        const isWrongChoice = isSubmitted && isSelected && !isCorrectChoice;

                        return (
                          <button
                            key={optIdx}
                            type="button"
                            disabled={isSubmitted}
                            onClick={() => handleSelectOption(q.id, opt)}
                            className={`p-3 rounded-xl text-xs font-bold text-right flex items-center justify-between border transition-all cursor-pointer ${
                              isCorrectChoice
                                ? 'bg-emerald-600 text-white border-emerald-600'
                                : isWrongChoice
                                ? 'bg-rose-600 text-white border-rose-600'
                                : isSelected
                                ? 'bg-amber-50 text-amber-950 border-amber-500 ring-2 ring-amber-300'
                                : 'bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200'
                            }`}
                          >
                            <span>{opt}</span>
                            {isCorrectChoice && <Check className="w-4 h-4 text-white" />}
                            {isWrongChoice && <XCircle className="w-4 h-4 text-white" />}
                          </button>
                        );
                      })}
                    </div>

                    {isSubmitted && q.explanation && (
                      <div className="mt-3 p-3 bg-slate-50 rounded-xl text-xs text-slate-700 flex items-start gap-2">
                        <HelpCircle className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                        <div>
                          <strong className="text-emerald-800 block">الشرح:</strong>
                          <span>{q.explanation}</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : activeSubMode === 'generator' ? (
        // VIEW 2: QUIZ GENERATOR CONFIGURATION DASHBOARD
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
              <Sliders className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900">
                إعدادات توليد الاختبار الذكي
              </h3>
              <p className="text-xs text-slate-500">
                حدد النطاق وعدد الأسئلة وسيقوم النظام بسحب أسئلة عشوائية فريدة ومصنفة مع خلط خياراتها.
              </p>
            </div>
          </div>

          {/* Scope Selector */}
          <div className="space-y-2.5">
            <label className="text-xs font-extrabold text-slate-800 block">
              ١. اختر نطاق الاختبار:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              {[
                { id: 'all', label: 'شامل كل المنهج (موصى به)', desc: 'جميع الوحدات والمقررات', icon: Trophy },
                { id: 'unit-1', label: 'الوحدة الأولى: نيلنا أمانة', desc: 'نصوص + نحو + إملاء الوحدة الأولى', icon: BookOpen },
                { id: 'unit-2', label: 'الوحدة الثانية: فن التواصل', desc: 'نصوص + نحو + إملاء الوحدة الثانية', icon: BookOpen },
                { id: 'unit-3', label: 'الوحدة الثالثة: جمال الاختلاف', desc: 'نصوص + نحو + إملاء الوحدة الثالثة', icon: BookOpen },
                { id: 'unit-revision', label: 'مراجعة ما سبق دراسته', desc: 'أساسيات الجملة وعلامات الرفع', icon: RotateCcw },
                { id: 'grammar', label: 'تحدي القواعد النحوية فقط', desc: 'المبتدأ، الخبر، الفاعل، المفاعيل', icon: CheckCheck },
                { id: 'spelling', label: 'تحدي القواعد الإملائية فقط', desc: 'الهمزات وعلامات الترقيم والتنوين', icon: CheckCheck },
                { id: 'reading', label: 'الفهم والاستيعاب واللغويات', desc: 'المعاني والمضادات وفهم النصوص', icon: Sparkles },
              ].map((scope) => {
                const isSelected = selectedScope === scope.id;
                const IconComponent = scope.icon;

                return (
                  <button
                    key={scope.id}
                    type="button"
                    onClick={() => setSelectedScope(scope.id as any)}
                    className={`p-3.5 rounded-2xl text-right border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-amber-50 border-amber-500 ring-2 ring-amber-300 text-amber-950 shadow-xs'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <IconComponent className={`w-4 h-4 ${isSelected ? 'text-amber-600' : 'text-slate-500'}`} />
                      <span className="font-bold text-xs sm:text-sm">{scope.label}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 pr-6">{scope.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Question Count Selector */}
          <div className="space-y-2.5">
            <label className="text-xs font-extrabold text-slate-800 block">
              ٢. اختر عدد أسئلة الاختبار:
            </label>
            <div className="flex flex-wrap items-center gap-2.5">
              {[10, 20, 30, 50].map((cnt) => (
                <button
                  key={cnt}
                  type="button"
                  onClick={() => setQuestionCount(cnt)}
                  className={`px-5 py-3 rounded-2xl text-sm font-mono font-black transition-all cursor-pointer border ${
                    questionCount === cnt
                      ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  {cnt} سؤالاً
                </button>
              ))}
            </div>
          </div>

          {/* Launch Action */}
          <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4">
            <div className="text-xs text-slate-500">
              ⚡ يتم حفظ النتيجة والتقارير تلقائياً فور إنهاء الاختبار مع تفصيل كامل للأخطاء.
            </div>

            <button
              onClick={handleStartQuiz}
              className="bg-linear-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white px-8 py-3.5 rounded-2xl text-sm sm:text-base font-black shadow-md shadow-amber-600/20 transition-all cursor-pointer active:scale-95 flex items-center gap-2"
            >
              <Sparkles className="w-5 h-5 text-amber-200" />
              <span>بدء الاختبار الذكي الآن ({questionCount} سؤالاً)</span>
            </button>
          </div>
        </div>
      ) : (
        // VIEW 3: COMPREHENSIVE SEARCHABLE REPOSITORY
        <div className="space-y-5">
          {/* Search & Filters Header */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-4">
            <div className="relative">
              <Search className="w-5 h-5 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث في نص السؤال، الكلمات المفتاحية، الاختيارات، أو الشروحات..."
                className="w-full pl-4 pr-11 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs sm:text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 font-mono"
                >
                  مسح
                </button>
              )}
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-bold text-slate-500">الوحدة:</span>
                {[
                  { id: 'الكل', label: 'الكل' },
                  { id: 'unit-revision', label: 'المراجعة' },
                  { id: 'unit-1', label: 'الوحدة الأولى' },
                  { id: 'unit-2', label: 'الوحدة الثانية' },
                  { id: 'unit-3', label: 'الوحدة الثالثة' },
                ].map(u => (
                  <button
                    key={u.id}
                    onClick={() => setRepoUnitFilter(u.id)}
                    className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                      repoUnitFilter === u.id
                        ? 'bg-amber-600 text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {u.label}
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className="font-bold text-slate-500">المادة:</span>
                {['الكل', 'قواعد نحوية', 'قواعد إملائية', 'فهم واستيعاب', 'مفردات ولغويات'].map(c => (
                  <button
                    key={c}
                    onClick={() => setRepoCategoryFilter(c)}
                    className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                      repoCategoryFilter === c
                        ? 'bg-slate-900 text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            <div className="text-xs text-slate-500 pt-2 border-t border-slate-100 flex items-center justify-between">
              <span>يتم عرض <strong className="font-mono text-slate-900">{filteredRepoQuestions.length}</strong> سؤالاً مطابقاً</span>
              <span className="text-emerald-700 font-bold">يمكنك تجربة الحل والاطلاع على الإجابة النموذجية فوراً</span>
            </div>
          </div>

          {/* Repository Cards */}
          <div className="space-y-3.5">
            {filteredRepoQuestions.map((q, idx) => {
              const isRevealed = !!revealedAnswers[q.id];

              return (
                <div
                  key={q.id}
                  className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-2xs space-y-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-amber-50 text-amber-900 font-mono text-xs font-black flex items-center justify-center">
                        {idx + 1}
                      </span>
                      {q.category && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                          {q.category}
                        </span>
                      )}
                      {(q as any).unitTitle && (
                        <span className="text-[10px] text-slate-400 hidden sm:inline">
                          {(q as any).unitTitle}
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => setRevealedAnswers(prev => ({ ...prev, [q.id]: !prev[q.id] }))}
                      className="text-xs font-bold text-amber-700 hover:text-amber-800 bg-amber-50 hover:bg-amber-100 px-3 py-1 rounded-xl transition-colors cursor-pointer"
                    >
                      {isRevealed ? 'إخفاء الإجابة النموذجية' : 'إظهار الإجابة النموذجية والشرح'}
                    </button>
                  </div>

                  <p className="text-sm font-bold text-slate-900 leading-relaxed">
                    {q.prompt}
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {q.options?.map((opt, oIdx) => {
                      const isCorrect = isRevealed && opt === q.correctAnswer;
                      return (
                        <div
                          key={oIdx}
                          className={`p-2.5 rounded-xl text-xs font-bold border transition-colors ${
                            isCorrect
                              ? 'bg-emerald-50 text-emerald-900 border-emerald-300 font-black'
                              : 'bg-slate-50 text-slate-700 border-slate-200'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span>{opt}</span>
                            {isCorrect && <Check className="w-4 h-4 text-emerald-600 shrink-0" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {isRevealed && (
                    <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl text-xs text-emerald-950 flex items-start gap-2 animate-in fade-in">
                      <HelpCircle className="w-4 h-4 text-emerald-700 mt-0.5 shrink-0" />
                      <div>
                        <strong className="block font-bold">الإجابة الصحيحة: {String(q.correctAnswer)}</strong>
                        {q.explanation && <span className="mt-0.5 block text-slate-600">{q.explanation}</span>}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Report Modal */}
      <TestReportModal
        testRecord={latestRecord}
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        onRetake={() => {
          setIsReportOpen(false);
          handleStartQuiz();
        }}
      />
    </div>
  );
};

import React, { useState, useMemo, useEffect } from 'react';
import { Question, TestRecord } from '../types.ts';
import { 
  getAllExercises, 
  generateTargetedQuiz, 
  getLessonBankTotal,
  getLessonQuestionBank
} from '../data/index.ts';
import { shuffleQuestionOptions } from '../utils/shuffle.ts';
import { 
  saveLessonProgress, 
  getLessonProgress, 
  clearLessonProgress,
  saveQuizProgress,
  getQuizProgress,
  clearQuizProgress,
  saveTestRecord,
  formatArabicDateTime,
  getAllTestRecords
} from '../utils/testStorage.ts';
import { TestReportModal } from './TestReportModal.tsx';
import { TestHistoryView } from './TestHistoryView.tsx';
import { 
  CheckCircle2, 
  XCircle, 
  HelpCircle, 
  Award, 
  RotateCcw, 
  Sparkles, 
  Trophy, 
  Search, 
  BookOpen, 
  ChevronLeft, 
  ChevronRight, 
  ListOrdered, 
  LayoutGrid, 
  Target,
  Dices,
  Sliders,
  Check,
  FileText,
  BookmarkCheck,
  CheckCheck,
  AlertTriangle
} from 'lucide-react';

interface ExercisesTabProps {
  exercises: Question[];
  lessonId: string;
  lessonTitle?: string;
  onAddScore: (points: number) => void;
  initialMode?: 'lesson' | 'fifty' | 'all' | 'history';
}

export const ExercisesTab: React.FC<ExercisesTabProps> = ({
  exercises,
  lessonId,
  lessonTitle,
  onAddScore,
  initialMode = 'lesson',
}) => {
  // Mode: 'lesson' | 'fifty' (Quiz Generator) | 'all' (Open repository) | 'history' (Test History & Reports)
  const [activeMode, setActiveMode] = useState<'lesson' | 'fifty' | 'all' | 'history'>(initialMode);
  
  useEffect(() => {
    if (initialMode) {
      setActiveMode(initialMode);
    }
  }, [initialMode]);

  // User answers and submissions per question id
  const [userAnswers, setUserAnswers] = useState<Record<string, any>>({});
  const [submitted, setSubmitted] = useState<Record<string, boolean>>({});
  const [correctCount, setCorrectCount] = useState<number>(0);
  const [isTestSubmitted, setIsTestSubmitted] = useState<boolean>(false);
  const [showConfirmSubmitModal, setShowConfirmSubmitModal] = useState<boolean>(false);

  // Filters for lists
  const [selectedCategory, setSelectedCategory] = useState<string>('الكل');
  const [selectedUnit, setSelectedUnit] = useState<string>('الكل');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Report & History Modal States
  const [selectedReportRecord, setSelectedReportRecord] = useState<TestRecord | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState<boolean>(false);
  const [savedNotice, setSavedNotice] = useState<string | null>(null);
  const [historyCount, setHistoryCount] = useState<number>(() => getAllTestRecords().length);

  // Lesson mode questions with guaranteed randomized options
  const [lessonQuizQuestions, setLessonQuizQuestions] = useState<Question[]>(() =>
    exercises.map(q => shuffleQuestionOptions(q))
  );

  useEffect(() => {
    setLessonQuizQuestions(exercises.map(q => shuffleQuestionOptions(q)));
    if (activeMode === 'lesson') {
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
        setTimeout(() => setSavedNotice(null), 4500);
      } else {
        setUserAnswers({});
        setSubmitted({});
        setCorrectCount(0);
        setIsTestSubmitted(false);
      }
      setSelectedCategory('الكل');
    }
  }, [exercises, lessonId]);

  // Restore or sync saved progress when active mode changes
  useEffect(() => {
    if (activeMode === 'lesson') {
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
      }
    } else if (activeMode === 'fifty') {
      const savedQuiz = getQuizProgress();
      if (savedQuiz && (Object.keys(savedQuiz.userAnswers || {}).length > 0 || savedQuiz.isSubmitted)) {
        setUserAnswers(savedQuiz.userAnswers || {});
        if (savedQuiz.isSubmitted) {
          setSubmitted(savedQuiz.submitted || {});
          setCorrectCount(savedQuiz.correctCount || 0);
          setIsTestSubmitted(true);
        } else {
          setSubmitted({});
          setCorrectCount(0);
          setIsTestSubmitted(false);
        }
      }
    }
    setHistoryCount(getAllTestRecords().length);
  }, [activeMode]);

  // Generator & Quiz state (Mode 'fifty' / Challenge)
  const [quizScope, setQuizScope] = useState<'lesson' | 'all'>('lesson');
  const [quizCount, setQuizCount] = useState<number>(20);
  const [fiftyViewMode, setFiftyViewMode] = useState<'single' | 'list'>('single');
  const [fiftyCurrentIndex, setFiftyCurrentIndex] = useState<number>(0);
  
  // Generation visual feedback states
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [quizGenerationKey, setQuizGenerationKey] = useState<number>(Date.now());

  // Initialize quiz questions with randomized options & question order
  const [quizQuestions, setQuizQuestions] = useState<Question[]>(() =>
    generateTargetedQuiz({
      scope: 'lesson',
      lessonId,
      count: 20
    })
  );

  // When lesson changes and user is in lesson scope, refresh questions
  useEffect(() => {
    if (quizScope === 'lesson') {
      const fresh = generateTargetedQuiz({
        scope: 'lesson',
        lessonId,
        count: quizCount
      });
      setQuizQuestions(fresh);
      setUserAnswers({});
      setSubmitted({});
      setCorrectCount(0);
      setFiftyCurrentIndex(0);
      setQuizGenerationKey(Date.now());
    }
  }, [lessonId]);

  // Open repository of all exercises
  const allExercises = useMemo(() => getAllExercises(), []);

  // Compute active question list based on mode
  const currentList = useMemo(() => {
    if (activeMode === 'lesson') {
      return lessonQuizQuestions;
    }
    if (activeMode === 'fifty') {
      return quizQuestions;
    }
    return allExercises;
  }, [activeMode, lessonQuizQuestions, quizQuestions, allExercises]);

  // Available categories for current list
  const availableCategories = useMemo(() => {
    const cats = new Set<string>();
    currentList.forEach(q => {
      if (q.category) cats.add(q.category);
    });
    return ['الكل', ...Array.from(cats)];
  }, [currentList]);

  // Filtered exercises according to filters & search
  const filteredList = useMemo(() => {
    return currentList.filter(q => {
      const matchCat = selectedCategory === 'الكل' || q.category === selectedCategory;
      const matchUnit = selectedUnit === 'الكل' || (q as any).unitId === selectedUnit || (q as any).unitTitle?.includes(selectedUnit);
      const matchSearch = !searchQuery.trim() || 
        q.prompt.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.options?.some(o => o.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (q.explanation && q.explanation.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchCat && matchUnit && matchSearch;
    });
  }, [currentList, selectedCategory, selectedUnit, searchQuery]);

  // Handle option select (Stores user's chosen option without immediate grading)
  const handleSelectOption = (questionId: string, option: any) => {
    if (isTestSubmitted) return;
    const nextAnswers = { ...userAnswers, [questionId]: option };
    setUserAnswers(nextAnswers);

    // Auto-save draft progress without revealing answers
    if (activeMode === 'lesson') {
      saveLessonProgress(lessonId, {
        userAnswers: nextAnswers,
        submitted: {},
        correctCount: 0,
        isSubmitted: false,
        lastUpdated: Date.now(),
      });
    } else if (activeMode === 'fifty') {
      saveQuizProgress({
        userAnswers: nextAnswers,
        submitted: {},
        correctCount: 0,
        isSubmitted: false,
        lastUpdated: Date.now(),
      });
    }
  };

  // Request test submission - checks if all questions are answered or prompts confirmation
  const handleRequestSubmit = () => {
    const questionsToInclude = currentList;
    if (questionsToInclude.length === 0) return;

    const answeredTotal = questionsToInclude.filter(q => userAnswers[q.id] !== undefined).length;
    if (answeredTotal < questionsToInclude.length) {
      setShowConfirmSubmitModal(true);
    } else {
      executeSubmitAndGenerateReport();
    }
  };

  // Evaluate all answers, commit test record, award score, and present error report
  const executeSubmitAndGenerateReport = () => {
    setShowConfirmSubmitModal(false);
    const questionsToInclude = currentList;
    if (questionsToInclude.length === 0) return;

    const subMap: Record<string, boolean> = {};
    let totalCorrect = 0;

    questionsToInclude.forEach(q => {
      subMap[q.id] = true;
      if (userAnswers[q.id] !== undefined && userAnswers[q.id] === q.correctAnswer) {
        totalCorrect++;
      }
    });

    const answeredTotal = questionsToInclude.filter(q => userAnswers[q.id] !== undefined).length;

    setSubmitted(subMap);
    setCorrectCount(totalCorrect);
    setIsTestSubmitted(true);

    if (totalCorrect > 0) {
      onAddScore(totalCorrect * 10);
    }

    // Save final graded progress
    if (activeMode === 'lesson') {
      saveLessonProgress(lessonId, {
        userAnswers,
        submitted: subMap,
        correctCount: totalCorrect,
        isSubmitted: true,
        lastUpdated: Date.now(),
      });
    } else if (activeMode === 'fifty') {
      saveQuizProgress({
        userAnswers,
        submitted: subMap,
        correctCount: totalCorrect,
        isSubmitted: true,
        lastUpdated: Date.now(),
      });
    }

    const record: TestRecord = {
      id: `test-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      title: activeMode === 'lesson'
        ? `تدريبات درس: ${lessonTitle || 'الدرس المحدد'}`
        : quizScope === 'lesson'
        ? `اختبار مخصص لدرس: ${lessonTitle || 'الدرس المحدد'} (${questionsToInclude.length} سؤالاً)`
        : `تحدي بنك الأسئلة الشامل (${questionsToInclude.length} سؤالاً)`,
      scope: activeMode === 'lesson' ? 'lesson' : 'quiz',
      lessonId: activeMode === 'lesson' || quizScope === 'lesson' ? lessonId : undefined,
      lessonTitle: lessonTitle || undefined,
      timestamp: Date.now(),
      formattedDate: formatArabicDateTime(Date.now()),
      totalQuestions: questionsToInclude.length,
      answeredCount: answeredTotal,
      correctCount: totalCorrect,
      scorePercentage: questionsToInclude.length > 0
        ? Math.round((totalCorrect / questionsToInclude.length) * 100)
        : 0,
      questions: questionsToInclude.map(q => ({
        questionId: q.id,
        prompt: q.prompt,
        type: q.type,
        userAnswer: userAnswers[q.id],
        correctAnswer: q.correctAnswer,
        isCorrect: userAnswers[q.id] === q.correctAnswer,
        explanation: q.explanation,
        category: q.category,
        options: q.options,
        lessonTitle: (q as any).lessonTitle,
        unitTitle: (q as any).unitTitle,
      })),
    };

    saveTestRecord(record);
    setHistoryCount(getAllTestRecords().length);
    setSelectedReportRecord(record);
    setIsReportModalOpen(true);
    setToastMessage('🎉 تم تسليم الاختبار وحفظ النتيجة في السجل وإصدار تقرير الأداء بنجاح!');
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Reset entire current mode quiz
  const handleResetQuiz = () => {
    setUserAnswers({});
    setSubmitted({});
    setCorrectCount(0);
    setIsTestSubmitted(false);
    setShowConfirmSubmitModal(false);
    setFiftyCurrentIndex(0);
    if (activeMode === 'lesson') {
      clearLessonProgress(lessonId);
      setToastMessage('تمت إعادة ضبط تدريبات هذا الدرس والبدء من جديد');
    } else if (activeMode === 'fifty') {
      clearQuizProgress();
      setToastMessage('تمت إعادة ضبط الاختبار والبدء من جديد');
    }
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Retake a test from history
  const handleRetakeFromHistory = (record: TestRecord) => {
    setIsTestSubmitted(false);
    setShowConfirmSubmitModal(false);
    if (record.scope === 'lesson' && record.lessonId === lessonId) {
      setActiveMode('lesson');
      setUserAnswers({});
      setSubmitted({});
      setCorrectCount(0);
      clearLessonProgress(lessonId);
      setLessonQuizQuestions(exercises.map(q => shuffleQuestionOptions(q)));
      setToastMessage(`🔄 بدأت إعادة تدريبات درس: ${lessonTitle || ''}`);
    } else {
      setActiveMode('fifty');
      const questionsToRetake: Question[] = record.questions.map(q => ({
        id: q.questionId,
        type: q.type as any,
        prompt: q.prompt,
        options: q.options ? [...q.options] : undefined,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
        category: q.category,
        lessonTitle: q.lessonTitle,
        unitTitle: q.unitTitle,
      }));
      setQuizQuestions(questionsToRetake.map(q => shuffleQuestionOptions(q)));
      setUserAnswers({});
      setSubmitted({});
      setCorrectCount(0);
      setFiftyCurrentIndex(0);
      setQuizScope(record.scope === 'lesson' ? 'lesson' : 'all');
      setToastMessage(`🔄 بدأت إعادة اختبار: ${record.title}`);
    }
  };

  // Generate / Reshuffle quiz questions
  const handleGenerateNewQuiz = (scopeOverride?: 'lesson' | 'all', countOverride?: number) => {
    setIsGenerating(true);
    setIsTestSubmitted(false);
    setShowConfirmSubmitModal(false);
    const targetScope = scopeOverride || quizScope;
    const targetCount = countOverride || quizCount;

    // Reset filters and search so questions are immediately visible
    setSelectedCategory('الكل');
    setSelectedUnit('الكل');
    setSearchQuery('');

    const fresh = generateTargetedQuiz({
      scope: targetScope,
      lessonId,
      count: targetCount
    });

    const newGenKey = Date.now();
    setQuizQuestions(fresh);
    setUserAnswers({});
    setSubmitted({});
    setCorrectCount(0);
    setFiftyCurrentIndex(0);
    setQuizGenerationKey(newGenKey);
    clearQuizProgress();

    const scopeLabel = targetScope === 'lesson' 
      ? (lessonTitle ? `درس: ${lessonTitle}` : 'الدرس المحدد') 
      : 'كامل المنهج المقرر';
    setToastMessage(`✨ تم توليد ${fresh.length} سؤالاً جديداً بنجاح من بنك الأسئلة (${scopeLabel})!`);

    setTimeout(() => {
      setIsGenerating(false);
    }, 350);

    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Generate / Reshuffle questions for lesson mode specifically
  const handleGenerateNewLessonExercises = () => {
    setIsGenerating(true);
    setIsTestSubmitted(false);
    setShowConfirmSubmitModal(false);
    setSelectedCategory('الكل');
    setSelectedUnit('الكل');
    setSearchQuery('');

    const freshBank = getLessonQuestionBank(lessonId, 15);
    const fresh = freshBank.length > 0 
      ? freshBank 
      : exercises.map(q => shuffleQuestionOptions(q));

    const newGenKey = Date.now();
    setLessonQuizQuestions(fresh);
    setUserAnswers({});
    setSubmitted({});
    setCorrectCount(0);
    setQuizGenerationKey(newGenKey);
    clearLessonProgress(lessonId);

    setToastMessage(`✨ تم تجديد تدريبات الدرس واختيار ${fresh.length} سؤالاً متنوعاً من بنك الأسئلة بدون أي تكرار!`);

    setTimeout(() => {
      setIsGenerating(false);
    }, 350);

    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Switch to quiz mode targeted at current lesson
  const handleLaunchTargetedLessonQuiz = (count: number = 20) => {
    setQuizScope('lesson');
    setQuizCount(count);
    setActiveMode('fifty');
    handleGenerateNewQuiz('lesson', count);
  };

  // Quiz mode progress stats
  const currentAnsweredCount = useMemo(() => {
    return currentList.filter(q => userAnswers[q.id] !== undefined).length;
  }, [currentList, userAnswers]);

  const quizAnsweredCount = useMemo(() => {
    return quizQuestions.filter(q => userAnswers[q.id] !== undefined).length;
  }, [quizQuestions, userAnswers]);

  const totalLessonBank = getLessonBankTotal(lessonId);

  return (
    <div className="space-y-6">
      {/* Top Main Mode Navigation Tabs (4 Options) */}
      <div className="bg-white rounded-2xl p-2 sm:p-2.5 border border-slate-200 shadow-2xs grid grid-cols-2 lg:grid-cols-4 gap-2 w-full">
        <button
          onClick={() => {
            setActiveMode('lesson');
            setSelectedCategory('الكل');
            setSelectedUnit('الكل');
          }}
          className={`w-full flex items-center justify-center gap-2 px-3 sm:px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeMode === 'lesson'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <BookOpen className="w-4 h-4 shrink-0" />
          <span className="truncate">تدريبات هذا الدرس</span>
          <span className={`text-[11px] px-1.5 py-0.2 rounded-full font-mono font-bold shrink-0 ${
            activeMode === 'lesson' ? 'bg-white/25 text-white' : 'bg-slate-200 text-slate-700'
          }`}>
            {lessonQuizQuestions.length}
          </span>
        </button>

        <button
          onClick={() => {
            setActiveMode('fifty');
            setSelectedCategory('الكل');
            setSelectedUnit('الكل');
          }}
          className={`w-full flex items-center justify-center gap-2 px-3 sm:px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeMode === 'fifty'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'text-amber-900 bg-amber-50 hover:bg-amber-100/70 border border-amber-200/80'
          }`}
        >
          <Trophy className="w-4 h-4 text-amber-300 shrink-0" />
          <span className="truncate">بَنْكُ الأَسْئِلَةِ وَالتَّحَدِّي</span>
          <span className={`text-[11px] px-2 py-0.5 rounded-full font-mono font-black shrink-0 ${
            activeMode === 'fifty' ? 'bg-white/30 text-white' : 'bg-amber-200 text-amber-950'
          }`}>
            توليد ذكي
          </span>
        </button>

        <button
          onClick={() => {
            setActiveMode('history');
          }}
          className={`w-full flex items-center justify-center gap-2 px-3 sm:px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeMode === 'history'
              ? 'bg-teal-700 text-white shadow-xs'
              : 'text-slate-700 hover:bg-teal-50 hover:text-teal-900'
          }`}
        >
          <FileText className="w-4 h-4 shrink-0" />
          <span className="truncate">سِجِلُّ الِاخْتِبَارَاتِ وَالتَّقَارِيرِ</span>
          <span className={`text-[11px] px-2 py-0.5 rounded-full font-mono font-black shrink-0 ${
            activeMode === 'history' ? 'bg-white/25 text-white' : 'bg-teal-100 text-teal-800'
          }`}>
            {historyCount}
          </span>
        </button>

        <button
          onClick={() => {
            setActiveMode('all');
            setSelectedCategory('الكل');
            setSelectedUnit('الكل');
          }}
          className={`w-full flex items-center justify-center gap-2 px-3 sm:px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeMode === 'all'
              ? 'bg-slate-800 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <LayoutGrid className="w-4 h-4 shrink-0" />
          <span className="truncate">المستودع الشامل المفتوح</span>
          <span className={`text-[11px] px-2 py-0.5 rounded-full font-mono font-bold shrink-0 ${
            activeMode === 'all' ? 'bg-white/25 text-white' : 'bg-slate-200 text-slate-700'
          }`}>
            {allExercises.length}+
          </span>
        </button>
      </div>

      {/* Toast Notification Alert */}
      {toastMessage && (
        <div className="bg-emerald-600 text-white px-4 py-3 rounded-2xl text-xs sm:text-sm font-bold shadow-md flex items-center justify-between gap-3 border border-emerald-500 animate-in fade-in duration-200">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-4 h-4 text-emerald-200 shrink-0 animate-pulse" />
            <span>{toastMessage}</span>
          </div>
          <button 
            onClick={() => setToastMessage(null)}
            className="text-white/80 hover:text-white text-xs font-mono p-1 rounded-md hover:bg-white/10 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Saved Progress Auto-Restored Notice */}
      {savedNotice && (
        <div className="bg-teal-50 border border-teal-200/90 text-teal-950 px-4 py-3 rounded-2xl text-xs font-bold flex items-center justify-between gap-2 shadow-2xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <BookmarkCheck className="w-4 h-4 text-teal-600 shrink-0" />
            <span>{savedNotice}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[11px] text-teal-800 bg-teal-100 px-2 py-0.5 rounded-full font-mono">
              محفوظ تلقائياً ✓
            </span>
            <button
              onClick={() => setSavedNotice(null)}
              className="text-slate-400 hover:text-slate-700 font-mono text-xs cursor-pointer p-0.5"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* MODE 4: TEST HISTORY & REPORTS VIEW */}
      {activeMode === 'history' && (
        <TestHistoryView
          onStartNewQuiz={() => setActiveMode('fifty')}
          onRetakeTest={handleRetakeFromHistory}
        />
      )}

      {/* Mode 1 & 3: Banner and Controls */}
      {activeMode !== 'fifty' && activeMode !== 'history' && (
        <div className="space-y-4">
          <div className={`text-white rounded-2xl p-5 shadow-xs flex flex-wrap items-center justify-between gap-4 ${
            activeMode === 'lesson'
              ? 'bg-linear-to-r from-emerald-600 to-teal-700'
              : 'bg-linear-to-r from-teal-700 to-slate-800'
          }`}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0">
                <Award className="w-5 h-5 text-amber-300" />
              </div>
              <div>
                <h3 className="font-extrabold text-base">
                  {activeMode === 'lesson'
                    ? `تدريبات درس: ${lessonTitle || 'الدرس المحدد'}`
                    : 'المستودع الكامل لبنك الأسئلة المقررة'}
                </h3>
                <p className="text-xs text-emerald-100 mt-0.5">
                  {activeMode === 'lesson'
                    ? `مجموع الأسئلة المعروضة: ${lessonQuizQuestions.length} سؤالاً • يتم حفظ إجاباتك تلقائياً`
                    : `إجمالي بنك الأسئلة: ${allExercises.length} سؤالاً شاملاً لكل الوحدات والظواهر`}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <div className="bg-white/20 backdrop-blur-xs px-3.5 py-1.5 rounded-xl text-xs font-bold">
                {isTestSubmitted ? (
                  <span>النتيجة النهائية: {correctCount} / {currentList.length}</span>
                ) : (
                  <span>تم حل: {currentAnsweredCount} / {currentList.length}</span>
                )}
              </div>

              {!isTestSubmitted ? (
                currentAnsweredCount > 0 && (
                  <button
                    onClick={handleRequestSubmit}
                    className="flex items-center gap-1.5 bg-amber-400 hover:bg-amber-300 text-amber-950 px-3.5 py-1.5 rounded-xl text-xs font-black transition-all shadow-xs cursor-pointer active:scale-95 border border-amber-300"
                    title="تسليم الحل وإصدار تقرير الأداء والأخطاء"
                  >
                    <FileText className="w-3.5 h-3.5 text-amber-950" />
                    <span>تسليم الحل وعرض التقرير ({currentAnsweredCount})</span>
                  </button>
                )
              ) : (
                <button
                  onClick={() => setIsReportModalOpen(true)}
                  className="flex items-center gap-1.5 bg-amber-400 hover:bg-amber-300 text-amber-950 px-3.5 py-1.5 rounded-xl text-xs font-black transition-all shadow-xs cursor-pointer active:scale-95 border border-amber-300"
                  title="عرض تقرير الأخطاء والتحليل"
                >
                  <FileText className="w-3.5 h-3.5 text-amber-950" />
                  <span>تقرير الأخطاء ({correctCount}/{currentList.length})</span>
                </button>
              )}

              {activeMode === 'lesson' && !isTestSubmitted && (
                <button
                  onClick={handleGenerateNewLessonExercises}
                  disabled={isGenerating}
                  className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-3 py-1.5 rounded-xl text-xs font-black transition-all shadow-xs cursor-pointer active:scale-95 border border-emerald-400"
                  title="توليد وتجديد أسئلة هذا الدرس من بنك الأسئلة"
                >
                  <Dices className={`w-3.5 h-3.5 text-slate-950 ${isGenerating ? 'animate-spin' : ''}`} />
                  <span>{isGenerating ? 'جارٍ التوليد...' : 'توليد جديد'}</span>
                </button>
              )}

              {(currentAnsweredCount > 0 || isTestSubmitted) && (
                <button
                  onClick={handleResetQuiz}
                  className="flex items-center gap-1 bg-white text-emerald-900 hover:bg-emerald-50 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors shadow-2xs cursor-pointer"
                  title="إعادة المحاولة ومسح التقدم المحفوظ لهذا الدرس"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>{isTestSubmitted ? 'إعادة الاختبار' : 'إعادة الضبط'}</span>
                </button>
              )}
            </div>
          </div>

          {/* Quick jump to 100-Question bank for this specific lesson */}
          {activeMode === 'lesson' && (
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-2xs">
                  <Dices className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-amber-950">
                    هل تريد اختباراً مخصصاً بدون أي تكرار لهذا الدرس؟
                  </h4>
                  <p className="text-[11px] text-amber-800 mt-0.5">
                    يتوفر {totalLessonBank} سؤالاً فريداً ومصنفاً في بنك هذا الدرس، يتم اختيارها وخلط خياراتها عشوائياً.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={() => handleLaunchTargetedLessonQuiz(10)}
                  className="flex-1 sm:flex-initial bg-amber-600 hover:bg-amber-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>بدء ١٠ أسئلة</span>
                </button>

                <button
                  onClick={() => handleLaunchTargetedLessonQuiz(Math.min(totalLessonBank || 20, 20))}
                  className="bg-amber-100 hover:bg-amber-200 text-amber-950 border border-amber-300 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  <span>{Math.min(totalLessonBank || 20, 20)} سؤالاً</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Mode 2: QUESTION BANK GENERATOR & INTERACTIVE QUIZ HEADER */}
      {activeMode === 'fifty' && (
        <div className="space-y-4">
          <div className="bg-linear-to-r from-amber-600 via-orange-600 to-amber-700 text-white rounded-3xl p-5 sm:p-6 shadow-md relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-amber-300/40" />
            
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0 border border-white/30 shadow-inner mt-1">
                  <Trophy className="w-7 h-7 text-amber-200" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="bg-amber-900/50 text-amber-200 text-[11px] font-black px-2.5 py-0.5 rounded-full border border-amber-400/40">
                      مُولِّدُ الأسئلة العشوائي الذكي
                    </span>
                    <span className="text-xs text-amber-100 font-bold">
                      بنك أسئلة مدرسي معتمد • منع التكرار تماماً • خلط عشوائي للخيارات
                    </span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black tracking-tight mt-1.5">
                    {quizScope === 'lesson' 
                      ? `اختبار عشوائي: ${lessonTitle || 'الدرس المحدد'}` 
                      : 'تحدي الأسئلة الشامل لكامل المنهج'}
                  </h3>
                  <p className="text-xs text-amber-100 mt-1 max-w-xl leading-relaxed">
                    يتم اختيار الأسئلة وترتيب الإجابات بشكل عشوائي تماماً في كل اختبار لضمان تجربة تعليمية منصفة ومتجددة دائماً.
                  </p>
                </div>
              </div>

              {/* Progress & Reset Controls */}
              <div className="flex flex-col sm:items-end gap-2 shrink-0 w-full sm:w-auto">
                <div className="bg-black/25 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/20 text-xs font-bold flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
                  <div>
                    <span className="text-amber-200">
                      {isTestSubmitted ? 'النتيجة: ' : 'تم حل: '}
                    </span>
                    <span className="font-mono text-white text-sm">
                      {isTestSubmitted ? correctCount : quizAnsweredCount}
                    </span> / {quizQuestions.length}
                  </div>
                  {isTestSubmitted && (
                    <>
                      <span className="text-white/30">|</span>
                      <div>
                        <span className="text-emerald-300">النسبة: </span>
                        <span className="font-mono text-white text-sm">
                          {quizQuestions.length > 0 ? Math.round((correctCount / quizQuestions.length) * 100) : 0}%
                        </span>
                      </div>
                    </>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                  {!isTestSubmitted ? (
                    quizAnsweredCount > 0 && (
                      <button
                        onClick={handleRequestSubmit}
                        className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 bg-amber-400 hover:bg-amber-300 text-amber-950 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-black transition-all shadow-sm cursor-pointer active:scale-95"
                        title="تسليم الحل وإصدار تقرير الأداء والأخطاء"
                      >
                        <FileText className="w-4 h-4 text-amber-950" />
                        <span>تسليم الاختبار والتقرير ({quizAnsweredCount})</span>
                      </button>
                    )
                  ) : (
                    <>
                      <button
                        onClick={() => setIsReportModalOpen(true)}
                        className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 bg-white hover:bg-amber-50 text-amber-950 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-black transition-all shadow-sm cursor-pointer active:scale-95"
                        title="عرض تقرير الأداء والأخطاء"
                      >
                        <FileText className="w-4 h-4 text-amber-600" />
                        <span>تقرير الأخطاء ({correctCount}/{quizQuestions.length})</span>
                      </button>
                      <button
                        onClick={handleResetQuiz}
                        className="flex items-center gap-1 bg-black/25 hover:bg-black/40 text-white px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer"
                        title="إعادة نفس الاختبار من البداية"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>إعادة الاختبار</span>
                      </button>
                    </>
                  )}

                  <button
                    onClick={() => handleGenerateNewQuiz()}
                    disabled={isGenerating}
                    className="flex-1 sm:flex-initial flex items-center justify-center gap-2 bg-amber-400 hover:bg-amber-300 text-amber-950 px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition-all shadow-sm border border-amber-300 cursor-pointer active:scale-95 disabled:opacity-75"
                    title="توليد مجموعة أسئلة عشوائية جديدة"
                  >
                    <Dices className={`w-4 h-4 text-amber-950 ${isGenerating ? 'animate-spin' : ''}`} />
                    <span>{isGenerating ? 'جارٍ التوليد...' : 'توليد جديد'}</span>
                  </button>

                  <div className="flex items-center bg-black/25 rounded-xl p-0.5 border border-white/20 shrink-0">
                    <button
                      onClick={() => setFiftyViewMode('single')}
                      className={`p-1.5 rounded-lg text-xs font-bold transition-all ${
                        fiftyViewMode === 'single'
                          ? 'bg-white text-amber-900 shadow-xs'
                          : 'text-amber-100 hover:text-white'
                      }`}
                      title="عرض تفاعلي سؤال بسؤال"
                    >
                      <ListOrdered className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setFiftyViewMode('list')}
                      className={`p-1.5 rounded-lg text-xs font-bold transition-all ${
                        fiftyViewMode === 'list'
                          ? 'bg-white text-amber-900 shadow-xs'
                          : 'text-amber-100 hover:text-white'
                      }`}
                      title="عرض القائمة الكاملة"
                    >
                      <LayoutGrid className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* GENERATOR SETTINGS PANEL (Scope & Question Count) */}
            <div className="mt-5 pt-4 border-t border-white/15 grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
              {/* Scope selection */}
              <div className="md:col-span-6 flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-amber-200 shrink-0 flex items-center gap-1">
                  <Sliders className="w-3.5 h-3.5" />
                  <span>نطاق الأسئلة:</span>
                </span>
                
                <div className="flex items-center gap-1.5 bg-black/20 p-1 rounded-xl border border-white/15 text-xs font-bold">
                  <button
                    onClick={() => {
                      setQuizScope('lesson');
                      handleGenerateNewQuiz('lesson', Math.min(quizCount, 20));
                    }}
                    className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                      quizScope === 'lesson'
                        ? 'bg-white text-amber-900 shadow-xs'
                        : 'text-amber-100 hover:text-white'
                    }`}
                  >
                    🎯 الدرس المحدد فقط
                  </button>
                  <button
                    onClick={() => {
                      setQuizScope('all');
                      handleGenerateNewQuiz('all', quizCount);
                    }}
                    className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                      quizScope === 'all'
                        ? 'bg-white text-amber-900 shadow-xs'
                        : 'text-amber-100 hover:text-white'
                    }`}
                  >
                    🌍 كامل المنهج المقرر
                  </button>
                </div>
              </div>

              {/* Count selection */}
              <div className="md:col-span-6 flex flex-wrap items-center justify-start md:justify-end gap-1.5">
                <span className="text-xs font-bold text-amber-200 shrink-0">
                  عدد الأسئلة:
                </span>
                {(quizScope === 'lesson'
                  ? [5, 10, 15, 20]
                  : [10, 20, 30, 50]
                ).map(count => (
                  <button
                    key={count}
                    onClick={() => {
                      setQuizCount(count);
                      handleGenerateNewQuiz(quizScope, count);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer border ${
                      quizCount === count
                        ? 'bg-amber-300 text-amber-950 border-amber-300 shadow-xs'
                        : 'bg-black/20 text-amber-100 border-white/15 hover:bg-black/30'
                    }`}
                  >
                    {count}
                  </button>
                ))}
              </div>
            </div>

            {/* Overall Progress Bar */}
            <div className="mt-4 pt-3 border-t border-white/15 space-y-1.5">
              <div className="flex justify-between text-xs font-bold text-amber-100">
                <span>
                  {isTestSubmitted 
                    ? `نتيجة الاختبار النهائي (${correctCount} من أصل ${quizQuestions.length})` 
                    : `نسبة الإنجاز في الاختبار الحالي (${quizQuestions.length} سؤالاً)`}
                </span>
                <span className="font-mono">
                  {quizQuestions.length > 0 
                    ? Math.round(((isTestSubmitted ? correctCount : quizAnsweredCount) / quizQuestions.length) * 100) 
                    : 0}%
                </span>
              </div>
              <div className="w-full h-2.5 bg-black/30 rounded-full overflow-hidden p-0.5">
                <div 
                  className="h-full bg-linear-to-r from-amber-300 to-emerald-400 rounded-full transition-all duration-300"
                  style={{ 
                    width: `${quizQuestions.length > 0 ? ((isTestSubmitted ? correctCount : quizAnsweredCount) / quizQuestions.length) * 100 : 0}%` 
                  }}
                />
              </div>
            </div>
          </div>

          {/* Quick Questions Map (Navigator) */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700">
              <div className="flex items-center gap-1.5">
                <Target className="w-4 h-4 text-amber-600" />
                <span>خريطة الأسئلة ({quizQuestions.length} سؤالاً):</span>
              </div>
              <div className="hidden sm:flex items-center gap-3 text-[11px] text-slate-500">
                {isTestSubmitted ? (
                  <>
                    <span className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> صحيح
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> خاطئ
                    </span>
                  </>
                ) : (
                  <>
                    <span className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-400" /> تم الحل
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-full bg-slate-200" /> متبقٍ
                    </span>
                  </>
                )}
              </div>
            </div>

            <div className="grid grid-cols-8 xs:grid-cols-10 sm:grid-cols-15 md:grid-cols-20 lg:grid-cols-25 gap-1 sm:gap-1.5 pt-1 w-full max-h-48 overflow-y-auto p-1">
              {quizQuestions.map((q, idx) => {
                const isCurrent = fiftyViewMode === 'single' && idx === fiftyCurrentIndex;
                const hasAnswer = userAnswers[q.id] !== undefined;
                const isCorrect = hasAnswer && userAnswers[q.id] === q.correctAnswer;

                let tileStyle = 'bg-slate-100 text-slate-600 hover:bg-slate-200 border-slate-200';
                if (isTestSubmitted) {
                  tileStyle = isCorrect 
                    ? 'bg-emerald-600 text-white font-bold border-emerald-700' 
                    : 'bg-rose-500 text-white font-bold border-rose-600';
                } else if (hasAnswer) {
                  tileStyle = 'bg-amber-400 text-amber-950 font-bold border-amber-500';
                }

                if (isCurrent) {
                  tileStyle += ' ring-2 ring-offset-1 ring-amber-500 scale-105 z-10';
                }

                return (
                  <button
                    key={`${q.id}-${idx}-${quizGenerationKey}`}
                    onClick={() => {
                      setFiftyCurrentIndex(idx);
                      if (fiftyViewMode === 'list') {
                        const el = document.getElementById(`q-card-${q.id}`);
                        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      }
                    }}
                    className={`h-7 sm:h-8 rounded-lg text-xs font-mono font-bold flex items-center justify-center border transition-all cursor-pointer ${tileStyle}`}
                    title={`سؤال ${idx + 1}: ${q.category || ''}`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Filter and Search Bar (Available for open repository and filters) */}
      {activeMode !== 'fifty' && (
        <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="flex-1 min-w-[200px] relative">
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث في نص السؤال أو الإجابة أو الشرح..."
                className="w-full pl-3 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            {/* Unit Filter if in all repository */}
            {activeMode === 'all' && (
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-slate-500 font-bold shrink-0">الوحدة:</span>
                <select
                  value={selectedUnit}
                  onChange={(e) => setSelectedUnit(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  <option value="الكل">جميع الوحدات</option>
                  <option value="unit-revision">المراجعة والتشخيص</option>
                  <option value="unit-1">المحور الثالث: مجتمعي (الوحدة الأولى)</option>
                  <option value="unit-2">المحور الثالث: مجتمعي (الوحدة الثانية)</option>
                  <option value="unit-3">المحور الرابع: مسؤولياتي (الوحدة الثالثة)</option>
                </select>
              </div>
            )}

            {/* Category Filter */}
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-slate-500 font-bold shrink-0">المجال:</span>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                {availableCategories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* SINGLE QUESTION INTERACTIVE CARD (WHEN IN QUIZ MODE WITH SINGLE VIEW) */}
      {activeMode === 'fifty' && fiftyViewMode === 'single' && quizQuestions.length > 0 && (
        <div className="bg-white rounded-3xl p-5 sm:p-7 border border-amber-200 shadow-sm space-y-6">
          {(() => {
            const question = quizQuestions[fiftyCurrentIndex];
            if (!question) return null;

            const isAnswered = userAnswers[question.id] !== undefined;
            const isDone = isTestSubmitted;
            const isCorrect = isAnswered && userAnswers[question.id] === question.correctAnswer;

            return (
              <div key={`${question.id}-${quizGenerationKey}`} className="space-y-6">
                {/* Question Metadata Header */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-xl bg-amber-500 text-white font-mono font-black text-sm flex items-center justify-center shadow-xs">
                      {fiftyCurrentIndex + 1}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        {question.category && (
                          <span className="text-[11px] font-bold text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded-md">
                            {question.category}
                          </span>
                        )}
                        {(question as any).lessonTitle && (
                          <span className="text-[11px] text-slate-500">
                            • {(question as any).lessonTitle}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {isDone && (
                      isCorrect ? (
                        <span className="flex items-center gap-1 text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-lg text-xs font-bold">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>صحيحة (+10)</span>
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-rose-700 bg-rose-100 px-2.5 py-1 rounded-lg text-xs font-bold">
                          <XCircle className="w-3.5 h-3.5" />
                          <span>خاطئة</span>
                        </span>
                      )
                    )}
                    <span className="text-xs font-bold text-slate-400 font-mono">
                      السؤال {fiftyCurrentIndex + 1} من {quizQuestions.length}
                    </span>
                  </div>
                </div>

                {/* Question Prompt */}
                <div className="space-y-2">
                  <h4 className="text-base sm:text-lg font-bold text-slate-900 leading-relaxed font-['Cairo',sans-serif]">
                    {question.prompt}
                  </h4>
                </div>

                {/* MCQ Options (Randomized order) */}
                {question.type === 'mcq' && question.options && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {question.options.map((option, optIdx) => {
                      const isSelected = userAnswers[question.id] === option;
                      let optionStyle = 'border-slate-200 hover:border-amber-400 bg-slate-50/70 text-slate-700';

                      if (isDone) {
                        if (option === question.correctAnswer) {
                          optionStyle = 'border-emerald-500 bg-emerald-100 text-emerald-900 font-bold ring-2 ring-emerald-500/20';
                        } else if (isSelected && !isCorrect) {
                          optionStyle = 'border-rose-400 bg-rose-100 text-rose-900 font-bold';
                        } else {
                          optionStyle = 'border-slate-100 opacity-50 text-slate-400';
                        }
                      } else if (isSelected) {
                        optionStyle = 'border-amber-500 bg-amber-50 text-amber-900 font-bold shadow-xs ring-2 ring-amber-500/20';
                      }

                      return (
                        <button
                          key={optIdx}
                          onClick={() => handleSelectOption(question.id, option)}
                          disabled={isDone}
                          className={`text-right p-4 rounded-2xl border text-sm transition-all flex items-center justify-between cursor-pointer ${optionStyle}`}
                        >
                          <span className="leading-relaxed">{option}</span>
                          <span className="w-5 h-5 rounded-full border border-current flex items-center justify-center text-xs shrink-0 mr-2">
                            {isSelected ? '✓' : ''}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Boolean Options */}
                {question.type === 'boolean' && (
                  <div className="grid grid-cols-2 gap-4 max-w-md">
                    {[
                      { label: 'صواب (✔)', val: true },
                      { label: 'خطأ (✖)', val: false }
                    ].map((btn) => {
                      const isSelected = userAnswers[question.id] === btn.val;
                      let btnStyle = 'border-slate-200 bg-slate-50 text-slate-700 hover:border-amber-400';

                      if (isDone) {
                        if (btn.val === question.correctAnswer) {
                          btnStyle = 'border-emerald-500 bg-emerald-100 text-emerald-900 font-bold ring-2 ring-emerald-500/20';
                        } else if (isSelected && !isCorrect) {
                          btnStyle = 'border-rose-400 bg-rose-100 text-rose-900 font-bold';
                        } else {
                          btnStyle = 'opacity-50 border-slate-100';
                        }
                      } else if (isSelected) {
                        btnStyle = 'border-amber-500 bg-amber-50 text-amber-900 font-bold ring-2 ring-amber-500/20';
                      }

                      return (
                        <button
                          key={String(btn.val)}
                          onClick={() => handleSelectOption(question.id, btn.val)}
                          disabled={isDone}
                          className={`p-4 rounded-2xl border text-sm font-bold transition-all text-center cursor-pointer ${btnStyle}`}
                        >
                          {btn.label}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Submit & Next Controls */}
                <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-4 border-t border-slate-100 w-full">
                  <div className="flex items-center justify-between sm:justify-start gap-2 w-full sm:w-auto">
                    <button
                      onClick={() => setFiftyCurrentIndex(prev => Math.max(0, prev - 1))}
                      disabled={fiftyCurrentIndex === 0}
                      className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        fiftyCurrentIndex === 0
                          ? 'opacity-40 text-slate-400 cursor-not-allowed bg-slate-50'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700 active:scale-95'
                      }`}
                    >
                      <ChevronRight className="w-4 h-4" />
                      <span>السابق</span>
                    </button>

                    <button
                      onClick={() => setFiftyCurrentIndex(prev => Math.min(quizQuestions.length - 1, prev + 1))}
                      disabled={fiftyCurrentIndex === quizQuestions.length - 1}
                      className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        fiftyCurrentIndex === quizQuestions.length - 1
                          ? 'opacity-40 text-slate-400 cursor-not-allowed bg-slate-50'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700 active:scale-95'
                      }`}
                    >
                      <span>التالي</span>
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="w-full sm:w-auto flex flex-wrap items-center justify-end gap-2">
                    {!isDone ? (
                      <button
                        onClick={handleRequestSubmit}
                        disabled={quizAnsweredCount === 0}
                        className={`w-full sm:w-auto px-6 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer active:scale-95 ${
                          quizAnsweredCount > 0
                            ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 font-black'
                            : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                        }`}
                      >
                        <FileText className="w-4 h-4 text-slate-950" />
                        <span>تسليم الحل وإنهاء الاختبار ({quizAnsweredCount}/{quizQuestions.length})</span>
                      </button>
                    ) : (
                      <div className="flex flex-wrap items-center justify-between sm:justify-end gap-2 w-full sm:w-auto">
                        <button
                          onClick={() => setIsReportModalOpen(true)}
                          className="bg-amber-500 hover:bg-amber-600 text-slate-950 px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-95 flex-1 sm:flex-initial"
                          title="عرض تقرير الأخطاء والتحليل الشامل"
                        >
                          <FileText className="w-3.5 h-3.5 text-slate-950" />
                          <span>فتح تقرير الأخطاء والتحليل</span>
                        </button>

                        {fiftyCurrentIndex < quizQuestions.length - 1 ? (
                          <button
                            onClick={() => setFiftyCurrentIndex(prev => prev + 1)}
                            className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer active:scale-95 flex-1 sm:flex-initial"
                          >
                            <span>السؤال التالي</span>
                            <ChevronLeft className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleGenerateNewQuiz()}
                            disabled={isGenerating}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 shadow-xs flex-1 sm:flex-initial"
                          >
                            <Dices className={`w-4 h-4 text-emerald-200 ${isGenerating ? 'animate-spin' : ''}`} />
                            <span>توليد اختبار جديد</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Explanation */}
                {isDone && question.explanation && (
                  <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200/80 text-xs text-slate-700 space-y-1 animate-in fade-in duration-200">
                    <div className="flex items-center gap-1.5 font-bold text-amber-900">
                      <HelpCircle className="w-4 h-4 text-amber-600" />
                      <span>التوضيح والقاعدة التعليمية:</span>
                    </div>
                    <p className="leading-relaxed pr-5">{question.explanation}</p>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}

      {/* QUESTIONS LIST (FOR LESSON, OPEN REPOSITORY, OR QUIZ LIST VIEW) */}
      {(activeMode !== 'fifty' || fiftyViewMode === 'list') && (
        <div className="space-y-4">
          {filteredList.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center border border-slate-200">
              <HelpCircle className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-slate-600 font-bold text-sm">لم يتم العثور على أسئلة تطابق بحثك الحالي.</p>
              <button
                onClick={() => {
                  setSelectedCategory('الكل');
                  setSelectedUnit('الكل');
                  setSearchQuery('');
                }}
                className="mt-3 text-xs text-emerald-700 font-bold hover:underline cursor-pointer"
              >
                إعادة تعيين الفلاتر
              </button>
            </div>
          ) : (
            filteredList.map((question, index) => {
              const isAnswered = userAnswers[question.id] !== undefined;
              const isDone = isTestSubmitted;
              const isCorrect = isAnswered && userAnswers[question.id] === question.correctAnswer;

              return (
                <div
                  id={`q-card-${question.id}`}
                  key={`${question.id}-${index}-${quizGenerationKey}`}
                  className={`bg-white rounded-2xl p-5 sm:p-6 border transition-all duration-200 shadow-xs ${
                    isDone
                      ? isCorrect
                        ? 'border-emerald-300 bg-emerald-50/20'
                        : 'border-rose-200 bg-rose-50/20'
                      : isAnswered
                        ? 'border-amber-300 bg-amber-50/10'
                        : 'border-slate-200/90 hover:border-slate-300'
                  }`}
                >
                  {/* Question Header */}
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-start gap-2.5">
                      <span className="w-7 h-7 rounded-xl bg-slate-100 text-slate-700 text-xs font-black flex items-center justify-center shrink-0 mt-0.5 font-mono">
                        {index + 1}
                      </span>
                      <div>
                        <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                          {question.category && (
                            <span className="inline-block text-[11px] font-bold text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded-md">
                              {question.category}
                            </span>
                          )}
                          {(question as any).unitTitle && (
                            <span className="inline-block text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                              {(question as any).unitTitle.split(':')[0]}
                            </span>
                          )}
                          {(question as any).lessonTitle && (
                            <span className="inline-block text-[10px] font-medium text-slate-400">
                              • {(question as any).lessonTitle}
                            </span>
                          )}
                        </div>
                        <h4 className="font-bold text-slate-900 text-sm sm:text-base leading-relaxed font-['Cairo',sans-serif]">
                          {question.prompt}
                        </h4>
                      </div>
                    </div>

                    <div className="shrink-0">
                      {isDone ? (
                        isCorrect ? (
                          <span className="flex items-center gap-1 text-emerald-600 text-xs font-bold bg-emerald-100 px-2.5 py-1 rounded-full">
                            <CheckCircle2 className="w-4 h-4" />
                            <span>إجابة صحيحة (+10)</span>
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-rose-600 text-xs font-bold bg-rose-100 px-2.5 py-1 rounded-full">
                            <XCircle className="w-4 h-4" />
                            <span>إجابة خاطئة</span>
                          </span>
                        )
                      ) : isAnswered ? (
                        <span className="flex items-center gap-1 text-amber-700 text-xs font-bold bg-amber-100 px-2.5 py-1 rounded-full">
                          <span>تم الاختيار ✓</span>
                        </span>
                      ) : null}
                    </div>
                  </div>

                  {/* MCQ Options (Randomized order) */}
                  {question.type === 'mcq' && question.options && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-4">
                      {question.options.map((option, optIdx) => {
                        const isSelected = userAnswers[question.id] === option;
                        let optionStyle = 'border-slate-200 hover:border-emerald-300 bg-slate-50/60 text-slate-700';

                        if (isDone) {
                          if (option === question.correctAnswer) {
                            optionStyle = 'border-emerald-500 bg-emerald-100 text-emerald-900 font-bold';
                          } else if (isSelected && !isCorrect) {
                            optionStyle = 'border-rose-400 bg-rose-100 text-rose-900 font-bold';
                          } else {
                            optionStyle = 'border-slate-100 opacity-60 text-slate-500';
                          }
                        } else if (isSelected) {
                          optionStyle = 'border-amber-500 bg-amber-50 text-amber-950 font-bold shadow-xs ring-2 ring-amber-500/20';
                        }

                        return (
                          <button
                            key={optIdx}
                            onClick={() => handleSelectOption(question.id, option)}
                            disabled={isDone}
                            className={`text-right p-3 rounded-xl border text-xs sm:text-sm transition-all flex items-center justify-between cursor-pointer ${optionStyle}`}
                          >
                            <span>{option}</span>
                            <span className="w-4 h-4 rounded-full border border-current flex items-center justify-center text-[10px]">
                              {isSelected ? '✓' : ''}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Boolean Options (صح أم خطأ) */}
                  {question.type === 'boolean' && (
                    <div className="grid grid-cols-2 gap-3 mb-4 max-w-xs">
                      {[
                        { label: 'صواب (✔)', val: true },
                        { label: 'خطأ (✖)', val: false }
                      ].map((btn) => {
                        const isSelected = userAnswers[question.id] === btn.val;
                        let btnStyle = 'border-slate-200 bg-slate-50 text-slate-700';

                        if (isDone) {
                          if (btn.val === question.correctAnswer) {
                            btnStyle = 'border-emerald-500 bg-emerald-100 text-emerald-900 font-bold';
                          } else if (isSelected && !isCorrect) {
                            btnStyle = 'border-rose-400 bg-rose-100 text-rose-900 font-bold';
                          } else {
                            btnStyle = 'opacity-50 border-slate-100';
                          }
                        } else if (isSelected) {
                          btnStyle = 'border-amber-500 bg-amber-50 text-amber-950 font-bold shadow-xs ring-2 ring-amber-500/20';
                        }

                        return (
                          <button
                            key={String(btn.val)}
                            onClick={() => handleSelectOption(question.id, btn.val)}
                            disabled={isDone}
                            className={`p-3 rounded-xl border text-xs sm:text-sm font-bold transition-all text-center cursor-pointer ${btnStyle}`}
                          >
                            {btn.label}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Explanation Note */}
                  {isDone && question.explanation && (
                    <div className="mt-3 pt-3 border-t border-slate-100 flex items-start gap-2 text-xs text-slate-600">
                      <HelpCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <p><span className="font-bold text-emerald-800">التوضيح:</span> {question.explanation}</p>
                    </div>
                  )}
                </div>
              );
            })
          )}

          {/* Bottom Assessment Bar */}
          {!isTestSubmitted ? (
            currentAnsweredCount > 0 && (
              <div className="bg-white border-2 border-amber-400/50 rounded-3xl p-5 sm:p-6 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 shadow-inner">
                    <CheckCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-slate-900 text-sm sm:text-base">
                      أجبت عن {currentAnsweredCount} من أصل {filteredList.length} سؤالاً
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      تم حفظ إجاباتك تلقائياً كمسوّدة. اضغط تسليم لتقييم جميع الأسئلة وإصدار تقرير الأداء وتحليل الأخطاء في النهاية.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 w-full sm:w-auto">
                  <button
                    onClick={handleRequestSubmit}
                    className="flex-1 sm:flex-initial flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black px-6 py-3 rounded-2xl text-xs sm:text-sm shadow-md transition-all cursor-pointer active:scale-95"
                  >
                    <FileText className="w-4 h-4 text-slate-950" />
                    <span>تسليم الحل وعرض تقرير الأخطاء</span>
                  </button>
                </div>
              </div>
            )
          ) : (
            <div className="bg-white border-2 border-emerald-500/25 rounded-3xl p-5 sm:p-6 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 shadow-inner">
                  <Trophy className="w-6 h-6 text-emerald-700" />
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-900 text-sm sm:text-base">
                    النتيجة النهائية: {correctCount} من أصل {filteredList.length} سؤالاً ({filteredList.length > 0 ? Math.round((correctCount / filteredList.length) * 100) : 0}%)
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    تم الانتهاء من الاختبار وتقييم جميع الإجابات وحفظ السجل.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
                <button
                  onClick={() => setIsReportModalOpen(true)}
                  className="flex-1 sm:flex-initial flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black px-5 py-3 rounded-2xl text-xs sm:text-sm shadow-md transition-all cursor-pointer active:scale-95"
                >
                  <FileText className="w-4 h-4 text-slate-950" />
                  <span>فتح تقرير الأخطاء والتحليل</span>
                </button>
                <button
                  onClick={handleResetQuiz}
                  className="flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-3 rounded-2xl text-xs sm:text-sm transition-all cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>إعادة الاختبار</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Confirmation Modal when submitting incomplete test */}
      {showConfirmSubmitModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95">
            <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto shadow-inner">
              <FileText className="w-7 h-7" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-lg font-black text-slate-900">
                هل تريد تسليم الاختبار الآن؟
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                لقد أجبت عن <span className="font-bold text-amber-700">{currentAnsweredCount}</span> سؤالاً من أصل <span className="font-bold text-slate-800">{currentList.length}</span> سؤالاً.
                {currentList.length - currentAnsweredCount > 0 && (
                  <span className="block mt-1 text-rose-600 font-bold">
                    تنبيه: يوجد {currentList.length - currentAnsweredCount} سؤالاً لم تجب عنها وسيتم احتسابها غير مجابة.
                  </span>
                )}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-2 pt-2">
              <button
                onClick={() => {
                  setShowConfirmSubmitModal(false);
                  executeSubmitAndGenerateReport();
                }}
                className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl text-xs sm:text-sm transition-all shadow-sm cursor-pointer active:scale-95"
              >
                نعم، تسليم وعرض تقرير الأخطاء
              </button>
              <button
                onClick={() => setShowConfirmSubmitModal(false)}
                className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs sm:text-sm transition-all cursor-pointer"
              >
                متابعة الحل
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Test Report Modal */}
      <TestReportModal
        testRecord={selectedReportRecord}
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        onRetake={handleRetakeFromHistory}
      />
    </div>
  );
};

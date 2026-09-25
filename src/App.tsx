import React from 'react';
import { allUnits, getLessonById, getAllLessons } from './data/index.ts';
import { Lesson, Unit } from './types.ts';
import { Header } from './components/Header.tsx';
import { Sidebar } from './components/Sidebar.tsx';
import { LessonReader } from './components/LessonReader.tsx';
import { VocabularyTab } from './components/VocabularyTab.tsx';
import { LessonExercisesTab } from './components/LessonExercisesTab.tsx';
import { QuestionBankView } from './components/QuestionBankView.tsx';
import { TestHistoryView } from './components/TestHistoryView.tsx';
import { GrammarTab } from './components/GrammarTab.tsx';
import { WritingTab } from './components/WritingTab.tsx';
import { LessonSubLessonsBar } from './components/LessonSubLessonsBar.tsx';
import { SubLessonGrammarView } from './components/SubLessonGrammarView.tsx';
import { SubLessonSpellingView } from './components/SubLessonSpellingView.tsx';
import { SubLessonWritingView } from './components/SubLessonWritingView.tsx';
import { AiTutorModal } from './components/AiTutorModal.tsx';
import { AiUsageModal } from './components/AiUsageModal.tsx';
import { AudioPlayerProvider, useAudioPlayer } from './context/AudioContext.tsx';
import { PinnedAudioPlayer } from './components/PinnedAudioPlayer.tsx';
import { AudioSettingsModal } from './components/AudioSettingsModal.tsx';
import { TextCharactersModal } from './components/TextCharactersModal.tsx';
import { 
  BookOpen, 
  HelpCircle, 
  GraduationCap, 
  PenTool, 
  CheckCircle2, 
  ChevronRight, 
  ChevronLeft,
  Sparkles,
  BookMarked,
  Trophy,
  FileText
} from 'lucide-react';
import { getAllTestRecords } from './utils/testStorage.ts';

type ActiveTabType = 'reader' | 'vocab' | 'exercises' | 'grammar' | 'spelling' | 'writing' | 'question_bank' | 'history';

const VALID_TABS: ActiveTabType[] = [
  'reader', 'vocab', 'exercises', 'grammar', 'spelling', 'writing', 'question_bank', 'history'
];

export default function App() {
  return (
    <AudioPlayerProvider>
      <MainAppContent />
    </AudioPlayerProvider>
  );
}

function MainAppContent() {
  // استعادة الدرس الأخير المفتوح من ذاكرة المتصفح لفتحه تلقائياً عند تحديث الصفحة
  const [activeLessonId, setActiveLessonId] = React.useState<string>(() => {
    const saved = localStorage.getItem('selah_active_lesson_id');
    if (saved && getLessonById(saved)) {
      return saved;
    }
    return 'u1-l1';
  });

  // استعادة الصفحة/التبويب الأخير المفتوح من ذاكرة المتصفح
  const [activeTab, setActiveTab] = React.useState<ActiveTabType>(() => {
    const saved = localStorage.getItem('selah_active_tab') as ActiveTabType;
    if (saved && VALID_TABS.includes(saved)) {
      return saved;
    }
    return 'reader';
  });

  // استعادة الصوت المفضل
  const [selectedVoice, setSelectedVoice] = React.useState<string>(() => {
    return localStorage.getItem('selah_selected_voice') || 'Zephyr';
  });

  const [isSidebarOpen, setIsSidebarOpen] = React.useState<boolean>(false);
  const [isAiTutorOpen, setIsAiTutorOpen] = React.useState<boolean>(false);
  const [isAiUsageModalOpen, setIsAiUsageModalOpen] = React.useState<boolean>(false);
  
  // Test records count for tab badge
  const [historyCount, setHistoryCount] = React.useState<number>(() => getAllTestRecords().length);

  React.useEffect(() => {
    const handleUpdate = () => setHistoryCount(getAllTestRecords().length);
    window.addEventListener('storage', handleUpdate);
    return () => window.removeEventListener('storage', handleUpdate);
  }, []);

  // حفظ التبويب النشط فور تغييره في ذاكرة المتصفح
  React.useEffect(() => {
    if (activeTab) {
      localStorage.setItem('selah_active_tab', activeTab);
    }
  }, [activeTab]);

  // حفظ معرف الدرس النشط فور تغييره في ذاكرة المتصفح
  React.useEffect(() => {
    if (activeLessonId) {
      localStorage.setItem('selah_active_lesson_id', activeLessonId);
    }
  }, [activeLessonId]);

  // حفظ الصوت المختار فور تغييره
  React.useEffect(() => {
    if (selectedVoice) {
      localStorage.setItem('selah_selected_voice', selectedVoice);
    }
  }, [selectedVoice]);
  
  // Student progress state stored locally
  const [studentScore, setStudentScore] = React.useState<number>(() => {
    const saved = localStorage.getItem('selah_student_score');
    return saved ? parseInt(saved, 10) : 50;
  });

  const [completedLessons, setCompletedLessons] = React.useState<string[]>(() => {
    const saved = localStorage.getItem('selah_completed_lessons');
    return saved ? JSON.parse(saved) : ['u-rev-1'];
  });

  const { syncCurrentLesson, preferredVoice } = useAudioPlayer();
  const activeVoice = preferredVoice || selectedVoice || 'Zephyr';

  const lessonLookup = getLessonById(activeLessonId);
  const currentLesson: Lesson = lessonLookup?.lesson || allUnits[1].lessons[0];
  const currentUnit: Unit = lessonLookup?.unit || allUnits[1];

  // مزامنة محتوى الدرس المستعاد تلقائياً مع مزود الصوت عند بدء التطبيق أو تبديل الدرس
  React.useEffect(() => {
    if (currentLesson) {
      syncCurrentLesson({
        id: currentLesson.id,
        title: currentLesson.title,
        text: currentLesson.readingText,
      });
    }
  }, [currentLesson.id, currentLesson.title, currentLesson.readingText, syncCurrentLesson]);

  // حفظ واستعادة موضع التمرير في الصفحة عند التحديث
  React.useEffect(() => {
    const handleBeforeUnload = () => {
      localStorage.setItem('selah_scroll_pos', String(window.scrollY));
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    const savedScroll = localStorage.getItem('selah_scroll_pos');
    if (savedScroll) {
      const targetPos = parseInt(savedScroll, 10);
      if (targetPos > 0) {
        setTimeout(() => {
          window.scrollTo({ top: targetPos, behavior: 'instant' });
        }, 100);
      }
    }

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  const allLessonsList = getAllLessons();
  const currentLessonIndex = allLessonsList.findIndex(l => l.id === currentLesson.id);
  const prevLesson = currentLessonIndex > 0 ? allLessonsList[currentLessonIndex - 1] : null;
  const nextLesson = currentLessonIndex < allLessonsList.length - 1 ? allLessonsList[currentLessonIndex + 1] : null;

  // Find sub-lessons
  const grammarSubLesson = currentLesson.grammarLessons?.find(g => g.category === 'نحو') || currentLesson.grammarLessons?.[0];
  const spellingSubLesson = currentLesson.grammarLessons?.find(g => g.category === 'إملاء');
  const writingSubTopic = currentLesson.writingTopic;
  const hasSubLessons = !!(grammarSubLesson || spellingSubLesson || writingSubTopic);

  const handleSelectLesson = (lessonId: string, subTab?: string) => {
    setActiveLessonId(lessonId);
    if (subTab) {
      setActiveTab(subTab as ActiveTabType);
    } else {
      setActiveTab('reader');
    }
    const lookup = getLessonById(lessonId);
    if (lookup?.lesson) {
      syncCurrentLesson({
        id: lookup.lesson.id,
        title: lookup.lesson.title,
        text: lookup.lesson.readingText,
      });
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAddScore = (points: number) => {
    setStudentScore(prev => {
      const next = prev + points;
      localStorage.setItem('selah_student_score', String(next));
      return next;
    });

    // Mark current lesson as completed
    if (!completedLessons.includes(currentLesson.id)) {
      setCompletedLessons(prev => {
        const next = [...prev, currentLesson.id];
        localStorage.setItem('selah_completed_lessons', JSON.stringify(next));
        return next;
      });
    }
  };

  const handleToggleCompleted = () => {
    if (completedLessons.includes(currentLesson.id)) {
      setCompletedLessons(prev => {
        const next = prev.filter(id => id !== currentLesson.id);
        localStorage.setItem('selah_completed_lessons', JSON.stringify(next));
        return next;
      });
    } else {
      handleAddScore(25);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100/60 text-slate-800 font-['Cairo',sans-serif] flex flex-col antialiased selection:bg-emerald-200 selection:text-emerald-900 pb-24" dir="rtl">
      {/* Top Main Navigation Header */}
      <Header
        currentUnit={currentUnit}
        currentLesson={currentLesson}
        studentScore={studentScore}
        selectedVoice={selectedVoice}
        onVoiceChange={setSelectedVoice}
        onToggleSidebar={() => setIsSidebarOpen(true)}
        onOpenAiTutor={() => setIsAiTutorOpen(true)}
        onOpenAiUsage={() => setIsAiUsageModalOpen(true)}
      />

      {/* Main Layout Area */}
      <div className="flex-1 max-w-7xl w-full mx-auto flex">
        {/* Main Content Area */}
        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 space-y-6">
          {/* Top-Level Section Navigation Bar (Curriculum vs Question Bank vs Test History) */}
          <div className="bg-white rounded-2xl sm:rounded-3xl p-2 border border-slate-200/90 shadow-2xs grid grid-cols-1 sm:grid-cols-3 gap-2 w-full">
            <button
              onClick={() => {
                if (['question_bank', 'history'].includes(activeTab)) {
                  setActiveTab('reader');
                }
              }}
              className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-black transition-all cursor-pointer ${
                !['question_bank', 'history'].includes(activeTab)
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-700 hover:bg-slate-100 hover:text-slate-950'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>دِرَاسَةُ المَنْهَجِ وَالدُّرُوسِ</span>
            </button>

            <button
              onClick={() => setActiveTab('question_bank')}
              className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-black transition-all cursor-pointer ${
                activeTab === 'question_bank'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-amber-900 bg-amber-50/80 hover:bg-amber-100 border border-amber-200/80'
              }`}
            >
              <Trophy className="w-4 h-4 text-amber-500" />
              <span>بَنْكُ الأَسْئِلَةِ وَتَوْلِيدُ الاخْتِبَارَاتِ</span>
              <span className="bg-amber-200 text-amber-950 text-[10px] px-2 py-0.5 rounded-full font-mono font-black">
                ٥٠٠+ سؤال
              </span>
            </button>

            <button
              onClick={() => setActiveTab('history')}
              className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-black transition-all cursor-pointer ${
                activeTab === 'history'
                  ? 'bg-teal-700 text-white shadow-xs'
                  : 'text-teal-900 bg-teal-50/80 hover:bg-teal-100 border border-teal-200/80'
              }`}
            >
              <FileText className="w-4 h-4 text-teal-600" />
              <span>سِجِلُّ النَّتَائِجِ وَتَقَارِيرِ الأَخْطَاءِ</span>
              {historyCount > 0 && (
                <span className="bg-teal-200 text-teal-950 text-[10px] px-2 py-0.5 rounded-full font-mono font-black">
                  {historyCount}
                </span>
              )}
            </button>
          </div>

          {/* VIEW A: QUESTION BANK (OUTSIDE LESSON) */}
          {activeTab === 'question_bank' && (
            <QuestionBankView
              onAddScore={handleAddScore}
              onViewHistory={() => setActiveTab('history')}
            />
          )}

          {/* VIEW B: TEST HISTORY & REPORTS (OUTSIDE LESSON) */}
          {activeTab === 'history' && (
            <TestHistoryView
              onStartNewQuiz={() => setActiveTab('question_bank')}
            />
          )}

          {/* VIEW C: LESSON CURRICULUM STUDY */}
          {!['question_bank', 'history'].includes(activeTab) && (
            <>
              {/* Unit Hero Card */}
              <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-xs relative overflow-hidden">
                <div className={`absolute top-0 right-0 left-0 h-2 bg-linear-to-r ${currentUnit.color}`} />
                
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="space-y-1 max-w-2xl">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-emerald-800 bg-emerald-100/90 px-3 py-1 rounded-full">
                        {currentUnit.badge || currentUnit.title}
                      </span>
                      {currentLesson.pagesRef && (
                        <span className="text-xs text-slate-500 font-medium">
                          {currentLesson.pagesRef}
                        </span>
                      )}
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-black text-slate-900 font-['Cairo',sans-serif] tracking-tight">
                      {currentLesson.title}
                    </h1>
                    {currentLesson.subTitle && (
                      <p className="text-sm font-semibold text-emerald-700">
                        {currentLesson.subTitle}
                      </p>
                    )}
                  </div>

                  {/* Action Buttons: Index Toggle + Mark Complete */}
                  <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full sm:w-auto shrink-0">
                    <button
                      onClick={() => setIsSidebarOpen(true)}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-2xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-all cursor-pointer shadow-2xs"
                      title="عرض فهرس الدروس والوحدات"
                    >
                      <BookOpen className="w-4 h-4 text-emerald-600" />
                      <span>فِهْرِسُ الدُّرُوسِ</span>
                    </button>

                    <button
                      onClick={handleToggleCompleted}
                      className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all shadow-2xs shrink-0 cursor-pointer ${
                        completedLessons.includes(currentLesson.id)
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 hover:bg-emerald-200/80'
                          : 'bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 border border-slate-200'
                      }`}
                      title={completedLessons.includes(currentLesson.id) ? 'إلغاء تحديد الدرس كمكتمل' : 'تحديد الدرس كمكتمل وإضافة ٢٥ نقطة'}
                    >
                      <CheckCircle2 className={`w-4 h-4 ${completedLessons.includes(currentLesson.id) ? 'text-emerald-600' : 'text-slate-400'}`} />
                      <span>{completedLessons.includes(currentLesson.id) ? 'أكملت دراسة هذا الدرس ✓' : 'تحديد الدرس كمكتمل (+25)'}</span>
                    </button>
                  </div>
                </div>

                {/* Lesson-Specific Sub Navigation Tabs */}
                <div className="mt-5 sm:mt-6 pt-3 sm:pt-4 border-t border-slate-100 flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-2 scrollbar-none -mx-2 px-2">
                  {/* 1. Study & Sub-Branches */}
                  <button
                    onClick={() => {
                      if (!['reader', 'grammar', 'spelling', 'writing'].includes(activeTab)) {
                        setActiveTab('reader');
                      }
                    }}
                    className={`flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all shrink-0 cursor-pointer border ${
                      ['reader', 'grammar', 'spelling', 'writing'].includes(activeTab)
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <BookOpen className="w-4 h-4" />
                    <span>شَرْحُ الدَّرْسِ وَفُرُوعِهِ</span>
                    {hasSubLessons && (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                        ['reader', 'grammar', 'spelling', 'writing'].includes(activeTab)
                          ? 'bg-emerald-700 text-emerald-100'
                          : 'bg-emerald-50 text-emerald-700'
                      }`}>
                        {1 + (grammarSubLesson ? 1 : 0) + (spellingSubLesson ? 1 : 0) + (writingSubTopic ? 1 : 0)} فروع
                      </span>
                    )}
                  </button>

                  {/* 2. Vocabulary & Dictionary */}
                  <button
                    onClick={() => setActiveTab('vocab')}
                    className={`flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all shrink-0 cursor-pointer border ${
                      activeTab === 'vocab'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <BookMarked className="w-4 h-4" />
                    <span>مُعْجَمُ اللُّغَوِيَّاتِ</span>
                    <span className={`text-[11px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                      activeTab === 'vocab' ? 'bg-emerald-700 text-emerald-100' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {currentLesson.vocabulary.length}
                    </span>
                  </button>

                  {/* 3. Lesson Exercises (Only for this lesson!) */}
                  <button
                    onClick={() => setActiveTab('exercises')}
                    className={`flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all shrink-0 cursor-pointer border ${
                      activeTab === 'exercises'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <HelpCircle className="w-4 h-4" />
                    <span>تَدْرِيبَاتُ هَذَا الدَّرْسِ</span>
                    {currentLesson.exercises.length > 0 && (
                      <span className={`text-[11px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                        activeTab === 'exercises' ? 'bg-emerald-700 text-emerald-100' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {currentLesson.exercises.length}+
                      </span>
                    )}
                  </button>
                </div>
              </div>

              {/* Sub-lessons classification navigator when lesson has sub-lessons and in reading/grammar/spelling/writing */}
              {hasSubLessons && (activeTab === 'reader' || activeTab === 'grammar' || activeTab === 'spelling' || activeTab === 'writing') && (
                <LessonSubLessonsBar
                  lesson={currentLesson}
                  activeSubTab={activeTab}
                  onSelectSubTab={(tab) => setActiveTab(tab as ActiveTabType)}
                />
              )}

              {/* Tab Content Display */}
              <div className="transition-all duration-300">
                {activeTab === 'reader' && (
                  <LessonReader 
                    lesson={currentLesson} 
                    voice={activeVoice}
                    onGoToVocabTab={() => setActiveTab('vocab')}
                    onAskAiTutor={() => setIsAiTutorOpen(true)}
                    onGoToSubTab={(tab) => setActiveTab(tab as ActiveTabType)}
                  />
                )}

                {activeTab === 'vocab' && (
                  <VocabularyTab key={currentLesson.id} vocabulary={currentLesson.vocabulary} voice={activeVoice} />
                )}

                {activeTab === 'exercises' && (
                  <LessonExercisesTab
                    key={`lesson-exercises-${currentLesson.id}`}
                    lessonId={currentLesson.id}
                    lessonTitle={currentLesson.title}
                    unitTitle={currentUnit.title}
                    onAddScore={handleAddScore}
                    onViewHistory={() => setActiveTab('history')}
                  />
                )}

                {activeTab === 'grammar' && (
                  grammarSubLesson ? (
                    grammarSubLesson.detailedSections || grammarSubLesson.exercises ? (
                      <SubLessonGrammarView 
                        lesson={grammarSubLesson} 
                        onAddScore={handleAddScore} 
                      />
                    ) : (
                      <GrammarTab grammarLessons={[grammarSubLesson]} />
                    )
                  ) : (
                    <GrammarTab grammarLessons={currentLesson.grammarLessons || []} />
                  )
                )}

                {activeTab === 'spelling' && (
                  spellingSubLesson ? (
                    <SubLessonSpellingView 
                      lesson={spellingSubLesson} 
                      onAddScore={handleAddScore} 
                    />
                  ) : (
                    <GrammarTab grammarLessons={currentLesson.grammarLessons?.filter(g => g.category === 'إملاء') || []} />
                  )
                )}

                {activeTab === 'writing' && (
                  writingSubTopic ? (
                    writingSubTopic.elements && (writingSubTopic.modelText || writingSubTopic.exercises) ? (
                      <SubLessonWritingView 
                        topic={writingSubTopic} 
                        lessonId={currentLesson.id} 
                        onAddScore={handleAddScore} 
                      />
                    ) : (
                      <WritingTab writingTopic={writingSubTopic} />
                    )
                  ) : (
                    <WritingTab writingTopic={currentLesson.writingTopic} />
                  )
                )}
              </div>

              {/* Bottom Next / Previous Lesson Navigation */}
              <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 w-full">
                {prevLesson ? (
                  <button
                    onClick={() => handleSelectLesson(prevLesson.id)}
                    className="flex items-center justify-between sm:justify-start gap-2.5 px-4 py-3 bg-white hover:bg-slate-50 text-slate-800 rounded-2xl border border-slate-200 text-xs sm:text-sm font-bold shadow-2xs transition-all hover:border-emerald-300 w-full sm:w-auto flex-1 max-w-none sm:max-w-xs cursor-pointer active:scale-[0.99]"
                  >
                    <ChevronRight className="w-4 h-4 text-emerald-600 shrink-0" />
                    <div className="text-right min-w-0 flex-1">
                      <div className="text-[10px] text-slate-400">الدرس السابق</div>
                      <div className="truncate text-slate-800">{prevLesson.title}</div>
                    </div>
                  </button>
                ) : (
                  <div className="hidden sm:block flex-1 max-w-xs" />
                )}

                {/* Central Lesson Indicator & Table of Contents Shortcut */}
                <div className="flex items-center justify-center gap-2.5 py-2 px-3.5 bg-slate-100/90 rounded-2xl border border-slate-200 text-xs text-slate-600 shrink-0">
                  <span className="font-bold text-slate-800 truncate max-w-[160px] sm:max-w-[200px]">
                    {currentUnit.title.split(':')[0]}
                  </span>
                  <span>•</span>
                  <button
                    onClick={() => setIsSidebarOpen(true)}
                    className="text-emerald-700 hover:text-emerald-800 font-bold hover:underline cursor-pointer flex items-center gap-1 shrink-0"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>فهرس الدروس</span>
                  </button>
                </div>

                {nextLesson ? (
                  <button
                    onClick={() => handleSelectLesson(nextLesson.id)}
                    className="flex items-center justify-between sm:justify-end gap-2.5 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs sm:text-sm font-bold shadow-sm transition-all active:scale-[0.99] w-full sm:w-auto flex-1 max-w-none sm:max-w-xs cursor-pointer"
                  >
                    <div className="text-right sm:text-left min-w-0 flex-1">
                      <div className="text-[10px] text-emerald-100">الدرس التالي</div>
                      <div className="truncate text-white">{nextLesson.title}</div>
                    </div>
                    <ChevronLeft className="w-4 h-4 text-white shrink-0" />
                  </button>
                ) : (
                  <div className="hidden sm:block flex-1 max-w-xs" />
                )}
              </div>
            </>
          )}
        </main>

        {/* Sidebar Table of Contents Navigation */}
        <Sidebar
          units={allUnits}
          activeLessonId={activeLessonId}
          onSelectLesson={handleSelectLesson}
          activeSubTab={activeTab}
          completedLessons={completedLessons}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          onOpenQuestionBank={() => {
            setActiveTab('question_bank');
            setIsSidebarOpen(false);
          }}
          onOpenHistory={() => {
            setActiveTab('history');
            setIsSidebarOpen(false);
          }}
        />
      </div>

      {/* AI Arabic Tutor Dialog */}
      <AiTutorModal
        isOpen={isAiTutorOpen}
        onClose={() => setIsAiTutorOpen(false)}
        currentLesson={currentLesson}
        voice={selectedVoice}
      />

      {/* AI Usage & Quota Modal */}
      <AiUsageModal
        isOpen={isAiUsageModalOpen}
        onClose={() => setIsAiUsageModalOpen(false)}
      />

      {/* Persistent Pinned Audio Player Bar (Stays active across all tabs & pages) */}
      <PinnedAudioPlayer
        currentLessonTitle={currentLesson.title}
        currentLessonId={currentLesson.id}
        currentText={currentLesson.readingText}
        currentVoice={selectedVoice}
      />

      {/* Global Audio Settings & Character Customization Modals */}
      <AudioSettingsModal />
      <TextCharactersModal />
    </div>
  );
}

import React, { useState, useMemo, useEffect } from 'react';
import { VocabItem } from '../types.ts';
import { 
  Volume2, 
  Sparkles, 
  Layers, 
  Search, 
  HelpCircle, 
  RotateCw,
  Check,
  BookOpen,
  Compass,
  Award,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  RefreshCw,
  SlidersHorizontal,
  BookmarkCheck,
  Lightbulb,
  TreePine,
  CheckCheck
} from 'lucide-react';
import { audioService } from '../utils/audioPlayer.ts';
import { shuffleArray } from '../utils/shuffle.ts';

interface VocabularyTabProps {
  vocabulary: VocabItem[];
  voice: string;
}

type SubTab = 'table' | 'map' | 'flashcards' | 'quiz';
type CategoryFilter = 'all' | 'meanings' | 'opposites' | 'plurals' | 'roots';

interface QuizQuestionItem {
  id: string;
  type: 'meaning' | 'opposite' | 'plural' | 'root';
  word: string;
  prompt: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

export const VocabularyTab: React.FC<VocabularyTabProps> = ({ vocabulary, voice }) => {
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('table');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  
  // Flashcards state
  const [flashcardIndex, setFlashcardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [slideDirection, setSlideDirection] = useState<'next' | 'prev' | null>(null);
  const [masteredWords, setMasteredWords] = useState<Record<string, boolean>>({});
  const [showOnlyUnmastered, setShowOnlyUnmastered] = useState(false);

  // Word Map state
  const [selectedMapIndex, setSelectedMapIndex] = useState(0);

  // Audio state
  const [playingWord, setPlayingWord] = useState<string | null>(null);

  // Mini Quiz state
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestionItem[]>([]);
  const [quizCurrentIndex, setQuizCurrentIndex] = useState(0);
  const [quizSelectedOption, setQuizSelectedOption] = useState<string | null>(null);
  const [quizIsAnswered, setQuizIsAnswered] = useState(false);
  const [quizScore, setQuizScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);

  // Sync with audio service
  useEffect(() => {
    const unsubscribe = audioService.subscribeVocab((activeWord, isPlaying) => {
      setPlayingWord(isPlaying ? activeWord : null);
    });
    return () => unsubscribe();
  }, []);

  // Filtered vocabulary list for Table & Map
  const filteredVocab = useMemo(() => {
    return vocabulary.filter((v) => {
      const matchesSearch = 
        !searchTerm.trim() ||
        v.word.includes(searchTerm) || 
        v.meaning.includes(searchTerm) ||
        (v.opposite && v.opposite.includes(searchTerm)) ||
        (v.plural && v.plural.includes(searchTerm)) ||
        (v.singular && v.singular.includes(searchTerm)) ||
        (v.root && v.root.includes(searchTerm)) ||
        (v.family && v.family.some(f => f.includes(searchTerm))) ||
        (v.contextSentence && v.contextSentence.includes(searchTerm));

      if (!matchesSearch) return false;

      if (categoryFilter === 'meanings') return Boolean(v.meaning);
      if (categoryFilter === 'opposites') return Boolean(v.opposite);
      if (categoryFilter === 'plurals') return Boolean(v.plural || v.singular);
      if (categoryFilter === 'roots') return Boolean(v.root || (v.family && v.family.length > 0));

      return true;
    });
  }, [vocabulary, searchTerm, categoryFilter]);

  // Flashcards filtered list
  const flashcardList = useMemo(() => {
    if (showOnlyUnmastered) {
      const remaining = vocabulary.filter(v => !masteredWords[v.id]);
      return remaining.length > 0 ? remaining : vocabulary;
    }
    return vocabulary;
  }, [vocabulary, showOnlyUnmastered, masteredWords]);

  const activeCard = flashcardList[flashcardIndex] || flashcardList[0] || vocabulary[0];
  const activeMapWord = filteredVocab[selectedMapIndex] || filteredVocab[0] || vocabulary[0];

  // Speak word
  const handleSpeak = async (speechText: string, wordKey: string) => {
    if (playingWord === wordKey) {
      audioService.stopWord();
      setPlayingWord(null);
      return;
    }
    setPlayingWord(wordKey);
    await audioService.speakWord(speechText, {
      voice,
      word: wordKey,
      onEnd: () => setPlayingWord(null),
      onError: () => setPlayingWord(null),
    });
  };

  // Flashcard controls
  const nextFlashcard = () => {
    setIsFlipped(false);
    setSlideDirection('next');
    setFlashcardIndex((prev) => (prev + 1) % flashcardList.length);
  };

  const prevFlashcard = () => {
    setIsFlipped(false);
    setSlideDirection('prev');
    setFlashcardIndex((prev) => (prev - 1 + flashcardList.length) % flashcardList.length);
  };

  const toggleMastered = (id: string) => {
    setMasteredWords((prev) => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Keyboard navigation for flashcards
  useEffect(() => {
    if (activeSubTab !== 'flashcards') return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        nextFlashcard();
      } else if (e.key === 'ArrowRight') {
        prevFlashcard();
      } else if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        setIsFlipped((f) => !f);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeSubTab, flashcardList.length]);

  // Generate dynamic vocabulary quiz
  const generateQuiz = () => {
    if (vocabulary.length < 3) return;

    const questions: QuizQuestionItem[] = [];
    const shuffledVocab = shuffleArray([...vocabulary]);

    shuffledVocab.forEach((item) => {
      // 1. Meaning Question
      if (item.meaning && questions.length < 8) {
        const distractors = vocabulary
          .filter(v => v.id !== item.id && v.meaning !== item.meaning)
          .map(v => v.meaning);
        const shuffledDistractors = shuffleArray(distractors).slice(0, 3);
        if (shuffledDistractors.length >= 2) {
          questions.push({
            id: `qz-mean-${item.id}`,
            type: 'meaning',
            word: item.word,
            prompt: `مَا المُرَادُ بِمَعْنَى كَلِمَةِ «${item.word}» فِي النَّصِّ؟`,
            options: shuffleArray([item.meaning, ...shuffledDistractors]),
            correctAnswer: item.meaning,
            explanation: `المعنى الصحيح لكلمة (${item.word}) هو: ${item.meaning}.`
          });
        }
      }

      // 2. Opposite Question
      if (item.opposite && questions.length < 8) {
        const distractors = vocabulary
          .filter(v => v.id !== item.id && v.opposite && v.opposite !== item.opposite)
          .map(v => v.opposite as string);
        const shuffledDistractors = shuffleArray(distractors).slice(0, 3);
        if (shuffledDistractors.length >= 2) {
          questions.push({
            id: `qz-opp-${item.id}`,
            type: 'opposite',
            word: item.word,
            prompt: `مَا مُضَادُّ (عَكْسُ) كَلِمَةِ «${item.word}»؟`,
            options: shuffleArray([item.opposite, ...shuffledDistractors]),
            correctAnswer: item.opposite,
            explanation: `مضاد كلمة (${item.word}) هو: ${item.opposite}.`
          });
        }
      }

      // 3. Root Question
      if (item.root && questions.length < 8) {
        const distractors = vocabulary
          .filter(v => v.id !== item.id && v.root && v.root !== item.root)
          .map(v => v.root as string);
        const shuffledDistractors = shuffleArray(distractors).slice(0, 3);
        if (shuffledDistractors.length >= 2) {
          questions.push({
            id: `qz-root-${item.id}`,
            type: 'root',
            word: item.word,
            prompt: `مَا الجَذْرُ اللُّغَوِيُّ (أَصْلُ الكَلِمَةِ) فِي المُعْجَمِ لِكَلِمَةِ «${item.word}»؟`,
            options: shuffleArray([item.root, ...shuffledDistractors]),
            correctAnswer: item.root,
            explanation: `الجذر اللغوي الثلاثي لكلمة (${item.word}) هو [${item.root}].`
          });
        }
      }
    });

    const finalQuestions = shuffleArray(questions).slice(0, 6);
    setQuizQuestions(finalQuestions);
    setQuizCurrentIndex(0);
    setQuizSelectedOption(null);
    setQuizIsAnswered(false);
    setQuizScore(0);
    setQuizFinished(false);
  };

  // Generate quiz when opening quiz tab
  useEffect(() => {
    if (activeSubTab === 'quiz' && quizQuestions.length === 0) {
      generateQuiz();
    }
  }, [activeSubTab, vocabulary]);

  const handleSelectQuizOption = (opt: string) => {
    if (quizIsAnswered) return;
    setQuizSelectedOption(opt);
    setQuizIsAnswered(true);
    const curr = quizQuestions[quizCurrentIndex];
    if (opt === curr.correctAnswer) {
      setQuizScore(s => s + 1);
    }
  };

  const handleNextQuizQuestion = () => {
    if (quizCurrentIndex + 1 < quizQuestions.length) {
      setQuizCurrentIndex(i => i + 1);
      setQuizSelectedOption(null);
      setQuizIsAnswered(false);
    } else {
      setQuizFinished(true);
    }
  };

  const masteredCount = Object.values(masteredWords).filter(Boolean).length;
  const masteryPercentage = vocabulary.length > 0 ? Math.round((masteredCount / vocabulary.length) * 100) : 0;

  return (
    <div className="space-y-6" dir="rtl">
      {/* Top Main Navigation Bar for the Lexicon */}
      <div className="bg-white rounded-3xl border border-emerald-100 p-4 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-linear-to-br from-emerald-600 to-teal-700 flex items-center justify-center text-white shadow-md shadow-emerald-600/20 shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-slate-900 text-base sm:text-lg font-['Cairo',sans-serif]">
                  مُعْجَمُ اللُّغَوِيَّاتِ التَّفَاعُلِيّ
                </h3>
                <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100/90 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  سلاح التلميذ
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                معاني الكلمات، الأضداد، الجموع، الجذور اللغوية، وعائلة الكلمة
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
              إجمالي المفردات: <strong className="text-emerald-700 font-mono text-sm">{vocabulary.length}</strong>
            </span>
            {masteredCount > 0 && (
              <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 flex items-center gap-1">
                <BookmarkCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>أُتْقِنَتْ: {masteredCount}</span>
              </span>
            )}
          </div>
        </div>

        {/* Sub-Tabs Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-100 p-1.5 rounded-2xl">
          <button
            onClick={() => setActiveSubTab('table')}
            className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer ${
              activeSubTab === 'table'
                ? 'bg-white text-emerald-800 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BookOpen className="w-4 h-4 shrink-0" />
            <span>قَائِمَةُ المَفْرَدَاتِ</span>
          </button>

          <button
            onClick={() => setActiveSubTab('map')}
            className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer ${
              activeSubTab === 'map'
                ? 'bg-white text-emerald-800 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <TreePine className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>خَرِيطَةُ الكَلِمَةِ وَالجُذُورِ</span>
          </button>

          <button
            onClick={() => setActiveSubTab('flashcards')}
            className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer ${
              activeSubTab === 'flashcards'
                ? 'bg-white text-emerald-800 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-4 h-4 shrink-0 text-teal-600" />
            <span>بِطَاقَاتُ الحِفْظِ</span>
          </button>

          <button
            onClick={() => {
              setActiveSubTab('quiz');
              if (quizQuestions.length === 0) generateQuiz();
            }}
            className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer ${
              activeSubTab === 'quiz'
                ? 'bg-white text-emerald-800 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Award className="w-4 h-4 shrink-0 text-amber-500" />
            <span>تَحَدِّي اللُّغَوِيَّاتِ</span>
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* MODE 1: COMPREHENSIVE LEXICON TABLE                      */}
      {/* ======================================================== */}
      {activeSubTab === 'table' && (
        <div className="space-y-4">
          {/* Filter Chips & Search Bar */}
          <div className="bg-white rounded-2xl border border-slate-200 p-3.5 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
            {/* Quick Category Chips */}
            <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
              <button
                onClick={() => setCategoryFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  categoryFilter === 'all'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                الكل ({vocabulary.length})
              </button>

              <button
                onClick={() => setCategoryFilter('meanings')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  categoryFilter === 'meanings'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                المعاني ({vocabulary.filter(v => v.meaning).length})
              </button>

              <button
                onClick={() => setCategoryFilter('opposites')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  categoryFilter === 'opposites'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                الأضداد ({vocabulary.filter(v => v.opposite).length})
              </button>

              <button
                onClick={() => setCategoryFilter('plurals')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  categoryFilter === 'plurals'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                المفرد والجمع ({vocabulary.filter(v => v.plural || v.singular).length})
              </button>

              <button
                onClick={() => setCategoryFilter('roots')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  categoryFilter === 'roots'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                الجذور والمشتقات ({vocabulary.filter(v => v.root || (v.family && v.family.length > 0)).length})
              </button>
            </div>

            {/* Search Input */}
            <div className="relative w-full md:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="ابحث في الكلمة، المعنى، الجذر..."
                className="w-full pl-3 pr-9 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 focus:bg-white font-medium"
              />
            </div>
          </div>

          {/* Lexicon Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {filteredVocab.map((item) => (
              <div 
                key={item.id}
                className="bg-white rounded-2xl border border-slate-200/90 hover:border-emerald-300 p-4 shadow-2xs hover:shadow-md transition-all space-y-3"
              >
                {/* Word Header */}
                <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleSpeak(`${item.word}، معناها: ${item.meaning}`, item.word)}
                      className={`p-2 rounded-xl transition-all cursor-pointer ${
                        playingWord === item.word
                          ? 'bg-emerald-600 text-white shadow-xs scale-105'
                          : 'text-slate-500 hover:text-emerald-700 bg-slate-100 hover:bg-emerald-50'
                      }`}
                      title={`استمع لنطق: ${item.word}`}
                    >
                      <Volume2 className={`w-4 h-4 ${playingWord === item.word ? 'animate-bounce' : ''}`} />
                    </button>

                    <h4 className="text-xl sm:text-2xl font-black text-slate-900 font-['Amiri',serif]">
                      {item.word}
                    </h4>

                    {item.wordType && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-slate-100 text-slate-700 border border-slate-200">
                        {item.wordType}
                      </span>
                    )}
                  </div>

                  {item.root && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-black text-amber-800 bg-amber-50 px-2.5 py-1 rounded-xl border border-amber-200/80">
                      <span>جذر:</span>
                      <span className="font-mono font-black">[{item.root}]</span>
                    </span>
                  )}
                </div>

                {/* Meaning */}
                <div className="bg-emerald-50/70 border border-emerald-100 rounded-xl p-2.5">
                  <span className="text-[11px] font-black text-emerald-800 block mb-0.5">
                    المَعْنَى / المُرَاد:
                  </span>
                  <p className="text-sm font-bold text-slate-900 font-['Cairo',sans-serif]">
                    {item.meaning}
                  </p>
                </div>

                {/* Opposite & Plural Row */}
                {(item.opposite || item.plural || item.singular) && (
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {item.opposite ? (
                      <div className="bg-rose-50/70 border border-rose-100 rounded-xl p-2">
                        <span className="text-[10px] font-black text-rose-800 block mb-0.5">المُضَاد (العَكْس):</span>
                        <p className="font-bold text-slate-900 font-['Amiri',serif] text-sm">
                          {item.opposite}
                        </p>
                      </div>
                    ) : <div />}

                    {(item.plural || item.singular) ? (
                      <div className="bg-purple-50/70 border border-purple-100 rounded-xl p-2">
                        <span className="text-[10px] font-black text-purple-800 block mb-0.5">
                          {item.plural ? 'الجَمْع:' : 'المُفْرَد:'}
                        </span>
                        <p className="font-bold text-slate-900 font-['Amiri',serif] text-sm">
                          {item.plural || item.singular}
                        </p>
                      </div>
                    ) : <div />}
                  </div>
                )}

                {/* Context Sentence */}
                {item.contextSentence && (
                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-2 text-xs">
                    <span className="text-[10px] font-bold text-slate-500 block mb-0.5">مِثَالٌ سِيَاقِيٌّ:</span>
                    <p className="text-slate-800 italic font-medium font-['Amiri',serif] text-sm">
                      {item.contextSentence}
                    </p>
                  </div>
                )}

                {/* Word Family */}
                {item.family && item.family.length > 0 && (
                  <div className="pt-1 flex flex-wrap items-center gap-1.5">
                    <span className="text-[10px] font-black text-slate-400">عائلة الكلمة:</span>
                    {item.family.map((fam, fi) => (
                      <span 
                        key={fi}
                        className="px-2 py-0.5 rounded-lg text-[11px] font-bold bg-teal-50 text-teal-800 border border-teal-100"
                      >
                        {fam}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {filteredVocab.length === 0 && (
            <div className="text-center py-12 bg-white rounded-3xl border border-slate-200">
              <Search className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-700">لم يتم العثور على مفردات مطابقة للبحث</p>
              <button
                onClick={() => { setSearchTerm(''); setCategoryFilter('all'); }}
                className="mt-3 px-4 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-bold hover:bg-emerald-100"
              >
                إعادة ضبط البحث
              </button>
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* MODE 2: INTERACTIVE WORD MAP (خريطة الكلمة والجذور)     */}
      {/* ======================================================== */}
      {activeSubTab === 'map' && (
        <div className="space-y-6">
          {/* Horizontal Word Carousel Selector */}
          <div className="bg-white rounded-2xl border border-slate-200 p-3 shadow-2xs">
            <span className="text-xs font-bold text-slate-500 block mb-2 px-1">
              اختر كلمة لعرض خريطتها اللغوية ومشتقاتها:
            </span>
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
              {vocabulary.map((item, idx) => (
                <button
                  key={item.id}
                  onClick={() => setSelectedMapIndex(idx)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    activeMapWord.id === item.id
                      ? 'bg-emerald-600 text-white shadow-xs scale-105'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  <span className="font-['Amiri',serif] text-sm">{item.word}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Main Visual Word Map Card */}
          {activeMapWord && (
            <div className="bg-linear-to-b from-white via-emerald-50/20 to-teal-50/30 rounded-3xl border-2 border-emerald-200 p-6 sm:p-8 shadow-md relative overflow-hidden">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-emerald-100">
                <div className="flex items-center gap-2">
                  <TreePine className="w-5 h-5 text-emerald-600" />
                  <h4 className="font-extrabold text-slate-900 text-base">
                    خَرِيطَةُ الكَلِمَةِ الشَّامِلَةُ
                  </h4>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedMapIndex((prev) => (prev - 1 + vocabulary.length) % vocabulary.length)}
                    className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-emerald-50 text-xs font-bold cursor-pointer"
                    title="الكلمة السابقة"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <span className="text-xs font-mono font-bold text-slate-500">
                    {selectedMapIndex + 1} / {vocabulary.length}
                  </span>
                  <button
                    onClick={() => setSelectedMapIndex((prev) => (prev + 1) % vocabulary.length)}
                    className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-emerald-50 text-xs font-bold cursor-pointer"
                    title="الكلمة التالية"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Central Visual Node Layout */}
              <div className="max-w-2xl mx-auto space-y-6">
                {/* Center Word Circle */}
                <div className="flex flex-col items-center justify-center p-6 bg-linear-to-br from-emerald-600 via-teal-600 to-emerald-700 rounded-3xl text-white shadow-xl text-center relative">
                  {activeMapWord.wordType && (
                    <span className="px-3 py-1 rounded-full text-xs font-black bg-white/20 text-white border border-white/30 mb-2">
                      نوع الكلمة: {activeMapWord.wordType}
                    </span>
                  )}
                  <h2 className="text-4xl sm:text-5xl font-black font-['Amiri',serif] tracking-wide my-2 drop-shadow-sm">
                    {activeMapWord.word}
                  </h2>
                  <button
                    onClick={() => handleSpeak(`${activeMapWord.word}، معناها: ${activeMapWord.meaning}`, activeMapWord.word)}
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold bg-white text-emerald-900 hover:bg-emerald-50 transition-all cursor-pointer shadow-xs mt-2"
                  >
                    <Volume2 className={`w-3.5 h-3.5 ${playingWord === activeMapWord.word ? 'animate-bounce' : ''}`} />
                    <span>استمع للنطق</span>
                  </button>
                </div>

                {/* Branches Grid: Meaning / Opposite / Plural / Root */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Meaning Node */}
                  <div className="bg-white rounded-2xl border-2 border-emerald-300/80 p-4 shadow-xs space-y-1">
                    <span className="text-xs font-black text-emerald-700 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>المَعْنَى / المُرَاد فِي النَّصِّ:</span>
                    </span>
                    <p className="text-base font-bold text-slate-900 font-['Cairo',sans-serif]">
                      {activeMapWord.meaning}
                    </p>
                  </div>

                  {/* Opposite Node */}
                  <div className="bg-white rounded-2xl border-2 border-rose-300/80 p-4 shadow-xs space-y-1">
                    <span className="text-xs font-black text-rose-700 flex items-center gap-1">
                      <span>المُضَاد (العَكْس):</span>
                    </span>
                    <p className="text-base font-bold text-slate-900 font-['Amiri',serif]">
                      {activeMapWord.opposite || 'لا يوجد مضاد مباشر'}
                    </p>
                  </div>

                  {/* Plural / Singular Node */}
                  <div className="bg-white rounded-2xl border-2 border-purple-300/80 p-4 shadow-xs space-y-1">
                    <span className="text-xs font-black text-purple-700 flex items-center gap-1">
                      <span>{activeMapWord.plural ? 'الجَمْع:' : 'المُفْرَد:'}</span>
                    </span>
                    <p className="text-base font-bold text-slate-900 font-['Amiri',serif]">
                      {activeMapWord.plural || activeMapWord.singular || '—'}
                    </p>
                  </div>

                  {/* Root Node */}
                  <div className="bg-white rounded-2xl border-2 border-amber-300/80 p-4 shadow-xs space-y-1">
                    <span className="text-xs font-black text-amber-700 flex items-center gap-1">
                      <span>الجَذْرُ اللُّغَوِيُّ فِي المُعْجَمِ:</span>
                    </span>
                    <p className="text-base font-mono font-black text-slate-900">
                      {activeMapWord.root ? `[ ${activeMapWord.root} ]` : '—'}
                    </p>
                  </div>
                </div>

                {/* Word Family Card */}
                {activeMapWord.family && activeMapWord.family.length > 0 && (
                  <div className="bg-white rounded-2xl border border-teal-200 p-4 shadow-xs space-y-2">
                    <span className="text-xs font-black text-teal-800 flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-teal-600" />
                      <span>عَائِلَةُ الكَلِمَةِ (المُشْتَقَّاتُ اللُّغَوِيَّةُ):</span>
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {activeMapWord.family.map((f, i) => (
                        <span
                          key={i}
                          className="px-3 py-1.5 rounded-xl bg-teal-50 text-teal-900 border border-teal-200 font-black text-sm font-['Amiri',serif]"
                        >
                          {f}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Illustrative Context Sentence Banner */}
                {activeMapWord.contextSentence && (
                  <div className="bg-emerald-100/60 border border-emerald-300/70 rounded-2xl p-4 text-center space-y-1">
                    <span className="text-xs font-black text-emerald-800 block">
                      مِثَالٌ سِيَاقِيٌّ مُفِيدٌ:
                    </span>
                    <p className="text-base text-slate-900 font-['Amiri',serif] font-bold">
                      {activeMapWord.contextSentence}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* MODE 3: 3D FLASHCARDS WITH MASTERY TRACKER               */}
      {/* ======================================================== */}
      {activeSubTab === 'flashcards' && activeCard && (
        <div className="max-w-xl mx-auto space-y-4">
          {/* Header Stats & Mastery Progress */}
          <div className="bg-white rounded-2xl border border-slate-200 p-3.5 shadow-2xs space-y-2.5">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="flex items-center gap-1.5 text-emerald-800">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span>بطاقة {flashcardIndex + 1} من {flashcardList.length}</span>
              </span>
              <span className="text-slate-500">
                نسبة الإتقان: <strong className="text-emerald-700 font-mono">{masteryPercentage}%</strong>
              </span>
            </div>

            {/* Progress bar */}
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-linear-to-r from-emerald-500 to-teal-600 transition-all duration-500"
                style={{ width: `${masteryPercentage}%` }}
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <button
                onClick={() => setShowOnlyUnmastered(!showOnlyUnmastered)}
                className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border transition-colors cursor-pointer ${
                  showOnlyUnmastered 
                    ? 'bg-amber-100 text-amber-900 border-amber-300' 
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {showOnlyUnmastered ? 'عرض جميع البطاقات' : 'عرض الكلمات غير المتقنة فقط'}
              </button>

              <span className="text-[11px] text-slate-400 hidden sm:inline">
                الأسهم ◄ ► للتنقل ومسطحة المسافة للقلب
              </span>
            </div>
          </div>

          {/* 3D Flip Card */}
          <div className="perspective-1000 w-full">
            <div
              key={flashcardIndex}
              className={`w-full ${slideDirection === 'next' ? 'animate-card-next' : slideDirection === 'prev' ? 'animate-card-prev' : ''}`}
            >
              <div
                onClick={() => setIsFlipped((prev) => !prev)}
                role="button"
                tabIndex={0}
                aria-label="اقلب البطاقة"
                className={`flip-card-inner relative w-full min-h-[320px] sm:min-h-[340px] cursor-pointer select-none transition-transform duration-500 transform-style-3d ${
                  isFlipped ? 'is-flipped' : ''
                }`}
                style={{
                  transformStyle: 'preserve-3d',
                  WebkitTransformStyle: 'preserve-3d',
                  transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                }}
              >
                {/* Front Face */}
                <div
                  className="flip-card-front absolute inset-0 rounded-3xl p-6 sm:p-7 bg-linear-to-br from-white via-emerald-50/30 to-teal-50/40 border-2 border-emerald-300/90 shadow-md hover:shadow-xl hover:border-emerald-400 flex flex-col justify-between transition-shadow"
                  style={{
                    backfaceVisibility: 'hidden',
                    WebkitBackfaceVisibility: 'hidden',
                    transform: 'rotateY(0deg)',
                    zIndex: isFlipped ? 0 : 2,
                    pointerEvents: isFlipped ? 'none' : 'auto',
                  }}
                >
                  <div className="flex items-center justify-between w-full pb-3 border-b border-emerald-100/80 shrink-0">
                    <span className="inline-flex items-center gap-1.5 text-xs font-black text-emerald-800 bg-emerald-100/90 px-3 py-1 rounded-full border border-emerald-200">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                      <span>الكَلِمَةُ (مَا مَعْنَاهَا؟)</span>
                    </span>
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-500 bg-white/90 px-2.5 py-1 rounded-full border border-slate-200 shadow-2xs">
                      <RotateCw className="w-3 h-3 text-emerald-600" />
                      <span>انقر للقلب</span>
                    </span>
                  </div>

                  <div className="flex-1 flex flex-col items-center justify-center py-6 px-2 text-center">
                    {activeCard.wordType && (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-200 mb-2">
                        {activeCard.wordType}
                      </span>
                    )}

                    <h3 className="text-3xl sm:text-5xl font-black text-slate-900 font-['Amiri',serif] leading-loose text-center drop-shadow-xs my-auto">
                      {activeCard.word}
                    </h3>

                    {activeCard.root && (
                      <span className="text-xs font-mono font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200 mt-2">
                        الجذر: [{activeCard.root}]
                      </span>
                    )}

                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSpeak(activeCard.word, activeCard.word);
                      }}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold text-emerald-700 bg-emerald-100/80 hover:bg-emerald-200 transition-colors cursor-pointer mt-3"
                    >
                      <Volume2 className={`w-3.5 h-3.5 ${playingWord === activeCard.word ? 'animate-bounce text-emerald-800' : ''}`} />
                      <span>استمع لنطق الكلمة</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between w-full pt-3 border-t border-emerald-100/60 text-[11px] text-slate-400 font-semibold shrink-0">
                    <span>سلاح التلميذ • بطاقات المفردات</span>
                    <span className="font-mono">{flashcardIndex + 1} / {flashcardList.length}</span>
                  </div>
                </div>

                {/* Back Face */}
                <div
                  className="flip-card-back absolute inset-0 rounded-3xl p-6 sm:p-7 bg-linear-to-br from-white via-teal-50/40 to-emerald-50/30 border-2 border-teal-300 shadow-md hover:shadow-xl hover:border-teal-400 flex flex-col justify-between transition-shadow"
                  style={{
                    backfaceVisibility: 'hidden',
                    WebkitBackfaceVisibility: 'hidden',
                    transform: 'rotateY(180deg)',
                    zIndex: isFlipped ? 2 : 0,
                    pointerEvents: isFlipped ? 'auto' : 'none',
                  }}
                >
                  <div className="flex items-center justify-between w-full pb-3 border-b border-teal-100/80 shrink-0">
                    <span className="inline-flex items-center gap-1.5 text-xs font-black text-teal-800 bg-teal-100/90 px-3 py-1 rounded-full border border-teal-200">
                      <BookOpen className="w-3.5 h-3.5 text-teal-600" />
                      <span>المَعْنَى وَالشَّرْحُ</span>
                    </span>
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-500 bg-white/90 px-2.5 py-1 rounded-full border border-slate-200 shadow-2xs">
                      <RotateCw className="w-3 h-3 text-teal-600" />
                      <span>العودة للكلمة</span>
                    </span>
                  </div>

                  <div className="flex-1 flex flex-col items-center justify-center py-4 px-2 space-y-3 text-center my-auto">
                    <span className="text-xs text-slate-500 font-bold bg-slate-100 px-3 py-0.5 rounded-md">
                      الكلمة: <strong className="text-slate-900 font-['Amiri',serif] text-base">{activeCard.word}</strong>
                    </span>
                    
                    <p className="text-2xl sm:text-3xl font-extrabold text-emerald-900 font-['Cairo',sans-serif] leading-snug">
                      {activeCard.meaning}
                    </p>

                    <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                      {activeCard.opposite && (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-800 bg-rose-50 border border-rose-200 px-3 py-1 rounded-xl">
                          <span>المضاد:</span>
                          <strong>{activeCard.opposite}</strong>
                        </span>
                      )}
                      {activeCard.plural && (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-purple-800 bg-purple-50 border border-purple-200 px-3 py-1 rounded-xl">
                          <span>الجمع:</span>
                          <strong>{activeCard.plural}</strong>
                        </span>
                      )}
                    </div>

                    {activeCard.contextSentence && (
                      <p className="text-xs text-slate-600 font-['Amiri',serif] italic bg-white/80 border border-slate-200 px-3 py-1.5 rounded-xl max-w-sm">
                        «{activeCard.contextSentence}»
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between w-full pt-3 border-t border-teal-100/60 text-[11px] text-slate-400 font-semibold shrink-0">
                    <span>سلاح التلميذ • بطاقات المفردات</span>
                    <span className="font-mono">{flashcardIndex + 1} / {flashcardList.length}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Controls Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 w-full">
            <button
              type="button"
              onClick={prevFlashcard}
              className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-emerald-700 transition-all cursor-pointer shadow-2xs active:scale-95 flex items-center justify-center gap-1.5"
            >
              <span>◄</span>
              <span>السابق</span>
            </button>

            {/* Dedicated Flip Card Button */}
            <button
              type="button"
              onClick={() => setIsFlipped((prev) => !prev)}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-95 bg-teal-600 hover:bg-teal-700 text-white"
            >
              <RotateCw className={`w-4 h-4 transition-transform duration-500 ${isFlipped ? 'rotate-180' : ''}`} />
              <span>{isFlipped ? 'عرض الكلمة' : 'اقلب البطاقة'}</span>
            </button>

            {/* Mark as Mastered button */}
            <button
              type="button"
              onClick={() => toggleMastered(activeCard.id)}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-95 ${
                masteredWords[activeCard.id]
                  ? 'bg-emerald-700 text-white'
                  : 'bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100'
              }`}
            >
              <Check className="w-4 h-4" />
              <span>{masteredWords[activeCard.id] ? 'تم الحفظ بنجاح' : 'أتقنت هذه الكلمة'}</span>
            </button>

            <button
              type="button"
              onClick={nextFlashcard}
              className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 shadow-xs transition-all cursor-pointer shadow-2xs active:scale-95 flex items-center justify-center gap-1.5"
            >
              <span>التالي</span>
              <span>►</span>
            </button>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODE 4: QUICK VOCABULARY CHALLENGE (تحدي اللغويات السريع)  */}
      {/* ======================================================== */}
      {activeSubTab === 'quiz' && (
        <div className="max-w-xl mx-auto space-y-4">
          {!quizFinished && quizQuestions.length > 0 && (
            <div className="bg-white rounded-3xl border border-emerald-100 p-6 shadow-md space-y-6">
              {/* Quiz Header & Progress */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 text-xs font-bold text-slate-500">
                <span className="flex items-center gap-1 text-emerald-800 bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-200">
                  <Award className="w-3.5 h-3.5 text-emerald-600" />
                  <span>السؤال {quizCurrentIndex + 1} من {quizQuestions.length}</span>
                </span>
                <span>النقاط: <strong className="text-emerald-700 font-mono text-sm">{quizScore}</strong></span>
              </div>

              {/* Question Prompt */}
              <div className="text-center py-2 space-y-2">
                <h3 className="text-lg sm:text-xl font-black text-slate-900 font-['Cairo',sans-serif] leading-relaxed">
                  {quizQuestions[quizCurrentIndex].prompt}
                </h3>
              </div>

              {/* Options */}
              <div className="space-y-2.5">
                {quizQuestions[quizCurrentIndex].options.map((opt, oi) => {
                  const isSelected = quizSelectedOption === opt;
                  const isCorrect = opt === quizQuestions[quizCurrentIndex].correctAnswer;
                  
                  let btnStyle = 'bg-slate-50 hover:bg-emerald-50/70 border-slate-200 text-slate-800';
                  if (quizIsAnswered) {
                    if (isCorrect) {
                      btnStyle = 'bg-emerald-100 border-emerald-500 text-emerald-950 font-black shadow-xs';
                    } else if (isSelected) {
                      btnStyle = 'bg-rose-100 border-rose-500 text-rose-950 font-black';
                    } else {
                      btnStyle = 'opacity-50 bg-slate-50 border-slate-200 text-slate-500';
                    }
                  }

                  return (
                    <button
                      key={oi}
                      disabled={quizIsAnswered}
                      onClick={() => handleSelectQuizOption(opt)}
                      className={`w-full text-right p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between gap-3 text-sm font-bold ${btnStyle}`}
                    >
                      <span className="font-['Amiri',serif] text-base">{opt}</span>
                      {quizIsAnswered && isCorrect && (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                      )}
                      {quizIsAnswered && isSelected && !isCorrect && (
                        <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Explanation & Next Button */}
              {quizIsAnswered && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-3 animate-fade-in">
                  <p className="text-xs sm:text-sm font-bold text-slate-800 font-['Cairo',sans-serif]">
                    💡 {quizQuestions[quizCurrentIndex].explanation}
                  </p>
                  <button
                    onClick={handleNextQuizQuestion}
                    className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm transition-all shadow-sm cursor-pointer flex items-center justify-center gap-2"
                  >
                    <span>{quizCurrentIndex + 1 < quizQuestions.length ? 'السؤال التالي' : 'عرض النتيجة النهائية'}</span>
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Quiz Completion Card */}
          {quizFinished && (
            <div className="bg-white rounded-3xl border-2 border-emerald-200 p-8 shadow-xl text-center space-y-5 animate-scale-up">
              <div className="w-16 h-16 rounded-3xl bg-linear-to-br from-amber-400 to-amber-500 text-white flex items-center justify-center mx-auto shadow-lg shadow-amber-400/30">
                <Award className="w-9 h-9" />
              </div>

              <div className="space-y-1">
                <h3 className="text-2xl font-black text-slate-900 font-['Cairo',sans-serif]">
                  أحسنت! أتممت تحدي اللغويات
                </h3>
                <p className="text-sm text-slate-500 font-medium">
                  نتيجتك في اختبار المفردات والمعاني لهذا الدرس
                </p>
              </div>

              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 max-w-xs mx-auto">
                <span className="text-xs text-emerald-800 font-bold block mb-1">الدرجة المحققة:</span>
                <div className="text-4xl font-black text-emerald-900 font-mono">
                  {quizScore} / {quizQuestions.length}
                </div>
                <span className="text-xs text-emerald-700 font-bold mt-1 block">
                  {quizScore === quizQuestions.length ? 'ممتاز! حصيلتك اللغوية كاملة 🌟' : 'رائع! واصل تدريبك لتصل للعلامة الكاملة 💪'}
                </span>
              </div>

              <button
                onClick={generateQuiz}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm transition-all shadow-md cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>إعادة التحدي بأسئلة جديدة</span>
              </button>
            </div>
          )}

          {quizQuestions.length === 0 && !quizFinished && (
            <div className="text-center py-12 bg-white rounded-3xl border border-slate-200">
              <Award className="w-10 h-10 text-amber-400 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-700">جاري إعداد أسئلة التحدي اللغوي...</p>
              <button
                onClick={generateQuiz}
                className="mt-3 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold"
              >
                توليد التحدي الآن
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

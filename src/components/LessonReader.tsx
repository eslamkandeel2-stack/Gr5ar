import React, { useState, useEffect } from 'react';
import { Lesson, VocabItem } from '../types.ts';
import { 
  Volume2, 
  HelpCircle, 
  Lightbulb, 
  Sparkles, 
  User, 
  BookMarked,
  Info,
  Eye,
  EyeOff,
  CheckCircle2,
  BookOpen,
  GraduationCap,
  PenTool,
  ArrowLeft,
  ChevronLeft
} from 'lucide-react';
import { AudioControlBar } from './AudioControlBar.tsx';
import { audioService } from '../utils/audioPlayer.ts';
import { InteractiveTextReader } from './InteractiveTextReader.tsx';
import { InteractiveWordModal } from './InteractiveWordModal.tsx';

interface LessonReaderProps {
  lesson: Lesson;
  voice: string;
  onGoToVocabTab?: (word: string) => void;
  onAskAiTutor?: (question: string) => void;
  onGoToSubTab?: (tab: 'grammar' | 'spelling' | 'writing' | 'exercises') => void;
}

export const LessonReader: React.FC<LessonReaderProps> = ({ 
  lesson, 
  voice,
  onGoToVocabTab,
  onAskAiTutor,
  onGoToSubTab
}) => {
  const [playingVerse, setPlayingVerse] = useState<number | null>(null);
  const [fontSize, setFontSize] = useState<'normal' | 'large' | 'xlarge'>(() => {
    const saved = localStorage.getItem('selah_reader_font_size');
    if (saved === 'normal' || saved === 'large' || saved === 'xlarge') return saved;
    return 'large';
  });
  const [selectedVocabModal, setSelectedVocabModal] = useState<VocabItem | null>(null);
  const [selfTestMode, setSelfTestMode] = useState<boolean>(false);
  const [revealedQuestions, setRevealedQuestions] = useState<Record<number, boolean>>({});

  useEffect(() => {
    localStorage.setItem('selah_reader_font_size', fontSize);
  }, [fontSize]);

  const playingVerseRef = React.useRef(playingVerse);
  playingVerseRef.current = playingVerse;

  // Synchronize playingVerse with global audio service so another audio replaces it cleanly
  useEffect(() => {
    const unsubscribe = audioService.subscribe((state) => {
      if (!state.isPlaying && !state.isLoading) {
        setPlayingVerse(prev => (prev === null ? null : null));
      } else if (playingVerseRef.current !== null && state.lessonTitle && !state.lessonTitle.startsWith(`البيت ${playingVerseRef.current}`)) {
        setPlayingVerse(null);
      }
    });
    return () => unsubscribe();
  }, []);

  const toggleQuestionReveal = (index: number) => {
    setRevealedQuestions(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const getFontSizeClass = () => {
    switch (fontSize) {
      case 'normal':
        return 'text-base leading-relaxed';
      case 'xlarge':
        return 'text-2xl leading-loose font-medium';
      case 'large':
      default:
        return 'text-lg sm:text-xl leading-loose font-medium';
    }
  };

  const handlePlaySingleVerse = async (verse: { part1: string; part2: string; number: number }) => {
    if (playingVerse === verse.number) {
      audioService.stop();
      setPlayingVerse(null);
      return;
    }

    setPlayingVerse(verse.number);
    const verseText = `${verse.part1} .. ${verse.part2}`;
    await audioService.speakText(verseText, {
      voice,
      lessonTitle: `البيت ${verse.number}: ${verse.part1.slice(0, 30)}...`,
      lessonId: lesson.id,
      onEnd: () => setPlayingVerse(null),
      onError: () => setPlayingVerse(null)
    });
  };

  return (
    <div className="space-y-6">
      {/* Audio Bar for Full Lesson */}
      <AudioControlBar
        textToRead={lesson.readingText}
        lessonTitle={lesson.title}
        lessonId={lesson.id}
        voice={voice}
        label={
          lesson.type === 'listening'
            ? 'نص الاستماع: استمع بعناية وركز في الفكرة الرئيسة'
            : lesson.type === 'poetry'
            ? 'إنشاد القصيدة الشعرية باللغة العربية الفصحى'
            : 'قراءة الدرس التعليمي المشكول بدقة'
        }
      />

      {/* Interactive In-Text Dictionary Notice Banner */}
      <div className="bg-linear-to-r from-emerald-50 via-teal-50 to-emerald-50 border border-emerald-200/90 rounded-2xl p-3.5 sm:px-4 flex flex-wrap items-center justify-between gap-2.5 text-xs text-emerald-900 shadow-2xs">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
            <BookOpen className="w-4 h-4" />
          </div>
          <div>
            <span className="font-extrabold text-emerald-950 block sm:inline">
              المعجم التفاعلي مربوط بالنص:
            </span>{' '}
            <span className="text-slate-600 font-medium">
              اضغط على أي كلمة مميزة بـ (<span className="text-emerald-700 font-bold">📖</span>) لإظهار معناها ومضادها وجذرها ونطقها فوراً.
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="bg-emerald-100 text-emerald-800 font-extrabold px-2.5 py-1 rounded-full border border-emerald-300 text-[11px] shrink-0">
            {lesson.vocabulary.length} مفردة مشروحة
          </span>
        </div>
      </div>

      {/* Font Size Selector and Mode Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 bg-white px-3 sm:px-4 py-2.5 rounded-xl border border-slate-200/80 text-xs text-slate-600 shadow-2xs">
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
          <BookMarked className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-bold text-slate-700 truncate">مرجع صفحات الكتاب:</span>
          <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono font-bold shrink-0">
            {lesson.pagesRef || 'سلاح التلميذ'}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="font-medium text-slate-500">حجم الخط:</span>
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg">
            <button
              onClick={() => setFontSize('normal')}
              className={`px-2.5 py-1 rounded text-xs font-bold transition-colors cursor-pointer ${
                fontSize === 'normal' ? 'bg-white text-emerald-700 shadow-2xs' : 'text-slate-600'
              }`}
            >
              عادي
            </button>
            <button
              onClick={() => setFontSize('large')}
              className={`px-2.5 py-1 rounded text-xs font-bold transition-colors cursor-pointer ${
                fontSize === 'large' ? 'bg-white text-emerald-700 shadow-2xs' : 'text-slate-600'
              }`}
            >
              كبير
            </button>
            <button
              onClick={() => setFontSize('xlarge')}
              className={`px-2.5 py-1 rounded text-xs font-bold transition-colors cursor-pointer ${
                fontSize === 'xlarge' ? 'bg-white text-emerald-700 shadow-2xs' : 'text-slate-600'
              }`}
            >
              أكبر
            </button>
          </div>
        </div>
      </div>

      {/* Author Bio Card if Poetry */}
      {lesson.author && (
        <div className="bg-linear-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-2xl p-4 sm:p-5 flex items-start gap-4 shadow-xs">
          <div className="w-12 h-12 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <User className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h4 className="font-black text-purple-950 text-base">التعريف بالشاعر: {lesson.author.name}</h4>
              {lesson.author.birthDeath && (
                <span className="bg-purple-200/80 text-purple-900 text-xs px-2.5 py-0.5 rounded-full font-bold">
                  {lesson.author.birthDeath}
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-purple-900/80 mt-1 leading-relaxed">
              {lesson.author.bio}
            </p>
          </div>
        </div>
      )}

      {/* Main Text Content */}
      {lesson.type === 'poetry' && lesson.poemVerses ? (
        /* Poetry Verses View */
        <div className="space-y-4">
          <div className="text-center py-2">
            <h3 className="text-2xl font-black text-slate-900 font-['Amiri',serif]">
              {lesson.title}
            </h3>
            <p className="text-xs text-slate-500 mt-1">اضغط على أيقونة الصوت لسماع البيت بمفرده، أو اضغط على أي كلمة ملونة لعرض معجمها</p>
          </div>

          <div className="space-y-3.5">
            {lesson.poemVerses.map((verse) => {
              const isCurrentPlaying = playingVerse === verse.number;
              return (
                <div
                  key={verse.number}
                  className={`bg-white rounded-2xl p-4 sm:p-5 border transition-all duration-200 shadow-xs ${
                    isCurrentPlaying
                      ? 'border-purple-400 ring-2 ring-purple-100 bg-purple-50/30'
                      : 'border-slate-200/90 hover:border-purple-200'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 text-xs font-black flex items-center justify-center">
                      {verse.number}
                    </span>
                    <button
                      onClick={() => handlePlaySingleVerse(verse)}
                      className={`flex items-center gap-1 text-xs font-bold px-3 py-1 rounded-full transition-colors ${
                        isCurrentPlaying
                          ? 'bg-purple-600 text-white'
                          : 'bg-purple-50 text-purple-700 hover:bg-purple-100'
                      }`}
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>{isCurrentPlaying ? 'إيقاف' : 'استمع للبيت'}</span>
                    </button>
                  </div>

                  {/* Poem Couplets (صدر وعجز) with interactive vocabulary clicking */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-2 border-y border-slate-100 text-center font-['Amiri',serif] font-bold text-slate-900 text-lg sm:text-xl">
                    <div className="p-2.5 bg-slate-50/70 rounded-xl text-emerald-950">
                      <InteractiveTextReader
                        text={verse.part1}
                        vocabulary={lesson.vocabulary}
                        onWordClick={(v) => setSelectedVocabModal(v)}
                      />
                    </div>
                    <div className="p-2.5 bg-slate-50/70 rounded-xl text-emerald-950">
                      <InteractiveTextReader
                        text={verse.part2}
                        vocabulary={lesson.vocabulary}
                        onWordClick={(v) => setSelectedVocabModal(v)}
                      />
                    </div>
                  </div>

                  {/* Verse Explanation & Aesthetics */}
                  <div className="mt-3.5 pt-2 space-y-2 text-xs sm:text-sm">
                    <div className="flex items-start gap-2 text-slate-700">
                      <HelpCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <p><span className="font-bold text-emerald-800">شرح البيت:</span> {verse.explanation}</p>
                    </div>

                    {verse.aestheticNote && (
                      <div className="flex items-start gap-2 text-purple-900 bg-purple-50/60 p-2.5 rounded-xl border border-purple-100">
                        <Sparkles className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                        <p><span className="font-bold text-purple-950">جماليات التعبير:</span> {verse.aestheticNote}</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Reading / Listening Text View */
        <article className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/90 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 font-['Cairo',sans-serif] tracking-tight">
              {lesson.title}
            </h3>
            {lesson.subTitle && (
              <p className="text-sm font-semibold text-emerald-700 mt-1">
                {lesson.subTitle}
              </p>
            )}
          </div>

          {/* Paragraphs with Interactive In-Text Vocabulary */}
          <div className={`text-slate-800 font-['Amiri',serif] ${getFontSizeClass()} space-y-5 text-justify`}>
            {lesson.readingText.split('\n\n').map((paragraph, idx) => (
              <p
                key={idx}
                className="p-3.5 sm:p-4 rounded-2xl hover:bg-slate-50/80 transition-colors border-r-4 border-emerald-400 pr-4 leading-loose"
              >
                <InteractiveTextReader
                  text={paragraph}
                  vocabulary={lesson.vocabulary}
                  onWordClick={(v) => setSelectedVocabModal(v)}
                />
              </p>
            ))}
          </div>
        </article>
      )}

      {/* Discussion Keys (هيا نناقش النص / مفاتيح النص الموسعة) */}
      {lesson.discussionPoints && lesson.discussionPoints.length > 0 && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-2xs shrink-0">
                <Lightbulb className="w-4 h-4 fill-current" />
              </div>
              <div>
                <h4 className="font-black text-slate-900 text-base">
                  هَيَّا نُنَاقِشِ النَّصَّ (أَسْئِلَةُ الفَهْمِ وَالتَّذَوُّقِ المَوْسُوعِيَّةِ)
                </h4>
                <p className="text-xs text-slate-500">
                  {lesson.discussionPoints.length} أسئلة شاملة ومناقشة تفاعلية لتعميق الفهم
                </p>
              </div>
            </div>

            {/* Self-Test Toggle Mode */}
            <button
              onClick={() => {
                setSelfTestMode(!selfTestMode);
                setRevealedQuestions({});
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                selfTestMode
                  ? 'bg-amber-100 text-amber-900 border-amber-300 shadow-2xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
              }`}
            >
              {selfTestMode ? (
                <>
                  <EyeOff className="w-3.5 h-3.5 text-amber-700" />
                  <span>وضع الاختبار الذاتي (الإجابات مخفية)</span>
                </>
              ) : (
                <>
                  <Eye className="w-3.5 h-3.5 text-slate-600" />
                  <span>تفعيل وضع الاختبار الذاتي</span>
                </>
              )}
            </button>
          </div>

          <div className="grid gap-3.5 sm:grid-cols-1">
            {lesson.discussionPoints.map((dp, i) => {
              const isRevealed = !selfTestMode || revealedQuestions[i];

              return (
                <div 
                  key={i} 
                  className="bg-slate-50/90 hover:bg-slate-50 rounded-2xl p-4 sm:p-5 border border-slate-200/70 space-y-2.5 transition-all"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5">
                      <span className="w-6 h-6 rounded-full bg-emerald-600 text-white text-xs font-black flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                        {i + 1}
                      </span>
                      <h5 className="font-extrabold text-slate-900 text-sm sm:text-base leading-snug">
                        {dp.question}
                      </h5>
                    </div>

                    {selfTestMode && (
                      <button
                        onClick={() => toggleQuestionReveal(i)}
                        className={`text-xs px-2.5 py-1 rounded-lg font-bold transition-colors shrink-0 cursor-pointer ${
                          isRevealed
                            ? 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                            : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs'
                        }`}
                      >
                        {isRevealed ? 'إخفاء الإجابة' : 'كشف الإجابة'}
                      </button>
                    )}
                  </div>

                  {/* Answer section */}
                  {isRevealed ? (
                    <div className="pr-8 text-xs sm:text-sm text-slate-700 leading-relaxed font-medium bg-emerald-50/50 p-3 rounded-xl border border-emerald-100/80 animate-fade-in">
                      <div className="flex items-center gap-1.5 text-emerald-800 font-bold mb-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>الإِجَابَةُ النَّمُوذَجِيَّةُ:</span>
                      </div>
                      <p>{dp.answer}</p>
                    </div>
                  ) : (
                    <div className="pr-8 text-xs text-slate-400 italic">
                      انقر على «كشف الإجابة» بعد أن تحاول الإجابة بنفسك.
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Streamlined Next Step Transition Card */}
      {onGoToSubTab && (
        <div className="bg-linear-to-r from-emerald-900 via-teal-900 to-slate-900 rounded-3xl p-5 sm:p-6 text-white shadow-md border border-emerald-700/50 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 text-right w-full sm:w-auto">
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300 shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-300 bg-amber-400/20 px-2 py-0.5 rounded-full border border-amber-400/30">
                  اكتملت قراءة وفهم النص
                </span>
              </div>
              <h4 className="text-base sm:text-lg font-black text-white mt-1">
                جاهز للمحطة التالية في هذا الدرس؟
              </h4>
              <p className="text-xs text-slate-300">
                يمكنك الآن الانتقال إلى شرح القواعد النحوية أو حل تدريبات الدرس التقييمية
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto justify-end shrink-0">
            {lesson.grammarLessons?.find(g => g.category === 'نحو') ? (
              <button
                onClick={() => onGoToSubTab('grammar')}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl text-xs sm:text-sm transition-all shadow-sm active:scale-95 cursor-pointer"
              >
                <GraduationCap className="w-4 h-4" />
                <span>درس القواعد النحوية</span>
                <ChevronLeft className="w-4 h-4" />
              </button>
            ) : lesson.grammarLessons?.find(g => g.category === 'إملاء') ? (
              <button
                onClick={() => onGoToSubTab('spelling')}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl text-xs sm:text-sm transition-all shadow-sm active:scale-95 cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>درس القواعد الإملائية</span>
                <ChevronLeft className="w-4 h-4" />
              </button>
            ) : null}

            {onGoToSubTab && (
              <button
                onClick={() => onGoToSubTab('exercises')}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl text-xs sm:text-sm border border-white/20 transition-all cursor-pointer"
              >
                <HelpCircle className="w-4 h-4 text-emerald-300" />
                <span>تدريبات واختبار الدرس</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Interactive Word Modal Popup */}
      <InteractiveWordModal
        vocabItem={selectedVocabModal}
        onClose={() => setSelectedVocabModal(null)}
        voice={voice}
        onGoToVocabTab={onGoToVocabTab}
        onAskAiTutor={onAskAiTutor}
      />
    </div>
  );
};

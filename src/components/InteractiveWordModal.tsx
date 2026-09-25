import React, { useState } from 'react';
import { VocabItem } from '../types.ts';
import { 
  Volume2, 
  X, 
  BookOpen, 
  Sparkles, 
  ArrowLeft, 
  Check, 
  Layers, 
  HelpCircle,
  ExternalLink,
  MessageCircleQuestion
} from 'lucide-react';
import { audioService } from '../utils/audioPlayer.ts';

interface InteractiveWordModalProps {
  vocabItem: VocabItem | null;
  onClose: () => void;
  voice: string;
  onGoToVocabTab?: (word: string) => void;
  onAskAiTutor?: (word: string) => void;
}

export const InteractiveWordModal: React.FC<InteractiveWordModalProps> = ({
  vocabItem,
  onClose,
  voice,
  onGoToVocabTab,
  onAskAiTutor,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);

  React.useEffect(() => {
    const unsubscribe = audioService.subscribeVocab((activeWord, isVocabPlaying) => {
      if (vocabItem && activeWord === vocabItem.word && isVocabPlaying) {
        setIsPlaying(true);
      } else {
        setIsPlaying(false);
      }
    });
    return () => unsubscribe();
  }, [vocabItem]);

  if (!vocabItem) return null;

  const handleSpeak = async () => {
    if (isPlaying) {
      audioService.stopWord();
      setIsPlaying(false);
      return;
    }
    setIsPlaying(true);
    const speechText = `${vocabItem.word}، ومعناها في النص: ${vocabItem.meaning}${
      vocabItem.opposite ? `، ومضادها: ${vocabItem.opposite}` : ''
    }${vocabItem.plural ? `، وجمعها: ${vocabItem.plural}` : ''}${
      vocabItem.singular ? `، ومفردها: ${vocabItem.singular}` : ''
    }`;

    try {
      await audioService.speakWord(speechText, {
        voice,
        word: vocabItem.word,
        onEnd: () => setIsPlaying(false),
        onError: () => setIsPlaying(false),
      });
    } catch {
      setIsPlaying(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in"
      onClick={onClose}
      dir="rtl"
    >
      <div 
        className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-emerald-100 overflow-hidden relative animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header with Badge and Close */}
        <div className="bg-linear-to-r from-emerald-600 via-teal-600 to-emerald-700 p-5 text-white relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-white/20 text-white backdrop-blur-xs border border-white/20">
                <BookOpen className="w-3.5 h-3.5" />
                معجم سلاح التلميذ التفاعلي
              </span>
              <span className="text-[11px] text-emerald-100 font-medium hidden sm:inline">
                (شرح فوري من داخل النص)
              </span>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-colors cursor-pointer"
              title="إغلاق"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Word display & Audio button */}
          <div className="mt-4 flex items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs text-emerald-100 font-bold block">الكَلِمَةُ فِي النَّصِّ:</span>
                {vocabItem.wordType && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-white/20 text-white border border-white/30">
                    {vocabItem.wordType}
                  </span>
                )}
              </div>
              <h2 className="text-3xl sm:text-4xl font-black font-['Amiri',serif] tracking-wide text-white drop-shadow-xs">
                {vocabItem.word}
              </h2>
            </div>

            <button
              onClick={handleSpeak}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-extrabold shadow-lg transition-all cursor-pointer ${
                isPlaying 
                  ? 'bg-amber-400 text-slate-950 scale-95' 
                  : 'bg-white text-emerald-800 hover:bg-emerald-50 active:scale-95'
              }`}
              title={isPlaying ? 'إيقاف النطق' : 'استمع لنطق الكلمة ومعناها مباشرة دون فتح المشغل'}
            >
              <Volume2 className={`w-4 h-4 ${isPlaying ? 'animate-bounce' : ''}`} />
              <span>{isPlaying ? 'إيقاف النطق' : 'استمع للنطق'}</span>
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Meaning / المراد */}
          <div className="bg-emerald-50/80 border border-emerald-200/80 rounded-2xl p-4">
            <div className="flex items-center gap-2 text-emerald-800 text-xs font-black mb-1.5">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>المَعْنَى / المُرَاد:</span>
            </div>
            <p className="text-base sm:text-lg font-black text-slate-900 leading-relaxed font-['Cairo',sans-serif]">
              {vocabItem.meaning}
            </p>
          </div>

          {/* Grid for Opposite, Plural/Singular, Root */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Opposite / المضاد */}
            {vocabItem.opposite && (
              <div className="bg-rose-50/70 border border-rose-200/70 rounded-2xl p-3.5">
                <span className="text-xs font-black text-rose-800 block mb-1">
                  المُضَاد (العَكْس):
                </span>
                <p className="text-sm sm:text-base font-bold text-slate-900 font-['Amiri',serif]">
                  {vocabItem.opposite}
                </p>
              </div>
            )}

            {/* Plural / الجمع */}
            {vocabItem.plural && (
              <div className="bg-purple-50/70 border border-purple-200/70 rounded-2xl p-3.5">
                <span className="text-xs font-black text-purple-800 block mb-1">
                  الجَمْع:
                </span>
                <p className="text-sm sm:text-base font-bold text-slate-900 font-['Amiri',serif]">
                  {vocabItem.plural}
                </p>
              </div>
            )}

            {/* Singular / المفرد */}
            {vocabItem.singular && (
              <div className="bg-purple-50/70 border border-purple-200/70 rounded-2xl p-3.5">
                <span className="text-xs font-black text-purple-800 block mb-1">
                  المُفْرَد:
                </span>
                <p className="text-sm sm:text-base font-bold text-slate-900 font-['Amiri',serif]">
                  {vocabItem.singular}
                </p>
              </div>
            )}

            {/* Linguistic root / أصل الكلمة */}
            {vocabItem.root && (
              <div className="bg-amber-50/70 border border-amber-200/70 rounded-2xl p-3.5">
                <span className="text-xs font-black text-amber-800 block mb-1">
                  الجَذْر اللُّغَوِي (أَصْل الكَلِمَة):
                </span>
                <p className="text-sm sm:text-base font-bold text-slate-900 font-mono">
                  {vocabItem.root}
                </p>
              </div>
            )}
          </div>

          {/* Context sentence if available */}
          {vocabItem.contextSentence && (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5">
              <span className="text-xs font-black text-slate-600 block mb-1">
                مِثَالٌ تَوْضِيحِيٌّ فِي جُمْلَةٍ:
              </span>
              <p className="text-xs sm:text-sm text-slate-800 font-medium italic">
                «{vocabItem.contextSentence}»
              </p>
            </div>
          )}

          {/* Word Family / المشتقات */}
          {vocabItem.family && vocabItem.family.length > 0 && (
            <div className="bg-teal-50/70 border border-teal-200/70 rounded-2xl p-3.5">
              <span className="text-xs font-black text-teal-800 block mb-1.5">
                عَائِلَةُ الكَلِمَةِ (المُشْتَقَّات):
              </span>
              <div className="flex flex-wrap gap-1.5">
                {vocabItem.family.map((f, i) => (
                  <span key={i} className="px-2.5 py-1 rounded-lg bg-white border border-teal-200 text-teal-900 font-bold text-xs font-['Amiri',serif]">
                    {f}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Footer actions */}
          <div className="pt-2 flex flex-wrap items-center justify-between gap-2.5 border-t border-slate-100">
            {onGoToVocabTab && (
              <button
                onClick={() => {
                  onClose();
                  onGoToVocabTab(vocabItem.word);
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 text-xs font-bold transition-colors cursor-pointer"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>فتح جدول المفردات الكامل</span>
              </button>
            )}

            {onAskAiTutor && (
              <button
                onClick={() => {
                  onClose();
                  onAskAiTutor(`اشرح لي بالتفصيل معنى وسياق كلمة "${vocabItem.word}" كما وردت في منهج الصف الخامس الابتدائي، مع إعرابها ومواطن جمالها إن وجدت.`);
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-bold transition-colors cursor-pointer"
              >
                <MessageCircleQuestion className="w-3.5 h-3.5 text-purple-600" />
                <span>اسأل المعلم الذكي</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="mr-auto px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors shadow-xs cursor-pointer"
            >
              تم الفهم
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

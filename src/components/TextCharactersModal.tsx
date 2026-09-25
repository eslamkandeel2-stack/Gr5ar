import React, { useState } from 'react';
import {
  X,
  Users,
  User,
  Sparkles,
  Play,
  RotateCw,
  Check,
  Volume2,
  Sliders,
  ListOrdered,
  HelpCircle,
  MessageSquare,
  Flame,
  Award
} from 'lucide-react';
import { useAudioPlayer } from '../context/AudioContext.tsx';
import { PRESET_VOICES, audioService } from '../utils/audioPlayer.ts';
import { TextCharacter, TextSegment } from '../utils/characterParser.ts';

export const TextCharactersModal: React.FC = () => {
  const {
    isCharactersModalOpen,
    setIsCharactersModalOpen,
    textCharacters,
    textSegments,
    updateCharacterVoice,
    updateSegmentCharacter,
    updateSegmentVoice,
    applyCharacterVoicesAndPlay,
    resetCharacterDetection,
    activeLessonTitle,
    isRegenerating,
  } = useAudioPlayer();

  const [activeTab, setActiveTab] = useState<'characters' | 'segments'>('characters');
  const [previewingId, setPreviewingId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isCharactersModalOpen) return null;

  const handlePreviewCharacter = async (char: TextCharacter) => {
    setPreviewingId(char.id);
    try {
      const phrase = char.sampleQuote
        ? `${char.name}: ${char.sampleQuote}`
        : `أَنَا ${char.name}، هَذَا نَمُوذَجٌ لِصَوْتِي فِي قِرَاءَةِ النَّصِّ.`;
      await audioService.previewSegment(phrase, char.voice);
    } finally {
      setPreviewingId(null);
    }
  };

  const handlePreviewSegment = async (seg: TextSegment) => {
    setPreviewingId(seg.id);
    try {
      await audioService.previewSegment(seg.text, seg.voice);
    } finally {
      setPreviewingId(null);
    }
  };

  const handleApply = async () => {
    setSuccessMsg('جاري تطبيق التوزيع الصوتي والتوليد التعبيري...');
    try {
      await applyCharacterVoicesAndPlay();
      setSuccessMsg('تم توليد النص بأصوات الشخصيات المختارة بنجاح!');
      setTimeout(() => {
        setSuccessMsg(null);
        setIsCharactersModalOpen(false);
      }, 1400);
    } catch (e) {
      setSuccessMsg('حدث خطأ أثناء التوليد، يرجى المحاولة ثانية');
    }
  };

  return (
    <div
      id="text-characters-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in"
      onClick={() => setIsCharactersModalOpen(false)}
      dir="rtl"
    >
      <div
        id="text-characters-modal-content"
        className="w-full max-w-3xl bg-slate-900 border border-emerald-500/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] text-slate-100 animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-900/90 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-linear-to-tr from-emerald-600 via-teal-600 to-cyan-600 flex items-center justify-center text-white shadow-md">
              <Users className="w-5 h-5 text-amber-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-white">
                  شخصيات النص والتوزيع الصوتي التعبيري
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {textCharacters.length} شخصيات متوفرة
                </span>
              </div>
              <p className="text-xs text-slate-300">
                {activeLessonTitle ? `درس: ${activeLessonTitle}` : 'تخصيص شخصية صوتية لكل دور أو جزء من النص'}
              </p>
            </div>
          </div>

          <button
            id="close-characters-modal-btn"
            onClick={() => setIsCharactersModalOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="إغلاق نافذة الشخصيات"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center border-b border-slate-800 bg-slate-900/60 px-5 pt-2 gap-2 shrink-0">
          <button
            id="tab-characters-list"
            onClick={() => setActiveTab('characters')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-black border-b-2 transition-all cursor-pointer ${
              activeTab === 'characters'
                ? 'border-emerald-400 text-emerald-300 bg-emerald-500/10 rounded-t-lg'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>قائمة الشخصيات المتوفرة في النص ({textCharacters.length})</span>
          </button>

          <button
            id="tab-segments-list"
            onClick={() => setActiveTab('segments')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-black border-b-2 transition-all cursor-pointer ${
              activeTab === 'segments'
                ? 'border-emerald-400 text-emerald-300 bg-emerald-500/10 rounded-t-lg'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ListOrdered className="w-4 h-4" />
            <span>أجزاء النص وتوزيع الأدوار ({textSegments.length} جزء)</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1 text-sm">
          {/* Active Tab 1: Characters List */}
          {activeTab === 'characters' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/80 text-xs text-slate-300 flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-white mb-0.5">
                    الذكاء الاصطناعي قام بتمييز شخصيات هذا الدرس تلقائياً
                  </p>
                  <p className="leading-relaxed">
                    يمكنك اختيار نبرة صوتية مخصصة لكل شخصية لتجسيد مشاعرها وتفاصيلها أثناء الاستماع والقراءة.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {textCharacters.map((char) => {
                  const currentVoiceObj = PRESET_VOICES.find((v) => v.id === char.voice);

                  return (
                    <div
                      key={char.id}
                      className="p-4 rounded-xl bg-slate-800/90 border border-slate-700 hover:border-emerald-500/40 transition-all flex flex-col justify-between gap-3 shadow-md"
                    >
                      {/* Top: Avatar, Name & Role */}
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-xl bg-slate-700 border border-slate-600 flex items-center justify-center shrink-0">
                              <User className={`w-5 h-5 ${char.color}`} />
                            </div>
                            <div>
                              <h4 className="font-black text-white text-sm">
                                {char.name}
                              </h4>
                              <p className="text-[11px] text-slate-400">
                                {char.role}
                              </p>
                            </div>
                          </div>

                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${char.bgLight} ${char.borderLight} ${char.color}`}>
                            {char.badge}
                          </span>
                        </div>

                        {/* Sample Quote from text if available */}
                        {char.sampleQuote && (
                          <div className="mt-2 p-2 rounded-lg bg-slate-900/80 border border-slate-800 text-[11px] text-slate-300 italic">
                            <span className="text-amber-400 font-bold ml-1">«</span>
                            {char.sampleQuote}
                            <span className="text-amber-400 font-bold mr-1">»</span>
                          </div>
                        )}
                      </div>

                      {/* Bottom: Voice Picker & Preview Button */}
                      <div className="pt-3 border-t border-slate-700/80 flex flex-col gap-2">
                        <div className="flex items-center justify-between gap-2">
                          <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1">
                            <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                            <span>الصوت المخصص:</span>
                          </label>

                          <button
                            onClick={() => handlePreviewCharacter(char)}
                            disabled={previewingId !== null}
                            className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/40 flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                            title="استمع لعينة من صوت هذه الشخصية"
                          >
                            <Play className="w-2.5 h-2.5 fill-current" />
                            <span>{previewingId === char.id ? 'جاري التشغيل...' : 'تجربة النبرة'}</span>
                          </button>
                        </div>

                        <select
                          id={`select-voice-${char.id}`}
                          value={char.voice}
                          onChange={(e) => updateCharacterVoice(char.id, e.target.value)}
                          className="w-full bg-slate-900 border border-slate-600 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-hidden focus:border-emerald-500 font-bold"
                        >
                          {PRESET_VOICES.map((v) => (
                            <option key={`opt-${char.id}-${v.id}`} value={v.id}>
                              صوت {v.nameAr} ({v.badge}) - {v.tone}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Active Tab 2: Text Segments Allocation */}
          {activeTab === 'segments' && (
            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/80 text-xs text-slate-300 flex items-start gap-2.5">
                <ListOrdered className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-white mb-0.5">
                    توزيع أجزاء وفقرات النص على الشخصيات الصوتية
                  </p>
                  <p className="leading-relaxed">
                    يمكنك تغيير الشخصية أو الصوت لأي جملة أو جزء محدد في النص لتخصيص القراءة التعبيرية بدقة.
                  </p>
                </div>
              </div>

              <div className="space-y-2.5">
                {textSegments.map((seg, idx) => {
                  const assignedChar = textCharacters.find((c) => c.id === seg.characterId);

                  return (
                    <div
                      key={seg.id}
                      className="p-3.5 rounded-xl bg-slate-800/90 border border-slate-700 hover:border-slate-600 transition-all flex flex-col gap-2.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-md bg-emerald-500/20 text-emerald-300 text-[11px] font-black flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          <span className="text-xs font-bold text-white">
                            الجزء {idx + 1} • {assignedChar?.name || seg.characterName}
                          </span>
                        </div>

                        {/* Quick Listen to this segment */}
                        <button
                          onClick={() => handlePreviewSegment(seg)}
                          disabled={previewingId !== null}
                          className="text-[11px] font-bold px-2 py-0.5 rounded bg-slate-700 hover:bg-slate-600 text-amber-300 hover:text-amber-200 flex items-center gap-1 cursor-pointer transition-all active:scale-95 disabled:opacity-50"
                          title="استمع لهذا الجزء فقط"
                        >
                          <Play className="w-2.5 h-2.5 fill-current" />
                          <span>{previewingId === seg.id ? 'تشغيل...' : 'استمع للجزء'}</span>
                        </button>
                      </div>

                      {/* Text content */}
                      <p className="text-xs text-slate-200 leading-relaxed bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/80">
                        {seg.text}
                      </p>

                      {/* Selectors: Assign Character & Voice */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-xs">
                        {/* Character Assignment */}
                        <div className="flex items-center gap-2 bg-slate-900/80 px-2.5 py-1.5 rounded-lg border border-slate-700/80">
                          <span className="text-[11px] text-slate-400 shrink-0">الشخصية:</span>
                          <select
                            value={seg.characterId}
                            onChange={(e) => updateSegmentCharacter(seg.id, e.target.value)}
                            className="w-full bg-transparent text-white font-bold text-xs focus:outline-hidden"
                          >
                            {textCharacters.map((c) => (
                              <option key={`char-opt-${seg.id}-${c.id}`} value={c.id} className="bg-slate-800">
                                {c.name} ({c.role})
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Voice Assignment */}
                        <div className="flex items-center gap-2 bg-slate-900/80 px-2.5 py-1.5 rounded-lg border border-slate-700/80">
                          <span className="text-[11px] text-slate-400 shrink-0">الصوت:</span>
                          <select
                            value={seg.voice}
                            onChange={(e) => updateSegmentVoice(seg.id, e.target.value)}
                            className="w-full bg-transparent text-white font-bold text-xs focus:outline-hidden"
                          >
                            {PRESET_VOICES.map((v) => (
                              <option key={`v-opt-${seg.id}-${v.id}`} value={v.id} className="bg-slate-800">
                                {v.nameAr} - {v.badge}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer with Actions */}
        <div className="px-5 py-4 border-t border-slate-800 bg-slate-900/90 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs">
            {successMsg ? (
              <span className="text-emerald-400 font-bold flex items-center gap-1.5 animate-fade-in">
                <Check className="w-4 h-4 text-emerald-400" />
                {successMsg}
              </span>
            ) : (
              <button
                onClick={resetCharacterDetection}
                className="text-slate-400 hover:text-slate-200 text-xs font-bold transition-colors cursor-pointer underline underline-offset-4"
              >
                استعادة الضبط التلقائي للشخصيات
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={() => setIsCharactersModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors cursor-pointer"
            >
              إلغاء
            </button>

            <button
              id="apply-character-voices-btn"
              onClick={handleApply}
              disabled={isRegenerating}
              className="px-5 py-2 rounded-xl bg-linear-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/20 flex items-center gap-2 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
            >
              <RotateCw className={`w-3.5 h-3.5 ${isRegenerating ? 'animate-spin' : ''}`} />
              <span>{isRegenerating ? 'جاري التوليد التعبيري...' : 'تطبيق وتوليد القراءة التعبيرية'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

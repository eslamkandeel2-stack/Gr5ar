import React, { useState } from 'react';
import {
  X,
  Volume2,
  Users,
  User,
  Settings2,
  Sparkles,
  Play,
  RotateCw,
  Check,
  Gauge,
  Info,
  HelpCircle,
} from 'lucide-react';
import { useAudioPlayer } from '../context/AudioContext';
import { PRESET_VOICES, audioService, VoiceOption } from '../utils/audioPlayer';
import { AiUsageBar } from './AiUsageBar';
import { AiUsageModal } from './AiUsageModal';

export const AudioSettingsModal: React.FC = () => {
  const {
    isSettingsOpen,
    setIsSettingsOpen,
    preferredVoice,
    setPreferredVoice,
    speechSpeed,
    setSpeechSpeed,
    isMultiSpeaker,
    setIsMultiSpeaker,
    speaker1Voice,
    setSpeaker1Voice,
    speaker2Voice,
    setSpeaker2Voice,
    regenerateAudio,
    isRegenerating,
    activeLessonTitle,
    currentLessonText,
    textCharacters,
    setIsCharactersModalOpen,
  } = useAudioPlayer();

  const [previewingVoice, setPreviewingVoice] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isUsageModalOpen, setIsUsageModalOpen] = useState(false);

  if (!isSettingsOpen) return null;

  const handlePreview = async (voiceId: string) => {
    setPreviewingVoice(voiceId);
    try {
      await audioService.previewVoice(voiceId);
    } finally {
      setPreviewingVoice(null);
    }
  };

  const handleApplyAndRegenerate = async () => {
    setSuccessMsg('جاري إعادة توليد الصوت بالأصوات المختارة...');
    try {
      await regenerateAudio();
      setSuccessMsg('تمت إعادة توليد الصوت بنجاح!');
      setTimeout(() => {
        setSuccessMsg(null);
        setIsSettingsOpen(false);
      }, 1200);
    } catch (e: any) {
      setSuccessMsg('حدث خطأ أثناء إعادة التوليد');
    }
  };

  return (
    <div
      id="audio-settings-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in"
      onClick={() => setIsSettingsOpen(false)}
      dir="rtl"
    >
      <div
        id="audio-settings-modal-content"
        className="w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] text-slate-100 animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-900/90 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-linear-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md">
              <Settings2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white flex items-center gap-2">
                إعدادات الصوت والقراءة التعبيرية
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  ذكاء اصطناعي
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                خصص نبرة الصوت أو فعّل التمثيل الصوتي متعدد الشخصيات للنصوص
              </p>
            </div>
          </div>
          <button
            id="close-audio-settings-btn"
            onClick={() => setIsSettingsOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="إغلاق الإعدادات"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-6 flex-1 text-sm">
          {/* AI Voice Generation Usage Bar */}
          <AiUsageBar
            variant="audio-compact"
            focusTts={true}
            onOpenDetails={() => setIsUsageModalOpen(true)}
          />

          {/* Section 1: Multi-Speaker Expressive Dialogue Toggle */}
          <div className="p-4 rounded-xl bg-slate-800/80 border border-emerald-500/30 shadow-inner">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="font-black text-white text-sm">
                    قراءة تعبيرية بأصوات متعددة (شخصيات النص)
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    جديد وحصري
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  يقوم الذكاء الاصطناعي تلقائياً بتمييز الحوارات والشخصيات في النص وتوزيعها على صوتين مختلفين (صوت الراوي وصوت الشخصية) لقراءة درامية مشوقة وممتعة للتلميذ بدلاً من القراءة التقليدية الرتيبة.
                </p>
              </div>

              {/* Toggle Switch */}
              <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                <input
                  id="toggle-multispeaker-checkbox"
                  type="checkbox"
                  checked={isMultiSpeaker}
                  onChange={(e) => setIsMultiSpeaker(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-12 h-6 bg-slate-700 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
              </label>
            </div>

            {/* Sub-selectors when Multi-Speaker is ON */}
            {isMultiSpeaker && (
              <div className="mt-4 pt-4 border-t border-slate-700/80 grid grid-cols-1 sm:grid-cols-2 gap-3 animate-fade-in">
                {/* Speaker 1: Narrator / Teacher */}
                <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-700">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5" />
                      صوت الراوي / المعلم
                    </span>
                    <button
                      onClick={() => handlePreview(speaker1Voice)}
                      disabled={previewingVoice !== null}
                      className="text-[11px] font-medium text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer bg-slate-800 px-2 py-0.5 rounded"
                      title="استمع للنموذج"
                    >
                      <Play className="w-2.5 h-2.5 fill-current" />
                      <span>تجربة</span>
                    </button>
                  </div>
                  <select
                    id="select-speaker1-voice"
                    value={speaker1Voice}
                    onChange={(e) => setSpeaker1Voice(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-600 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-hidden focus:border-emerald-500"
                  >
                    {PRESET_VOICES.map((v) => (
                      <option key={`sp1-${v.id}`} value={v.id}>
                        {v.nameAr} ({v.badge}) - {v.gender === 'male' ? 'رجالي' : 'نسائي'}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Speaker 2: Character / Pupil */}
                <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-700">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5" />
                      صوت الشخصية / التلميذ
                    </span>
                    <button
                      onClick={() => handlePreview(speaker2Voice)}
                      disabled={previewingVoice !== null}
                      className="text-[11px] font-medium text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer bg-slate-800 px-2 py-0.5 rounded"
                      title="استمع للنموذج"
                    >
                      <Play className="w-2.5 h-2.5 fill-current" />
                      <span>تجربة</span>
                    </button>
                  </div>
                  <select
                    id="select-speaker2-voice"
                    value={speaker2Voice}
                    onChange={(e) => setSpeaker2Voice(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-600 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-hidden focus:border-amber-500"
                  >
                    {PRESET_VOICES.map((v) => (
                      <option key={`sp2-${v.id}`} value={v.id}>
                        {v.nameAr} ({v.badge}) - {v.gender === 'male' ? 'رجالي' : 'نسائي'}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Direct Link to Character & Segment Voice Customization */}
                <div className="sm:col-span-2 pt-3 border-t border-slate-700/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 bg-slate-950/40 p-3 rounded-lg">
                  <div className="text-xs text-slate-300">
                    <span className="font-bold text-white block">تخصيص شخصيات النص وأجزائه:</span>
                    <span>
                      {textCharacters.length > 0
                        ? `يتوفر في هذا النص (${textCharacters.length}) شخصيات مختلفة يمكنك تعيين نبرة لكل منها.`
                        : 'عرض قائمة الشخصيات وتخصيص صوت مخصص لكل جملة وحوار.'}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      setIsSettingsOpen(false);
                      setIsCharactersModalOpen(true);
                    }}
                    className="px-3.5 py-1.5 rounded-lg bg-cyan-600/30 hover:bg-cyan-600/50 text-cyan-200 border border-cyan-500/50 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 active:scale-95"
                  >
                    <Users className="w-3.5 h-3.5 text-cyan-300" />
                    <span>تخصيص شخصيات النص ({textCharacters.length || '...'})</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Section 2: Preferred Voice Selection (When single speaker or default) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="font-black text-white flex items-center gap-2 text-sm">
                <Volume2 className="w-4 h-4 text-emerald-400" />
                الصوت المفضل لقراءة النصوص
              </label>
              {isMultiSpeaker && (
                <span className="text-[11px] text-slate-400">
                  (يستخدم للأجزاء الفردية والشرح الإضافي)
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {PRESET_VOICES.map((voice: VoiceOption) => {
                const isSelected = preferredVoice === voice.id;
                const isPlayingThis = previewingVoice === voice.id;

                return (
                  <div
                    key={voice.id}
                    id={`voice-card-${voice.id}`}
                    onClick={() => setPreferredVoice(voice.id)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'bg-emerald-950/40 border-emerald-500/80 shadow-md ring-1 ring-emerald-500/40'
                        : 'bg-slate-800/60 hover:bg-slate-800 border-slate-700/80'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-white text-sm">
                            صوت {voice.nameAr}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-700/80 text-slate-300 font-medium border border-slate-600/60">
                            {voice.gender === 'male' ? 'صوت رجالي' : 'صوت نسائي'}
                          </span>
                          {isSelected && (
                            <span className="w-4 h-4 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center shrink-0">
                              <Check className="w-2.5 h-2.5 stroke-[3]" />
                            </span>
                          )}
                        </div>
                        <span className="inline-block text-[11px] font-bold text-emerald-400">
                          {voice.badge}
                        </span>
                      </div>

                      {/* Preview Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePreview(voice.id);
                        }}
                        disabled={previewingVoice !== null}
                        title={`استمع لنموذج صوت ${voice.nameAr}`}
                        className={`p-2 rounded-lg transition-all cursor-pointer shrink-0 ${
                          isPlayingThis
                            ? 'bg-emerald-500 text-slate-950 animate-pulse'
                            : 'bg-slate-700 hover:bg-slate-600 text-slate-200'
                        }`}
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                      </button>
                    </div>

                    <p className="text-[11px] text-slate-300 mt-2 leading-relaxed">
                      {voice.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 3: Reading Speed */}
          <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700/80 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="font-bold text-white text-xs flex items-center gap-2">
                <Gauge className="w-4 h-4 text-emerald-400" />
                سرعة القراءة التعليمية
              </label>
              <span className="text-xs font-mono font-bold text-emerald-300 bg-slate-900 px-2 py-0.5 rounded border border-slate-700">
                {speechSpeed}x
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {[
                { val: 0.8, label: 'متأنٍ ومفصل (0.8x)', desc: 'للإملاء والتهجي' },
                { val: 1.0, label: 'طبيعي معتدل (1.0x)', desc: 'للقراءة النموذجية' },
                { val: 1.2, label: 'سريع ورشيق (1.2x)', desc: 'للمراجعة السريعة' },
              ].map((speed) => (
                <button
                  key={speed.val}
                  type="button"
                  onClick={() => setSpeechSpeed(speed.val)}
                  className={`p-2 rounded-lg text-center border transition-all cursor-pointer ${
                    speechSpeed === speed.val
                      ? 'bg-emerald-600 text-white border-emerald-400 shadow-sm'
                      : 'bg-slate-900/80 hover:bg-slate-700/80 text-slate-300 border-slate-700'
                  }`}
                >
                  <p className="text-xs font-bold">{speed.label}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{speed.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Info Hint */}
          <div className="flex items-start gap-2 text-xs text-slate-400 bg-slate-950/40 p-3 rounded-lg border border-slate-800">
            <Info className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <p>
              يتم حفظ خياراتك الصوتية تلقائياً على جهازك لتطبيقها على جميع نصوص ودروس المنهج الدراسي المقبلة.
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/90 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-300">
            {successMsg ? (
              <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5" />
                {successMsg}
              </span>
            ) : (
              <span>
                الدرس الحالي:{' '}
                <strong className="text-white">
                  {activeLessonTitle || 'جاهز للتطبيق'}
                </strong>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              id="close-settings-cancel-btn"
              type="button"
              onClick={() => setIsSettingsOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors cursor-pointer"
            >
              إغلاق
            </button>

            {/* Direct Re-generate Audio with new settings button */}
            {currentLessonText && (
              <button
                id="apply-and-regenerate-btn"
                type="button"
                onClick={handleApplyAndRegenerate}
                disabled={isRegenerating}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black bg-emerald-500 hover:bg-emerald-600 text-slate-950 transition-all shadow-md active:scale-95 cursor-pointer disabled:opacity-50"
              >
                <RotateCw
                  className={`w-3.5 h-3.5 ${isRegenerating ? 'animate-spin' : ''}`}
                />
                <span>تطبيق وإعادة توليد الصوت الآن</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* AI Usage & Quota Details Modal */}
      <AiUsageModal
        isOpen={isUsageModalOpen}
        onClose={() => setIsUsageModalOpen(false)}
      />
    </div>
  );
};

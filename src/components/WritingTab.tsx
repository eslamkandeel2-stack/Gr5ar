import React from 'react';
import { WritingTopic } from '../types.ts';
import { PenTool, CheckCircle2, FileText, Lightbulb } from 'lucide-react';

interface WritingTabProps {
  writingTopic?: WritingTopic;
}

export const WritingTab: React.FC<WritingTabProps> = ({ writingTopic }) => {
  const [userDraft, setUserDraft] = React.useState('');
  const [isSaved, setIsSaved] = React.useState(false);

  if (!writingTopic) {
    return (
      <div className="bg-white rounded-2xl p-8 text-center border border-slate-200">
        <PenTool className="w-10 h-10 text-slate-300 mx-auto mb-2" />
        <p className="text-slate-600 font-bold text-sm">لا يوجد موضوع تعبير كتابي مخصص لهذا الدرس.</p>
      </div>
    );
  }

  const handleSave = () => {
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Topic Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="p-5 bg-linear-to-r from-teal-600 to-emerald-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center">
              <PenTool className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase bg-white/20 px-2 py-0.5 rounded">
                التَّعْبِيرُ الكِتَابِيُّ
              </span>
              <h3 className="text-lg font-black mt-0.5">{writingTopic.title}</h3>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Elements of the writing */}
          <div className="space-y-3">
            <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-600" />
              <span>عَنَاصِرُ المَوْضُوعِ الرَّئِيسَةُ:</span>
            </h4>

            <div className="grid gap-3 sm:grid-cols-2">
              {writingTopic.elements.map((el, i) => (
                <div key={i} className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/60 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-black flex items-center justify-center">
                      {i + 1}
                    </span>
                    <h5 className="font-bold text-slate-900 text-xs">{el.name}</h5>
                  </div>
                  <p className="text-xs text-slate-600 pr-7">{el.desc}</p>
                  {el.sample && (
                    <p className="text-[11px] text-emerald-700 bg-emerald-50/80 p-1.5 rounded-lg pr-7 mt-1 font-mono">
                      مثال: {el.sample}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Guidelines */}
          {writingTopic.instructions && (
            <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 space-y-2">
              <h5 className="font-bold text-amber-900 text-xs flex items-center gap-1.5">
                <Lightbulb className="w-4 h-4 text-amber-600" />
                <span>إِرْشَادَاتٌ مُهِمَّةٌ لِلْكِتَابَةِ:</span>
              </h5>
              <ul className="text-xs text-amber-800 space-y-1 list-disc list-inside">
                {writingTopic.instructions.map((ins, idx) => (
                  <li key={idx}>{ins}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Interactive Student Workspace */}
          <div className="space-y-3 pt-2">
            <h4 className="font-extrabold text-slate-900 text-sm flex items-center justify-between">
              <span>مِسَاحَةُ التِّلْمِيذِ لِلْكِتَابَةِ وَالتَّطْبِيقِ:</span>
              {isSaved && (
                <span className="text-xs text-emerald-600 flex items-center gap-1 font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  تم الحفظ بنجاح
                </span>
              )}
            </h4>

            <textarea
              value={userDraft}
              onChange={(e) => setUserDraft(e.target.value)}
              placeholder="اكتب موضوعك هنا متبعًا العناصر الستة بدقة وترتيب..."
              rows={6}
              className="w-full p-4 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500 text-sm font-['Amiri',serif] leading-relaxed resize-y bg-slate-50/30"
            />

            <div className="flex justify-end">
              <button
                onClick={handleSave}
                disabled={!userDraft.trim()}
                className={`px-5 py-2 rounded-xl text-xs font-bold transition-colors ${
                  userDraft.trim()
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                حفظ مسودتي
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

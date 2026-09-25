import React from 'react';
import { Unit, Lesson } from '../types.ts';
import { 
  Headphones, 
  BookOpen, 
  Feather, 
  CheckCircle2, 
  RotateCcw,
  Sparkles,
  ChevronDown,
  ChevronLeft,
  Trophy,
  X
} from 'lucide-react';

interface SidebarProps {
  units: Unit[];
  activeLessonId: string;
  onSelectLesson: (lessonId: string, subTab?: string) => void;
  activeSubTab?: string;
  completedLessons: string[];
  isOpen: boolean;
  onClose: () => void;
  onOpenQuestionBank?: () => void;
  onOpenHistory?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  units,
  activeLessonId,
  onSelectLesson,
  activeSubTab = 'reader',
  completedLessons,
  isOpen,
  onClose,
  onOpenQuestionBank,
  onOpenHistory,
}) => {
  const [expandedUnits, setExpandedUnits] = React.useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('selah_expanded_units');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {
      'unit-revision': true,
      'unit-1': true,
      'unit-2': true,
      'unit-3': true,
    };
  });

  React.useEffect(() => {
    try {
      localStorage.setItem('selah_expanded_units', JSON.stringify(expandedUnits));
    } catch (e) {}
  }, [expandedUnits]);

  // توسيع الوحدة الحاوية للدرس المختار تلقائياً
  React.useEffect(() => {
    if (activeLessonId) {
      const parentUnit = units.find(u => u.lessons.some(l => l.id === activeLessonId));
      if (parentUnit) {
        setExpandedUnits(prev => ({
          ...prev,
          [parentUnit.id]: true
        }));
      }
    }
  }, [activeLessonId, units]);

  const toggleUnit = (unitId: string) => {
    setExpandedUnits(prev => ({
      ...prev,
      [unitId]: !prev[unitId]
    }));
  };

  const getLessonIcon = (type: Lesson['type']) => {
    switch (type) {
      case 'listening':
        return <Headphones className="w-4 h-4 text-sky-600" />;
      case 'poetry':
        return <Feather className="w-4 h-4 text-purple-600" />;
      case 'revision':
        return <RotateCcw className="w-4 h-4 text-amber-600" />;
      case 'reading':
      default:
        return <BookOpen className="w-4 h-4 text-emerald-600" />;
    }
  };

  const getLessonTypeBadge = (type: Lesson['type']) => {
    switch (type) {
      case 'listening':
        return <span className="text-[10px] font-bold bg-sky-100 text-sky-700 px-1.5 py-0.5 rounded">استماع</span>;
      case 'poetry':
        return <span className="text-[10px] font-bold bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded">نص شعري</span>;
      case 'revision':
        return <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">مراجعة</span>;
      case 'reading':
      default:
        return <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded">قراءة</span>;
    }
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 z-40 lg:hidden backdrop-blur-xs transition-opacity"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed lg:static top-0 bottom-0 right-0 z-50 w-[85vw] max-w-sm sm:w-88 bg-white border-l border-slate-200/80 flex flex-col transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Sidebar Header */}
        <div className="p-3.5 sm:p-4 border-b border-slate-100 bg-linear-to-r from-emerald-50/70 to-teal-50/70">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping shrink-0" />
              <h2 className="font-extrabold text-slate-800 text-sm sm:text-base truncate">فهرس الكتاب والوحدات</h2>
            </div>
            
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-xs font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full">
                {completedLessons.length} مكتمل
              </span>
              <button
                onClick={onClose}
                className="lg:hidden p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-white/60 transition-colors"
                title="إغلاق الفهرس"
                aria-label="إغلاق الفهرس"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
          <p className="text-[11px] sm:text-xs text-slate-500 mt-1">توزيع منهج الفصل الدراسي الأول ٢٠٢٦ / ٢٠٢٧</p>
        </div>

        {/* Units and Lessons List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          {/* External Independent Features Buttons */}
          <div className="space-y-2">
            {onOpenQuestionBank && (
              <button
                onClick={onOpenQuestionBank}
                className="w-full text-right p-3 rounded-xl bg-linear-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-xs transition-all flex items-center justify-between gap-2 cursor-pointer group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0">
                    <Trophy className="w-4 h-4 text-amber-100" />
                  </div>
                  <div>
                    <h4 className="font-black text-xs">بنك الأسئلة وتوليد الاختبارات</h4>
                    <p className="text-[10px] text-amber-100">تبويب شامل خارج الدروس</p>
                  </div>
                </div>
                <span className="text-[10px] font-black bg-white/25 px-2 py-0.5 rounded-full">
                  ٥٠٠+ سؤال 🏆
                </span>
              </button>
            )}

            {onOpenHistory && (
              <button
                onClick={onOpenHistory}
                className="w-full text-right p-2.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-950 border border-teal-200 transition-all flex items-center justify-between gap-2 cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm">📊</span>
                  <span className="font-bold text-xs">سجل النتائج وتقارير الأخطاء</span>
                </div>
                <span className="text-[10px] text-teal-700 bg-teal-200/80 px-2 py-0.5 rounded-full font-bold">
                  سجل الدرجات
                </span>
              </button>
            )}
          </div>

          {units.map((unit) => {
            const isExpanded = expandedUnits[unit.id] ?? true;
            const unitCompletedCount = unit.lessons.filter(l => completedLessons.includes(l.id)).length;

            return (
              <div
                key={unit.id}
                className="rounded-xl border border-slate-200/90 overflow-hidden bg-slate-50/50"
              >
                {/* Unit Header Accordion Toggle */}
                <button
                  onClick={() => toggleUnit(unit.id)}
                  className="w-full text-right p-3 bg-white hover:bg-slate-50 transition-colors flex items-center justify-between gap-2 border-b border-slate-100"
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div className={`w-7 h-7 rounded-lg bg-linear-to-br ${unit.color} text-white flex items-center justify-center text-xs font-black shrink-0`}>
                      {typeof unit.number === 'number' ? unit.number : '★'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-slate-800 text-xs truncate">
                        {unit.title}
                      </h3>
                      <p className="text-[11px] text-slate-400 truncate">
                        {unit.theme}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[10px] font-bold text-slate-400">
                      {unitCompletedCount}/{unit.lessons.length}
                    </span>
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronLeft className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                </button>

                {/* Lessons in Unit */}
                {isExpanded && (
                  <div className="p-1.5 space-y-1 bg-slate-50/50">
                    {unit.lessons.map((lesson) => {
                      const isActive = lesson.id === activeLessonId;
                      const isCompleted = completedLessons.includes(lesson.id);

                      const grammarSub = lesson.grammarLessons?.find(g => g.category === 'نحو');
                      const spellingSub = lesson.grammarLessons?.find(g => g.category === 'إملاء');
                      const writingSub = lesson.writingTopic;
                      const hasSubLessons = grammarSub || spellingSub || writingSub;

                      return (
                        <div key={lesson.id} className="space-y-1">
                          <button
                            onClick={() => {
                              onSelectLesson(lesson.id, 'reader');
                              if (window.innerWidth < 1024) onClose();
                            }}
                            className={`w-full text-right p-2.5 rounded-xl flex items-start gap-2.5 transition-all text-xs font-medium cursor-pointer ${
                              isActive
                                ? 'bg-emerald-600 text-white shadow-xs font-bold'
                                : 'text-slate-700 hover:bg-white hover:text-slate-900'
                            }`}
                          >
                            <div className="mt-0.5 shrink-0">
                              {isCompleted ? (
                                <CheckCircle2 className={`w-4 h-4 ${isActive ? 'text-emerald-200' : 'text-emerald-500'}`} />
                              ) : (
                                <div className={isActive ? 'text-white' : ''}>
                                  {getLessonIcon(lesson.type)}
                                </div>
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-1 mb-0.5">
                                <span className="truncate">{lesson.title}</span>
                                <span className={isActive ? 'opacity-90' : ''}>
                                  {getLessonTypeBadge(lesson.type)}
                                </span>
                              </div>
                              {lesson.subTitle && (
                                <p className={`text-[11px] truncate ${isActive ? 'text-emerald-100' : 'text-slate-400'}`}>
                                  {lesson.subTitle}
                                </p>
                              )}
                            </div>
                          </button>

                          {/* Sub-Lessons List when this lesson is active and has sub-lessons */}
                          {isActive && hasSubLessons && (
                            <div className="mr-4 pr-2.5 py-1 border-r-2 border-emerald-500/40 space-y-1 text-xs animate-fadeIn">
                              <button
                                onClick={() => {
                                  onSelectLesson(lesson.id, 'reader');
                                  if (window.innerWidth < 1024) onClose();
                                }}
                                className={`w-full text-right px-2.5 py-1.5 rounded-lg flex items-center justify-between gap-1.5 transition-all cursor-pointer ${
                                  activeSubTab === 'reader'
                                    ? 'bg-emerald-100/90 text-emerald-950 font-black'
                                    : 'text-slate-600 hover:bg-white hover:text-slate-900'
                                }`}
                              >
                                <span className="truncate">📖 النَّصُّ القِرَائِيُّ</span>
                                <span className="text-[10px] text-slate-400">القراءة</span>
                              </button>

                              {grammarSub && (
                                <button
                                  onClick={() => {
                                    onSelectLesson(lesson.id, 'grammar');
                                    if (window.innerWidth < 1024) onClose();
                                  }}
                                  className={`w-full text-right px-2.5 py-1.5 rounded-lg flex items-center justify-between gap-1.5 transition-all cursor-pointer ${
                                    activeSubTab === 'grammar'
                                      ? 'bg-indigo-100 text-indigo-950 font-black'
                                      : 'text-slate-600 hover:bg-white hover:text-slate-900'
                                  }`}
                                >
                                  <span className="truncate">🎓 {grammarSub.title.replace('القواعد النحوية:', 'النحو:')}</span>
                                  <span className="text-[9px] bg-indigo-50 text-indigo-700 px-1 py-0.2 rounded font-bold">شرح + تدريب</span>
                                </button>
                              )}

                              {spellingSub && (
                                <button
                                  onClick={() => {
                                    onSelectLesson(lesson.id, 'spelling');
                                    if (window.innerWidth < 1024) onClose();
                                  }}
                                  className={`w-full text-right px-2.5 py-1.5 rounded-lg flex items-center justify-between gap-1.5 transition-all cursor-pointer ${
                                    activeSubTab === 'spelling'
                                      ? 'bg-sky-100 text-sky-950 font-black'
                                      : 'text-slate-600 hover:bg-white hover:text-slate-900'
                                  }`}
                                >
                                  <span className="truncate">✍️ {spellingSub.title.replace('القواعد الإملائية:', 'الإملاء:')}</span>
                                  <span className="text-[9px] bg-sky-50 text-sky-700 px-1 py-0.2 rounded font-bold">شرح + تدريب</span>
                                </button>
                              )}

                              {writingSub && (
                                <button
                                  onClick={() => {
                                    onSelectLesson(lesson.id, 'writing');
                                    if (window.innerWidth < 1024) onClose();
                                  }}
                                  className={`w-full text-right px-2.5 py-1.5 rounded-lg flex items-center justify-between gap-1.5 transition-all cursor-pointer ${
                                    activeSubTab === 'writing'
                                      ? 'bg-teal-100 text-teal-950 font-black'
                                      : 'text-slate-600 hover:bg-white hover:text-slate-900'
                                  }`}
                                >
                                  <span className="truncate">📝 التَّعْبِيرُ: {writingSub.title}</span>
                                  <span className="text-[9px] bg-teal-50 text-teal-700 px-1 py-0.2 rounded font-bold">نموذج + ورشة</span>
                                </button>
                              )}

                              {lesson.exercises && lesson.exercises.length > 0 && (
                                <button
                                  onClick={() => {
                                    onSelectLesson(lesson.id, 'exercises');
                                    if (window.innerWidth < 1024) onClose();
                                  }}
                                  className={`w-full text-right px-2.5 py-1.5 rounded-lg flex items-center justify-between gap-1.5 transition-all cursor-pointer ${
                                    activeSubTab === 'exercises'
                                      ? 'bg-amber-100 text-amber-950 font-black'
                                      : 'text-slate-600 hover:bg-white hover:text-slate-900'
                                  }`}
                                >
                                  <span className="truncate">🎯 تَدْرِيبَاتُ هَذَا الدَّرْسِ</span>
                                  <span className="text-[10px] text-amber-700 font-bold">{lesson.exercises.length} س</span>
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer Note */}
        <div className="p-3 border-t border-slate-100 bg-white text-center">
          <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500 font-medium">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>مدعوم بمحرك جيمناي الصوتي الفصيح</span>
          </div>
        </div>
      </aside>
    </>
  );
};

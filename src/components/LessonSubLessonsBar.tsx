import React from 'react';
import { Lesson } from '../types.ts';
import { 
  BookOpen, 
  GraduationCap, 
  Sparkles, 
  PenTool, 
  Layers
} from 'lucide-react';

interface LessonSubLessonsBarProps {
  lesson: Lesson;
  activeSubTab: string;
  onSelectSubTab: (tabId: string) => void;
}

export const LessonSubLessonsBar: React.FC<LessonSubLessonsBarProps> = ({
  lesson,
  activeSubTab,
  onSelectSubTab
}) => {
  // Find sub-lessons
  const grammarLesson = lesson.grammarLessons?.find(g => g.category === 'نحو');
  const spellingLesson = lesson.grammarLessons?.find(g => g.category === 'إملاء');
  const writingTopic = lesson.writingTopic;

  // Sub-branches belonging specifically to the educational content of this lesson
  const subItems = [
    {
      id: 'reader',
      title: 'النَّصُّ القِرَائِيُّ',
      subText: 'القراءة المشكولة والمعجم الصوتي',
      badge: 'النص الكامل',
      icon: BookOpen,
      available: true
    },
    {
      id: 'grammar',
      title: grammarLesson ? grammarLesson.title : 'القَوَاعِدُ النَّحْوِيَّةُ',
      subText: grammarLesson?.subTitle || 'شرح تفصيلي + أمثلة معربة وتدريبات',
      badge: grammarLesson?.exercises ? `${grammarLesson.exercises.length} تدريبات` : 'شرح مفصل',
      icon: GraduationCap,
      available: !!grammarLesson
    },
    {
      id: 'spelling',
      title: spellingLesson ? spellingLesson.title : 'القَوَاعِدُ الإِمْلَائِيَّةُ',
      subText: spellingLesson?.subTitle || 'قواعد الرسم والظواهر الإملائية',
      badge: spellingLesson?.exercises ? `${spellingLesson.exercises.length} تدريبات` : 'إملاء',
      icon: Sparkles,
      available: !!spellingLesson
    },
    {
      id: 'writing',
      title: writingTopic ? writingTopic.title : 'التَّعْبِيرُ الكِتَابِيُّ',
      subText: writingTopic?.subTitle || 'عناصر المهارة ونموذج تطبيقي',
      badge: writingTopic?.exercises ? `${writingTopic.exercises.length} تدريبات` : 'تعبير',
      icon: PenTool,
      available: !!writingTopic
    }
  ].filter(item => item.available);

  // If there's only 1 item (just reader with no grammar/spelling/writing), no need to show this bar
  if (subItems.length <= 1) {
    return null;
  }

  return (
    <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 p-3 sm:p-4 shadow-xs mb-6">
      {/* Sub-Branch Bar Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 mb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
            <Layers className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-black text-slate-800">
            فروع ومحطات الدرس المقررة:
          </span>
          <span className="text-[11px] text-slate-500 hidden sm:inline">
            (تنقل مباشر بين القراءة والنحو والإملاء والتعبير)
          </span>
        </div>

        <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
          {subItems.length} فروع تعليمية
        </span>
      </div>

      {/* Sub-Branch Interactive Segmented Grid */}
      <div className={`grid grid-cols-1 sm:grid-cols-2 ${subItems.length >= 4 ? 'lg:grid-cols-4' : 'lg:grid-cols-3'} gap-2`}>
        {subItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeSubTab === item.id;

          let activeClasses = '';
          let iconClasses = '';

          if (isActive) {
            activeClasses = 'bg-linear-to-r from-emerald-600 to-teal-700 text-white shadow-sm shadow-emerald-700/20 border-emerald-700 ring-2 ring-emerald-500/20';
            iconClasses = 'bg-white/20 text-white';
          } else {
            activeClasses = 'bg-slate-50 hover:bg-slate-100/80 text-slate-800 border-slate-200/80 hover:border-slate-300';
            iconClasses = 'bg-emerald-100/80 text-emerald-800';
          }

          return (
            <button
              key={item.id}
              onClick={() => onSelectSubTab(item.id)}
              className={`p-3 rounded-xl border text-right transition-all flex items-start gap-2.5 cursor-pointer min-w-0 ${activeClasses}`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 transition-transform ${isActive ? 'scale-105' : ''} ${iconClasses}`}>
                <Icon className="w-4 h-4" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1 mb-0.5">
                  <h4 className={`text-xs font-black truncate ${isActive ? 'text-white' : 'text-slate-900'}`}>
                    {item.title}
                  </h4>
                  <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-md shrink-0 font-mono ${
                    isActive ? 'bg-white/20 text-emerald-100' : 'bg-slate-200/70 text-slate-700'
                  }`}>
                    {item.badge}
                  </span>
                </div>

                <p className={`text-[11px] truncate leading-tight ${isActive ? 'text-emerald-100' : 'text-slate-500'}`}>
                  {item.subText}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};


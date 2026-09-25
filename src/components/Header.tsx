import React from 'react';
import { BookOpen, Sparkles, Volume2, Award, Menu, BrainCircuit } from 'lucide-react';
import { Lesson, Unit } from '../types.ts';
import { AiUsageBar } from './AiUsageBar.tsx';

interface HeaderProps {
  currentUnit: Unit;
  currentLesson: Lesson;
  studentScore: number;
  selectedVoice: string;
  onVoiceChange: (voice: string) => void;
  onToggleSidebar: () => void;
  onOpenAiTutor: () => void;
  onOpenAiUsage: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUnit,
  currentLesson,
  studentScore,
  selectedVoice,
  onVoiceChange,
  onToggleSidebar,
  onOpenAiTutor,
  onOpenAiUsage,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between gap-2 sm:gap-4 min-w-0">
        {/* Left: Mobile Menu & Brand */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <button
            onClick={onToggleSidebar}
            className="lg:hidden p-2 rounded-xl text-slate-700 hover:text-slate-900 hover:bg-slate-100 active:bg-slate-200 transition-colors shrink-0"
            title="القائمة"
            aria-label="تبديل القائمة"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-linear-to-br from-emerald-600 to-teal-700 flex items-center justify-center text-white shadow-sm shadow-emerald-700/20 shrink-0">
              <BookOpen className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="font-extrabold text-slate-900 text-sm sm:text-lg tracking-tight truncate">سِلَاحُ التِّلْمِيذ</span>
                <span className="bg-emerald-100 text-emerald-800 text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded-full font-bold shrink-0">
                  الصف ٥
                </span>
              </div>
              <p className="hidden xs:block text-[11px] sm:text-xs text-slate-600 font-medium truncate">اللغة العربية • ترم ١</p>
            </div>
          </div>
        </div>

        {/* Center: Current Breadcrumb (Desktop) */}
        <div className="hidden md:flex items-center gap-2 text-xs font-semibold text-slate-700 bg-slate-100/80 px-3 py-1.5 rounded-full border border-slate-200/60 shrink min-w-0">
          <span className="text-emerald-700 font-bold shrink-0">{currentUnit.title.split(':')[0]}</span>
          <span className="text-slate-400">/</span>
          <span className="text-slate-800 truncate max-w-[160px] lg:max-w-[240px]">{currentLesson.title}</span>
        </div>

        {/* Right: Audio Voice Selector, Score, AI Usage & AI Tutor Button */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Gemini Voice Selector */}
          <div className="hidden lg:flex items-center gap-1.5 bg-slate-100 text-slate-700 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-slate-200">
            <Volume2 className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
            <span className="text-slate-600">الصوت:</span>
            <select
              value={selectedVoice}
              onChange={(e) => onVoiceChange(e.target.value)}
              className="bg-transparent text-xs font-bold text-emerald-900 focus:outline-none cursor-pointer"
            >
              <option value="Zephyr">زفير (فصيح)</option>
              <option value="Kore">كوري (معبر)</option>
              <option value="Puck">باك (تعليمي)</option>
              <option value="Charon">تشارون (رصين)</option>
              <option value="Fenrir">فنرير (قوي)</option>
            </select>
          </div>

          {/* AI Usage & Renewal Bar Header Badge */}
          <AiUsageBar variant="header-badge" onOpenDetails={onOpenAiUsage} />

          {/* Student Score Badge */}
          <div className="flex items-center gap-1 sm:gap-1.5 bg-amber-50 text-amber-900 px-2 sm:px-3 py-1.5 rounded-xl border border-amber-200 text-xs font-bold shadow-2xs shrink-0">
            <Award className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-600 shrink-0" />
            <span className="font-mono">{studentScore}</span>
            <span className="text-amber-800 text-[10px] hidden xs:inline">نقطة</span>
          </div>

          {/* AI Tutor Button */}
          <button
            onClick={onOpenAiTutor}
            className="flex items-center gap-1 sm:gap-1.5 bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-xs font-bold shadow-sm shadow-emerald-600/20 transition-all active:scale-95 shrink-0 cursor-pointer"
            title="المعلم الذكي لجيمناي"
          >
            <BrainCircuit className="w-4 h-4 text-emerald-200 shrink-0" />
            <span className="hidden sm:inline">معلم لغتي الذكي</span>
            <span className="sm:hidden text-xs">المعلم</span>
            <Sparkles className="w-3 h-3 text-amber-300 animate-pulse shrink-0" />
          </button>
        </div>
      </div>
    </header>
  );
};

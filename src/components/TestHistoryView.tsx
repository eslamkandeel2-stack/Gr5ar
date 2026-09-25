import React, { useState, useEffect } from 'react';
import { TestRecord } from '../types.ts';
import { 
  getAllTestRecords, 
  deleteTestRecord, 
  clearAllTestRecords, 
  getOverallTestStats 
} from '../utils/testStorage.ts';
import { TestReportModal } from './TestReportModal.tsx';
import { 
  Trophy, 
  Award, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  RotateCcw, 
  Trash2, 
  FileText, 
  Sparkles, 
  BarChart3, 
  ChevronLeft,
  Filter,
  ArrowRight,
  BookOpen
} from 'lucide-react';

interface TestHistoryViewProps {
  onStartNewQuiz?: () => void;
  onRetakeTest?: (record: TestRecord) => void;
}

export const TestHistoryView: React.FC<TestHistoryViewProps> = ({
  onStartNewQuiz,
  onRetakeTest,
}) => {
  const [records, setRecords] = useState<TestRecord[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<TestRecord | null>(null);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'lesson' | 'quiz'>('all');
  const [stats, setStats] = useState(getOverallTestStats());

  const loadData = () => {
    setRecords(getAllTestRecords());
    setStats(getOverallTestStats());
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('هل أنت متأكد من حذف نتيجة هذا الاختبار؟')) {
      deleteTestRecord(id);
      loadData();
    }
  };

  const handleClearAll = () => {
    if (window.confirm('هل أنت متأكد من مسح سجل الاختبارات بالكامل؟')) {
      clearAllTestRecords();
      loadData();
    }
  };

  const handleViewReport = (record: TestRecord) => {
    setSelectedRecord(record);
    setIsReportOpen(true);
  };

  const filteredRecords = records.filter(r => {
    if (selectedFilter === 'lesson') return r.scope === 'lesson';
    if (selectedFilter === 'quiz') return r.scope === 'quiz' || r.scope === 'all';
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner and Overall Stats */}
      <div className="bg-linear-to-r from-slate-900 via-slate-800 to-emerald-950 text-white rounded-3xl p-5 sm:p-7 border border-slate-700 shadow-md relative overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0 shadow-inner">
              <Trophy className="w-7 h-7 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-black px-2.5 py-0.5 rounded-full bg-emerald-400/20 text-emerald-300 border border-emerald-400/30">
                  سِجِلُّ الِاخْتِبَارَاتِ وَالتَّقَارِيرِ
                </span>
                <span className="text-xs text-slate-400">
                  حفظ تلقائي لجميع نتائجك وتتبع الأخطاء
                </span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-white mt-1">
                سجل نتائج الاختبارات وتقارير الأخطاء السابقة
              </h3>
              <p className="text-xs text-slate-300 mt-1 max-w-xl leading-relaxed">
                يمكنك مراجعة أي اختبار سابق بالتفصيل، والاطلاع على الأسئلة التي أخطأت فيها مع شروحاتها وتصحيحها.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            {records.length > 0 && (
              <button
                onClick={handleClearAll}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-rose-300 hover:text-white bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/40 transition-all cursor-pointer"
                title="مسح السجل بالكامل"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>مسح السجل</span>
              </button>
            )}

            {onStartNewQuiz && (
              <button
                onClick={onStartNewQuiz}
                className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition-all shadow-sm cursor-pointer active:scale-95"
              >
                <Sparkles className="w-4 h-4" />
                <span>بدء اختبار جديد</span>
              </button>
            )}
          </div>
        </div>

        {/* Aggregated Quick Metrics 4-Box Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 mt-6 pt-5 border-t border-white/10">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 sm:p-3.5 border border-white/10 text-center min-w-0">
            <div className="text-[11px] text-slate-300 font-bold truncate">الاختبارات المنجزة</div>
            <div className="text-xl sm:text-2xl font-black text-white font-mono mt-1 break-words">
              {stats.totalTests}
            </div>
          </div>

          <div className="bg-emerald-500/15 backdrop-blur-md rounded-2xl p-3 sm:p-3.5 border border-emerald-500/20 text-center min-w-0">
            <div className="text-[11px] text-emerald-300 font-bold truncate">متوسط الدرجات</div>
            <div className="text-xl sm:text-2xl font-black text-emerald-300 font-mono mt-1 break-words">
              {stats.avgScore}%
            </div>
          </div>

          <div className="bg-amber-500/15 backdrop-blur-md rounded-2xl p-3 sm:p-3.5 border border-amber-500/20 text-center min-w-0">
            <div className="text-[11px] text-amber-300 font-bold truncate">أسئلة تم حلها</div>
            <div className="text-xl sm:text-2xl font-black text-amber-300 font-mono mt-1 break-words">
              {stats.totalQuestions}
            </div>
          </div>

          <div className="bg-teal-500/15 backdrop-blur-md rounded-2xl p-3 sm:p-3.5 border border-teal-500/20 text-center min-w-0">
            <div className="text-[11px] text-teal-300 font-bold truncate">اختبارات الدرجة الكاملة</div>
            <div className="text-xl sm:text-2xl font-black text-teal-300 font-mono mt-1 flex items-center justify-center gap-1 break-words">
              <span>{stats.perfectScoresCount}</span>
              <span className="text-sm">🌟</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
          <Filter className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>تصفية السجل:</span>
        </div>

        <div className="flex flex-wrap items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
          <button
            onClick={() => setSelectedFilter('all')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              selectedFilter === 'all'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            جميع الاختبارات ({records.length})
          </button>

          <button
            onClick={() => setSelectedFilter('lesson')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              selectedFilter === 'lesson'
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            تدريبات الدروس ({records.filter(r => r.scope === 'lesson').length})
          </button>

          <button
            onClick={() => setSelectedFilter('quiz')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              selectedFilter === 'quiz'
                ? 'bg-amber-600 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            تحديات بنك الأسئلة ({records.filter(r => r.scope === 'quiz' || r.scope === 'all').length})
          </button>
        </div>
      </div>

      {/* History Items List */}
      <div className="space-y-3.5">
        {filteredRecords.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 sm:p-10 text-center border border-slate-200 space-y-3 w-full overflow-hidden break-words">
            <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200">
              <Trophy className="w-8 h-8" />
            </div>
            <h4 className="text-base font-extrabold text-slate-900 break-words">
              لا توجد اختبارات محفوظة في هذا القسم حتى الآن
            </h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed break-words">
              عند إجابتك على تدريبات أي درس أو خوض اختبار من بنك الأسئلة والنقر على «إنهاء الاختبار وعرض التقرير»، سيتم حفظ النتيجة تلقائياً هنا مع تحليل تفصيلي لجميع الأخطاء.
            </p>
            {onStartNewQuiz && (
              <div className="pt-2">
                <button
                  onClick={onStartNewQuiz}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
                >
                  بدء أول اختبار الآن
                </button>
              </div>
            )}
          </div>
        ) : (
          filteredRecords.map((record) => {
            const mistakesCount = record.questions.filter(q => !q.isCorrect).length;

            return (
              <div
                key={record.id}
                onClick={() => handleViewReport(record)}
                className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 hover:border-emerald-300 hover:shadow-sm transition-all duration-200 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 group w-full overflow-hidden break-words"
              >
                {/* Right Info: Score Badge + Title + Date */}
                <div className="flex items-start sm:items-center gap-3.5 min-w-0 flex-1 w-full">
                  {/* Score Pill / Badge */}
                  <div className={`w-14 sm:w-16 h-14 sm:h-16 rounded-2xl flex flex-col items-center justify-center shrink-0 font-mono font-black border shadow-2xs ${
                    record.scorePercentage >= 85
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                      : record.scorePercentage >= 65
                      ? 'bg-amber-50 text-amber-800 border-amber-300'
                      : 'bg-rose-50 text-rose-800 border-rose-300'
                  }`}>
                    <span className="text-base sm:text-lg leading-none">{record.scorePercentage}%</span>
                    <span className="text-[9px] font-sans font-bold text-slate-500 mt-0.5">
                      {record.scorePercentage >= 85 ? 'ممتاز' : record.scorePercentage >= 65 ? 'جيد جداً' : 'مراجعة'}
                    </span>
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-md shrink-0 ${
                        record.scope === 'lesson'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-900'
                      }`}>
                        {record.scope === 'lesson' ? 'تدريبات الدرس' : 'بنك الأسئلة الشامل'}
                      </span>
                      <span className="text-xs text-slate-400 font-mono flex items-center gap-1 shrink-0">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {record.formattedDate}
                      </span>
                    </div>

                    <h4 className="font-extrabold text-slate-900 text-sm sm:text-base mt-1.5 break-words line-clamp-2 leading-snug group-hover:text-emerald-700 transition-colors">
                      {record.title}
                    </h4>

                    {/* Quick breakdown tags */}
                    <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs text-slate-500">
                      <span className="font-bold text-slate-700">
                        {record.totalQuestions} أسئلة
                      </span>
                      <span>•</span>
                      <span className="text-emerald-700 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        {record.correctCount} صحيحة
                      </span>
                      <span>•</span>
                      <span className={`font-bold flex items-center gap-1 ${
                        mistakesCount > 0 ? 'text-rose-700' : 'text-slate-400'
                      }`}>
                        <XCircle className="w-3.5 h-3.5" />
                        {mistakesCount} أخطاء
                      </span>
                    </div>
                  </div>
                </div>

                {/* Left Action Buttons */}
                <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full md:w-auto justify-end shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleViewReport(record);
                    }}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 px-3.5 py-2 rounded-xl text-xs font-bold transition-colors border border-emerald-200 cursor-pointer shadow-2xs whitespace-nowrap"
                  >
                    <FileText className="w-3.5 h-3.5 text-emerald-600" />
                    <span>عرض التقرير والأخطاء</span>
                  </button>

                  {onRetakeTest && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onRetakeTest(record);
                      }}
                      className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer border border-slate-200 shrink-0"
                      title="إعادة خوض هذا الاختبار"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  )}

                  <button
                    onClick={(e) => handleDelete(record.id, e)}
                    className="p-2 rounded-xl bg-slate-100 hover:bg-rose-100 text-slate-500 hover:text-rose-700 transition-colors cursor-pointer border border-slate-200 shrink-0"
                    title="حذف هذا الاختبار"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Test Report Modal */}
      <TestReportModal
        testRecord={selectedRecord}
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        onRetake={(rec) => {
          setIsReportOpen(false);
          if (onRetakeTest) onRetakeTest(rec);
        }}
      />
    </div>
  );
};

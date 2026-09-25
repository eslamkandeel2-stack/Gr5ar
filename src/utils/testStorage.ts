import { TestRecord, SavedProgressState } from '../types.ts';

const TEST_HISTORY_KEY = 'selah_test_history_v1';
const LESSON_PROGRESS_PREFIX = 'selah_progress_lesson_';
const QUIZ_PROGRESS_KEY = 'selah_progress_quiz_active';

/**
 * Save progress for a specific lesson's exercises
 */
export function saveLessonProgress(lessonId: string, progress: SavedProgressState): void {
  try {
    localStorage.setItem(`${LESSON_PROGRESS_PREFIX}${lessonId}`, JSON.stringify(progress));
  } catch (e) {
    console.warn('Failed to save lesson progress:', e);
  }
}

/**
 * Retrieve saved progress for a specific lesson
 */
export function getLessonProgress(lessonId: string): SavedProgressState | null {
  try {
    const raw = localStorage.getItem(`${LESSON_PROGRESS_PREFIX}${lessonId}`);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

/**
 * Clear progress for a specific lesson
 */
export function clearLessonProgress(lessonId: string): void {
  try {
    localStorage.removeItem(`${LESSON_PROGRESS_PREFIX}${lessonId}`);
  } catch (e) {
    console.warn('Failed to clear lesson progress:', e);
  }
}

/**
 * Save active quiz progress
 */
export function saveQuizProgress(progress: SavedProgressState): void {
  try {
    localStorage.setItem(QUIZ_PROGRESS_KEY, JSON.stringify(progress));
  } catch (e) {
    console.warn('Failed to save quiz progress:', e);
  }
}

/**
 * Get active quiz progress
 */
export function getQuizProgress(): SavedProgressState | null {
  try {
    const raw = localStorage.getItem(QUIZ_PROGRESS_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

/**
 * Clear active quiz progress
 */
export function clearQuizProgress(): void {
  try {
    localStorage.removeItem(QUIZ_PROGRESS_KEY);
  } catch (e) {
    console.warn('Failed to clear quiz progress:', e);
  }
}

/**
 * Format Arabic date/time nicely
 */
export function formatArabicDateTime(timestamp: number): string {
  try {
    const d = new Date(timestamp);
    const dateStr = d.toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const timeStr = d.toLocaleTimeString('ar-EG', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
    return `${dateStr} - ${timeStr}`;
  } catch (e) {
    return new Date(timestamp).toLocaleString();
  }
}

/**
 * Save a completed test record to history
 */
export function saveTestRecord(record: TestRecord): void {
  try {
    const all = getAllTestRecords();
    // Prepend so latest test is first
    const updated = [record, ...all.filter(r => r.id !== record.id)].slice(0, 50); // keep last 50 tests
    localStorage.setItem(TEST_HISTORY_KEY, JSON.stringify(updated));
  } catch (e) {
    console.warn('Failed to save test record:', e);
  }
}

/**
 * Get all test records from history
 */
export function getAllTestRecords(): TestRecord[] {
  try {
    const raw = localStorage.getItem(TEST_HISTORY_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    return [];
  }
}

/**
 * Get single test record by ID
 */
export function getTestRecordById(id: string): TestRecord | null {
  const all = getAllTestRecords();
  return all.find(r => r.id === id) || null;
}

/**
 * Delete a specific test record
 */
export function deleteTestRecord(id: string): void {
  try {
    const all = getAllTestRecords();
    const filtered = all.filter(r => r.id !== id);
    localStorage.setItem(TEST_HISTORY_KEY, JSON.stringify(filtered));
  } catch (e) {
    console.warn('Failed to delete test record:', e);
  }
}

/**
 * Clear all test history
 */
export function clearAllTestRecords(): void {
  try {
    localStorage.removeItem(TEST_HISTORY_KEY);
  } catch (e) {
    console.warn('Failed to clear all test records:', e);
  }
}

/**
 * Get aggregated statistics across all tests
 */
export function getOverallTestStats(): {
  totalTests: number;
  avgScore: number;
  totalQuestions: number;
  totalCorrect: number;
  totalMistakes: number;
  perfectScoresCount: number;
} {
  const records = getAllTestRecords();
  if (records.length === 0) {
    return {
      totalTests: 0,
      avgScore: 0,
      totalQuestions: 0,
      totalCorrect: 0,
      totalMistakes: 0,
      perfectScoresCount: 0,
    };
  }

  const totalTests = records.length;
  let totalScoreSum = 0;
  let totalQuestions = 0;
  let totalCorrect = 0;
  let perfectScoresCount = 0;

  records.forEach(r => {
    totalScoreSum += r.scorePercentage;
    totalQuestions += r.answeredCount || r.totalQuestions;
    totalCorrect += r.correctCount;
    if (r.scorePercentage === 100) {
      perfectScoresCount++;
    }
  });

  const avgScore = Math.round(totalScoreSum / totalTests);
  const totalMistakes = Math.max(0, totalQuestions - totalCorrect);

  return {
    totalTests,
    avgScore,
    totalQuestions,
    totalCorrect,
    totalMistakes,
    perfectScoresCount,
  };
}

import { Unit, Lesson, Question } from '../types.ts';
import { revisionUnit } from './revision.ts';
import { unit1 } from './unit1.ts';
import { unit2 } from './unit2.ts';
import { unit3 } from './unit3.ts';
import { shuffleQuestionOptions, shuffleArray } from '../utils/shuffle.ts';
import { getLessonQuestionBank, getLessonBankTotal, normalizePromptKey } from './lessonQuestionBank.ts';

export const allUnits: Unit[] = [
  revisionUnit,
  unit1,
  unit2,
  unit3
];

export function getLessonById(lessonId: string): { lesson: Lesson; unit: Unit } | null {
  for (const unit of allUnits) {
    const found = unit.lessons.find(l => l.id === lessonId);
    if (found) {
      return { lesson: found, unit };
    }
  }
  return null;
}

export function getAllLessons(): Lesson[] {
  return allUnits.flatMap(u => u.lessons);
}

export type QuizQuestion = Question & {
  lessonId: string;
  lessonTitle: string;
  unitId: string;
  unitTitle: string;
};

/**
 * Returns full verified exercises for a specific lesson, strictly deduplicated.
 */
export function getLessonFullExercises(lessonId: string): Question[] {
  const info = getLessonById(lessonId);
  const base = info?.lesson.exercises || [];
  const subGrammar = info?.lesson.grammarLessons?.flatMap(g => g.exercises || []) || [];
  const bank = getLessonQuestionBank(lessonId, 100);

  const seen = new Set<string>();
  const combined: Question[] = [];

  for (const q of [...base, ...subGrammar, ...bank]) {
    const key = normalizePromptKey(q.prompt);
    if (!seen.has(key)) {
      seen.add(key);
      combined.push(shuffleQuestionOptions(q));
    }
  }

  return combined;
}

/**
 * Returns all exercises across all units and question banks, ensuring options are shuffled.
 */
export function getAllExercises(): QuizQuestion[] {
  const all: QuizQuestion[] = [];
  const seen = new Set<string>();

  for (const unit of allUnits) {
    for (const lesson of unit.lessons) {
      const fullList = getLessonFullExercises(lesson.id);
      for (const ex of fullList) {
        const key = normalizePromptKey(ex.prompt);
        if (!seen.has(key)) {
          seen.add(key);
          all.push({
            ...ex,
            lessonId: lesson.id,
            lessonTitle: lesson.title,
            unitId: unit.id,
            unitTitle: unit.title
          });
        }
      }
    }
  }
  return all;
}

/**
 * Generates a targeted or comprehensive quiz based on selected scope and question count.
 * Options are guaranteed to be randomized so correct answers appear in random positions.
 */
export function generateTargetedQuiz(options: {
  scope: 'lesson' | 'unit' | 'all';
  lessonId?: string;
  unitId?: string;
  count?: number;
}): QuizQuestion[] {
  const { scope, lessonId, unitId, count = 20 } = options;

  let pool: QuizQuestion[] = [];

  if (scope === 'lesson' && lessonId) {
    const info = getLessonById(lessonId);
    const lessonTitle = info?.lesson.title || 'الدرس المحدد';
    const currentUnitId = info?.unit.id || 'unit-1';
    const unitTitle = info?.unit.title || 'الوحدة';

    // 1. Gather original exercises of this lesson
    if (info?.lesson.exercises) {
      info.lesson.exercises.forEach(q => {
        pool.push({
          ...shuffleQuestionOptions(q),
          lessonId,
          lessonTitle,
          unitId: currentUnitId,
          unitTitle
        });
      });
    }

    // 2. Gather from the 100-questions bank for this lesson
    const bankQuestions = getLessonQuestionBank(lessonId, 100);
    bankQuestions.forEach(q => {
      pool.push({
        ...q,
        lessonId,
        lessonTitle,
        unitId: currentUnitId,
        unitTitle
      });
    });
  } else if (scope === 'unit' && unitId) {
    const unit = allUnits.find(u => u.id === unitId);
    if (unit) {
      for (const lesson of unit.lessons) {
        // base exercises
        lesson.exercises.forEach(q => {
          pool.push({
            ...shuffleQuestionOptions(q),
            lessonId: lesson.id,
            lessonTitle: lesson.title,
            unitId: unit.id,
            unitTitle: unit.title
          });
        });
        // bank questions
        const bank = getLessonQuestionBank(lesson.id, 25);
        bank.forEach(q => {
          pool.push({
            ...q,
            lessonId: lesson.id,
            lessonTitle: lesson.title,
            unitId: unit.id,
            unitTitle: unit.title
          });
        });
      }
    }
  } else {
    // All curriculum
    pool = getAllExercises();
    // Add extra sample from banks of all lessons
    for (const unit of allUnits) {
      for (const lesson of unit.lessons) {
        const bankSample = getLessonQuestionBank(lesson.id, 10);
        bankSample.forEach(q => {
          pool.push({
            ...q,
            lessonId: lesson.id,
            lessonTitle: lesson.title,
            unitId: unit.id,
            unitTitle: unit.title
          });
        });
      }
    }
  }

  // Deduplicate strictly by normalized question prompt
  const seenPrompts = new Set<string>();
  const uniquePool: QuizQuestion[] = [];
  for (const q of pool) {
    const key = normalizePromptKey(q.prompt);
    if (!seenPrompts.has(key)) {
      seenPrompts.add(key);
      uniquePool.push(shuffleQuestionOptions(q));
    }
  }

  // Shuffle pool thoroughly
  const shuffled = shuffleArray(uniquePool);
  const selectedCount = Math.min(count, shuffled.length);
  return shuffled.slice(0, selectedCount);
}

/**
 * 50-Question challenge across the curriculum with randomized options
 */
export function getFiftyQuestionChallenge(): QuizQuestion[] {
  return generateTargetedQuiz({
    scope: 'all',
    count: 50
  });
}

export { getLessonQuestionBank, getLessonBankTotal };

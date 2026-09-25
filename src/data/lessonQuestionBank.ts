import { Question } from '../types.ts';
import { shuffleArray, shuffleQuestionOptions } from '../utils/shuffle.ts';
import { getRev1Questions, getRev2Questions } from './questionBanks/revBank.ts';
import {
  getU1L1Questions,
  getU1L2Questions,
  getU1L3Questions,
  getU1L4Questions,
  getU1EvalQuestions
} from './questionBanks/unit1Bank.ts';
import {
  getU2L1Questions,
  getU2L2Questions,
  getU2L3Questions,
  getU2L4Questions,
  getU2EvalQuestions
} from './questionBanks/unit2Bank.ts';
import {
  getU3L1Questions,
  getU3L2Questions,
  getU3L3Questions,
  getU3L4Questions,
  getU3EvalQuestions
} from './questionBanks/unit3Bank.ts';

/**
 * Clean Arabic prompt text for strict deduplication
 */
export function normalizePromptKey(text: string): string {
  return text
    .replace(/[\u064B-\u0652\u0670\u0640]/g, '') // strip tashkeel and tatweel
    .replace(/[إأآا]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/[«»"':;!؟?.,\(\)\[\]\-]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

/**
 * 17 lesson pools strictly tied to the Grade 5 Arabic Curriculum
 */
export const lessonQuestionPools: Record<string, (() => Question[]) | undefined> = {
  // Revision Lessons
  'rev-1': getRev1Questions,
  'rev-2': getRev2Questions,

  // Unit 1 Lessons
  'u1-l1': getU1L1Questions,
  'u1-l2': getU1L2Questions,
  'u1-l3': getU1L3Questions,
  'u1-l4': getU1L4Questions,
  'u1-eval': getU1EvalQuestions,

  // Unit 2 Lessons
  'u2-l1': getU2L1Questions,
  'u2-l2': getU2L2Questions,
  'u2-l3': getU2L3Questions,
  'u2-l4': getU2L4Questions,
  'u2-eval': getU2EvalQuestions,

  // Unit 3 Lessons
  'u3-l1': getU3L1Questions,
  'u3-l2': getU3L2Questions,
  'u3-l3': getU3L3Questions,
  'u3-l4': getU3L4Questions,
  'u3-eval': getU3EvalQuestions
};

/**
 * Returns a randomized slice of unique, non-repetitive questions for the given lesson ID.
 * Guarantees zero duplicate questions and randomized option positions.
 */
export function getLessonQuestionBank(lessonId: string, count: number = 20): Question[] {
  const poolGen = lessonQuestionPools[lessonId];
  let rawPool: Question[] = [];
  if (typeof poolGen === 'function') {
    rawPool = poolGen();
  }

  // Deduplicate strictly
  const seen = new Set<string>();
  const uniquePool: Question[] = [];
  for (const q of rawPool) {
    const key = normalizePromptKey(q.prompt);
    if (!seen.has(key)) {
      seen.add(key);
      uniquePool.push(q);
    }
  }

  // Shuffle the unique pool and randomize options
  const shuffledPool = shuffleArray(uniquePool);
  const selected = count > 0 && count < shuffledPool.length ? shuffledPool.slice(0, count) : shuffledPool;
  return selected.map(q => shuffleQuestionOptions(q));
}

/**
 * Returns the exact total count of available unique questions in the bank for this lesson
 */
export function getLessonBankTotal(lessonId: string): number {
  const poolGen = lessonQuestionPools[lessonId];
  if (typeof poolGen === 'function') {
    return poolGen().length;
  }
  return 0;
}

/**
 * Utility functions for randomizing options and array elements
 */

export function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Ensures a question's options are randomized so the correct answer
 * never predictably appears in the first position.
 */
export function shuffleQuestionOptions<T extends { options?: string[]; correctAnswer?: any; type?: string }>(question: T): T {
  if (question.type === 'mcq' && Array.isArray(question.options) && question.options.length > 1) {
    const shuffled = shuffleArray(question.options);
    return {
      ...question,
      options: shuffled,
    };
  }
  return { ...question };
}

/**
 * Shuffles questions array and all their options
 */
export function prepareShuffledQuiz<T extends { options?: string[]; correctAnswer?: any; type?: string }>(
  questions: T[],
  count?: number
): T[] {
  const shuffledPool = shuffleArray(questions);
  const selected = typeof count === 'number' && count > 0 ? shuffledPool.slice(0, count) : shuffledPool;
  return selected.map(q => shuffleQuestionOptions(q));
}

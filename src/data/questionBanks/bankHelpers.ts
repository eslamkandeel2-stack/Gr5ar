import { Question } from '../../types.ts';
import { shuffleQuestionOptions } from '../../utils/shuffle.ts';

export function createMCQ(
  id: string,
  category: string,
  prompt: string,
  correctAnswer: string,
  wrongOptions: string[],
  explanation?: string
): Question {
  return shuffleQuestionOptions({
    id,
    type: 'mcq',
    category,
    prompt,
    options: [correctAnswer, ...wrongOptions],
    correctAnswer,
    explanation: explanation || `الإجابة الصحيحة هي: "${correctAnswer}" وفقاً لمنهج اللغة العربية المقرّر.`
  });
}

export function createBool(
  id: string,
  category: string,
  prompt: string,
  correctAnswer: boolean,
  explanation?: string
): Question {
  return {
    id,
    type: 'boolean',
    category,
    prompt,
    correctAnswer,
    explanation: explanation || (correctAnswer ? 'هذه العبارة صحيحة تماماً وفقاً للدرس.' : 'هذه العبارة غير صحيحة.')
  };
}

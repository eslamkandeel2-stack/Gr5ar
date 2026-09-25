export type LessonType = 'listening' | 'reading' | 'poetry' | 'revision' | 'unit_eval';

export interface VocabItem {
  id: string;
  word: string;
  meaning: string;
  opposite?: string;
  plural?: string;
  singular?: string;
  contextSentence?: string;
  root?: string;
  wordType?: 'اسم' | 'فعل' | 'تعبير' | string;
  family?: string[];
}

export interface Question {
  id: string;
  type: 'mcq' | 'boolean' | 'matching' | 'fill_blank' | 'short_answer';
  prompt: string;
  options?: string[];
  correctAnswer: string | number | boolean | Record<string, string>;
  explanation?: string;
  pairs?: { left: string; right: string }[];
  category?: 'فهم واستيعاب' | 'مفردات ولغويات' | 'قواعد نحوية' | 'قواعد إملائية' | 'تذوق بلاغي' | 'تعبير كتابي' | string;
  lessonTitle?: string;
  unitTitle?: string;
}

export interface SubLessonSection {
  title: string;
  content: string;
  keyPoints?: string[];
  alert?: string;
}

export interface SubLessonTable {
  title?: string;
  headers: string[];
  rows: string[][];
}

export interface SubLessonExample {
  text: string;
  note: string;
  highlight?: string;
  analysis?: { word: string; role: string; marker: string }[];
}

export interface CommonMistakeItem {
  wrong: string;
  right: string;
  reason: string;
}

export interface GrammarLesson {
  id?: string;
  title: string;
  category: 'نحو' | 'إملاء' | 'بلاغة' | 'تعبير' | 'خط';
  subTitle?: string;
  objective?: string;
  rules: string[];
  detailedSections?: SubLessonSection[];
  tables?: SubLessonTable[];
  examples: SubLessonExample[];
  commonMistakes?: CommonMistakeItem[];
  tips?: string[];
  exercises?: Question[];
}

export interface PoemVerse {
  number: number;
  part1: string;
  part2: string;
  explanation: string;
  aestheticNote?: string;
}

export interface TestQuestionResult {
  questionId: string;
  prompt: string;
  type: 'mcq' | 'boolean' | 'matching' | 'fill_blank' | 'short_answer';
  userAnswer: any;
  correctAnswer: any;
  isCorrect: boolean;
  explanation?: string;
  category?: string;
  options?: string[];
  lessonTitle?: string;
  unitTitle?: string;
}

export interface TestRecord {
  id: string;
  title: string;
  scope: 'lesson' | 'quiz' | 'all';
  lessonId?: string;
  lessonTitle?: string;
  timestamp: number;
  formattedDate: string;
  totalQuestions: number;
  answeredCount: number;
  correctCount: number;
  scorePercentage: number;
  timeSpentSeconds?: number;
  questions: TestQuestionResult[];
}

export interface SavedProgressState {
  userAnswers: Record<string, any>;
  submitted: Record<string, boolean>;
  correctCount: number;
  lastUpdated: number;
  isSubmitted?: boolean;
  questionIds?: string[];
}

export interface WritingElement {
  name: string;
  desc: string;
  sample?: string;
}

export interface WritingModel {
  title: string;
  context: string;
  content: string;
  breakdown: { element: string; text: string; note?: string }[];
}

export interface WritingTopic {
  id?: string;
  title: string;
  type: string;
  subTitle?: string;
  objective?: string;
  elements: WritingElement[];
  instructions?: string[];
  modelText?: WritingModel;
  rubric?: { criteria: string; points: string; tip: string }[];
  exercises?: Question[];
}

export interface Lesson {
  id: string;
  unitId: string;
  title: string;
  subTitle?: string;
  type: LessonType;
  pagesRef?: string;
  readingText: string;
  diacriticsText?: string;
  author?: {
    name: string;
    bio: string;
    birthDeath?: string;
  };
  poemVerses?: PoemVerse[];
  vocabulary: VocabItem[];
  discussionPoints?: { question: string; answer: string }[];
  exercises: Question[];
  grammarLessons?: GrammarLesson[];
  writingTopic?: WritingTopic;
}

export interface Unit {
  id: string;
  number: number | string;
  title: string;
  theme: string;
  description: string;
  color: string;
  bgGradient: string;
  badge: string;
  lessons: Lesson[];
}

export interface AiServiceMetric {
  queries: number;
  limit: number;
  tokens: number;
  promptTokens: number;
  candidatesTokens: number;
  lastModel?: string;
  isExceeded?: boolean;
}

export interface AiUsageStats {
  date: string;
  used: number;
  limit: number;
  remaining: number;
  percent: number;
  // Real Gemini Token & API Consumption Data
  totalTokens: number;
  promptTokens: number;
  candidatesTokens: number;
  tokensLimit?: number;
  tokensPercent?: number;
  resetTimestamp: number;
  resetTimeFormatted: string;
  resetCountdown: {
    hours: number;
    minutes: number;
    seconds: number;
    formattedArabic: string;
  };
  breakdown: {
    tutorQueries: number;
    ttsGenerations: number;
    tutor?: AiServiceMetric;
    tts?: AiServiceMetric;
  };
  lastApiCall?: {
    service: 'tutor' | 'tts';
    model: string;
    promptTokens: number;
    candidatesTokens: number;
    totalTokens: number;
    timestamp: string;
  };
  quotaWarning?: {
    service: 'tutor' | 'tts';
    retryDelay?: string;
    message?: string;
  } | null;
  isExceeded: boolean;
}

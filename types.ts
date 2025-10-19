export enum Language {
  EN = 'en',
  AR = 'ar',
}

export enum View {
  LANDING = 'landing',
  TUTOR = 'tutor',
  DASHBOARD = 'dashboard',
}

export enum Theme {
  LIGHT = 'light',
  DARK = 'dark',
}

export enum MessageSender {
  USER = 'user',
  AI = 'ai',
  SYSTEM = 'system',
}

export enum TutorFlowStep {
  SUBJECT = 'subject',
  LEVEL = 'level',
  LESSONS = 'lessons',
  CHAT = 'chat',
  SUMMARY = 'summary',
}

export interface Message {
  id: string;
  sender: MessageSender;
  text: string;
}

export interface ProgressData {
  subject: string;
  lesson: string;
  level: string;
  date: string;
  summary: string;
  score?: number;
}

export interface LearningPlan {
  subject: string;
  level: string;
  lessons: string[];
  completedLessons: string[];
}

export interface QuizQuestion {
  question: string;
  options: string[];
  answer: string;
}

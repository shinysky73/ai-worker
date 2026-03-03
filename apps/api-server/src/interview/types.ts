export type JobCategory = '개발' | '디자인' | '기획/PM' | '마케팅' | '영업' | '일반/기타';

export const JOB_CATEGORIES: JobCategory[] = ['개발', '디자인', '기획/PM', '마케팅', '영업', '일반/기타'];

export type EvaluationLevel = '상' | '중' | '하';

export interface EvaluationCriteria {
  level: EvaluationLevel;
  description: string;
}

export interface InterviewQuestion {
  question: string;
  intent: string;
  goodAnswerKeywords: string[];
  evaluationCriteria: EvaluationCriteria[];
  targetCompetency: string;
}

export interface InterviewQuestionResult {
  questions: InterviewQuestion[];
  totalQuestions: number;
  jobCategory: JobCategory;
  jdSummary: string;
}

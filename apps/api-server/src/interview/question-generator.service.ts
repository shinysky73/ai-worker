import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { executeWithRetry } from '../presentation/utils/retry';
import type { JobCategory, InterviewQuestionResult, Competency } from './types';

const MAX_GENERATION_ATTEMPTS = 3;
const MIN_COMPETENCIES = 3;

@Injectable()
export class QuestionGeneratorService {
  private genAI: GoogleGenerativeAI;
  private model: ReturnType<GoogleGenerativeAI['getGenerativeModel']>;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    this.genAI = new GoogleGenerativeAI(apiKey || '');
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
  }

  async generate(jdText: string, jobCategory: JobCategory): Promise<InterviewQuestionResult> {
    const prompt = this.buildPrompt(jdText, jobCategory);

    for (let attempt = 0; attempt < MAX_GENERATION_ATTEMPTS; attempt++) {
      const result = await executeWithRetry(() =>
        this.model.generateContent([prompt]),
      );

      const text = result.response.text();
      const parsed = this.parseJson(text);

      if (!parsed || !this.isValidResult(parsed)) {
        continue;
      }

      return this.normalizeResult(parsed, jobCategory);
    }

    throw new Error('면접 질문 생성에 실패했습니다. 다시 시도해주세요.');
  }

  private buildPrompt(jdText: string, jobCategory: JobCategory): string {
    return `당신은 HR 전문가이자 면접관 코치입니다. 아래 채용 공고(JD)를 분석하여 면접 질문을 생성해주세요.

## 직무 유형: ${jobCategory}

## 채용 공고:
${jdText}

## 요구사항:
1. JD에서 핵심 역량을 3~7개 추출하세요.
2. 각 역량별로 면접 질문을 2~3개씩 생성하세요.
3. 전체 질문 수는 10~20개 범위로 맞추세요.
4. 각 질문에는 반드시 다음을 포함하세요:
   - question: 면접 질문 텍스트
   - intent: 이 질문으로 무엇을 평가하는가
   - goodAnswerKeywords: 우수 답변에 포함될 키워드 배열 (3~5개)
   - evaluationCriteria: 평가 기준 배열 (상/중/하 3단계, 각 level과 description 포함)

## 응답 형식 (JSON만 반환):
{
  "competencies": [
    {
      "name": "역량명",
      "questions": [
        {
          "question": "질문 텍스트",
          "intent": "평가 의도",
          "goodAnswerKeywords": ["키워드1", "키워드2", "키워드3"],
          "evaluationCriteria": [
            { "level": "상", "description": "우수 답변 기준" },
            { "level": "중", "description": "보통 답변 기준" },
            { "level": "하", "description": "미흡 답변 기준" }
          ]
        }
      ]
    }
  ],
  "totalQuestions": 10,
  "jobCategory": "${jobCategory}",
  "jdSummary": "JD 한줄 요약"
}

JSON만 반환해주세요. 다른 텍스트는 포함하지 마세요.`;
  }

  private parseJson(text: string): InterviewQuestionResult | null {
    let jsonStr = text.trim();
    const codeBlockMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeBlockMatch) {
      jsonStr = codeBlockMatch[1].trim();
    }

    try {
      return JSON.parse(jsonStr);
    } catch {
      return null;
    }
  }

  private isValidResult(result: InterviewQuestionResult): boolean {
    if (!result.competencies || !Array.isArray(result.competencies)) {
      return false;
    }
    if (result.competencies.length < MIN_COMPETENCIES) {
      return false;
    }
    for (const comp of result.competencies) {
      if (!comp.name || !Array.isArray(comp.questions) || comp.questions.length === 0) {
        return false;
      }
    }
    return true;
  }

  private normalizeResult(result: InterviewQuestionResult, jobCategory: JobCategory): InterviewQuestionResult {
    const competencies: Competency[] = result.competencies.map((comp) => ({
      name: comp.name || '',
      questions: (comp.questions || []).map((q) => ({
        question: q.question || '',
        intent: q.intent || '',
        goodAnswerKeywords: Array.isArray(q.goodAnswerKeywords) ? q.goodAnswerKeywords : [],
        evaluationCriteria: Array.isArray(q.evaluationCriteria)
          ? q.evaluationCriteria.map((ec) => ({
              level: ec.level || '하',
              description: ec.description || '',
            }))
          : [
              { level: '상' as const, description: '' },
              { level: '중' as const, description: '' },
              { level: '하' as const, description: '' },
            ],
      })),
    }));

    const totalQuestions = competencies.reduce((sum, c) => sum + c.questions.length, 0);

    return {
      competencies,
      totalQuestions,
      jobCategory,
      jdSummary: result.jdSummary || '',
    };
  }
}

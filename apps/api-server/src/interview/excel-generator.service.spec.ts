import { Test, TestingModule } from '@nestjs/testing';
import { InterviewExcelGeneratorService } from './excel-generator.service';
import type { InterviewQuestionResult } from './types';

const MOCK_RESULT: InterviewQuestionResult = {
  competencies: [
    {
      name: 'React 개발',
      questions: [
        {
          question: 'React의 Virtual DOM을 설명해주세요.',
          intent: 'React 핵심 개념 이해도',
          goodAnswerKeywords: ['diffing', 'reconciliation', '렌더링 최적화'],
          evaluationCriteria: [
            { level: '상', description: '동작 원리와 최적화까지 설명' },
            { level: '중', description: '기본 개념만 설명' },
            { level: '하', description: '설명 불가' },
          ],
        },
      ],
    },
    {
      name: 'TypeScript',
      questions: [
        {
          question: '제네릭 활용 경험을 말씀해주세요.',
          intent: 'TypeScript 고급 활용 능력',
          goodAnswerKeywords: ['제네릭', '타입 안전성'],
          evaluationCriteria: [
            { level: '상', description: '실제 프로젝트 사례 설명' },
            { level: '중', description: '개념만 이해' },
            { level: '하', description: '모름' },
          ],
        },
      ],
    },
    {
      name: '협업',
      questions: [
        {
          question: '코드 리뷰 갈등 해결 경험을 말씀해주세요.',
          intent: '갈등 해결 능력',
          goodAnswerKeywords: ['소통', '타협'],
          evaluationCriteria: [
            { level: '상', description: '구체적 사례 설명' },
            { level: '중', description: '일반적 답변' },
            { level: '하', description: '경험 없음' },
          ],
        },
      ],
    },
  ],
  totalQuestions: 3,
  jobCategory: '개발',
  jdSummary: 'React 프론트엔드 개발자',
};

describe('InterviewExcelGeneratorService', () => {
  let service: InterviewExcelGeneratorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [InterviewExcelGeneratorService],
    }).compile();

    service = module.get<InterviewExcelGeneratorService>(InterviewExcelGeneratorService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('shouldGenerateExcelBuffer: 면접 질문 결과를 엑셀 Buffer로 변환', async () => {
    const buffer = await service.generateInterviewExcel(MOCK_RESULT);

    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(0);
  });

  it('shouldHandleEmptyResult: 질문이 없는 경우에도 엑셀 생성', async () => {
    const emptyResult: InterviewQuestionResult = {
      competencies: [],
      totalQuestions: 0,
      jobCategory: '일반/기타',
      jdSummary: '빈 결과',
    };

    const buffer = await service.generateInterviewExcel(emptyResult);

    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(0);
  });
});

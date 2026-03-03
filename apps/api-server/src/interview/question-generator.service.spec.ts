import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { QuestionGeneratorService } from './question-generator.service';
import type { InterviewQuestionResult } from './types';

// Mock @google/generative-ai
const mockGenerateContent = jest.fn();
jest.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
    getGenerativeModel: jest.fn().mockReturnValue({
      generateContent: mockGenerateContent,
    }),
  })),
}));

// Mock retry to execute immediately
jest.mock('../presentation/utils/retry', () => ({
  executeWithRetry: jest.fn((fn) => fn()),
}));

const VALID_AI_RESPONSE: InterviewQuestionResult = {
  questions: [
    {
      question: 'React의 Virtual DOM 동작 원리를 설명해주세요.',
      intent: 'React 핵심 개념 이해도 평가',
      goodAnswerKeywords: ['diffing', 'reconciliation', '렌더링 최적화'],
      evaluationCriteria: [
        { level: '상', description: '동작 원리와 최적화 전략까지 설명' },
        { level: '중', description: '기본 개념은 설명하나 깊이 부족' },
        { level: '하', description: '개념을 설명하지 못함' },
      ],
      targetCompetency: 'React 프론트엔드 개발',
    },
    {
      question: 'useState와 useReducer의 차이점과 각각 언제 사용하는지 설명해주세요.',
      intent: '상태 관리 패턴 이해도 평가',
      goodAnswerKeywords: ['복잡한 상태', 'dispatch', 'reducer 패턴'],
      evaluationCriteria: [
        { level: '상', description: '구체적 사례와 함께 차이점 설명' },
        { level: '중', description: '차이점은 알지만 사례 부족' },
        { level: '하', description: '차이점을 모름' },
      ],
      targetCompetency: 'React 프론트엔드 개발',
    },
    {
      question: 'TypeScript의 제네릭을 활용한 경험을 말씀해주세요.',
      intent: 'TypeScript 고급 활용 능력 평가',
      goodAnswerKeywords: ['제네릭', '타입 안전성', '재사용성'],
      evaluationCriteria: [
        { level: '상', description: '실제 프로젝트 사례와 함께 설명' },
        { level: '중', description: '개념은 알지만 실무 적용 경험 부족' },
        { level: '하', description: '제네릭 개념을 모름' },
      ],
      targetCompetency: 'TypeScript 활용',
    },
    {
      question: '팀 내 코드 리뷰 프로세스에서 갈등이 생겼을 때 어떻게 해결하셨나요?',
      intent: '팀워크 및 갈등 해결 능력 평가',
      goodAnswerKeywords: ['소통', '타협', '기술적 근거'],
      evaluationCriteria: [
        { level: '상', description: '구체적 사례와 해결 과정 설명' },
        { level: '중', description: '일반적인 답변' },
        { level: '하', description: '관련 경험 없음' },
      ],
      targetCompetency: '협업 및 커뮤니케이션',
    },
    {
      question: '최근 진행한 프로젝트에서 성능 최적화를 경험한 사례를 설명해주세요.',
      intent: '성능 최적화 실무 능력 평가',
      goodAnswerKeywords: ['번들 사이즈', '렌더링 최적화', '메모이제이션'],
      evaluationCriteria: [
        { level: '상', description: '구체적 수치와 함께 최적화 과정 설명' },
        { level: '중', description: '최적화 개념은 알지만 실무 경험 부족' },
        { level: '하', description: '성능 최적화 경험 없음' },
      ],
      targetCompetency: '성능 최적화',
    },
  ],
  totalQuestions: 5,
  jobCategory: '개발',
  jdSummary: 'React/TypeScript 프론트엔드 개발자 채용',
};

describe('QuestionGeneratorService', () => {
  let service: QuestionGeneratorService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QuestionGeneratorService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('test-api-key'),
          },
        },
      ],
    }).compile();

    service = module.get<QuestionGeneratorService>(QuestionGeneratorService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generate', () => {
    it('shouldGenerateQuestionsFromJD: JD 텍스트에서 역량별 면접 질문 생성', async () => {
      mockGenerateContent.mockResolvedValue({
        response: {
          text: () => JSON.stringify(VALID_AI_RESPONSE),
        },
      });

      const result = await service.generate(
        '프론트엔드 개발자를 모집합니다. React, TypeScript 경험자 우대. 3년 이상 경력.',
        '개발',
      );

      expect(result.questions.length).toBeGreaterThanOrEqual(3);
      expect(result.totalQuestions).toBeGreaterThanOrEqual(3);
      expect(result.jobCategory).toBe('개발');
      expect(result.jdSummary).toBeTruthy();

      // Each question has required fields
      for (const q of result.questions) {
        expect(q.question).toBeTruthy();
        expect(q.intent).toBeTruthy();
        expect(q.targetCompetency).toBeTruthy();
        expect(q.goodAnswerKeywords.length).toBeGreaterThanOrEqual(1);
        expect(q.evaluationCriteria.length).toBe(3); // 상/중/하
      }
    });

    it('shouldUseDefaultCategory: 직무 유형 미지정 시 일반/기타로 처리', async () => {
      mockGenerateContent.mockResolvedValue({
        response: {
          text: () => JSON.stringify({ ...VALID_AI_RESPONSE, jobCategory: '일반/기타' }),
        },
      });

      const result = await service.generate(
        '우리 회사에 합류할 인재를 찾습니다. 성실하고 책임감 있는 분을 원합니다. 관련 경험 우대.',
        '일반/기타',
      );

      expect(result.jobCategory).toBe('일반/기타');
    });

    it('shouldHandleCodeBlockResponse: ```json 코드 블록 감싸진 응답 파싱', async () => {
      mockGenerateContent.mockResolvedValue({
        response: {
          text: () => '```json\n' + JSON.stringify(VALID_AI_RESPONSE) + '\n```',
        },
      });

      const result = await service.generate(
        '프론트엔드 개발자를 모집합니다. React, TypeScript 경험자 우대. 3년 이상 경력.',
        '개발',
      );

      expect(result.questions.length).toBeGreaterThanOrEqual(3);
    });

    it('shouldRetryOnInvalidJson: JSON 파싱 실패 시 최대 2회 재시도 후 에러', async () => {
      mockGenerateContent
        .mockResolvedValueOnce({ response: { text: () => 'not valid json' } })
        .mockResolvedValueOnce({ response: { text: () => 'still not json' } })
        .mockResolvedValueOnce({ response: { text: () => 'third try no json' } });

      await expect(
        service.generate('프론트엔드 개발자를 모집합니다. React 경험 3년 이상.', '개발'),
      ).rejects.toThrow('면접 질문 생성에 실패했습니다');
    });

    it('shouldIncludeResumeInPrompt: 이력서 제공 시 프롬프트에 이력서 포함', async () => {
      mockGenerateContent.mockResolvedValue({
        response: {
          text: () => JSON.stringify(VALID_AI_RESPONSE),
        },
      });

      await service.generate(
        '프론트엔드 개발자를 모집합니다. React, TypeScript 경험자 우대. 3년 이상 경력.',
        '개발',
        'React 3년 경력, 대규모 SPA 프로젝트 리드 경험.',
      );

      const calledPrompt = mockGenerateContent.mock.calls[0][0][0];
      expect(calledPrompt).toContain('React 3년 경력');
      expect(calledPrompt).toContain('이력서');
    });

    it('shouldNotIncludeResumeWhenNotProvided: 이력서 미제공 시 이력서 섹션 없음', async () => {
      mockGenerateContent.mockResolvedValue({
        response: {
          text: () => JSON.stringify(VALID_AI_RESPONSE),
        },
      });

      await service.generate(
        '프론트엔드 개발자를 모집합니다. React, TypeScript 경험자 우대. 3년 이상 경력.',
        '개발',
      );

      const calledPrompt = mockGenerateContent.mock.calls[0][0][0];
      expect(calledPrompt).not.toContain('지원자 이력서');
    });

    it('shouldLimitToFiveQuestions: AI가 5개 초과 생성 시 5개만 반환', async () => {
      const sixQuestions = {
        ...VALID_AI_RESPONSE,
        questions: [
          ...VALID_AI_RESPONSE.questions,
          {
            question: '여섯 번째 질문입니다.',
            intent: '추가 역량 평가',
            goodAnswerKeywords: ['키워드'],
            evaluationCriteria: [
              { level: '상', description: '우수' },
              { level: '중', description: '보통' },
              { level: '하', description: '미흡' },
            ],
            targetCompetency: '추가 역량',
          },
        ],
        totalQuestions: 6,
      };

      mockGenerateContent.mockResolvedValue({
        response: {
          text: () => JSON.stringify(sixQuestions),
        },
      });

      const result = await service.generate(
        '프론트엔드 개발자를 모집합니다. React, TypeScript 경험자 우대. 3년 이상 경력.',
        '개발',
      );

      expect(result.questions.length).toBe(5);
      expect(result.totalQuestions).toBe(5);
    });

    it('shouldValidateMinQuestions: 질문이 3개 미만이면 재시도', async () => {
      const tooFewQuestions = {
        ...VALID_AI_RESPONSE,
        questions: [VALID_AI_RESPONSE.questions[0]],
        totalQuestions: 1,
      };

      mockGenerateContent
        .mockResolvedValueOnce({ response: { text: () => JSON.stringify(tooFewQuestions) } })
        .mockResolvedValueOnce({ response: { text: () => JSON.stringify(tooFewQuestions) } })
        .mockResolvedValueOnce({ response: { text: () => JSON.stringify(VALID_AI_RESPONSE) } });

      const result = await service.generate(
        '프론트엔드 개발자를 모집합니다. React, TypeScript 경험자 우대. 3년 이상 경력.',
        '개발',
      );

      expect(result.questions.length).toBeGreaterThanOrEqual(3);
      expect(mockGenerateContent).toHaveBeenCalledTimes(3);
    });
  });
});

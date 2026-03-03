import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { InterviewService } from './interview.service';
import { QuestionGeneratorService } from './question-generator.service';
import { InterviewExcelGeneratorService } from './excel-generator.service';
import { PrismaService } from '../prisma/prisma.service';
import type { InterviewQuestionResult } from './types';

const MOCK_RESULT: InterviewQuestionResult = {
  questions: [
    {
      question: '질문1',
      intent: '의도1',
      goodAnswerKeywords: ['키워드1'],
      evaluationCriteria: [
        { level: '상', description: '우수' },
        { level: '중', description: '보통' },
        { level: '하', description: '미흡' },
      ],
      targetCompetency: 'React 개발',
    },
    {
      question: '질문2',
      intent: '의도2',
      goodAnswerKeywords: ['키워드2'],
      evaluationCriteria: [
        { level: '상', description: '우수' },
        { level: '중', description: '보통' },
        { level: '하', description: '미흡' },
      ],
      targetCompetency: 'React 개발',
    },
    {
      question: '질문3',
      intent: '의도3',
      goodAnswerKeywords: ['키워드3'],
      evaluationCriteria: [
        { level: '상', description: '우수' },
        { level: '중', description: '보통' },
        { level: '하', description: '미흡' },
      ],
      targetCompetency: 'TypeScript',
    },
    {
      question: '질문4',
      intent: '의도4',
      goodAnswerKeywords: ['키워드4'],
      evaluationCriteria: [
        { level: '상', description: '우수' },
        { level: '중', description: '보통' },
        { level: '하', description: '미흡' },
      ],
      targetCompetency: '협업',
    },
    {
      question: '질문5',
      intent: '의도5',
      goodAnswerKeywords: ['키워드5'],
      evaluationCriteria: [
        { level: '상', description: '우수' },
        { level: '중', description: '보통' },
        { level: '하', description: '미흡' },
      ],
      targetCompetency: '문제 해결',
    },
  ],
  totalQuestions: 5,
  jobCategory: '개발',
  jdSummary: 'React 프론트엔드 개발자',
};

describe('InterviewService', () => {
  let service: InterviewService;
  let questionGenerator: { generate: jest.Mock };
  let excelGenerator: { generateInterviewExcel: jest.Mock };
  let prismaService: {
    interviewHistory: {
      create: jest.Mock;
      findMany: jest.Mock;
      count: jest.Mock;
      findFirst: jest.Mock;
      delete: jest.Mock;
    };
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    questionGenerator = {
      generate: jest.fn().mockResolvedValue(MOCK_RESULT),
    };

    excelGenerator = {
      generateInterviewExcel: jest.fn().mockResolvedValue(Buffer.from('fake-excel')),
    };

    prismaService = {
      interviewHistory: {
        create: jest.fn().mockResolvedValue({ id: 'history-1' }),
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
        findFirst: jest.fn().mockResolvedValue(null),
        delete: jest.fn().mockResolvedValue(undefined),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InterviewService,
        { provide: QuestionGeneratorService, useValue: questionGenerator },
        { provide: InterviewExcelGeneratorService, useValue: excelGenerator },
        { provide: PrismaService, useValue: prismaService },
      ],
    }).compile();

    service = module.get<InterviewService>(InterviewService);
  });

  afterEach(() => {
    service.onModuleDestroy();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('submitJd', () => {
    it('shouldReturnIdOnSubmit: JD 제출 시 ID 반환', async () => {
      const result = await service.submitJd(
        '프론트엔드 개발자를 모집합니다. React, TypeScript 경험 3년 이상 우대합니다. 협업 능력 중시.',
        '개발',
        'user-1',
      );

      expect(result.id).toMatch(/^[0-9a-f]{8}-/i);
    });

    it('shouldRejectNonStringJd: jdText가 문자열이 아닌 경우 400 에러', async () => {
      await expect(
        service.submitJd(123 as any, '개발', 'user-1'),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.submitJd(null as any, '개발', 'user-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('shouldRejectShortJd: 50자 미만 JD 제출 시 400 에러', async () => {
      await expect(
        service.submitJd('짧은 JD', '개발', 'user-1'),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.submitJd('짧은 JD', '개발', 'user-1'),
      ).rejects.toThrow('채용 공고 내용이 너무 짧습니다 (최소 50자)');
    });

    it('shouldRejectLongJd: 10,000자 초과 JD 제출 시 413 에러', async () => {
      const longJd = 'A'.repeat(10001);
      await expect(
        service.submitJd(longJd, '개발', 'user-1'),
      ).rejects.toThrow('최대 10,000자까지 입력 가능합니다');
    });

    it('shouldRejectBlankJd: 공백만 있는 텍스트 제출 시 400 에러', async () => {
      await expect(
        service.submitJd('   \n  \t  ', '개발', 'user-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('shouldStripHtmlTags: HTML 태그가 포함된 텍스트에서 태그 제거', async () => {
      const htmlJd = '<p>프론트엔드 <b>개발자</b>를 모집합니다.</p><br/><script>alert("xss")</script> React, TypeScript 경험 3년 이상.';
      const result = await service.submitJd(htmlJd, '개발', 'user-1');
      expect(result.id).toBeTruthy();

      await new Promise((resolve) => setTimeout(resolve, 100));

      const calledJd = questionGenerator.generate.mock.calls[0]?.[0];
      expect(calledJd).not.toContain('<p>');
      expect(calledJd).not.toContain('<b>');
      expect(calledJd).not.toContain('<script>');
    });

    it('shouldUseDefaultCategory: 유효하지 않은 직무 유형은 일반/기타로 대체', async () => {
      const result = await service.submitJd(
        '프론트엔드 개발자를 모집합니다. React, TypeScript 경험 3년 이상 우대합니다.',
        '존재하지않는유형' as any,
        'user-1',
      );
      expect(result.id).toBeTruthy();

      await new Promise((resolve) => setTimeout(resolve, 100));

      const calledCategory = questionGenerator.generate.mock.calls[0]?.[1];
      expect(calledCategory).toBe('일반/기타');
    });

    it('shouldPassResumeTextToGenerator: resumeText가 제공되면 generator에 전달', async () => {
      const resumeText = 'React 3년 경력, TypeScript 프로젝트 다수 경험. 성능 최적화 전문.';
      await service.submitJd(
        '프론트엔드 개발자를 모집합니다. React, TypeScript 경험 3년 이상 우대합니다. 협업 능력 중시.',
        '개발',
        'user-1',
        resumeText,
      );

      await new Promise((resolve) => setTimeout(resolve, 100));

      const calledResume = questionGenerator.generate.mock.calls[0]?.[2];
      expect(calledResume).toBe(resumeText);
    });

    it('shouldStripHtmlFromResume: 이력서 HTML 태그 제거', async () => {
      const htmlResume = '<p>React <b>3년</b> 경력</p><script>alert("xss")</script> TypeScript 프로젝트 경험.';
      await service.submitJd(
        '프론트엔드 개발자를 모집합니다. React, TypeScript 경험 3년 이상 우대합니다. 협업 능력 중시.',
        '개발',
        'user-1',
        htmlResume,
      );

      await new Promise((resolve) => setTimeout(resolve, 100));

      const calledResume = questionGenerator.generate.mock.calls[0]?.[2];
      expect(calledResume).not.toContain('<p>');
      expect(calledResume).not.toContain('<b>');
      expect(calledResume).not.toContain('<script>');
    });

    it('shouldRejectLongResume: 10,000자 초과 이력서 제출 시 413 에러', async () => {
      const longResume = 'A'.repeat(10001);
      await expect(
        service.submitJd(
          '프론트엔드 개발자를 모집합니다. React, TypeScript 경험 3년 이상 우대합니다. 협업 능력 중시.',
          '개발',
          'user-1',
          longResume,
        ),
      ).rejects.toThrow('이력서는 최대 10,000자까지 입력 가능합니다');
    });

    it('shouldIgnoreEmptyResume: 빈 이력서는 undefined로 처리', async () => {
      await service.submitJd(
        '프론트엔드 개발자를 모집합니다. React, TypeScript 경험 3년 이상 우대합니다. 협업 능력 중시.',
        '개발',
        'user-1',
        '   ',
      );

      await new Promise((resolve) => setTimeout(resolve, 100));

      const calledResume = questionGenerator.generate.mock.calls[0]?.[2];
      expect(calledResume).toBeUndefined();
    });
  });

  describe('getStatus', () => {
    it('shouldReturnProcessingStatus: 처리 중 상태 반환', async () => {
      const { id } = await service.submitJd(
        '프론트엔드 개발자를 모집합니다. React, TypeScript 경험 3년 이상 우대합니다.',
        '개발',
        'user-1',
      );

      const status = await service.getStatus(id, 'user-1');
      expect(status.id).toBe(id);
      expect(['pending', 'processing', 'completed']).toContain(status.status);
    });

    it('shouldReturnCompletedWithResult: 처리 완료 후 결과 포함', async () => {
      const { id } = await service.submitJd(
        '프론트엔드 개발자를 모집합니다. React, TypeScript 경험 3년 이상 우대합니다.',
        '개발',
        'user-1',
      );

      await new Promise((resolve) => setTimeout(resolve, 200));

      const status = await service.getStatus(id, 'user-1');
      expect(status.status).toBe('completed');
      expect(status.result).toBeDefined();
      expect(status.result!.questions.length).toBeGreaterThanOrEqual(3);
    });

    it('shouldReturnPendingForUnknownId: 알 수 없는 ID는 pending 반환', async () => {
      const status = await service.getStatus('unknown-id', 'user-1');
      expect(status.status).toBe('pending');
    });

    it('shouldDenyAccessForWrongUser: 다른 사용자의 결과 조회 시 pending 반환', async () => {
      const { id } = await service.submitJd(
        '프론트엔드 개발자를 모집합니다. React, TypeScript 경험 3년 이상 우대합니다.',
        '개발',
        'user-a',
      );

      await new Promise((resolve) => setTimeout(resolve, 200));

      const status = await service.getStatus(id, 'user-b');
      expect(status.status).toBe('pending');
    });
  });

  describe('getExcelBuffer', () => {
    it('shouldReturnExcelAfterProcessing: 처리 완료 후 엑셀 Buffer 반환', async () => {
      const { id } = await service.submitJd(
        '프론트엔드 개발자를 모집합니다. React, TypeScript 경험 3년 이상 우대합니다.',
        '개발',
        'user-1',
      );

      await new Promise((resolve) => setTimeout(resolve, 200));

      const result = await service.getExcelBuffer(id, 'user-1');

      expect(result).not.toBeNull();
      expect(result!.buffer).toBeInstanceOf(Buffer);
      expect(result!.filename).toMatch(/^interview_questions_\d{8}_\d{6}\.xlsx$/);
    });

    it('shouldReturnNullForWrongUser: 다른 사용자의 엑셀 요청 시 null', async () => {
      const { id } = await service.submitJd(
        '프론트엔드 개발자를 모집합니다. React, TypeScript 경험 3년 이상 우대합니다.',
        '개발',
        'user-a',
      );

      await new Promise((resolve) => setTimeout(resolve, 200));

      const result = await service.getExcelBuffer(id, 'user-b');
      expect(result).toBeNull();
    });
  });

  describe('history - save on completion', () => {
    it('shouldSaveHistoryOnCompletion: 생성 완료 시 자동으로 히스토리 저장', async () => {
      await service.submitJd(
        '프론트엔드 개발자를 모집합니다. React, TypeScript 경험 3년 이상 우대합니다.',
        '개발',
        'user-1',
      );

      await new Promise((resolve) => setTimeout(resolve, 200));

      expect(prismaService.interviewHistory.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'user-1',
          jobCategory: '개발',
          questionCount: 5,
          hasResume: false,
        }),
      });
    });

    it('shouldSaveHasResumeTrue: 이력서 제공 시 hasResume: true로 저장', async () => {
      await service.submitJd(
        '프론트엔드 개발자를 모집합니다. React, TypeScript 경험 3년 이상 우대합니다.',
        '개발',
        'user-1',
        'React 3년 경력, TypeScript 프로젝트 다수 경험.',
      );

      await new Promise((resolve) => setTimeout(resolve, 200));

      expect(prismaService.interviewHistory.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          hasResume: true,
        }),
      });
    });
  });

  describe('error handling', () => {
    it('shouldSetErrorOnGenerationFailure: AI 생성 실패 시 에러 상태', async () => {
      questionGenerator.generate.mockRejectedValue(new Error('AI generation failed'));

      const { id } = await service.submitJd(
        '프론트엔드 개발자를 모집합니다. React, TypeScript 경험 3년 이상 우대합니다.',
        '개발',
        'user-1',
      );

      await new Promise((resolve) => setTimeout(resolve, 200));

      const status = await service.getStatus(id, 'user-1');
      expect(status.status).toBe('error');
      expect(status.error).toBeTruthy();
    });
  });

  describe('getHistoryList', () => {
    it('shouldReturnPaginatedList: 페이지네이션된 히스토리 목록 반환', async () => {
      const mockItems = [{ id: 'h1', jobCategory: '개발', questionCount: 10 }];
      prismaService.interviewHistory.findMany.mockResolvedValue(mockItems);
      prismaService.interviewHistory.count.mockResolvedValue(1);

      const result = await service.getHistoryList('user-1', 1, 10);

      expect(result).toEqual({ items: mockItems, total: 1, page: 1, limit: 10 });
      expect(prismaService.interviewHistory.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 10,
      });
    });
  });

  describe('getHistoryDetail', () => {
    it('shouldReturnDetail: 히스토리 상세 반환', async () => {
      const mockDetail = { id: 'h1', userId: 'user-1', jobCategory: '개발' };
      prismaService.interviewHistory.findFirst.mockResolvedValue(mockDetail);

      const result = await service.getHistoryDetail('user-1', 'h1');
      expect(result).toEqual(mockDetail);
    });

    it('shouldThrow404WhenNotFound: 존재하지 않는 히스토리는 404', async () => {
      prismaService.interviewHistory.findFirst.mockResolvedValue(null);
      await expect(service.getHistoryDetail('user-1', 'unknown')).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteHistory', () => {
    it('shouldDeleteHistory: 히스토리 삭제', async () => {
      const mockHistory = { id: 'h1', userId: 'user-1' };
      prismaService.interviewHistory.findFirst.mockResolvedValue(mockHistory);

      await service.deleteHistory('user-1', 'h1');
      expect(prismaService.interviewHistory.delete).toHaveBeenCalledWith({ where: { id: 'h1' } });
    });

    it('shouldThrow404WhenNotFound: 존재하지 않는 히스토리 삭제 시 404', async () => {
      prismaService.interviewHistory.findFirst.mockResolvedValue(null);
      await expect(service.deleteHistory('user-1', 'unknown')).rejects.toThrow(NotFoundException);
    });
  });

  describe('regenerateExcel', () => {
    it('shouldRegenerateExcelFromHistory: 히스토리에서 엑셀 재생성', async () => {
      const mockHistory = {
        id: 'h1',
        userId: 'user-1',
        questionsData: MOCK_RESULT,
      };
      prismaService.interviewHistory.findFirst.mockResolvedValue(mockHistory);

      const result = await service.regenerateExcel('user-1', 'h1');

      expect(result).not.toBeNull();
      expect(result!.buffer).toBeInstanceOf(Buffer);
      expect(excelGenerator.generateInterviewExcel).toHaveBeenCalledWith(MOCK_RESULT);
    });

    it('shouldThrow404WhenNotFound: 존재하지 않는 히스토리 재다운로드 시 404', async () => {
      prismaService.interviewHistory.findFirst.mockResolvedValue(null);
      await expect(service.regenerateExcel('user-1', 'unknown')).rejects.toThrow(NotFoundException);
    });
  });
});

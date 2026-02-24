import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { InterviewController } from './interview.controller';
import { InterviewService } from './interview.service';

describe('InterviewController', () => {
  let controller: InterviewController;
  let interviewService: {
    submitJd: jest.Mock;
    getStatus: jest.Mock;
    getResult: jest.Mock;
  };

  const mockUser = { id: 'user-1', email: 'test@test.com' };

  beforeEach(async () => {
    jest.clearAllMocks();

    interviewService = {
      submitJd: jest.fn().mockResolvedValue({ id: 'job-1' }),
      getStatus: jest.fn().mockResolvedValue({ id: 'job-1', status: 'completed' }),
      getResult: jest.fn().mockResolvedValue(null),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [InterviewController],
      providers: [
        { provide: InterviewService, useValue: interviewService },
      ],
    }).compile();

    controller = module.get<InterviewController>(InterviewController);
  });

  describe('POST /generate', () => {
    it('shouldReturnIdOnGenerate: JD 제출 시 { id } 반환', async () => {
      const req = { user: mockUser } as any;
      const result = await controller.generate(req, {
        jdText: '프론트엔드 개발자를 모집합니다. React, TypeScript 경험 3년 이상.',
        jobCategory: '개발',
      });

      expect(result).toEqual({ id: 'job-1' });
      expect(interviewService.submitJd).toHaveBeenCalledWith(
        '프론트엔드 개발자를 모집합니다. React, TypeScript 경험 3년 이상.',
        '개발',
        'user-1',
      );
    });

    it('shouldUseDefaultCategory: jobCategory 미전달 시 일반/기타 기본값', async () => {
      const req = { user: mockUser } as any;
      await controller.generate(req, {
        jdText: '인재를 모집합니다. 성실하고 책임감 있는 분을 원합니다.',
      } as any);

      expect(interviewService.submitJd).toHaveBeenCalledWith(
        expect.any(String),
        '일반/기타',
        'user-1',
      );
    });
  });

  describe('GET /:id/status', () => {
    it('shouldReturnStatus: 상태 조회 결과 반환', async () => {
      const req = { user: mockUser } as any;
      const result = await controller.getStatus(req, 'job-1');

      expect(result).toEqual({ id: 'job-1', status: 'completed' });
      expect(interviewService.getStatus).toHaveBeenCalledWith('job-1', 'user-1');
    });
  });
});

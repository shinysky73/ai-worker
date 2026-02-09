import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PresentationController } from './presentation.controller';
import { PresentationService, UploadOptions } from './presentation.service';
import { ConverterService } from './converter.service';
import { ScriptGeneratorService } from './script-generator.service';
import { createMockPptxFile } from './__mocks__';

describe('PresentationController', () => {
  let controller: PresentationController;
  let presentationService: jest.Mocked<PresentationService>;
  let converterService: jest.Mocked<ConverterService>;
  let scriptGeneratorService: jest.Mocked<ScriptGeneratorService>;

  beforeEach(async () => {
    const mockPresentationService = {
      uploadFile: jest.fn(),
      getStatus: jest.fn(),
      getResult: jest.fn(),
      getHistoryList: jest.fn(),
      getHistoryDetail: jest.fn(),
      deleteHistory: jest.fn(),
      saveHistory: jest.fn(),
    };

    const mockConverterService = {
      convertToPdf: jest.fn(),
      convertPdfToImages: jest.fn(),
    };

    const mockScriptGeneratorService = {
      generateScript: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PresentationController],
      providers: [
        { provide: PresentationService, useValue: mockPresentationService },
        { provide: ConverterService, useValue: mockConverterService },
        { provide: ScriptGeneratorService, useValue: mockScriptGeneratorService },
      ],
    }).compile();

    controller = module.get<PresentationController>(PresentationController);
    presentationService = module.get(PresentationService);
    converterService = module.get(ConverterService);
    scriptGeneratorService = module.get(ScriptGeneratorService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('POST /api/presentations/upload', () => {
    const mockReq = { user: { id: 'user-1' } } as any;

    it('shouldHandleFileUpload: POST /api/presentations/upload 엔드포인트', async () => {
      const mockFile = createMockPptxFile();
      presentationService.uploadFile.mockResolvedValue({
        id: 'test-uuid',
        filename: mockFile.originalname,
      });

      const result = await controller.uploadFile(mockReq, mockFile as any);

      expect(presentationService.uploadFile).toHaveBeenCalledWith(
        mockFile,
        undefined,
        'user-1',
      );
      expect(result).toEqual({
        id: 'test-uuid',
        filename: mockFile.originalname,
      });
    });
  });

  describe('GET /api/presentations/:id/status', () => {
    it('shouldReturnUploadStatus: GET /api/presentations/:id/status 엔드포인트', async () => {
      presentationService.getStatus.mockResolvedValue({
        id: 'test-uuid',
        status: 'processing',
        progress: 50,
      });

      const result = await controller.getStatus('test-uuid');

      expect(presentationService.getStatus).toHaveBeenCalledWith('test-uuid');
      expect(result).toEqual({
        id: 'test-uuid',
        status: 'processing',
        progress: 50,
      });
    });
  });

  describe('GET /api/presentations/:id/result', () => {
    it('shouldReturnGeneratedResult: GET /api/presentations/:id/result 엔드포인트', async () => {
      const mockResult = {
        id: 'test-uuid',
        slides: [
          {
            slideNumber: 1,
            script: 'This is the first slide script.',
            estimatedSeconds: 20,
          },
        ],
        totalEstimatedSeconds: 20,
      };
      presentationService.getResult.mockResolvedValue(mockResult);

      const result = await controller.getResult('test-uuid');

      expect(presentationService.getResult).toHaveBeenCalledWith('test-uuid');
      expect(result).toEqual(mockResult);
    });

    it('shouldReturn404ForNotFound: 존재하지 않는 ID에 404 반환', async () => {
      presentationService.getResult.mockResolvedValue(null);

      await expect(controller.getResult('non-existent-uuid')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('JWT Guard', () => {
    it('shouldHaveJwtGuardOnController: 컨트롤러에 JWT 가드가 적용되어 있어야 한다', () => {
      const guards = Reflect.getMetadata('__guards__', PresentationController);
      expect(guards).toBeDefined();
      expect(guards.length).toBeGreaterThan(0);

      // AuthGuard('jwt')가 적용되었는지 확인
      const guardInstance = new guards[0]();
      expect(guardInstance).toBeDefined();
    });
  });

  describe('GET /api/presentations/history', () => {
    it('shouldReturnHistoryList: 로그인 사용자의 히스토리 목록 반환', async () => {
      const mockReq = { user: { id: 'user-1' } } as any;
      const mockResult = {
        items: [{ id: 'h-1', filename: 'a.pptx' }],
        total: 1,
        page: 1,
        limit: 20,
      };
      presentationService.getHistoryList.mockResolvedValue(mockResult as any);

      const result = await controller.getHistoryList(mockReq);

      expect(presentationService.getHistoryList).toHaveBeenCalledWith('user-1', 1, 20);
      expect(result).toEqual(mockResult);
    });
  });

  describe('GET /api/presentations/history/:id', () => {
    it('shouldReturnHistoryDetail: 히스토리 상세 조회', async () => {
      const mockReq = { user: { id: 'user-1' } } as any;
      const mockHistory = { id: 'h-1', userId: 'user-1', filename: 'a.pptx' };
      presentationService.getHistoryDetail.mockResolvedValue(mockHistory as any);

      const result = await controller.getHistoryDetail(mockReq, 'h-1');

      expect(presentationService.getHistoryDetail).toHaveBeenCalledWith('user-1', 'h-1');
      expect(result).toEqual(mockHistory);
    });
  });

  describe('DELETE /api/presentations/history/:id', () => {
    it('shouldDeleteHistory: 히스토리 삭제', async () => {
      const mockReq = { user: { id: 'user-1' } } as any;
      presentationService.deleteHistory.mockResolvedValue(undefined);

      await controller.deleteHistory(mockReq, 'h-1');

      expect(presentationService.deleteHistory).toHaveBeenCalledWith('user-1', 'h-1');
    });
  });

  describe('POST /api/presentations/upload with options', () => {
    const mockReq = { user: { id: 'user-1' } } as any;

    it('shouldValidateOptions: options 파라미터 검증 (tone, targetMinutes)', async () => {
      const mockFile = createMockPptxFile();

      // Valid options should work
      presentationService.uploadFile.mockResolvedValue({
        id: 'test-uuid',
        filename: mockFile.originalname,
      });

      const validOptions: UploadOptions = { tone: 'formal', targetMinutes: 10 };
      const result = await controller.uploadFile(mockReq, mockFile as any, validOptions);

      expect(presentationService.uploadFile).toHaveBeenCalledWith(
        mockFile,
        validOptions,
        'user-1',
      );
      expect(result).toEqual({
        id: 'test-uuid',
        filename: mockFile.originalname,
      });

      // Invalid tone should throw BadRequestException
      await expect(
        controller.uploadFile(mockReq, mockFile as any, { tone: 'invalid' as any }),
      ).rejects.toThrow(BadRequestException);

      // Invalid targetMinutes (negative) should throw BadRequestException
      await expect(
        controller.uploadFile(mockReq, mockFile as any, { targetMinutes: -5 }),
      ).rejects.toThrow(BadRequestException);

      // Invalid targetMinutes (too large) should throw BadRequestException
      await expect(
        controller.uploadFile(mockReq, mockFile as any, { targetMinutes: 200 }),
      ).rejects.toThrow(BadRequestException);
    });
  });
});

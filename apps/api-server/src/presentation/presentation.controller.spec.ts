import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
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
    it('shouldHandleFileUpload: POST /api/presentations/upload 엔드포인트', async () => {
      const mockFile = createMockPptxFile();
      presentationService.uploadFile.mockResolvedValue({
        id: 'test-uuid',
        filename: mockFile.originalname,
      });

      const result = await controller.uploadFile(mockFile as any);

      expect(presentationService.uploadFile).toHaveBeenCalledWith(
        mockFile,
        undefined,
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

  describe('POST /api/presentations/upload with options', () => {
    it('shouldValidateOptions: options 파라미터 검증 (tone, targetMinutes)', async () => {
      const mockFile = createMockPptxFile();

      // Valid options should work
      presentationService.uploadFile.mockResolvedValue({
        id: 'test-uuid',
        filename: mockFile.originalname,
      });

      const validOptions: UploadOptions = { tone: 'formal', targetMinutes: 10 };
      const result = await controller.uploadFile(mockFile as any, validOptions);

      expect(presentationService.uploadFile).toHaveBeenCalledWith(
        mockFile,
        validOptions,
      );
      expect(result).toEqual({
        id: 'test-uuid',
        filename: mockFile.originalname,
      });

      // Invalid tone should throw BadRequestException
      await expect(
        controller.uploadFile(mockFile as any, { tone: 'invalid' as any }),
      ).rejects.toThrow(BadRequestException);

      // Invalid targetMinutes (negative) should throw BadRequestException
      await expect(
        controller.uploadFile(mockFile as any, { targetMinutes: -5 }),
      ).rejects.toThrow(BadRequestException);

      // Invalid targetMinutes (too large) should throw BadRequestException
      await expect(
        controller.uploadFile(mockFile as any, { targetMinutes: 200 }),
      ).rejects.toThrow(BadRequestException);
    });
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { ImageAnalysisController } from './image-analysis.controller';
import { ImageAnalysisService } from './image-analysis.service';

describe('ImageAnalysisController', () => {
  let controller: ImageAnalysisController;
  let service: {
    uploadFile: jest.Mock;
    getStatus: jest.Mock;
    getResult: jest.Mock;
  };

  beforeEach(async () => {
    service = {
      uploadFile: jest.fn(),
      getStatus: jest.fn(),
      getResult: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ImageAnalysisController],
      providers: [
        {
          provide: ImageAnalysisService,
          useValue: service,
        },
      ],
    }).compile();

    controller = module.get<ImageAnalysisController>(ImageAnalysisController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('uploadFile', () => {
    it('shouldCallServiceUpload: 파일과 옵션을 서비스에 전달', async () => {
      const mockFile = { originalname: 'test.png', mimetype: 'image/png', size: 1024, buffer: Buffer.from('test') } as any;
      const mockOptions = { detailLevel: 'detailed' as const, language: 'ko' as const };

      service.uploadFile.mockResolvedValue({ id: 'test-id', filename: 'test.png' });

      const result = await controller.uploadFile(mockFile, mockOptions);

      expect(service.uploadFile).toHaveBeenCalledWith(mockFile, mockOptions);
      expect(result.id).toBe('test-id');
    });

    it('shouldRejectInvalidDetailLevel: 유효하지 않은 detailLevel 거부', async () => {
      const mockFile = { originalname: 'test.png' } as any;
      const mockOptions = { detailLevel: 'invalid' as any };

      await expect(controller.uploadFile(mockFile, mockOptions)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('shouldRejectInvalidLanguage: 유효하지 않은 language 거부', async () => {
      const mockFile = { originalname: 'test.png' } as any;
      const mockOptions = { language: 'fr' as any };

      await expect(controller.uploadFile(mockFile, mockOptions)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('getStatus', () => {
    it('shouldReturnStatus: 상태 조회 결과 반환', async () => {
      service.getStatus.mockResolvedValue({
        id: 'test-id',
        status: 'processing',
        progress: 50,
        message: '분석 중...',
      });

      const result = await controller.getStatus('test-id');

      expect(result.status).toBe('processing');
      expect(result.progress).toBe(50);
    });
  });

  describe('getResult', () => {
    it('shouldReturnResult: 분석 결과 반환', async () => {
      service.getResult.mockResolvedValue({
        id: 'test-id',
        imageType: 'table',
        description: '표 설명',
        insights: ['인사이트'],
      });

      const result = await controller.getResult('test-id');

      expect(result.imageType).toBe('table');
    });

    it('shouldThrow404WhenNotFound: 결과 없으면 404', async () => {
      service.getResult.mockResolvedValue(null);

      await expect(controller.getResult('unknown')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});

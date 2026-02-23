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
    getHistoryList: jest.Mock;
    getHistoryDetail: jest.Mock;
    deleteHistory: jest.Mock;
    getHistoryImagePath: jest.Mock;
  };

  const mockReq = { user: { id: 'test-user-id' } } as any;

  beforeEach(async () => {
    service = {
      uploadFile: jest.fn(),
      getStatus: jest.fn(),
      getResult: jest.fn(),
      getHistoryList: jest.fn(),
      getHistoryDetail: jest.fn(),
      deleteHistory: jest.fn(),
      getHistoryImagePath: jest.fn(),
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
    it('shouldCallServiceUpload: 파일과 옵션, userId를 서비스에 전달', async () => {
      const mockFile = { originalname: 'test.png', mimetype: 'image/png', size: 1024, buffer: Buffer.from('test') } as any;
      const mockOptions = { detailLevel: 'detailed' as const, language: 'ko' as const };

      service.uploadFile.mockResolvedValue({ id: 'test-id', filename: 'test.png' });

      const result = await controller.uploadFile(mockReq, mockFile, mockOptions);

      expect(service.uploadFile).toHaveBeenCalledWith(mockFile, mockOptions, 'test-user-id');
      expect(result.id).toBe('test-id');
    });

    it('shouldRejectInvalidDetailLevel: 유효하지 않은 detailLevel 거부', async () => {
      const mockFile = { originalname: 'test.png' } as any;
      const mockOptions = { detailLevel: 'invalid' as any };

      await expect(controller.uploadFile(mockReq, mockFile, mockOptions)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('shouldRejectInvalidLanguage: 유효하지 않은 language 거부', async () => {
      const mockFile = { originalname: 'test.png' } as any;
      const mockOptions = { language: 'fr' as any };

      await expect(controller.uploadFile(mockReq, mockFile, mockOptions)).rejects.toThrow(
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

      const result = await controller.getStatus(mockReq, 'test-id');

      expect(service.getStatus).toHaveBeenCalledWith('test-id', 'test-user-id');
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

      const result = await controller.getResult(mockReq, 'test-id');

      expect(service.getResult).toHaveBeenCalledWith('test-id', 'test-user-id');
      expect(result.imageType).toBe('table');
    });

    it('shouldThrow404WhenNotFound: 결과 없으면 404', async () => {
      service.getResult.mockResolvedValue(null);

      await expect(controller.getResult(mockReq, 'unknown')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getHistoryList', () => {
    it('shouldReturnPaginatedList: 페이지네이션된 히스토리 목록 반환', async () => {
      const mockData = { items: [{ id: 'h1' }], total: 1, page: 1, limit: 20 };
      service.getHistoryList.mockResolvedValue(mockData);

      const result = await controller.getHistoryList(mockReq, '1', '20');

      expect(service.getHistoryList).toHaveBeenCalledWith('test-user-id', 1, 20);
      expect(result).toEqual(mockData);
    });

    it('shouldClampLimit: limit 상한 100 적용', async () => {
      service.getHistoryList.mockResolvedValue({ items: [], total: 0, page: 1, limit: 100 });

      await controller.getHistoryList(mockReq, '1', '9999');

      expect(service.getHistoryList).toHaveBeenCalledWith('test-user-id', 1, 100);
    });

    it('shouldHandleNaN: NaN 입력 시 기본값 사용', async () => {
      service.getHistoryList.mockResolvedValue({ items: [], total: 0, page: 1, limit: 20 });

      await controller.getHistoryList(mockReq, 'abc', 'xyz');

      expect(service.getHistoryList).toHaveBeenCalledWith('test-user-id', 1, 20);
    });
  });

  describe('getHistoryDetail', () => {
    it('shouldReturnDetail: 히스토리 상세 반환', async () => {
      const mockDetail = { id: 'h1', filename: 'test.png', description: '설명' };
      service.getHistoryDetail.mockResolvedValue(mockDetail);

      const result = await controller.getHistoryDetail(mockReq, 'h1');

      expect(service.getHistoryDetail).toHaveBeenCalledWith('test-user-id', 'h1');
      expect(result).toEqual(mockDetail);
    });
  });

  describe('deleteHistory', () => {
    it('shouldCallDelete: 히스토리 삭제 호출', async () => {
      service.deleteHistory.mockResolvedValue(undefined);

      await controller.deleteHistory(mockReq, 'h1');

      expect(service.deleteHistory).toHaveBeenCalledWith('test-user-id', 'h1');
    });
  });
});

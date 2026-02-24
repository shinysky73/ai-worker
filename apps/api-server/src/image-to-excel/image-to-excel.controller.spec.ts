import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ImageToExcelController } from './image-to-excel.controller';
import { ImageToExcelService } from './image-to-excel.service';

describe('ImageToExcelController', () => {
  let controller: ImageToExcelController;
  let service: {
    uploadFiles: jest.Mock;
    getStatus: jest.Mock;
    getExcelBuffer: jest.Mock;
    getExtractedData: jest.Mock;
    getHistoryList: jest.Mock;
    getHistoryDetail: jest.Mock;
    deleteHistory: jest.Mock;
    regenerateExcel: jest.Mock;
  };

  const mockUser = { id: 'user-1', email: 'test@test.com', name: 'Test' };
  const mockReq = { user: mockUser } as any;

  beforeEach(async () => {
    service = {
      uploadFiles: jest.fn(),
      getStatus: jest.fn(),
      getExcelBuffer: jest.fn(),
      getExtractedData: jest.fn(),
      getHistoryList: jest.fn(),
      getHistoryDetail: jest.fn(),
      deleteHistory: jest.fn(),
      regenerateExcel: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ImageToExcelController],
      providers: [
        { provide: ImageToExcelService, useValue: service },
      ],
    }).compile();

    controller = module.get<ImageToExcelController>(ImageToExcelController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('uploadFiles', () => {
    it('shouldCallServiceWithCorrectParams: 업로드 시 서비스에 올바른 파라미터 전달', async () => {
      const mockFiles = [{ originalname: 'test.png' }] as any;
      service.uploadFiles.mockResolvedValue({ id: 'uuid-1', totalFiles: 1 });

      const result = await controller.uploadFiles(mockReq, mockFiles, 'receipt');

      expect(service.uploadFiles).toHaveBeenCalledWith(mockFiles, 'receipt', 'user-1');
      expect(result.id).toBe('uuid-1');
    });

    it('shouldRejectInvalidType: 잘못된 타입은 400 에러', async () => {
      const mockFiles = [{ originalname: 'test.png' }] as any;

      await expect(controller.uploadFiles(mockReq, mockFiles, 'invoice' as any)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('getStatus', () => {
    it('shouldReturnStatus: 상태 조회', async () => {
      service.getStatus.mockResolvedValue({ id: 'uuid-1', status: 'processing', totalFiles: 3, completedFiles: 1 });

      const result = await controller.getStatus(mockReq, 'uuid-1');

      expect(result.status).toBe('processing');
      expect(service.getStatus).toHaveBeenCalledWith('uuid-1', 'user-1');
    });
  });

  describe('downloadExcel', () => {
    it('shouldSetContentDisposition: 다운로드 시 Content-Disposition 헤더 설정', async () => {
      service.getExcelBuffer.mockResolvedValue({
        buffer: Buffer.from('excel-data'),
        filename: 'receipts_20260223_120000.xlsx',
      });

      const mockRes = {
        setHeader: jest.fn(),
        send: jest.fn(),
      } as any;

      await controller.downloadExcel(mockReq, 'uuid-1', mockRes);

      expect(mockRes.setHeader).toHaveBeenCalledWith(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );
      expect(mockRes.setHeader).toHaveBeenCalledWith(
        'Content-Disposition',
        expect.stringContaining('attachment; filename='),
      );
      expect(mockRes.send).toHaveBeenCalled();
    });

    it('shouldThrow404WhenNoExcel: 엑셀이 없으면 404', async () => {
      service.getExcelBuffer.mockResolvedValue(null);

      const mockRes = { setHeader: jest.fn(), send: jest.fn() } as any;

      await expect(controller.downloadExcel(mockReq, 'uuid-1', mockRes)).rejects.toThrow(NotFoundException);
    });
  });

  describe('history', () => {
    it('shouldParsePagination: 페이지네이션 파라미터 파싱', async () => {
      service.getHistoryList.mockResolvedValue({ items: [], total: 0, page: 1, limit: 10 });

      await controller.getHistoryList(mockReq, '2', '5');

      expect(service.getHistoryList).toHaveBeenCalledWith('user-1', 2, 5);
    });

    it('shouldClampPagination: 비정상 페이지네이션 파라미터 보정', async () => {
      service.getHistoryList.mockResolvedValue({ items: [], total: 0, page: 1, limit: 10 });

      await controller.getHistoryList(mockReq, '-1', '200');

      expect(service.getHistoryList).toHaveBeenCalledWith('user-1', 1, 100);
    });
  });
});

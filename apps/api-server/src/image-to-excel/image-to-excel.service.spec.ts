import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import * as fs from 'fs/promises';
import { ImageToExcelService } from './image-to-excel.service';
import { DataExtractorService } from './data-extractor.service';
import { ExcelGeneratorService } from './excel-generator.service';
import { PrismaService } from '../prisma/prisma.service';
import type { UploadedFile } from './image-to-excel.service';

jest.mock('fs/promises');

const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a]);
const JPEG_MAGIC = Buffer.from([0xff, 0xd8, 0xff, 0xe0]);

function createMockFile(overrides: Partial<UploadedFile> = {}): UploadedFile {
  return {
    fieldname: 'files',
    originalname: 'test.png',
    encoding: '7bit',
    mimetype: 'image/png',
    size: 1024 * 100,
    buffer: PNG_MAGIC,
    ...overrides,
  };
}

describe('ImageToExcelService', () => {
  let service: ImageToExcelService;
  let dataExtractor: { extractReceipt: jest.Mock; extractNamecard: jest.Mock };
  let excelGenerator: { generateReceiptExcel: jest.Mock; generateNamecardExcel: jest.Mock };
  let prismaService: {
    imageToExcelHistory: {
      create: jest.Mock;
      findMany: jest.Mock;
      count: jest.Mock;
      findFirst: jest.Mock;
      delete: jest.Mock;
    };
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    (fs.mkdir as jest.Mock).mockResolvedValue(undefined);
    (fs.writeFile as jest.Mock).mockResolvedValue(undefined);
    (fs.unlink as jest.Mock).mockResolvedValue(undefined);

    dataExtractor = {
      extractReceipt: jest.fn().mockResolvedValue({
        data: { date: '2026-02-23', storeName: '테스트', items: '', totalAmount: '1000', paymentMethod: '카드', originalFilename: '' },
        confidence: 'high',
      }),
      extractNamecard: jest.fn().mockResolvedValue({
        data: { name: '김철수', title: '대리', company: '삼성', phone: '', email: '', address: '', originalFilename: '' },
        confidence: 'high',
      }),
    };

    excelGenerator = {
      generateReceiptExcel: jest.fn().mockResolvedValue(Buffer.from('fake-excel')),
      generateNamecardExcel: jest.fn().mockResolvedValue(Buffer.from('fake-excel')),
    };

    prismaService = {
      imageToExcelHistory: {
        create: jest.fn().mockResolvedValue({ id: 'history-1' }),
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
        findFirst: jest.fn().mockResolvedValue(null),
        delete: jest.fn().mockResolvedValue(undefined),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ImageToExcelService,
        { provide: DataExtractorService, useValue: dataExtractor },
        { provide: ExcelGeneratorService, useValue: excelGenerator },
        { provide: PrismaService, useValue: prismaService },
      ],
    }).compile();

    service = module.get<ImageToExcelService>(ImageToExcelService);
  });

  afterEach(() => {
    service.onModuleDestroy();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('uploadFiles', () => {
    it('shouldReturnUuidOnUpload: 업로드 완료 후 UUID 반환', async () => {
      const files = [createMockFile()];
      const result = await service.uploadFiles(files, 'receipt', 'user-1');

      expect(result.id).toMatch(/^[0-9a-f]{8}-/i);
      expect(result.totalFiles).toBe(1);
    });

    it('shouldRejectEmptyFileList: 파일 0개 업로드 시 400 에러', async () => {
      await expect(service.uploadFiles([], 'receipt', 'user-1')).rejects.toThrow(BadRequestException);
      await expect(service.uploadFiles([], 'receipt', 'user-1')).rejects.toThrow('최소 1개 파일을 업로드하세요');
    });

    it('shouldRejectOver20Files: 21장 이상 업로드 시 400 에러', async () => {
      const files = Array.from({ length: 21 }, () => createMockFile());
      await expect(service.uploadFiles(files, 'receipt', 'user-1')).rejects.toThrow(BadRequestException);
      await expect(service.uploadFiles(files, 'receipt', 'user-1')).rejects.toThrow('최대 20장까지 업로드 가능합니다');
    });

    it('shouldFilterInvalidFiles: 지원하지 않는 형식은 건너뛰고 유효 파일만 처리', async () => {
      const files = [
        createMockFile({ originalname: 'valid.png' }),
        createMockFile({ originalname: 'bad.gif', mimetype: 'image/gif' }),
      ];

      const result = await service.uploadFiles(files, 'receipt', 'user-1');

      // 유효한 파일만 카운트
      expect(result.totalFiles).toBe(1);
      expect(result.skippedFiles).toHaveLength(1);
      expect(result.skippedFiles![0]).toContain('bad.gif');
    });

    it('shouldSkipEmptyFiles: 0바이트 파일은 건너뜀', async () => {
      const files = [
        createMockFile({ originalname: 'valid.png' }),
        createMockFile({ originalname: 'empty.png', size: 0, buffer: Buffer.alloc(0) }),
      ];

      const result = await service.uploadFiles(files, 'receipt', 'user-1');

      expect(result.totalFiles).toBe(1);
      expect(result.skippedFiles).toHaveLength(1);
    });

    it('shouldRejectWhenAllFilesInvalid: 유효한 파일이 0개이면 400 에러', async () => {
      const files = [
        createMockFile({ originalname: 'bad.gif', mimetype: 'image/gif' }),
      ];

      await expect(service.uploadFiles(files, 'receipt', 'user-1')).rejects.toThrow(BadRequestException);
    });
  });

  describe('getStatus', () => {
    it('shouldReturnProcessingStatus: 처리 중 상태 반환', async () => {
      const files = [createMockFile()];
      const { id } = await service.uploadFiles(files, 'receipt', 'user-1');

      const status = await service.getStatus(id, 'user-1');

      expect(status.id).toBe(id);
      expect(['pending', 'processing', 'completed']).toContain(status.status);
      expect(status.totalFiles).toBe(1);
    });

    it('shouldReturnPendingForUnknownId: 알 수 없는 ID에 대해 pending 반환', async () => {
      const status = await service.getStatus('unknown-id', 'user-1');

      expect(status.status).toBe('pending');
    });

    it('shouldDenyAccessForWrongUser: 다른 사용자의 상태 조회 시 pending 반환', async () => {
      const files = [createMockFile()];
      const { id } = await service.uploadFiles(files, 'receipt', 'user-a');

      const status = await service.getStatus(id, 'user-b');

      expect(status.status).toBe('pending');
    });

    it('shouldShowIndividualImageStatus: 개별 이미지 상태 배열 포함', async () => {
      const files = [createMockFile({ originalname: 'a.png' }), createMockFile({ originalname: 'b.png' })];
      const { id } = await service.uploadFiles(files, 'receipt', 'user-1');

      // 비동기 처리 완료 대기
      await new Promise((resolve) => setTimeout(resolve, 100));

      const status = await service.getStatus(id, 'user-1');

      expect(status.images).toBeDefined();
      expect(status.images!.length).toBe(2);
    });
  });

  describe('getExcelBuffer', () => {
    it('shouldReturnExcelBufferAfterProcessing: 처리 완료 후 엑셀 Buffer 반환', async () => {
      const files = [createMockFile()];
      const { id } = await service.uploadFiles(files, 'receipt', 'user-1');

      // 비동기 처리 완료 대기
      await new Promise((resolve) => setTimeout(resolve, 200));

      const result = await service.getExcelBuffer(id, 'user-1');

      expect(result).not.toBeNull();
      expect(result!.buffer).toBeInstanceOf(Buffer);
      expect(result!.filename).toMatch(/^receipts_\d{8}_\d{6}\.xlsx$/);
    });

    it('shouldReturnNullForWrongUser: 다른 사용자의 엑셀 요청 시 null', async () => {
      const files = [createMockFile()];
      const { id } = await service.uploadFiles(files, 'receipt', 'user-a');

      await new Promise((resolve) => setTimeout(resolve, 200));

      const result = await service.getExcelBuffer(id, 'user-b');

      expect(result).toBeNull();
    });
  });

  describe('processing with errors', () => {
    it('shouldHandlePartialFailure: 일부 이미지만 실패 시 전체 상태 completed, 개별 error', async () => {
      dataExtractor.extractReceipt
        .mockResolvedValueOnce({
          data: { date: '2026-02-23', storeName: 'OK', items: '', totalAmount: '', paymentMethod: '', originalFilename: '' },
          confidence: 'high',
        })
        .mockRejectedValueOnce(new Error('Extraction failed'));

      const files = [
        createMockFile({ originalname: 'ok.png' }),
        createMockFile({ originalname: 'fail.png' }),
      ];
      const { id } = await service.uploadFiles(files, 'receipt', 'user-1');

      await new Promise((resolve) => setTimeout(resolve, 200));

      const status = await service.getStatus(id, 'user-1');

      expect(status.status).toBe('completed');
      expect(status.images!.find((img) => img.filename === 'fail.png')!.status).toBe('error');
      expect(status.images!.find((img) => img.filename === 'ok.png')!.status).toBe('completed');
    });
  });

  describe('getHistoryList', () => {
    it('shouldReturnPaginatedList: 페이지네이션된 히스토리 목록 반환', async () => {
      const mockItems = [{ id: 'h1', type: 'receipt', imageCount: 3 }];
      prismaService.imageToExcelHistory.findMany.mockResolvedValue(mockItems);
      prismaService.imageToExcelHistory.count.mockResolvedValue(1);

      const result = await service.getHistoryList('user-1', 1, 10);

      expect(result).toEqual({ items: mockItems, total: 1, page: 1, limit: 10 });
      expect(prismaService.imageToExcelHistory.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 10,
      });
    });
  });

  describe('getHistoryDetail', () => {
    it('shouldReturnDetail: 히스토리 상세 반환', async () => {
      const mockDetail = { id: 'h1', userId: 'user-1', type: 'receipt' };
      prismaService.imageToExcelHistory.findFirst.mockResolvedValue(mockDetail);

      const result = await service.getHistoryDetail('user-1', 'h1');
      expect(result).toEqual(mockDetail);
    });

    it('shouldThrow404WhenNotFound: 존재하지 않는 히스토리는 404', async () => {
      prismaService.imageToExcelHistory.findFirst.mockResolvedValue(null);
      await expect(service.getHistoryDetail('user-1', 'unknown')).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteHistory', () => {
    it('shouldDeleteHistory: 히스토리 삭제', async () => {
      const mockHistory = { id: 'h1', userId: 'user-1' };
      prismaService.imageToExcelHistory.findFirst.mockResolvedValue(mockHistory);

      await service.deleteHistory('user-1', 'h1');

      expect(prismaService.imageToExcelHistory.delete).toHaveBeenCalledWith({ where: { id: 'h1' } });
    });

    it('shouldThrow404WhenNotFound: 존재하지 않는 히스토리 삭제 시 404', async () => {
      prismaService.imageToExcelHistory.findFirst.mockResolvedValue(null);
      await expect(service.deleteHistory('user-1', 'unknown')).rejects.toThrow(NotFoundException);
    });
  });

  describe('regenerateExcel', () => {
    it('shouldRegenerateExcelFromHistory: 히스토리에서 엑셀 재생성', async () => {
      const mockHistory = {
        id: 'h1',
        userId: 'user-1',
        type: 'receipt',
        extractedData: [{ date: '2026-02-23', storeName: '테스트', items: '', totalAmount: '1000', paymentMethod: '', originalFilename: 'r.jpg' }],
        excelFilename: 'receipts_20260223_120000.xlsx',
      };
      prismaService.imageToExcelHistory.findFirst.mockResolvedValue(mockHistory);
      excelGenerator.generateReceiptExcel.mockResolvedValue(Buffer.from('regen-excel'));

      const result = await service.regenerateExcel('user-1', 'h1');

      expect(result).not.toBeNull();
      expect(result!.filename).toBe('receipts_20260223_120000.xlsx');
      expect(excelGenerator.generateReceiptExcel).toHaveBeenCalledWith(mockHistory.extractedData);
    });

    it('shouldThrow404WhenNotFound: 존재하지 않는 히스토리 재다운로드 시 404', async () => {
      prismaService.imageToExcelHistory.findFirst.mockResolvedValue(null);
      await expect(service.regenerateExcel('user-1', 'unknown')).rejects.toThrow(NotFoundException);
    });
  });
});

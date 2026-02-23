import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import * as fs from 'fs/promises';
import { ImageAnalysisService } from './image-analysis.service';
import { ImageAnalyzerService } from './image-analyzer.service';
import { PrismaService } from '../prisma/prisma.service';
import type { UploadedFile } from './image-analysis.service';

jest.mock('fs/promises');

// Magic bytes
const JPEG_MAGIC = Buffer.from([0xff, 0xd8, 0xff, 0xe0]);
const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a]);
const WEBP_MAGIC = Buffer.from([0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50]);

function createMockImageFile(overrides: Partial<UploadedFile> = {}): UploadedFile {
  return {
    fieldname: 'file',
    originalname: 'test-chart.png',
    encoding: '7bit',
    mimetype: 'image/png',
    size: 1024 * 1024, // 1MB
    buffer: PNG_MAGIC,
    ...overrides,
  };
}

describe('ImageAnalysisService', () => {
  let service: ImageAnalysisService;
  let analyzerService: { analyzeImage: jest.Mock };
  let prismaService: {
    imageAnalysisHistory: {
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
    (fs.rename as jest.Mock).mockResolvedValue(undefined);
    (fs.unlink as jest.Mock).mockResolvedValue(undefined);

    analyzerService = {
      analyzeImage: jest.fn().mockResolvedValue({
        imageType: 'chart',
        description: '막대 차트입니다.',
        insights: ['상승 추세'],
      }),
    };

    prismaService = {
      imageAnalysisHistory: {
        create: jest.fn().mockResolvedValue({ id: 'history-1' }),
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
        findFirst: jest.fn().mockResolvedValue(null),
        delete: jest.fn().mockResolvedValue(undefined),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ImageAnalysisService,
        {
          provide: ImageAnalyzerService,
          useValue: analyzerService,
        },
        {
          provide: PrismaService,
          useValue: prismaService,
        },
      ],
    }).compile();

    service = module.get<ImageAnalysisService>(ImageAnalysisService);
  });

  afterEach(() => {
    service.onModuleDestroy();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // Test 1: FR-1 AC1 — JPEG/PNG/WebP 업로드 허용
  describe('uploadFile', () => {
    it('shouldAcceptPngFile: PNG 이미지 업로드 시 UUID와 파일명 반환', async () => {
      const file = createMockImageFile();
      const result = await service.uploadFile(file);

      expect(result.id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      );
      expect(result.filename).toBe('test-chart.png');
    });

    it('shouldAcceptJpegFile: JPEG 이미지 업로드 허용', async () => {
      const file = createMockImageFile({
        originalname: 'photo.jpg',
        mimetype: 'image/jpeg',
        buffer: JPEG_MAGIC,
      });

      const result = await service.uploadFile(file);
      expect(result.id).toBeDefined();
      expect(result.filename).toBe('photo.jpg');
    });

    it('shouldAcceptWebpFile: WebP 이미지 업로드 허용', async () => {
      const file = createMockImageFile({
        originalname: 'image.webp',
        mimetype: 'image/webp',
        buffer: WEBP_MAGIC,
      });

      const result = await service.uploadFile(file);
      expect(result.id).toBeDefined();
      expect(result.filename).toBe('image.webp');
    });

    // Test 2: FR-1 AC2 — 10MB 제한
    it('shouldRejectFileTooLarge: 10MB 초과 파일 거부', async () => {
      const file = createMockImageFile({
        size: 11 * 1024 * 1024, // 11MB
      });

      await expect(service.uploadFile(file)).rejects.toThrow(BadRequestException);
      await expect(service.uploadFile(file)).rejects.toThrow(
        '파일 크기가 너무 큽니다. 10MB 이하의 파일만 업로드할 수 있습니다.',
      );
    });

    // Test 3: FR-1 AC3 — 지원하지 않는 형식 거부
    it('shouldRejectUnsupportedFormat: GIF 등 지원하지 않는 형식 거부', async () => {
      const file = createMockImageFile({
        originalname: 'animation.gif',
        mimetype: 'image/gif',
      });

      await expect(service.uploadFile(file)).rejects.toThrow(BadRequestException);
      await expect(service.uploadFile(file)).rejects.toThrow(
        '지원하지 않는 파일 형식입니다. JPEG, PNG, WebP 파일만 업로드할 수 있습니다.',
      );
    });

    // Edge Case: 0바이트 파일 거부
    it('shouldRejectEmptyFile: 빈 파일(0바이트) 업로드 거부', async () => {
      const file = createMockImageFile({
        size: 0,
        buffer: Buffer.alloc(0),
      });

      await expect(service.uploadFile(file)).rejects.toThrow(BadRequestException);
      await expect(service.uploadFile(file)).rejects.toThrow('빈 파일은 업로드할 수 없습니다.');
    });

    // Edge Case: 손상된 파일 (magic bytes 불일치)
    it('shouldRejectCorruptedFile: magic bytes 불일치 시 거부', async () => {
      const file = createMockImageFile({
        buffer: Buffer.from('not a real image file content'),
      });

      await expect(service.uploadFile(file)).rejects.toThrow(BadRequestException);
      await expect(service.uploadFile(file)).rejects.toThrow('파일이 손상되었거나 유효하지 않습니다.');
    });

    // 파일 저장 확인
    it('shouldStoreFileWithUuid: 파일을 UUID 이름으로 저장', async () => {
      const file = createMockImageFile();
      const result = await service.uploadFile(file);

      expect(fs.mkdir).toHaveBeenCalled();
      expect(fs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining(result.id),
        file.buffer,
      );
    });
  });

  // 상태 관리 테스트
  describe('getStatus', () => {
    it('shouldReturnPendingForUnknownId: 알 수 없는 ID에 대해 pending 반환', async () => {
      const status = await service.getStatus('unknown-id');
      expect(status.status).toBe('pending');
      expect(status.progress).toBe(0);
    });

    it('shouldTrackProcessingStatus: 업로드 후 상태가 추적됨', async () => {
      const file = createMockImageFile();
      const result = await service.uploadFile(file);

      // 비동기 처리가 시작되므로 잠시 대기
      await new Promise((resolve) => setTimeout(resolve, 50));

      const status = await service.getStatus(result.id);
      // processing 또는 completed 상태여야 함
      expect(['pending', 'processing', 'completed']).toContain(status.status);
    });

    it('shouldDenyAccessForWrongUser: 다른 사용자의 상태 조회 시 pending 반환', async () => {
      const file = createMockImageFile();
      const result = await service.uploadFile(file, undefined, 'user-a');

      await new Promise((resolve) => setTimeout(resolve, 50));

      const status = await service.getStatus(result.id, 'user-b');
      expect(status.status).toBe('pending');
      expect(status.progress).toBe(0);
    });
  });

  describe('getResult', () => {
    it('shouldReturnNullForUnknownId: 알 수 없는 ID에 대해 null 반환', async () => {
      const result = await service.getResult('unknown-id');
      expect(result).toBeNull();
    });

    it('shouldReturnResultAfterProcessing: 처리 완료 후 결과 반환', async () => {
      const file = createMockImageFile();
      const uploadResult = await service.uploadFile(file);

      // 비동기 처리 완료 대기
      await new Promise((resolve) => setTimeout(resolve, 100));

      const result = await service.getResult(uploadResult.id);
      expect(result).not.toBeNull();
      expect(result!.imageType).toBe('chart');
      expect(result!.description).toBe('막대 차트입니다.');
      expect(result!.insights).toEqual(['상승 추세']);
    });

    it('shouldDenyAccessForWrongUser: 다른 사용자의 결과 조회 시 null 반환', async () => {
      const file = createMockImageFile();
      const uploadResult = await service.uploadFile(file, undefined, 'user-a');

      await new Promise((resolve) => setTimeout(resolve, 100));

      const result = await service.getResult(uploadResult.id, 'user-b');
      expect(result).toBeNull();
    });
  });

  describe('getHistoryList', () => {
    it('shouldReturnPaginatedList: 페이지네이션된 목록 반환', async () => {
      const mockItems = [{ id: 'h1', filename: 'test.png' }];
      prismaService.imageAnalysisHistory.findMany.mockResolvedValue(mockItems);
      prismaService.imageAnalysisHistory.count.mockResolvedValue(1);

      const result = await service.getHistoryList('user-1', 1, 20);

      expect(result).toEqual({ items: mockItems, total: 1, page: 1, limit: 20 });
      expect(prismaService.imageAnalysisHistory.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 20,
      });
    });

    it('shouldCalculateSkipCorrectly: 페이지 2는 skip=20', async () => {
      prismaService.imageAnalysisHistory.findMany.mockResolvedValue([]);
      prismaService.imageAnalysisHistory.count.mockResolvedValue(0);

      await service.getHistoryList('user-1', 2, 20);

      expect(prismaService.imageAnalysisHistory.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 20, take: 20 }),
      );
    });
  });

  describe('getHistoryDetail', () => {
    it('shouldReturnDetail: 히스토리 상세 반환', async () => {
      const mockDetail = { id: 'h1', userId: 'user-1', filename: 'test.png' };
      prismaService.imageAnalysisHistory.findFirst.mockResolvedValue(mockDetail);

      const result = await service.getHistoryDetail('user-1', 'h1');

      expect(result).toEqual(mockDetail);
      expect(prismaService.imageAnalysisHistory.findFirst).toHaveBeenCalledWith({
        where: { id: 'h1', userId: 'user-1' },
      });
    });

    it('shouldThrow404WhenNotFound: 존재하지 않는 히스토리는 404', async () => {
      prismaService.imageAnalysisHistory.findFirst.mockResolvedValue(null);

      await expect(service.getHistoryDetail('user-1', 'unknown')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('deleteHistory', () => {
    it('shouldDeleteAndCleanupFile: 히스토리 삭제 후 이미지 파일도 정리', async () => {
      const mockHistory = { id: 'h1', userId: 'user-1', imagePath: '/uploads/image.png' };
      prismaService.imageAnalysisHistory.findFirst.mockResolvedValue(mockHistory);

      await service.deleteHistory('user-1', 'h1');

      expect(prismaService.imageAnalysisHistory.delete).toHaveBeenCalledWith({
        where: { id: 'h1' },
      });
      expect(fs.unlink).toHaveBeenCalledWith('/uploads/image.png');
    });

    it('shouldThrow404WhenNotFound: 존재하지 않는 히스토리 삭제 시 404', async () => {
      prismaService.imageAnalysisHistory.findFirst.mockResolvedValue(null);

      await expect(service.deleteHistory('user-1', 'unknown')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getHistoryImagePath', () => {
    it('shouldThrow404WhenNoImage: 이미지 없으면 404', async () => {
      prismaService.imageAnalysisHistory.findFirst.mockResolvedValue(null);

      await expect(service.getHistoryImagePath('user-1', 'unknown')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});

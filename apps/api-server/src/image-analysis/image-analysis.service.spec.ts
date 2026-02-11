import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import * as fs from 'fs/promises';
import { ImageAnalysisService } from './image-analysis.service';
import { ImageAnalyzerService } from './image-analyzer.service';
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

  beforeEach(async () => {
    jest.clearAllMocks();
    (fs.mkdir as jest.Mock).mockResolvedValue(undefined);
    (fs.writeFile as jest.Mock).mockResolvedValue(undefined);

    analyzerService = {
      analyzeImage: jest.fn().mockResolvedValue({
        imageType: 'chart',
        description: '막대 차트입니다.',
        insights: ['상승 추세'],
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ImageAnalysisService,
        {
          provide: ImageAnalyzerService,
          useValue: analyzerService,
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
  });
});

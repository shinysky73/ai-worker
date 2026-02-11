import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';

const mockExecAsync = jest.fn();

jest.mock('child_process', () => ({
  exec: jest.fn(),
}));

jest.mock('util', () => ({
  ...jest.requireActual('util'),
  promisify: jest.fn(() => mockExecAsync),
}));

const mockReaddir = jest.fn();

jest.mock('fs/promises', () => ({
  mkdir: jest.fn().mockResolvedValue(undefined),
  readdir: mockReaddir,
}));

import { ConverterService } from './converter.service';

describe('ConverterService', () => {
  let service: ConverterService;

  beforeEach(async () => {
    jest.clearAllMocks();
    mockExecAsync.mockResolvedValue({ stdout: '', stderr: '' });
    mockReaddir.mockResolvedValue([]);

    const module: TestingModule = await Test.createTestingModule({
      providers: [ConverterService],
    }).compile();

    service = module.get<ConverterService>(ConverterService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('convertToPdf', () => {
    it('shouldConvertPptxToPdf: PPTX 파일을 PDF로 변환', async () => {
      const inputPath = '/uploads/presentations/test-uuid.pptx';

      const result = await service.convertToPdf(inputPath);

      expect(mockExecAsync).toHaveBeenCalledWith(
        expect.stringContaining('soffice'),
      );
      expect(mockExecAsync).toHaveBeenCalledWith(
        expect.stringContaining('--convert-to pdf'),
      );
      expect(result).toBe('/uploads/presentations/test-uuid.pdf');
    });
  });

  describe('convertPdfToImages', () => {
    it('shouldConvertPdfToImages: PDF를 슬라이드별 PNG 이미지로 변환', async () => {
      const pdfPath = '/uploads/presentations/test-uuid.pdf';

      const result = await service.convertPdfToImages(pdfPath);

      expect(mockExecAsync).toHaveBeenCalledWith(
        expect.stringContaining('pdftoppm'),
      );
      expect(mockExecAsync).toHaveBeenCalledWith(
        expect.stringContaining('-png'),
      );
      expect(result.outputDir).toBe('/uploads/presentations/test-uuid');
    });

    it('shouldGenerateCorrectResolution: 1920x1080 해상도로 생성', async () => {
      const pdfPath = '/uploads/presentations/test-uuid.pdf';

      await service.convertPdfToImages(pdfPath);

      // 1920x1080 at 150 DPI means scale_x=1920/8.5*150=3388, scale_y=1080/11*150=1473
      // We use -scale-to-x 1920 -scale-to-y 1080 for exact dimensions
      expect(mockExecAsync).toHaveBeenCalledWith(
        expect.stringContaining('-scale-to-x 1920'),
      );
      expect(mockExecAsync).toHaveBeenCalledWith(
        expect.stringContaining('-scale-to-y 1080'),
      );
    });

    it('shouldReturnSlideCount: 변환된 슬라이드 수 반환', async () => {
      const pdfPath = '/uploads/presentations/test-uuid.pdf';
      mockReaddir.mockResolvedValue([
        'test-uuid-1.png',
        'test-uuid-2.png',
        'test-uuid-3.png',
      ]);

      const result = await service.convertPdfToImages(pdfPath);

      expect(result.slideCount).toBe(3);
    });

    it('shouldRetryOnFailure: 변환 실패 시 최대 3회 재시도', async () => {
      const pdfPath = '/uploads/presentations/test-uuid.pdf';
      mockExecAsync
        .mockRejectedValueOnce(new Error('Conversion failed'))
        .mockRejectedValueOnce(new Error('Conversion failed'))
        .mockResolvedValueOnce({ stdout: '', stderr: '' });
      mockReaddir.mockResolvedValue(['test-uuid-1.png']);

      const result = await service.convertPdfToImages(pdfPath);

      expect(mockExecAsync).toHaveBeenCalledTimes(3);
      expect(result.slideCount).toBe(1);
    });

    it('shouldRejectTooManySlides: 50장 초과 슬라이드 거부', async () => {
      const pdfPath = '/uploads/presentations/test-uuid.pdf';
      const manySlides = Array.from(
        { length: 51 },
        (_, i) => `test-uuid-${i + 1}.png`,
      );
      mockReaddir.mockResolvedValue(manySlides);

      await expect(service.convertPdfToImages(pdfPath)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.convertPdfToImages(pdfPath)).rejects.toThrow(
        'Presentation exceeds maximum slide limit of 50.',
      );
    });
  });
});

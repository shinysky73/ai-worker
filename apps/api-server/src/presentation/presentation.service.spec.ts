import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import * as fs from 'fs/promises';
import * as path from 'path';
import { PresentationService } from './presentation.service';
import {
  createMockPptxFile,
  createMockPptFile,
  createMockInvalidFile,
  createMockLargeFile,
  createMockCorruptedPptxFile,
} from './__mocks__';

jest.mock('fs/promises');

describe('PresentationService', () => {
  let service: PresentationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PresentationService],
    }).compile();

    service = module.get<PresentationService>(PresentationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('uploadFile', () => {
    it('shouldAcceptValidPptxFile: 유효한 PPTX 파일 업로드 시 UUID 반환', async () => {
      const mockFile = createMockPptxFile();

      const result = await service.uploadFile(mockFile);

      expect(result).toBeDefined();
      expect(result.id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      );
      expect(result.filename).toBe(mockFile.originalname);
    });

    it('shouldAcceptValidPptFile: 유효한 PPT 파일 업로드 시 UUID 반환', async () => {
      const mockFile = createMockPptFile();

      const result = await service.uploadFile(mockFile);

      expect(result).toBeDefined();
      expect(result.id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      );
      expect(result.filename).toBe(mockFile.originalname);
    });

    it('shouldRejectInvalidFileType: PPT/PPTX가 아닌 파일 거부', async () => {
      const mockFile = createMockInvalidFile();

      await expect(service.uploadFile(mockFile)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.uploadFile(mockFile)).rejects.toThrow(
        'Invalid file type. Only PPT and PPTX files are allowed.',
      );
    });

    it('shouldRejectFileTooLarge: 50MB 초과 파일 거부', async () => {
      const mockFile = createMockLargeFile(51);

      await expect(service.uploadFile(mockFile)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.uploadFile(mockFile)).rejects.toThrow(
        'File size exceeds the maximum limit of 50MB.',
      );
    });

    it('shouldRejectCorruptedFile: 손상된 파일 거부', async () => {
      const mockFile = createMockCorruptedPptxFile();

      await expect(service.uploadFile(mockFile)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.uploadFile(mockFile)).rejects.toThrow(
        'File appears to be corrupted or invalid.',
      );
    });

    it('shouldStoreFileWithUuid: 파일을 UUID로 저장', async () => {
      const mockFile = createMockPptxFile();
      (fs.mkdir as jest.Mock).mockResolvedValue(undefined);
      (fs.writeFile as jest.Mock).mockResolvedValue(undefined);

      const result = await service.uploadFile(mockFile);

      expect(fs.mkdir).toHaveBeenCalled();
      expect(fs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining(result.id),
        mockFile.buffer,
      );
    });
  });
});

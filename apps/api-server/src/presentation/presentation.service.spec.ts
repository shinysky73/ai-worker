import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import * as fs from 'fs/promises';
import { PresentationService } from './presentation.service';
import { ConverterService } from './converter.service';
import { ScriptGeneratorService } from './script-generator.service';
import { PrismaService } from '../prisma/prisma.service';
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
  let prismaService: {
    presentationHistory: {
      create: jest.Mock;
      findMany: jest.Mock;
      findFirst: jest.Mock;
      delete: jest.Mock;
      count: jest.Mock;
    };
  };

  beforeEach(async () => {
    prismaService = {
      presentationHistory: {
        create: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PresentationService,
        {
          provide: ConverterService,
          useValue: {
            convertToPdf: jest.fn(),
            convertPdfToImages: jest.fn(),
          },
        },
        {
          provide: ScriptGeneratorService,
          useValue: {
            analyzeSlide: jest.fn(),
            generateScriptWithContext: jest.fn(),
            refineAllScripts: jest.fn(),
          },
        },
        {
          provide: PrismaService,
          useValue: prismaService,
        },
      ],
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
        'Invalid file type. Only PPT, PPTX, and PDF files are allowed.',
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

  describe('saveHistory', () => {
    it('shouldSaveHistoryToDb: 스크립트 생성 완료 시 DB에 저장', async () => {
      const userId = 'user-1';
      const filename = 'test.pptx';
      const options = { tone: 'formal' as const, targetMinutes: 10 };
      const slides = [
        { slideNumber: 1, script: '안녕하세요', estimatedSeconds: 30 },
      ];
      const totalEstimatedSeconds = 30;

      prismaService.presentationHistory.create.mockResolvedValue({
        id: 'history-1',
        userId,
        filename,
        tone: options.tone,
        targetMinutes: options.targetMinutes,
        slides,
        totalEstimatedSeconds,
        createdAt: new Date(),
      });

      const result = await service.saveHistory(
        userId,
        filename,
        options,
        slides,
        totalEstimatedSeconds,
      );

      expect(prismaService.presentationHistory.create).toHaveBeenCalledWith({
        data: {
          userId,
          filename,
          tone: options.tone,
          targetMinutes: options.targetMinutes,
          slides,
          totalEstimatedSeconds,
        },
      });
      expect(result.id).toBe('history-1');
    });
  });

  describe('getHistoryList', () => {
    it('shouldReturnUserHistoryList: 사용자별 히스토리 목록 반환 (최신순, 페이지네이션)', async () => {
      const mockItems = [
        { id: 'h-1', userId: 'user-1', filename: 'a.pptx', createdAt: new Date() },
        { id: 'h-2', userId: 'user-1', filename: 'b.pptx', createdAt: new Date() },
      ];
      prismaService.presentationHistory.findMany.mockResolvedValue(mockItems);
      prismaService.presentationHistory.count.mockResolvedValue(2);

      const result = await service.getHistoryList('user-1', 1, 20);

      expect(prismaService.presentationHistory.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 20,
      });
      expect(result.items).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
    });
  });

  describe('getHistoryDetail', () => {
    it('shouldReturnHistoryDetail: 본인 히스토리 상세 조회', async () => {
      const mockHistory = {
        id: 'h-1',
        userId: 'user-1',
        filename: 'a.pptx',
        slides: [{ slideNumber: 1, script: '내용', estimatedSeconds: 30 }],
        totalEstimatedSeconds: 30,
      };
      prismaService.presentationHistory.findFirst.mockResolvedValue(mockHistory);

      const result = await service.getHistoryDetail('user-1', 'h-1');

      expect(prismaService.presentationHistory.findFirst).toHaveBeenCalledWith({
        where: { id: 'h-1', userId: 'user-1' },
      });
      expect(result.id).toBe('h-1');
    });

    it('shouldReturn404ForOtherUserHistory: 타 사용자 히스토리 접근 시 404', async () => {
      prismaService.presentationHistory.findFirst.mockResolvedValue(null);

      await expect(
        service.getHistoryDetail('user-2', 'h-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteHistory', () => {
    it('shouldDeleteOwnHistory: 본인 히스토리 삭제', async () => {
      prismaService.presentationHistory.findFirst.mockResolvedValue({
        id: 'h-1',
        userId: 'user-1',
      });
      prismaService.presentationHistory.delete.mockResolvedValue({});

      await service.deleteHistory('user-1', 'h-1');

      expect(prismaService.presentationHistory.delete).toHaveBeenCalledWith({
        where: { id: 'h-1' },
      });
    });

    it('shouldReturn404WhenDeletingOtherUserHistory: 타 사용자 히스토리 삭제 시 404', async () => {
      prismaService.presentationHistory.findFirst.mockResolvedValue(null);

      await expect(
        service.deleteHistory('user-2', 'h-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});

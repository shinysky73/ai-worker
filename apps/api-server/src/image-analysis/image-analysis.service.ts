import { Injectable, BadRequestException, OnModuleDestroy } from '@nestjs/common';
import { randomUUID } from 'crypto';
import * as fs from 'fs/promises';
import * as path from 'path';
import { ImageAnalyzerService } from './image-analyzer.service';
import type { ImageAnalysisResult, AnalyzeOptions } from './image-analyzer.service';

export interface UploadedFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

export interface UploadResult {
  id: string;
  filename: string;
}

export type ProcessingStatus = 'pending' | 'processing' | 'completed' | 'error';

export interface StatusResult {
  id: string;
  status: ProcessingStatus;
  progress: number;
  message?: string;
  error?: string;
}

export interface AnalysisResultWithId {
  id: string;
  filename: string;
  imageType: string;
  description: string;
  insights: string[];
}

export interface UploadOptions {
  detailLevel?: 'brief' | 'detailed';
  language?: 'ko' | 'en';
}

const ALLOWED_MIMETYPES = ['image/jpeg', 'image/png', 'image/webp'];
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const STORE_TTL_MS = 60 * 60 * 1000; // 1 hour
const CLEANUP_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes

// Magic bytes
const JPEG_MAGIC = Buffer.from([0xff, 0xd8, 0xff]);
const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47]);
const WEBP_RIFF = Buffer.from([0x52, 0x49, 0x46, 0x46]); // "RIFF"

const UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'image-analysis');

interface StoreEntry<T> {
  data: T;
  createdAt: number;
}

@Injectable()
export class ImageAnalysisService implements OnModuleDestroy {
  private statusStore = new Map<string, StoreEntry<StatusResult>>();
  private resultStore = new Map<string, StoreEntry<AnalysisResultWithId>>();
  private optionsStore = new Map<string, StoreEntry<UploadOptions>>();
  private cleanupTimer: ReturnType<typeof setInterval>;

  constructor(private readonly imageAnalyzerService: ImageAnalyzerService) {
    this.cleanupTimer = setInterval(() => this.cleanupExpiredEntries(), CLEANUP_INTERVAL_MS);
  }

  onModuleDestroy() {
    clearInterval(this.cleanupTimer);
  }

  private cleanupExpiredEntries(): void {
    const now = Date.now();
    for (const [key, entry] of this.statusStore) {
      if (now - entry.createdAt > STORE_TTL_MS) {
        this.statusStore.delete(key);
        this.resultStore.delete(key);
        this.optionsStore.delete(key);
      }
    }
  }

  private setStatus(id: string, status: StatusResult): void {
    this.statusStore.set(id, { data: status, createdAt: Date.now() });
  }

  private setResult(id: string, result: AnalysisResultWithId): void {
    this.resultStore.set(id, { data: result, createdAt: Date.now() });
  }

  async uploadFile(file: UploadedFile, options?: UploadOptions): Promise<UploadResult> {
    this.validateFileType(file);
    this.validateFileSize(file);
    this.validateFileIntegrity(file);

    const id = randomUUID();
    const decodedFilename = Buffer.from(file.originalname, 'latin1').toString('utf8');
    const ext = path.extname(file.originalname).toLowerCase();

    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      throw new BadRequestException(
        '지원하지 않는 파일 형식입니다. JPEG, PNG, WebP 파일만 업로드할 수 있습니다.',
      );
    }

    const filePath = path.join(UPLOAD_DIR, `${id}${ext}`);
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
    await fs.writeFile(filePath, file.buffer);

    this.setStatus(id, { id, status: 'pending', progress: 0 });

    if (options) {
      this.optionsStore.set(id, { data: options, createdAt: Date.now() });
    }

    // Start async processing
    this.processImage(id, filePath, decodedFilename);

    return { id, filename: decodedFilename };
  }

  private validateFileType(file: UploadedFile): void {
    if (!ALLOWED_MIMETYPES.includes(file.mimetype)) {
      throw new BadRequestException(
        '지원하지 않는 파일 형식입니다. JPEG, PNG, WebP 파일만 업로드할 수 있습니다.',
      );
    }
  }

  private validateFileSize(file: UploadedFile): void {
    if (file.size === 0) {
      throw new BadRequestException('빈 파일은 업로드할 수 없습니다.');
    }
    if (file.size > MAX_FILE_SIZE) {
      throw new BadRequestException(
        '파일 크기가 너무 큽니다. 10MB 이하의 파일만 업로드할 수 있습니다.',
      );
    }
  }

  private validateFileIntegrity(file: UploadedFile): void {
    if (file.buffer.length < 4) {
      throw new BadRequestException('파일이 손상되었거나 유효하지 않습니다.');
    }

    const isJpeg = file.mimetype === 'image/jpeg' &&
      file.buffer.subarray(0, 3).equals(JPEG_MAGIC);
    const isPng = file.mimetype === 'image/png' &&
      file.buffer.subarray(0, 4).equals(PNG_MAGIC);
    const isWebp = file.mimetype === 'image/webp' &&
      file.buffer.subarray(0, 4).equals(WEBP_RIFF);

    if (!isJpeg && !isPng && !isWebp) {
      throw new BadRequestException('파일이 손상되었거나 유효하지 않습니다.');
    }
  }

  private async processImage(id: string, filePath: string, filename: string): Promise<void> {
    const optionsEntry = this.optionsStore.get(id);
    const options = optionsEntry?.data || {};

    try {
      this.setStatus(id, { id, status: 'processing', progress: 10, message: '이미지를 분석하고 있습니다...' });

      const analyzeOptions: AnalyzeOptions = {
        detailLevel: options.detailLevel || 'detailed',
        language: options.language || 'ko',
      };

      const analysisResult: ImageAnalysisResult = await this.imageAnalyzerService.analyzeImage(
        filePath,
        analyzeOptions,
      );

      this.setStatus(id, { id, status: 'processing', progress: 90, message: '분석 완료 처리 중...' });

      this.setResult(id, {
        id,
        filename,
        imageType: analysisResult.imageType,
        description: analysisResult.description,
        insights: analysisResult.insights,
      });

      this.setStatus(id, { id, status: 'completed', progress: 100, message: '분석 완료!' });
    } catch (error) {
      this.setStatus(id, {
        id,
        status: 'error',
        progress: 0,
        message: '분석 중 오류 발생',
        error: error instanceof Error ? error.message : '분석에 실패했습니다.',
      });
    }
  }

  async getStatus(id: string): Promise<StatusResult> {
    const entry = this.statusStore.get(id);
    if (!entry) {
      return { id, status: 'pending', progress: 0 };
    }
    return entry.data;
  }

  async getResult(id: string): Promise<AnalysisResultWithId | null> {
    const entry = this.resultStore.get(id);
    return entry?.data || null;
  }
}

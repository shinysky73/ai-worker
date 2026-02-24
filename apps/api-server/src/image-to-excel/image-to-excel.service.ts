import { Injectable, BadRequestException, NotFoundException, OnModuleDestroy } from '@nestjs/common';
import { randomUUID } from 'crypto';
import * as fs from 'fs/promises';
import * as path from 'path';
import { DataExtractorService } from './data-extractor.service';
import { ExcelGeneratorService } from './excel-generator.service';
import { PrismaService } from '../prisma/prisma.service';
import type { ImageToExcelType, ReceiptData, NamecardData } from './types';

export interface UploadedFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

export type ProcessingStatus = 'pending' | 'processing' | 'completed' | 'error';

export interface ImageStatus {
  filename: string;
  status: ProcessingStatus;
  error?: string;
}

export interface StatusResult {
  id: string;
  status: ProcessingStatus;
  totalFiles: number;
  completedFiles: number;
  images?: ImageStatus[];
  error?: string;
}

export interface UploadResult {
  id: string;
  totalFiles: number;
  skippedFiles?: string[];
}

export interface ExcelResult {
  buffer: Buffer;
  filename: string;
}

const ALLOWED_MIMETYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILES = 20;
const UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'image-to-excel');
const STORE_TTL_MS = 60 * 60 * 1000;
const CLEANUP_INTERVAL_MS = 10 * 60 * 1000;

interface StoreEntry<T> {
  data: T;
  createdAt: number;
}

interface JobData {
  type: ImageToExcelType;
  userId: string;
  filePaths: string[];
  filenames: string[];
  imageStatuses: ImageStatus[];
  receiptData?: ReceiptData[];
  namecardData?: NamecardData[];
  excelBuffer?: Buffer;
  excelFilename?: string;
}

@Injectable()
export class ImageToExcelService implements OnModuleDestroy {
  private statusStore = new Map<string, StoreEntry<StatusResult>>();
  private jobStore = new Map<string, StoreEntry<JobData>>();
  private cleanupTimer: ReturnType<typeof setInterval>;

  constructor(
    private readonly dataExtractor: DataExtractorService,
    private readonly excelGenerator: ExcelGeneratorService,
    private readonly prismaService: PrismaService,
  ) {
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
        this.jobStore.delete(key);
      }
    }
  }

  async uploadFiles(files: UploadedFile[], type: ImageToExcelType, userId: string): Promise<UploadResult> {
    if (!files || files.length === 0) {
      throw new BadRequestException('최소 1개 파일을 업로드하세요');
    }
    if (files.length > MAX_FILES) {
      throw new BadRequestException('최대 20장까지 업로드 가능합니다');
    }

    const validFiles: UploadedFile[] = [];
    const skippedFiles: string[] = [];

    for (const file of files) {
      const filename = Buffer.from(file.originalname, 'latin1').toString('utf8');
      if (!ALLOWED_MIMETYPES.includes(file.mimetype)) {
        skippedFiles.push(`${filename}: 지원하지 않는 형식`);
        continue;
      }
      if (file.size === 0 || file.buffer.length === 0) {
        skippedFiles.push(`${filename}: 빈 파일`);
        continue;
      }
      validFiles.push(file);
    }

    if (validFiles.length === 0) {
      throw new BadRequestException('유효한 이미지 파일이 없습니다');
    }

    const id = randomUUID();
    const filePaths: string[] = [];
    const filenames: string[] = [];
    const imageStatuses: ImageStatus[] = [];

    await fs.mkdir(UPLOAD_DIR, { recursive: true });

    for (const file of validFiles) {
      const filename = Buffer.from(file.originalname, 'latin1').toString('utf8');
      const ext = path.extname(file.originalname).toLowerCase() || '.png';
      const filePath = path.join(UPLOAD_DIR, `${id}_${filenames.length}${ext}`);
      await fs.writeFile(filePath, file.buffer);
      filePaths.push(filePath);
      filenames.push(filename);
      imageStatuses.push({ filename, status: 'pending' });
    }

    const statusResult: StatusResult = {
      id,
      status: 'pending',
      totalFiles: validFiles.length,
      completedFiles: 0,
      images: imageStatuses,
    };

    this.statusStore.set(id, { data: statusResult, createdAt: Date.now() });
    this.jobStore.set(id, {
      data: { type, userId, filePaths, filenames, imageStatuses },
      createdAt: Date.now(),
    });

    // Start async processing
    this.processFiles(id).catch((err) => {
      console.error(`[${id}] Unhandled error in processFiles:`, err);
    });

    return {
      id,
      totalFiles: validFiles.length,
      skippedFiles: skippedFiles.length > 0 ? skippedFiles : undefined,
    };
  }

  private async processFiles(id: string): Promise<void> {
    const jobEntry = this.jobStore.get(id);
    if (!jobEntry) return;

    const job = jobEntry.data;
    const receiptData: ReceiptData[] = [];
    const namecardData: NamecardData[] = [];
    let completedCount = 0;

    this.updateStatus(id, { status: 'processing' });

    for (let i = 0; i < job.filePaths.length; i++) {
      job.imageStatuses[i].status = 'processing';
      this.updateStatus(id, {});

      try {
        if (job.type === 'receipt') {
          const result = await this.dataExtractor.extractReceipt(job.filePaths[i], job.filenames[i]);
          result.data.originalFilename = job.filenames[i];
          receiptData.push(result.data);
        } else {
          const result = await this.dataExtractor.extractNamecard(job.filePaths[i], job.filenames[i]);
          result.data.originalFilename = job.filenames[i];
          namecardData.push(result.data);
        }
        job.imageStatuses[i].status = 'completed';
        completedCount++;
      } catch (err) {
        job.imageStatuses[i].status = 'error';
        job.imageStatuses[i].error = err instanceof Error ? err.message : 'Unknown error';
        completedCount++;
      }

      this.updateStatus(id, { completedFiles: completedCount });
    }

    // Generate Excel
    try {
      const now = new Date();
      const timestamp = now.getFullYear().toString() +
        String(now.getMonth() + 1).padStart(2, '0') +
        String(now.getDate()).padStart(2, '0') + '_' +
        String(now.getHours()).padStart(2, '0') +
        String(now.getMinutes()).padStart(2, '0') +
        String(now.getSeconds()).padStart(2, '0');

      let excelBuffer: Buffer;
      let excelFilename: string;

      if (job.type === 'receipt') {
        excelBuffer = await this.excelGenerator.generateReceiptExcel(receiptData);
        excelFilename = `receipts_${timestamp}.xlsx`;
      } else {
        excelBuffer = await this.excelGenerator.generateNamecardExcel(namecardData);
        excelFilename = `namecards_${timestamp}.xlsx`;
      }

      job.receiptData = receiptData;
      job.namecardData = namecardData;
      job.excelBuffer = excelBuffer;
      job.excelFilename = excelFilename;

      this.updateStatus(id, { status: 'completed', completedFiles: job.filePaths.length });

      // Save history
      try {
        await this.prismaService.imageToExcelHistory.create({
          data: {
            userId: job.userId,
            type: job.type,
            imageCount: job.filePaths.length,
            extractedData: JSON.parse(JSON.stringify(job.type === 'receipt' ? receiptData : namecardData)),
            excelFilename,
          },
        });
      } catch (historyError) {
        console.error(`[${id}] Failed to save history:`, historyError);
      }
    } catch (err) {
      this.updateStatus(id, { status: 'error', error: err instanceof Error ? err.message : 'Excel 생성 실패' });
    }

    // Cleanup temp files
    for (const filePath of job.filePaths) {
      await fs.unlink(filePath).catch(() => {});
    }
  }

  private updateStatus(id: string, updates: Partial<StatusResult>): void {
    const entry = this.statusStore.get(id);
    if (!entry) return;

    const jobEntry = this.jobStore.get(id);
    const current = entry.data;
    const updated: StatusResult = {
      ...current,
      ...updates,
      images: jobEntry?.data.imageStatuses ? [...jobEntry.data.imageStatuses] : current.images,
    };

    this.statusStore.set(id, { data: updated, createdAt: entry.createdAt });
  }

  async getStatus(id: string, userId: string): Promise<StatusResult> {
    const jobEntry = this.jobStore.get(id);
    if (jobEntry && jobEntry.data.userId !== userId) {
      return { id, status: 'pending', totalFiles: 0, completedFiles: 0 };
    }

    const entry = this.statusStore.get(id);
    if (!entry) {
      return { id, status: 'pending', totalFiles: 0, completedFiles: 0 };
    }

    return entry.data;
  }

  async getExcelBuffer(id: string, userId: string): Promise<ExcelResult | null> {
    const jobEntry = this.jobStore.get(id);
    if (!jobEntry || jobEntry.data.userId !== userId) {
      return null;
    }

    const job = jobEntry.data;
    if (!job.excelBuffer || !job.excelFilename) {
      return null;
    }

    return { buffer: job.excelBuffer, filename: job.excelFilename };
  }

  async getExtractedData(id: string, userId: string): Promise<{ type: ImageToExcelType; data: (ReceiptData | NamecardData)[] } | null> {
    const jobEntry = this.jobStore.get(id);
    if (!jobEntry || jobEntry.data.userId !== userId) {
      return null;
    }

    const job = jobEntry.data;
    return {
      type: job.type,
      data: job.type === 'receipt' ? (job.receiptData || []) : (job.namecardData || []),
    };
  }

  async getHistoryList(userId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.prismaService.imageToExcelHistory.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prismaService.imageToExcelHistory.count({ where: { userId } }),
    ]);
    return { items, total, page, limit };
  }

  async getHistoryDetail(userId: string, historyId: string) {
    const history = await this.prismaService.imageToExcelHistory.findFirst({
      where: { id: historyId, userId },
    });
    if (!history) throw new NotFoundException('History not found');
    return history;
  }

  async deleteHistory(userId: string, historyId: string) {
    const history = await this.prismaService.imageToExcelHistory.findFirst({
      where: { id: historyId, userId },
    });
    if (!history) throw new NotFoundException('History not found');
    await this.prismaService.imageToExcelHistory.delete({ where: { id: historyId } });
  }

  async regenerateExcel(userId: string, historyId: string): Promise<ExcelResult | null> {
    const history = await this.prismaService.imageToExcelHistory.findFirst({
      where: { id: historyId, userId },
    });
    if (!history) throw new NotFoundException('History not found');

    const extractedData = history.extractedData as unknown;
    const type = history.type as ImageToExcelType;

    let buffer: Buffer;
    if (type === 'receipt') {
      buffer = await this.excelGenerator.generateReceiptExcel(extractedData as ReceiptData[]);
    } else {
      buffer = await this.excelGenerator.generateNamecardExcel(extractedData as NamecardData[]);
    }

    return { buffer, filename: history.excelFilename };
  }
}

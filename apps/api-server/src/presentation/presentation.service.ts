import { Injectable, BadRequestException, NotFoundException, OnModuleDestroy } from '@nestjs/common';
import { randomUUID } from 'crypto';
import * as fs from 'fs/promises';
import * as path from 'path';
import { ConverterService } from './converter.service';
import { ScriptGeneratorService } from './script-generator.service';
import type { SlideAnalysis, SlideScript } from './script-generator.service';
import { PrismaService } from '../prisma/prisma.service';

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

export interface UploadOptions {
  tone?: 'formal' | 'casual';
  targetMinutes?: number;
}

export type ProcessingStatus = 'pending' | 'processing' | 'completed' | 'error';

export interface StatusResult {
  id: string;
  status: ProcessingStatus;
  progress: number;
  message?: string;
  error?: string;
}

export interface SlideResult {
  slideNumber: number;
  script: string;
  estimatedSeconds: number;
  transition?: string;
}

export interface PresentationResult {
  id: string;
  slides: SlideResult[];
  totalEstimatedSeconds: number;
}

const ALLOWED_MIMETYPES = [
  'application/vnd.openxmlformats-officedocument.presentationml.presentation', // PPTX
  'application/vnd.ms-powerpoint', // PPT
  'application/pdf', // PDF
];

const ALLOWED_EXTENSIONS = ['.ppt', '.pptx', '.pdf'];

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const STORE_TTL_MS = 60 * 60 * 1000; // 1 hour
const CLEANUP_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes
const MAX_ANALYSIS_CONCURRENCY = 3; // Max concurrent analysis API calls

// PPTX files are ZIP archives starting with "PK" signature
const PPTX_MAGIC_BYTES = Buffer.from([0x50, 0x4b]); // "PK"
// PPT files (OLE2 format) start with this signature
const PPT_MAGIC_BYTES = Buffer.from([0xd0, 0xcf, 0x11, 0xe0]);
// PDF files start with "%PDF"
const PDF_MAGIC_BYTES = Buffer.from([0x25, 0x50, 0x44, 0x46]);

const UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'presentations');

interface StoreEntry<T> {
  data: T;
  createdAt: number;
}

interface UploadMeta {
  userId: string;
  filename: string;
}

@Injectable()
export class PresentationService implements OnModuleDestroy {
  private statusStore = new Map<string, StoreEntry<StatusResult>>();
  private resultStore = new Map<string, StoreEntry<PresentationResult>>();
  private optionsStore = new Map<string, StoreEntry<UploadOptions>>();
  private metaStore = new Map<string, StoreEntry<UploadMeta>>();
  private cleanupTimer: ReturnType<typeof setInterval>;

  constructor(
    private readonly converterService: ConverterService,
    private readonly scriptGeneratorService: ScriptGeneratorService,
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
        this.resultStore.delete(key);
        this.optionsStore.delete(key);
        this.metaStore.delete(key);
      }
    }
  }

  private setStatus(id: string, status: StatusResult): void {
    this.statusStore.set(id, { data: status, createdAt: Date.now() });
  }

  private setResult(id: string, result: PresentationResult): void {
    this.resultStore.set(id, { data: result, createdAt: Date.now() });
  }

  private setOptions(id: string, options: UploadOptions): void {
    this.optionsStore.set(id, { data: options, createdAt: Date.now() });
  }

  async uploadFile(
    file: UploadedFile,
    options?: UploadOptions,
    userId?: string,
  ): Promise<UploadResult> {
    this.validateFileType(file);
    this.validateFileSize(file);
    this.validateFileIntegrity(file);

    const id = randomUUID();
    const decodedFilename = Buffer.from(file.originalname, 'latin1').toString('utf8');

    if (userId) {
      this.metaStore.set(id, { data: { userId, filename: decodedFilename }, createdAt: Date.now() });
    }

    await this.storeFile(id, file, options);

    return {
      id,
      filename: decodedFilename,
    };
  }

  private validateFileType(file: UploadedFile): void {
    if (!ALLOWED_MIMETYPES.includes(file.mimetype)) {
      throw new BadRequestException(
        'Invalid file type. Only PPT, PPTX, and PDF files are allowed.',
      );
    }
  }

  private validateFileSize(file: UploadedFile): void {
    if (file.size > MAX_FILE_SIZE) {
      throw new BadRequestException(
        'File size exceeds the maximum limit of 50MB.',
      );
    }
  }

  private validateFileIntegrity(file: UploadedFile): void {
    const isPdf = file.mimetype === 'application/pdf';
    const isPptx = file.mimetype.includes('presentationml.presentation');
    const magicBytes = isPdf ? PDF_MAGIC_BYTES : isPptx ? PPTX_MAGIC_BYTES : PPT_MAGIC_BYTES;

    if (file.buffer.length < magicBytes.length) {
      throw new BadRequestException('File appears to be corrupted or invalid.');
    }

    const fileHeader = file.buffer.subarray(0, magicBytes.length);
    if (!fileHeader.equals(magicBytes)) {
      throw new BadRequestException('File appears to be corrupted or invalid.');
    }
  }

  private async storeFile(id: string, file: UploadedFile, options?: UploadOptions): Promise<void> {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      throw new BadRequestException('Invalid file extension.');
    }
    const filePath = path.join(UPLOAD_DIR, `${id}${ext}`);

    await fs.mkdir(UPLOAD_DIR, { recursive: true });
    await fs.writeFile(filePath, file.buffer);

    this.setStatus(id, {
      id,
      status: 'pending',
      progress: 0,
    });

    if (options) {
      this.setOptions(id, options);
    }

    // Start async processing
    this.processPresentation(id, filePath).catch((err) => {
      console.error(`[${id}] Unhandled error in processPresentation:`, err);
    });
  }

  // ────────────────────────────────────────────
  // Main Pipeline
  // ────────────────────────────────────────────
  //
  // Progress allocation:
  //   0-15%  : PPT → PDF → Images conversion
  //  15-45%  : Step 1 — Slide analysis (parallel)
  //  45-80%  : Step 2 — Script generation with context (sequential)
  //  80-95%  : Step 3 — Post-processing refinement
  //  95-100% : Done
  // ────────────────────────────────────────────

  private async processPresentation(id: string, filePath: string): Promise<void> {
    const optionsEntry = this.optionsStore.get(id);
    const options = optionsEntry?.data || {};

    try {
      this.setStatus(id, { id, status: 'processing', progress: 2, message: '처리 준비 중...' });

      // ── Conversion: File → PDF → Images (0-15%) ──
      const isPdf = filePath.toLowerCase().endsWith('.pdf');
      let pdfPath: string;

      if (isPdf) {
        console.log(`[${id}] PDF file detected, skipping conversion.`);
        pdfPath = filePath;
        this.setStatus(id, { id, status: 'processing', progress: 8, message: 'PDF 파일 확인 완료' });
      } else {
        console.log(`[${id}] Converting PPT to PDF...`);
        this.setStatus(id, { id, status: 'processing', progress: 5, message: 'PPT를 PDF로 변환 중...' });
        pdfPath = await this.converterService.convertToPdf(filePath);
      }

      console.log(`[${id}] Converting PDF to images...`);
      this.setStatus(id, { id, status: 'processing', progress: 10, message: 'PDF를 이미지로 변환 중...' });
      const { images, slideCount } = await this.converterService.convertPdfToImages(pdfPath);
      this.setStatus(id, { id, status: 'processing', progress: 15, message: `${slideCount}개 슬라이드 이미지 생성 완료` });

      const targetSecondsPerSlide = options.targetMinutes
        ? (options.targetMinutes * 60) / slideCount
        : undefined;

      // ── Step 1: Slide Analysis — parallel (15-45%) ──
      console.log(`[${id}] Step 1: Analyzing ${slideCount} slides...`);
      this.setStatus(id, { id, status: 'processing', progress: 16, message: '슬라이드 분석 중...' });

      const analyses = await this.analyzeSlidesConcurrently(id, images, slideCount);
      this.setStatus(id, { id, status: 'processing', progress: 45, message: '슬라이드 분석 완료' });

      // ── Step 2: Script Generation with context — sequential (45-80%) ──
      console.log(`[${id}] Step 2: Generating scripts with context...`);
      this.setStatus(id, { id, status: 'processing', progress: 46, message: '맥락 기반 스크립트 생성 중...' });

      const scripts = await this.generateScriptsSequentially(
        id, analyses, slideCount, options, targetSecondsPerSlide,
      );
      this.setStatus(id, { id, status: 'processing', progress: 80, message: '개별 스크립트 생성 완료' });

      // ── Step 3: Post-processing refinement (80-95%) ──
      console.log(`[${id}] Step 3: Refining all scripts...`);
      this.setStatus(id, { id, status: 'processing', progress: 82, message: '전체 스크립트 다듬는 중...' });

      const refined = await this.scriptGeneratorService.refineAllScripts(
        scripts, analyses, {
          tone: options.tone,
          targetSecondsPerSlide,
          totalSlideCount: slideCount,
        },
      );
      this.setStatus(id, { id, status: 'processing', progress: 95, message: '스크립트 최적화 완료' });

      // ── Store final result (100%) ──
      const slides: SlideResult[] = refined.slides.map((s) => ({
        slideNumber: s.slideNumber,
        script: s.script,
        estimatedSeconds: s.estimatedSeconds,
        transition: s.transition,
      }));

      this.setResult(id, {
        id,
        slides,
        totalEstimatedSeconds: refined.totalEstimatedSeconds,
      });

      this.setStatus(id, { id, status: 'completed', progress: 100, message: '스크립트 생성 완료!' });
      console.log(`[${id}] Processing completed!`);

      // Save to history if userId is available
      const meta = this.metaStore.get(id);
      if (meta?.data.userId) {
        try {
          await this.saveHistory(meta.data.userId, meta.data.filename, options, slides, refined.totalEstimatedSeconds);
          console.log(`[${id}] History saved for user ${meta.data.userId}`);
        } catch (historyError) {
          console.error(`[${id}] Failed to save history:`, historyError);
        }
      }

    } catch (error) {
      console.error(`[${id}] Processing error:`, error);
      this.setStatus(id, {
        id,
        status: 'error',
        progress: 0,
        message: '처리 중 오류 발생',
        error: error instanceof Error ? error.message : 'Processing failed',
      });
    } finally {
      // Cleanup temp files
      await this.cleanupTempFiles(filePath);
    }
  }

  private async cleanupTempFiles(filePath: string): Promise<void> {
    try {
      // Delete uploaded file
      await fs.unlink(filePath).catch(() => {});

      // Delete converted PDF (if PPT was uploaded)
      const ext = path.extname(filePath).toLowerCase();
      if (ext !== '.pdf') {
        const pdfPath = filePath.replace(ext, '.pdf');
        await fs.unlink(pdfPath).catch(() => {});
      }

      // Delete images directory
      const baseName = path.basename(filePath, path.extname(filePath));
      const imagesDir = path.join(path.dirname(filePath), baseName);
      await fs.rm(imagesDir, { recursive: true, force: true }).catch(() => {});
    } catch {
      // Best effort cleanup
    }
  }

  // ── Step 1: Parallel slide analysis ──

  private async analyzeSlidesConcurrently(
    id: string,
    images: string[],
    slideCount: number,
  ): Promise<SlideAnalysis[]> {
    const progressPerSlide = 29 / slideCount; // 15% → 44%
    let completedCount = 0;
    const results: SlideAnalysis[] = new Array(images.length);

    for (let batchStart = 0; batchStart < images.length; batchStart += MAX_ANALYSIS_CONCURRENCY) {
      const batchEnd = Math.min(batchStart + MAX_ANALYSIS_CONCURRENCY, images.length);
      const batch = images.slice(batchStart, batchEnd);

      const batchPromises = batch.map(async (imagePath, batchIndex) => {
        const i = batchStart + batchIndex;
        const analysis = await this.scriptGeneratorService.analyzeSlide(imagePath);
        results[i] = analysis;

        completedCount++;
        const currentProgress = 16 + Math.round(progressPerSlide * completedCount);
        this.setStatus(id, {
          id,
          status: 'processing',
          progress: currentProgress,
          message: `슬라이드 ${completedCount}/${slideCount} 분석 중...`,
        });
      });

      await Promise.all(batchPromises);
    }

    return results;
  }

  // ── Step 2: Sequential script generation with context ──

  private async generateScriptsSequentially(
    id: string,
    analyses: SlideAnalysis[],
    slideCount: number,
    options: UploadOptions,
    targetSecondsPerSlide?: number,
  ): Promise<SlideScript[]> {
    const progressPerSlide = 34 / slideCount; // 46% → 80%
    const scripts: SlideScript[] = [];

    for (let i = 0; i < analyses.length; i++) {
      console.log(`[${id}] Generating script for slide ${i + 1}/${slideCount}...`);

      this.setStatus(id, {
        id,
        status: 'processing',
        progress: 46 + Math.round(progressPerSlide * i),
        message: `슬라이드 ${i + 1}/${slideCount} 스크립트 생성 중...`,
      });

      const script = await this.scriptGeneratorService.generateScriptWithContext(
        analyses[i],
        scripts, // pass all previous scripts for context
        {
          tone: options.tone,
          targetSecondsPerSlide,
          totalSlideCount: slideCount,
        },
      );

      scripts.push(script);

      this.setStatus(id, {
        id,
        status: 'processing',
        progress: 46 + Math.round(progressPerSlide * (i + 1)),
        message: `슬라이드 ${i + 1}/${slideCount} 스크립트 완료`,
      });
    }

    return scripts;
  }

  async getStatus(id: string, userId?: string): Promise<StatusResult> {
    if (userId) {
      const meta = this.metaStore.get(id);
      if (meta && meta.data.userId !== userId) {
        return { id, status: 'pending', progress: 0 };
      }
    }
    const entry = this.statusStore.get(id);
    if (!entry) {
      return { id, status: 'pending', progress: 0 };
    }
    return entry.data;
  }

  async getResult(id: string, userId?: string): Promise<PresentationResult | null> {
    if (userId) {
      const meta = this.metaStore.get(id);
      if (meta && meta.data.userId !== userId) {
        return null;
      }
    }
    const entry = this.resultStore.get(id);
    return entry?.data || null;
  }

  // ── History CRUD ──

  async saveHistory(
    userId: string,
    filename: string,
    options: UploadOptions,
    slides: SlideResult[],
    totalEstimatedSeconds: number,
  ) {
    return this.prismaService.presentationHistory.create({
      data: {
        userId,
        filename,
        tone: options.tone || null,
        targetMinutes: options.targetMinutes ? Number(options.targetMinutes) : null,
        slides: JSON.parse(JSON.stringify(slides)),
        totalEstimatedSeconds,
      },
    });
  }

  async getHistoryList(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.prismaService.presentationHistory.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prismaService.presentationHistory.count({
        where: { userId },
      }),
    ]);
    return { items, total, page, limit };
  }

  async getHistoryDetail(userId: string, historyId: string) {
    const history = await this.prismaService.presentationHistory.findFirst({
      where: { id: historyId, userId },
    });
    if (!history) {
      throw new NotFoundException('History not found');
    }
    return history;
  }

  async deleteHistory(userId: string, historyId: string) {
    const history = await this.prismaService.presentationHistory.findFirst({
      where: { id: historyId, userId },
    });
    if (!history) {
      throw new NotFoundException('History not found');
    }
    await this.prismaService.presentationHistory.delete({
      where: { id: historyId },
    });
  }
}

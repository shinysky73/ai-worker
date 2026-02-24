import { Injectable, BadRequestException, NotFoundException, OnModuleDestroy, HttpException, HttpStatus } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { QuestionGeneratorService } from './question-generator.service';
import { InterviewExcelGeneratorService } from './excel-generator.service';
import { PrismaService } from '../prisma/prisma.service';
import type { JobCategory, InterviewQuestionResult } from './types';
import { JOB_CATEGORIES } from './types';

export type ProcessingStatus = 'pending' | 'processing' | 'completed' | 'error';

export interface StatusResult {
  id: string;
  status: ProcessingStatus;
  result?: InterviewQuestionResult;
  error?: string;
}

export interface SubmitResult {
  id: string;
}

export interface ExcelResult {
  buffer: Buffer;
  filename: string;
}

const MIN_JD_LENGTH = 50;
const MAX_JD_LENGTH = 10000;
const STORE_TTL_MS = 60 * 60 * 1000;
const CLEANUP_INTERVAL_MS = 10 * 60 * 1000;

interface StoreEntry {
  status: StatusResult;
  userId: string;
  jdText: string;
  jobCategory: JobCategory;
  createdAt: number;
}

@Injectable()
export class InterviewService implements OnModuleDestroy {
  private store = new Map<string, StoreEntry>();
  private cleanupTimer: ReturnType<typeof setInterval>;

  constructor(
    private readonly questionGenerator: QuestionGeneratorService,
    private readonly excelGenerator: InterviewExcelGeneratorService,
    private readonly prismaService: PrismaService,
  ) {
    this.cleanupTimer = setInterval(() => this.cleanupExpiredEntries(), CLEANUP_INTERVAL_MS);
  }

  onModuleDestroy() {
    clearInterval(this.cleanupTimer);
  }

  private cleanupExpiredEntries(): void {
    const now = Date.now();
    for (const [key, entry] of this.store) {
      if (now - entry.createdAt > STORE_TTL_MS) {
        this.store.delete(key);
      }
    }
  }

  async submitJd(jdText: string, jobCategory: string, userId: string): Promise<SubmitResult> {
    const cleanText = this.stripHtml(jdText).trim();

    if (!cleanText || cleanText.length < MIN_JD_LENGTH) {
      throw new BadRequestException('채용 공고 내용이 너무 짧습니다 (최소 50자)');
    }
    if (cleanText.length > MAX_JD_LENGTH) {
      throw new HttpException('최대 10,000자까지 입력 가능합니다', HttpStatus.PAYLOAD_TOO_LARGE);
    }

    const validCategory: JobCategory = JOB_CATEGORIES.includes(jobCategory as JobCategory)
      ? (jobCategory as JobCategory)
      : '일반/기타';

    const id = randomUUID();

    const entry: StoreEntry = {
      status: { id, status: 'pending' },
      userId,
      jdText: cleanText,
      jobCategory: validCategory,
      createdAt: Date.now(),
    };

    this.store.set(id, entry);

    this.processGeneration(id).catch((err) => {
      console.error(`[${id}] Unhandled error in processGeneration:`, err);
    });

    return { id };
  }

  private async processGeneration(id: string): Promise<void> {
    const entry = this.store.get(id);
    if (!entry) return;

    entry.status.status = 'processing';

    try {
      const result = await this.questionGenerator.generate(entry.jdText, entry.jobCategory);
      entry.status.status = 'completed';
      entry.status.result = result;

      // Save to history
      try {
        await this.prismaService.interviewHistory.create({
          data: {
            userId: entry.userId,
            jdSummary: result.jdSummary || entry.jdText.substring(0, 100),
            jobCategory: entry.jobCategory,
            questionsData: JSON.parse(JSON.stringify(result)),
            questionCount: result.totalQuestions,
          },
        });
      } catch (historyError) {
        console.error(`[${id}] Failed to save history:`, historyError);
      }
    } catch (err) {
      entry.status.status = 'error';
      entry.status.error = err instanceof Error ? err.message : '면접 질문 생성에 실패했습니다.';
    }
  }

  async getStatus(id: string, userId: string): Promise<StatusResult> {
    const entry = this.store.get(id);
    if (!entry || entry.userId !== userId) {
      return { id, status: 'pending' };
    }
    return { ...entry.status };
  }

  async getResult(id: string, userId: string): Promise<InterviewQuestionResult | null> {
    const entry = this.store.get(id);
    if (!entry || entry.userId !== userId) {
      return null;
    }
    return entry.status.result || null;
  }

  async getExcelBuffer(id: string, userId: string): Promise<ExcelResult | null> {
    const entry = this.store.get(id);
    if (!entry || entry.userId !== userId || !entry.status.result) {
      return null;
    }

    const buffer = await this.excelGenerator.generateInterviewExcel(entry.status.result);
    const now = new Date();
    const timestamp = now.getFullYear().toString() +
      String(now.getMonth() + 1).padStart(2, '0') +
      String(now.getDate()).padStart(2, '0') + '_' +
      String(now.getHours()).padStart(2, '0') +
      String(now.getMinutes()).padStart(2, '0') +
      String(now.getSeconds()).padStart(2, '0');

    return { buffer, filename: `interview_questions_${timestamp}.xlsx` };
  }

  // History methods
  async getHistoryList(userId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.prismaService.interviewHistory.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prismaService.interviewHistory.count({ where: { userId } }),
    ]);
    return { items, total, page, limit };
  }

  async getHistoryDetail(userId: string, historyId: string) {
    const history = await this.prismaService.interviewHistory.findFirst({
      where: { id: historyId, userId },
    });
    if (!history) throw new NotFoundException('History not found');
    return history;
  }

  async deleteHistory(userId: string, historyId: string) {
    const history = await this.prismaService.interviewHistory.findFirst({
      where: { id: historyId, userId },
    });
    if (!history) throw new NotFoundException('History not found');
    await this.prismaService.interviewHistory.delete({ where: { id: historyId } });
  }

  async regenerateExcel(userId: string, historyId: string): Promise<ExcelResult | null> {
    const history = await this.prismaService.interviewHistory.findFirst({
      where: { id: historyId, userId },
    });
    if (!history) throw new NotFoundException('History not found');

    const questionsData = history.questionsData as unknown as InterviewQuestionResult;
    const buffer = await this.excelGenerator.generateInterviewExcel(questionsData);

    return { buffer, filename: `interview_questions_${history.id.substring(0, 8)}.xlsx` };
  }

  private stripHtml(text: string): string {
    return text.replace(/<[^>]*>/g, '');
  }
}

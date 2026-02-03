import { Injectable, BadRequestException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import * as fs from 'fs/promises';
import * as path from 'path';

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
  error?: string;
}

export interface SlideResult {
  slideNumber: number;
  script: string;
  estimatedSeconds: number;
}

export interface PresentationResult {
  id: string;
  slides: SlideResult[];
  totalEstimatedSeconds: number;
}

const ALLOWED_MIMETYPES = [
  'application/vnd.openxmlformats-officedocument.presentationml.presentation', // PPTX
  'application/vnd.ms-powerpoint', // PPT
];

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

// PPTX files are ZIP archives starting with "PK" signature
const PPTX_MAGIC_BYTES = Buffer.from([0x50, 0x4b]); // "PK"
// PPT files (OLE2 format) start with this signature
const PPT_MAGIC_BYTES = Buffer.from([0xd0, 0xcf, 0x11, 0xe0]);

const UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'presentations');

@Injectable()
export class PresentationService {
  private statusStore = new Map<string, StatusResult>();
  private resultStore = new Map<string, PresentationResult>();
  async uploadFile(
    file: UploadedFile,
    options?: UploadOptions,
  ): Promise<UploadResult> {
    this.validateFileType(file);
    this.validateFileSize(file);
    this.validateFileIntegrity(file);

    const id = randomUUID();
    await this.storeFile(id, file);

    return {
      id,
      filename: file.originalname,
    };
  }

  private validateFileType(file: UploadedFile): void {
    if (!ALLOWED_MIMETYPES.includes(file.mimetype)) {
      throw new BadRequestException(
        'Invalid file type. Only PPT and PPTX files are allowed.',
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
    const isPptx = file.mimetype.includes('presentationml.presentation');
    const magicBytes = isPptx ? PPTX_MAGIC_BYTES : PPT_MAGIC_BYTES;

    if (file.buffer.length < magicBytes.length) {
      throw new BadRequestException('File appears to be corrupted or invalid.');
    }

    const fileHeader = file.buffer.subarray(0, magicBytes.length);
    if (!fileHeader.equals(magicBytes)) {
      throw new BadRequestException('File appears to be corrupted or invalid.');
    }
  }

  private async storeFile(id: string, file: UploadedFile): Promise<void> {
    const ext = path.extname(file.originalname);
    const filePath = path.join(UPLOAD_DIR, `${id}${ext}`);

    await fs.mkdir(UPLOAD_DIR, { recursive: true });
    await fs.writeFile(filePath, file.buffer);

    this.statusStore.set(id, {
      id,
      status: 'pending',
      progress: 0,
    });
  }

  async getStatus(id: string): Promise<StatusResult> {
    const status = this.statusStore.get(id);
    if (!status) {
      return {
        id,
        status: 'pending',
        progress: 0,
      };
    }
    return status;
  }

  async getResult(id: string): Promise<PresentationResult | null> {
    return this.resultStore.get(id) || null;
  }
}

import { Injectable, BadRequestException } from '@nestjs/common';
import { execFile } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';
import * as fs from 'fs/promises';
import { executeWithRetry } from './utils/retry';

const execFileAsync = promisify(execFile);

const MAX_SLIDES = 50;
const COMMAND_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

export interface ConversionResult {
  outputDir: string;
  images: string[];
  slideCount: number;
}

@Injectable()
export class ConverterService {
  async convertToPdf(inputPath: string): Promise<string> {
    const outputDir = path.dirname(inputPath);
    const baseName = path.basename(inputPath, path.extname(inputPath));
    const outputPath = path.join(outputDir, `${baseName}.pdf`);

    const args = ['--headless', '--convert-to', 'pdf', '--outdir', outputDir, inputPath];

    try {
      const { stderr } = await execFileAsync('soffice', args, {
        timeout: COMMAND_TIMEOUT_MS,
      });
      if (stderr) {
        console.warn(`[soffice] stderr: ${stderr}`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`PPT to PDF conversion failed: ${message}`);
    }

    try {
      await fs.access(outputPath);
    } catch {
      throw new Error('PDF conversion completed but output file not found.');
    }

    return outputPath;
  }

  async convertPdfToImages(pdfPath: string): Promise<ConversionResult> {
    const baseName = path.basename(pdfPath, '.pdf');
    const outputDir = path.join(path.dirname(pdfPath), baseName);

    await fs.mkdir(outputDir, { recursive: true });

    const args = ['-png', '-scale-to-x', '1920', '-scale-to-y', '1080', pdfPath, path.join(outputDir, baseName)];

    await executeWithRetry(async () => {
      try {
        const { stderr } = await execFileAsync('pdftoppm', args, {
          timeout: COMMAND_TIMEOUT_MS,
        });
        if (stderr) {
          console.warn(`[pdftoppm] stderr: ${stderr}`);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        throw new Error(`PDF to image conversion failed: ${message}`);
      }
    });

    const files = await fs.readdir(outputDir);
    const imageFiles = files.filter((f) => f.endsWith('.png')).sort();
    const slideCount = imageFiles.length;

    if (slideCount === 0) {
      throw new Error('No images were generated from the PDF.');
    }

    if (slideCount > MAX_SLIDES) {
      throw new BadRequestException(
        `Presentation exceeds maximum slide limit of ${MAX_SLIDES}.`,
      );
    }

    const images = imageFiles.map((f) => path.join(outputDir, f));

    return {
      outputDir,
      images,
      slideCount,
    };
  }
}

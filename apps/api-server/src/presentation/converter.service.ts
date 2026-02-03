import { Injectable, BadRequestException } from '@nestjs/common';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';
import * as fs from 'fs/promises';

const execAsync = promisify(exec);

const MAX_RETRIES = 3;
const MAX_SLIDES = 50;

export interface ConversionResult {
  outputDir: string;
  imageCount: number;
}

@Injectable()
export class ConverterService {
  async convertToPdf(inputPath: string): Promise<string> {
    const outputDir = path.dirname(inputPath);
    const baseName = path.basename(inputPath, path.extname(inputPath));
    const outputPath = path.join(outputDir, `${baseName}.pdf`);

    const command = `soffice --headless --convert-to pdf --outdir "${outputDir}" "${inputPath}"`;
    await execAsync(command);

    return outputPath;
  }

  async convertPdfToImages(pdfPath: string): Promise<ConversionResult> {
    const outputDir = pdfPath.replace('.pdf', '');
    const baseName = path.basename(pdfPath, '.pdf');

    await fs.mkdir(outputDir, { recursive: true });

    const command = `pdftoppm -png -scale-to-x 1920 -scale-to-y 1080 "${pdfPath}" "${path.join(outputDir, baseName)}"`;
    await this.executeWithRetry(command);

    const files = await fs.readdir(outputDir);
    const imageCount = files.filter((f) => f.endsWith('.png')).length;

    if (imageCount > MAX_SLIDES) {
      throw new BadRequestException(
        `Presentation exceeds maximum slide limit of ${MAX_SLIDES}.`,
      );
    }

    return {
      outputDir,
      imageCount,
    };
  }

  private async executeWithRetry(
    command: string,
    retries: number = MAX_RETRIES,
  ): Promise<void> {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        await execAsync(command);
        return;
      } catch (error) {
        if (attempt === retries) {
          throw error;
        }
      }
    }
  }
}

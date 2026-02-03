import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as fs from 'fs/promises';

export interface SlideAnalysis {
  content: string;
  script: string;
  keywords: string[];
}

export interface SlideScript {
  slideNumber: number;
  script: string;
  estimatedSeconds: number;
}

export type ToneType = 'formal' | 'casual';

export interface GenerateScriptOptions {
  tone?: ToneType;
}

const WORDS_PER_MINUTE = 150;
const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000;

@Injectable()
export class ScriptGeneratorService {
  private genAI: GoogleGenerativeAI;
  private model: ReturnType<GoogleGenerativeAI['getGenerativeModel']>;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    this.genAI = new GoogleGenerativeAI(apiKey || '');
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  }

  async analyzeSlide(
    imagePath: string,
    options: GenerateScriptOptions = {},
  ): Promise<SlideAnalysis> {
    const imageBuffer = await fs.readFile(imagePath);
    const base64Image = imageBuffer.toString('base64');
    const toneInstruction = this.getToneInstruction(options.tone);

    const prompt = [
      {
        inlineData: {
          mimeType: 'image/png',
          data: base64Image,
        },
      },
      `Analyze this presentation slide and respond in JSON format with:
      - content: Brief description of what the slide contains
      - script: A presentation script for this slide (2-3 sentences)${toneInstruction}
      - keywords: Array of key terms from the slide`,
    ];

    const result = await this.executeWithRetry(() =>
      this.model.generateContent(prompt),
    );

    const text = result.response.text();
    return JSON.parse(text);
  }

  private async executeWithRetry<T>(
    fn: () => Promise<T>,
    retries: number = MAX_RETRIES,
  ): Promise<T> {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        if (attempt === retries) {
          throw error;
        }
        const delay = BASE_DELAY_MS * Math.pow(2, attempt - 1);
        await this.sleep(delay);
      }
    }
    throw new Error('Retry failed');
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private getToneInstruction(tone?: ToneType): string {
    if (tone === 'formal') {
      return ' Use formal, professional language appropriate for business presentations.';
    }
    if (tone === 'casual') {
      return ' Use casual, conversational language that feels friendly and approachable.';
    }
    return '';
  }

  async generateScript(
    imagePath: string,
    options: GenerateScriptOptions = {},
  ): Promise<SlideScript> {
    const analysis = await this.analyzeSlide(imagePath, options);
    const slideNumber = this.extractSlideNumber(imagePath);
    const estimatedSeconds = this.calculateReadingTime(analysis.script);

    return {
      slideNumber,
      script: analysis.script,
      estimatedSeconds,
    };
  }

  private calculateReadingTime(script: string): number {
    const wordCount = script.trim().split(/\s+/).length;
    const minutes = wordCount / WORDS_PER_MINUTE;
    return Math.round(minutes * 60);
  }

  private extractSlideNumber(imagePath: string): number {
    const match = imagePath.match(/-(\d+)\.png$/);
    return match ? parseInt(match[1], 10) : 1;
  }
}

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as fs from 'fs/promises';
import { executeWithRetry } from '../presentation/utils/retry';

export type ImageType = 'table' | 'chart' | 'other';
export type DetailLevel = 'brief' | 'detailed';
export type OutputLanguage = 'ko' | 'en';

export interface ImageAnalysisResult {
  imageType: ImageType;
  description: string;
  insights: string[];
}

export interface AnalyzeOptions {
  detailLevel?: DetailLevel;
  language?: OutputLanguage;
}

@Injectable()
export class ImageAnalyzerService {
  private genAI: GoogleGenerativeAI;
  private model: ReturnType<GoogleGenerativeAI['getGenerativeModel']>;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    this.genAI = new GoogleGenerativeAI(apiKey || '');
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
  }

  async analyzeImage(
    imagePath: string,
    options: AnalyzeOptions = {},
  ): Promise<ImageAnalysisResult> {
    const { detailLevel = 'detailed', language = 'ko' } = options;

    const imageBuffer = await fs.readFile(imagePath);
    const base64Image = imageBuffer.toString('base64');
    const mimeType = this.detectMimeType(imagePath);

    const prompt = this.buildPrompt(detailLevel, language);

    const result = await executeWithRetry(() =>
      this.model.generateContent([
        {
          inlineData: {
            mimeType,
            data: base64Image,
          },
        },
        prompt,
      ]),
    );

    const text = result.response.text();
    return this.parseResult(text);
  }

  private buildPrompt(detailLevel: DetailLevel, language: OutputLanguage): string {
    const langInstruction = language === 'ko'
      ? '반드시 한국어로 작성해주세요.'
      : 'Write your response in English.';

    const detailInstruction = detailLevel === 'brief'
      ? language === 'ko'
        ? '핵심 내용을 2-3문장으로 간략하게 설명해주세요.'
        : 'Describe the key content briefly in 2-3 sentences.'
      : language === 'ko'
        ? '구조와 데이터를 포함하여 상세하게 설명해주세요.'
        : 'Describe in detail including structure and data.';

    return `이 이미지를 분석하여 JSON 형식으로 응답해주세요.

분석 항목:
1. imageType: 이미지 유형을 판별해주세요. "table" (표), "chart" (차트/그래프), "other" (기타) 중 하나
2. description: 이미지 내용을 텍스트로 설명해주세요. ${detailInstruction}
   - 표(table)인 경우: 행/열 구조와 데이터를 설명
   - 차트(chart)인 경우: 차트 유형(막대, 선, 원형 등), 축, 데이터 추세를 설명
   - 기타(other)인 경우: 이미지에 보이는 내용을 시각적으로 묘사
   - 복수의 표/차트가 있으면 각각을 구분하여 설명
3. insights: 핵심 인사이트를 문자열 배열로 제공 (최소 1개, 최대 5개)

${langInstruction}
JSON만 반환해주세요.`;
  }

  private detectMimeType(imagePath: string): string {
    const ext = imagePath.toLowerCase().split('.').pop();
    switch (ext) {
      case 'jpg':
      case 'jpeg':
        return 'image/jpeg';
      case 'png':
        return 'image/png';
      case 'webp':
        return 'image/webp';
      default:
        return 'image/png';
    }
  }

  parseResult(text: string): ImageAnalysisResult {
    let jsonStr = text.trim();

    const codeBlockMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeBlockMatch) {
      jsonStr = codeBlockMatch[1].trim();
    }

    try {
      const parsed = JSON.parse(jsonStr) as Partial<ImageAnalysisResult>;
      return {
        imageType: this.normalizeImageType(parsed.imageType),
        description: parsed.description || '',
        insights: Array.isArray(parsed.insights) ? parsed.insights : [],
      };
    } catch {
      return {
        imageType: 'other',
        description: text,
        insights: [],
      };
    }
  }

  private normalizeImageType(type?: string): ImageType {
    if (type === 'table' || type === 'chart') return type;
    return 'other';
  }
}

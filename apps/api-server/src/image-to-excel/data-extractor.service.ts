import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as fs from 'fs/promises';
import { executeWithRetry } from '../presentation/utils/retry';
import type { ReceiptData, NamecardData, Confidence, ExtractionResult } from './types';

@Injectable()
export class DataExtractorService {
  private genAI: GoogleGenerativeAI;
  private model: ReturnType<GoogleGenerativeAI['getGenerativeModel']>;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    this.genAI = new GoogleGenerativeAI(apiKey || '');
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
  }

  async extractReceipt(imagePath: string, originalFilename = ''): Promise<ExtractionResult<ReceiptData>> {
    const prompt = `이 영수증 이미지를 분석하여 다음 JSON 형식으로 응답해주세요.
추출 항목:
- date: 날짜 (YYYY-MM-DD 형식, 없으면 빈 문자열)
- storeName: 상호명 (없으면 빈 문자열)
- items: 항목 요약 (품목명 x수량, 쉼표 구분. 없으면 빈 문자열)
- totalAmount: 합계 금액 (숫자만, 없으면 빈 문자열)
- paymentMethod: 결제 수단 (카드/현금/기타, 없으면 빈 문자열)
- confidence: 추출 신뢰도 ("high" / "medium" / "low")

추출할 수 없는 필드는 빈 문자열로 반환하세요.
원문 그대로 추출하세요 (번역하지 마세요).
JSON만 반환해주세요.`;

    const parsed = await this.callGemini(imagePath, prompt);

    return {
      data: {
        date: parsed.date || '',
        storeName: parsed.storeName || '',
        items: parsed.items || '',
        totalAmount: parsed.totalAmount || '',
        paymentMethod: parsed.paymentMethod || '',
        originalFilename,
      },
      confidence: this.normalizeConfidence(parsed.confidence),
    };
  }

  async extractNamecard(imagePath: string, originalFilename = ''): Promise<ExtractionResult<NamecardData>> {
    const prompt = `이 명함 이미지를 분석하여 다음 JSON 형식으로 응답해주세요.
추출 항목:
- name: 이름 (없으면 빈 문자열)
- title: 직함 (없으면 빈 문자열)
- company: 회사명 (없으면 빈 문자열)
- phone: 전화번호 (없으면 빈 문자열)
- email: 이메일 (없으면 빈 문자열)
- address: 주소 (없으면 빈 문자열)
- confidence: 추출 신뢰도 ("high" / "medium" / "low")

추출할 수 없는 필드는 빈 문자열로 반환하세요.
원문 그대로 추출하세요 (번역하지 마세요).
JSON만 반환해주세요.`;

    const parsed = await this.callGemini(imagePath, prompt);

    return {
      data: {
        name: parsed.name || '',
        title: parsed.title || '',
        company: parsed.company || '',
        phone: parsed.phone || '',
        email: parsed.email || '',
        address: parsed.address || '',
        originalFilename,
      },
      confidence: this.normalizeConfidence(parsed.confidence),
    };
  }

  private async callGemini(imagePath: string, prompt: string): Promise<Record<string, string>> {
    const imageBuffer = await fs.readFile(imagePath);
    const base64Image = imageBuffer.toString('base64');
    const mimeType = this.detectMimeType(imagePath);

    const result = await executeWithRetry(() =>
      this.model.generateContent([
        { inlineData: { mimeType, data: base64Image } },
        prompt,
      ]),
    );

    const text = result.response.text();
    return this.parseJson(text);
  }

  private parseJson(text: string): Record<string, string> {
    let jsonStr = text.trim();
    const codeBlockMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeBlockMatch) {
      jsonStr = codeBlockMatch[1].trim();
    }

    try {
      return JSON.parse(jsonStr);
    } catch {
      return {};
    }
  }

  private normalizeConfidence(value?: string): Confidence {
    if (value === 'high' || value === 'medium') return value;
    return 'low';
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
}

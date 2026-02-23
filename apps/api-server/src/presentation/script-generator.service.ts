import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as fs from 'fs/promises';
import { executeWithRetry } from './utils/retry';

// ── Interfaces ──

export interface SlideAnalysis {
  slideNumber: number;
  visibleText: string;
  charts: string;
  images: string;
  layoutType: string;
  keyMessage: string;
  speakerNotes: string;
}

export interface SlideScript {
  slideNumber: number;
  script: string;
  estimatedSeconds: number;
  transition: string;
}

export interface RefinedResult {
  slides: SlideScript[];
  totalEstimatedSeconds: number;
}

export type ToneType = 'formal' | 'casual';

export interface GenerateScriptOptions {
  tone?: ToneType;
  targetSecondsPerSlide?: number;
  totalSlideCount?: number;
}

// ── Constants ──

const WORDS_PER_MINUTE = 150; // English fallback
const KOREAN_CHARS_PER_MINUTE = 450; // Korean speech rate (syllable blocks/min)

@Injectable()
export class ScriptGeneratorService {
  private genAI: GoogleGenerativeAI;
  private model: ReturnType<GoogleGenerativeAI['getGenerativeModel']>;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is required');
    }
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
  }

  // ────────────────────────────────────────────
  // Step 1: 상세 슬라이드 분석 (병렬 가능)
  // ────────────────────────────────────────────

  async analyzeSlide(imagePath: string): Promise<SlideAnalysis> {
    const imageBuffer = await fs.readFile(imagePath);
    const base64Image = imageBuffer.toString('base64');
    const slideNumber = this.extractSlideNumber(imagePath);

    const prompt = [
      {
        inlineData: {
          mimeType: 'image/png',
          data: base64Image,
        },
      },
      `이 프레젠테이션 슬라이드 이미지를 상세하게 분석하여 JSON 형식으로 응답해주세요.

분석 항목:
1. visibleText: 슬라이드에 보이는 모든 텍스트를 그대로 추출 (제목, 본문, 캡션, 주석 등 전부 포함)
2. charts: 차트나 그래프가 있다면 유형(막대, 선, 원형 등)과 데이터 경향을 설명. 없으면 빈 문자열
3. images: 의미 있는 사진이나 다이어그램이 있다면 무엇을 나타내는지 설명. 아이콘·화살표·장식 그래픽 등 UI 요소는 제외. 없으면 빈 문자열
4. layoutType: 슬라이드 유형 (title, content, chart, comparison, image, closing 중 하나)
5. keyMessage: 이 슬라이드가 전달하려는 핵심 메시지 1문장
6. speakerNotes: 발표자가 알아야 할 보충 설명이나 맥락 (이미지에서 유추 가능한 것)

반드시 한국어로 작성하고 JSON만 반환해주세요.`,
    ];

    const result = await executeWithRetry(() =>
      this.model.generateContent(prompt),
    );

    const text = result.response.text();
    const parsed = this.parseJson<Partial<SlideAnalysis>>(text, {});

    return {
      slideNumber,
      visibleText: parsed.visibleText || '',
      charts: parsed.charts || '',
      images: parsed.images || '',
      layoutType: parsed.layoutType || 'content',
      keyMessage: parsed.keyMessage || '',
      speakerNotes: parsed.speakerNotes || '',
    };
  }

  // ────────────────────────────────────────────
  // Step 2: 맥락 기반 스크립트 생성 (순차)
  // ────────────────────────────────────────────

  async generateScriptWithContext(
    analysis: SlideAnalysis,
    previousScripts: SlideScript[],
    options: GenerateScriptOptions = {},
  ): Promise<SlideScript> {
    const toneInstruction = this.getToneInstruction(options.tone);
    const lengthInstruction = this.getLengthInstruction(options.targetSecondsPerSlide);
    const totalSlides = options.totalSlideCount || 1;
    const slideNumber = analysis.slideNumber;

    const positionHint = this.getPositionHint(slideNumber, totalSlides, analysis.layoutType);

    // 이전 슬라이드 맥락 구성
    let contextBlock = '';
    if (previousScripts.length > 0) {
      const recentScripts = previousScripts.slice(-3); // 최근 3개만
      contextBlock = `
[이전 슬라이드 흐름]
${recentScripts.map((s) => `슬라이드 ${s.slideNumber}: ${s.script.substring(0, 150)}...`).join('\n')}
`;
    }

    const prompt = `당신은 전문 프레젠테이션 코치입니다. 아래 슬라이드 분석 결과를 바탕으로 발표 스크립트를 작성해주세요.

[슬라이드 ${slideNumber}/${totalSlides} 분석 결과]
- 유형: ${analysis.layoutType}
- 텍스트: ${analysis.visibleText}
${analysis.charts ? `- 차트/그래프: ${analysis.charts}` : ''}
${analysis.images ? `- 이미지/다이어그램: ${analysis.images}` : ''}
- 핵심 메시지: ${analysis.keyMessage}
${analysis.speakerNotes ? `- 보충 설명: ${analysis.speakerNotes}` : ''}
${contextBlock}
[작성 규칙]
1. 슬라이드에 보이는 텍스트와 시각 자료(차트, 그래프, 의미 있는 이미지)를 활용하세요.
2. 차트나 그래프가 있다면 데이터의 의미와 시사점을 반드시 언급하세요.
3. 아이콘, 화살표, 장식적 그래픽 요소는 스크립트에서 언급하지 마세요. 내용과 메시지에만 집중하세요.
4. ${positionHint}
5. 이전 슬라이드와 자연스럽게 연결되는 전환 표현을 사용하세요.${toneInstruction}${lengthInstruction}

JSON 형식으로 응답해주세요:
- script: 발표 스크립트 (한글)
- transition: 다음 슬라이드로 넘어갈 때 사용할 전환 문장 1개 (한글)

JSON만 반환해주세요.`;

    const result = await executeWithRetry(() =>
      this.model.generateContent(prompt),
    );

    const text = result.response.text();
    const parsed = this.parseJson<{ script?: string; transition?: string }>(text, {});

    const script = parsed.script || '';
    const estimatedSeconds = this.calculateReadingTime(script);

    return {
      slideNumber,
      script,
      estimatedSeconds,
      transition: parsed.transition || '',
    };
  }

  // ────────────────────────────────────────────
  // Step 3: 전체 후처리 리파인
  // ────────────────────────────────────────────

  async refineAllScripts(
    slides: SlideScript[],
    analyses: SlideAnalysis[],
    options: GenerateScriptOptions = {},
  ): Promise<RefinedResult> {
    const toneInstruction = this.getToneInstruction(options.tone);
    const totalTargetSeconds = options.targetSecondsPerSlide
      ? options.targetSecondsPerSlide * slides.length
      : undefined;

    const timeInstruction = totalTargetSeconds
      ? `총 발표 시간은 약 ${Math.round(totalTargetSeconds / 60)}분(${totalTargetSeconds}초)이 되어야 합니다.`
      : '';

    const scriptsBlock = slides
      .map((s) => {
        const analysis = analyses.find((a) => a.slideNumber === s.slideNumber);
        return `[슬라이드 ${s.slideNumber}] (유형: ${analysis?.layoutType || 'content'})
스크립트: ${s.script}
전환: ${s.transition}`;
      })
      .join('\n\n');

    const prompt = `당신은 전문 프레젠테이션 코치입니다. 아래는 프레젠테이션의 슬라이드별 발표 스크립트입니다.
전체적인 관점에서 검토하고 개선해주세요.

${scriptsBlock}

[검토 및 개선 기준]
1. 흐름: 도입 → 본론 → 결론의 자연스러운 흐름을 갖추고 있는지 확인하고, 부족하면 보완하세요.
2. 전환: 슬라이드 간 전환이 자연스러운지 확인하세요. 앞 슬라이드의 내용을 받아서 시작하는 연결 표현이 있어야 합니다.
3. 일관성: 어투와 용어가 전체적으로 일관되게 사용되는지 확인하세요.${toneInstruction}
4. 중복 제거: 동일한 표현이나 내용이 반복되면 다양하게 변경하세요.
5. 시간 배분: 각 슬라이드의 중요도에 맞게 스크립트 분량을 조절하세요. ${timeInstruction}
6. 첫 슬라이드는 청중의 관심을 끄는 도입부, 마지막 슬라이드는 핵심 메시지를 정리하는 마무리가 되어야 합니다.

JSON 형식으로 응답해주세요:
{
  "slides": [
    {
      "slideNumber": 번호,
      "script": "개선된 스크립트",
      "transition": "다음 슬라이드 전환 문장"
    }
  ]
}

반드시 한국어로 작성하고 JSON만 반환해주세요. 모든 슬라이드를 빠짐없이 포함하세요.`;

    const result = await executeWithRetry(() =>
      this.model.generateContent(prompt),
    );

    const text = result.response.text();
    const parsed = this.parseJson<{ slides?: Array<{ slideNumber?: number; script?: string; transition?: string }> }>(
      text,
      { slides: [] },
    );

    const refinedSlides: SlideScript[] = slides.map((original) => {
      const refined = parsed.slides?.find((s) => s.slideNumber === original.slideNumber);
      if (refined?.script) {
        return {
          slideNumber: original.slideNumber,
          script: refined.script,
          estimatedSeconds: this.calculateReadingTime(refined.script),
          transition: refined.transition || original.transition,
        };
      }
      return original;
    });

    const totalEstimatedSeconds = refinedSlides.reduce((sum, s) => sum + s.estimatedSeconds, 0);

    return {
      slides: refinedSlides,
      totalEstimatedSeconds,
    };
  }

  // ── Utility methods ──

  private getPositionHint(slideNumber: number, totalSlides: number, layoutType: string): string {
    if (slideNumber === 1 || layoutType === 'title') {
      return '이것은 첫 번째(또는 제목) 슬라이드입니다. 인사말과 발표 주제 소개로 청중의 관심을 끌어주세요.';
    }
    if (slideNumber === totalSlides || layoutType === 'closing') {
      return '이것은 마지막 슬라이드입니다. 핵심 메시지를 요약하고 청중에게 감사 인사로 마무리해주세요.';
    }
    return '본론 슬라이드입니다. 핵심 내용을 명확하게 전달하되, 청중이 이해하기 쉽게 설명해주세요.';
  }

  private getToneInstruction(tone?: ToneType): string {
    if (tone === 'formal') {
      return ' 격식체를 사용하여 비즈니스 발표에 적합한 전문적인 어투로 작성해주세요.';
    }
    if (tone === 'casual') {
      return ' 비격식체를 사용하여 친근하고 편안한 어투로 작성해주세요.';
    }
    return '';
  }

  private getLengthInstruction(targetSecondsPerSlide?: number): string {
    if (!targetSecondsPerSlide) return '';
    const approxWords = Math.round((targetSecondsPerSlide / 60) * WORDS_PER_MINUTE);
    return `\n5. 이 슬라이드의 스크립트는 약 ${targetSecondsPerSlide}초 분량(약 ${approxWords}단어)으로 작성해주세요.`;
  }

  calculateReadingTime(script: string): number {
    const text = script.trim();
    // Count Korean characters (Hangul syllable blocks)
    const koreanChars = (text.match(/[\uAC00-\uD7AF]/g) || []).length;

    if (koreanChars > text.length * 0.3) {
      // Korean-dominant: use character-based calculation
      const totalChars = text.replace(/\s/g, '').length;
      const minutes = totalChars / KOREAN_CHARS_PER_MINUTE;
      return Math.max(1, Math.round(minutes * 60));
    }

    // English/mixed: use word-based calculation
    const wordCount = text.split(/\s+/).length;
    const minutes = wordCount / WORDS_PER_MINUTE;
    return Math.max(1, Math.round(minutes * 60));
  }

  extractSlideNumber(imagePath: string): number {
    const match = imagePath.match(/-(\d+)\.png$/);
    return match ? parseInt(match[1], 10) : 1;
  }

  private parseJson<T>(text: string, fallback: T): T {
    let jsonStr = text.trim();

    const codeBlockMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeBlockMatch) {
      jsonStr = codeBlockMatch[1].trim();
    }

    try {
      return JSON.parse(jsonStr) as T;
    } catch {
      return fallback;
    }
  }
}

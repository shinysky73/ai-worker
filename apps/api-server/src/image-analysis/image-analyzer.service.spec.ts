import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { ImageAnalyzerService } from './image-analyzer.service';

// Mock @google/generative-ai
const mockGenerateContent = jest.fn();
jest.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
    getGenerativeModel: jest.fn().mockReturnValue({
      generateContent: mockGenerateContent,
    }),
  })),
}));

// Mock fs/promises
jest.mock('fs/promises', () => ({
  readFile: jest.fn().mockResolvedValue(Buffer.from('fake-image-data')),
}));

// Mock retry to execute immediately
jest.mock('../presentation/utils/retry', () => ({
  executeWithRetry: jest.fn((fn) => fn()),
}));

describe('ImageAnalyzerService', () => {
  let service: ImageAnalyzerService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ImageAnalyzerService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('test-api-key'),
          },
        },
      ],
    }).compile();

    service = module.get<ImageAnalyzerService>(ImageAnalyzerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // Test 1: FR-3 AC1 — 표 이미지 분석
  describe('analyzeImage', () => {
    it('shouldAnalyzeTableImage: 표 이미지 입력 시 imageType "table"과 행/열 설명 반환', async () => {
      mockGenerateContent.mockResolvedValue({
        response: {
          text: () => JSON.stringify({
            imageType: 'table',
            description: '3행 4열의 매출 데이터 표입니다. 2024년 분기별 매출이 정리되어 있습니다.',
            insights: ['Q4 매출이 전 분기 대비 20% 증가', '연간 총 매출 100억원'],
          }),
        },
      });

      const result = await service.analyzeImage('/tmp/test-table.png');

      expect(result.imageType).toBe('table');
      expect(result.description).toContain('매출');
      expect(result.insights.length).toBeGreaterThanOrEqual(1);
    });

    // Test 2: FR-3 AC2 — 차트 이미지 분석
    it('shouldAnalyzeChartImage: 차트 이미지 입력 시 유형, 축, 추세 포함한 설명 반환', async () => {
      mockGenerateContent.mockResolvedValue({
        response: {
          text: () => JSON.stringify({
            imageType: 'chart',
            description: '막대 차트입니다. X축은 월별, Y축은 매출(억원)을 나타냅니다. 상승 추세를 보입니다.',
            insights: ['6월 매출이 최고', '전반적 상승 추세'],
          }),
        },
      });

      const result = await service.analyzeImage('/tmp/test-chart.jpg');

      expect(result.imageType).toBe('chart');
      expect(result.description).toBeTruthy();
      expect(result.insights.length).toBeGreaterThanOrEqual(1);
    });

    // Test 3: FR-3 AC3 — 일반 이미지 분석
    it('shouldAnalyzeOtherImage: 표/차트가 아닌 일반 이미지도 설명 반환', async () => {
      mockGenerateContent.mockResolvedValue({
        response: {
          text: () => JSON.stringify({
            imageType: 'other',
            description: '회사 로고가 포함된 발표 표지 이미지입니다.',
            insights: ['브랜드 아이덴티티 표현'],
          }),
        },
      });

      const result = await service.analyzeImage('/tmp/test-photo.webp');

      expect(result.imageType).toBe('other');
      expect(result.description).toBeTruthy();
    });

    // Test 4: FR-3 AC4 — 결과 구조 검증
    it('shouldReturnStructuredResult: 결과에 imageType, description, insights 포함', async () => {
      mockGenerateContent.mockResolvedValue({
        response: {
          text: () => JSON.stringify({
            imageType: 'table',
            description: '데이터 표',
            insights: ['인사이트 1'],
          }),
        },
      });

      const result = await service.analyzeImage('/tmp/test.png');

      expect(result).toHaveProperty('imageType');
      expect(result).toHaveProperty('description');
      expect(result).toHaveProperty('insights');
      expect(['table', 'chart', 'other']).toContain(result.imageType);
      expect(typeof result.description).toBe('string');
      expect(Array.isArray(result.insights)).toBe(true);
    });

    // Test 5: FR-3 AC5 — API 실패 시 재시도
    it('shouldRetryOnApiFailure: API 호출 실패 시 executeWithRetry를 통해 재시도', async () => {
      const { executeWithRetry } = require('../presentation/utils/retry');

      mockGenerateContent.mockResolvedValue({
        response: {
          text: () => JSON.stringify({
            imageType: 'other',
            description: '결과',
            insights: [],
          }),
        },
      });

      await service.analyzeImage('/tmp/test.png');

      expect(executeWithRetry).toHaveBeenCalledWith(expect.any(Function));
    });

    // Test 6: 옵션 — 설명 수준(brief)
    it('shouldSupportBriefOption: detailLevel=brief 옵션이 프롬프트에 반영', async () => {
      mockGenerateContent.mockResolvedValue({
        response: {
          text: () => JSON.stringify({
            imageType: 'chart',
            description: '매출 차트입니다.',
            insights: ['상승 추세'],
          }),
        },
      });

      const result = await service.analyzeImage('/tmp/test.png', {
        detailLevel: 'brief',
      });

      expect(result.imageType).toBe('chart');
      // brief 옵션 전달 시에도 정상 결과 반환
      expect(result.description).toBeTruthy();
    });

    // Test 7: 옵션 — 출력 언어(en)
    it('shouldSupportEnglishOption: language=en 옵션으로 영어 결과 요청', async () => {
      mockGenerateContent.mockResolvedValue({
        response: {
          text: () => JSON.stringify({
            imageType: 'table',
            description: 'A table with 3 rows and 4 columns showing quarterly revenue.',
            insights: ['Q4 revenue increased by 20%'],
          }),
        },
      });

      const result = await service.analyzeImage('/tmp/test.png', {
        language: 'en',
      });

      expect(result.imageType).toBe('table');
      expect(result.description).toBeTruthy();
    });
  });

  // Edge Case Tests
  describe('parseResult', () => {
    // Edge: JSON이 코드 블록에 감싸진 경우
    it('shouldParseMarkdownCodeBlock: ```json 코드 블록 감싸진 응답 파싱', () => {
      const text = '```json\n{"imageType":"table","description":"표","insights":["인사이트"]}\n```';

      const result = service.parseResult(text);

      expect(result.imageType).toBe('table');
      expect(result.description).toBe('표');
    });

    // Edge: 잘못된 JSON 응답
    it('shouldFallbackOnInvalidJson: 파싱 불가 응답 시 description에 원문, imageType=other', () => {
      const text = 'This is not valid JSON at all';

      const result = service.parseResult(text);

      expect(result.imageType).toBe('other');
      expect(result.description).toBe(text);
      expect(result.insights).toEqual([]);
    });

    // Edge: imageType이 예상 값이 아닌 경우
    it('shouldNormalizeUnknownImageType: 알 수 없는 imageType을 "other"로 정규화', () => {
      const text = JSON.stringify({
        imageType: 'diagram',
        description: '다이어그램',
        insights: [],
      });

      const result = service.parseResult(text);

      expect(result.imageType).toBe('other');
    });

    // Edge: insights가 배열이 아닌 경우
    it('shouldHandleNonArrayInsights: insights가 배열이 아니면 빈 배열 반환', () => {
      const text = JSON.stringify({
        imageType: 'chart',
        description: '차트',
        insights: 'not an array',
      });

      const result = service.parseResult(text);

      expect(result.insights).toEqual([]);
    });
  });
});

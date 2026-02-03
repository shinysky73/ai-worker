import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { ScriptGeneratorService } from './script-generator.service';

const mockGenerateContent = jest.fn();

jest.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
    getGenerativeModel: jest.fn().mockReturnValue({
      generateContent: mockGenerateContent,
    }),
  })),
}));

jest.mock('fs/promises', () => ({
  readFile: jest.fn().mockResolvedValue(Buffer.from('fake image data')),
}));

describe('ScriptGeneratorService', () => {
  let service: ScriptGeneratorService;

  beforeEach(async () => {
    jest.clearAllMocks();
    mockGenerateContent.mockResolvedValue({
      response: {
        text: () =>
          JSON.stringify({
            content: 'This slide shows a chart about sales growth.',
            script:
              'As you can see from this chart, our sales have grown significantly over the past quarter.',
            keywords: ['sales', 'growth', 'chart'],
          }),
      },
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ScriptGeneratorService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('fake-api-key'),
          },
        },
      ],
    }).compile();

    service = module.get<ScriptGeneratorService>(ScriptGeneratorService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('analyzeSlide', () => {
    it('shouldAnalyzeSlideImage: 슬라이드 이미지 분석하여 내용 추출', async () => {
      const imagePath = '/uploads/presentations/test-uuid/test-uuid-1.png';

      const result = await service.analyzeSlide(imagePath);

      expect(mockGenerateContent).toHaveBeenCalled();
      expect(result.content).toBeDefined();
      expect(result.content).toContain('chart');
    });
  });

  describe('generateScript', () => {
    it('shouldGenerateScriptForSlide: 슬라이드별 발표 스크립트 생성', async () => {
      const imagePath = '/uploads/presentations/test-uuid/test-uuid-1.png';

      const result = await service.generateScript(imagePath);

      expect(result.script).toBeDefined();
      expect(result.script.length).toBeGreaterThan(0);
      expect(result.slideNumber).toBe(1);
    });

    it('shouldCalculateEstimatedTime: 스크립트 기반 예상 시간 계산 (150단어/분)', async () => {
      // Script with exactly 25 words
      const scriptWith25Words =
        'One two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen twenty twenty-one twenty-two twenty-three twenty-four twenty-five';
      mockGenerateContent.mockResolvedValue({
        response: {
          text: () =>
            JSON.stringify({
              content: 'Test slide content',
              script: scriptWith25Words,
              keywords: ['test'],
            }),
        },
      });

      const imagePath = '/uploads/presentations/test-uuid/test-uuid-1.png';
      const result = await service.generateScript(imagePath);

      // 25 words / 150 words per minute = 0.1667 minutes = 10 seconds (rounded)
      expect(result.estimatedSeconds).toBe(10);
    });

    it('shouldApplyFormalTone: 격식체 톤 적용', async () => {
      const imagePath = '/uploads/presentations/test-uuid/test-uuid-1.png';

      await service.generateScript(imagePath, { tone: 'formal' });

      expect(mockGenerateContent).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.stringContaining('formal'),
        ]),
      );
    });

    it('shouldApplyCasualTone: 비격식체 톤 적용', async () => {
      const imagePath = '/uploads/presentations/test-uuid/test-uuid-1.png';

      await service.generateScript(imagePath, { tone: 'casual' });

      expect(mockGenerateContent).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.stringContaining('casual'),
        ]),
      );
    });

    it('shouldHandleTextOnlySlide: 텍스트만 있는 슬라이드 처리', async () => {
      mockGenerateContent.mockResolvedValue({
        response: {
          text: () =>
            JSON.stringify({
              content: 'This is a text-only slide with bullet points.',
              script:
                'Let me walk you through these key points on the slide.',
              keywords: ['bullet points', 'key points'],
              slideType: 'text',
            }),
        },
      });

      const imagePath = '/uploads/presentations/test-uuid/test-uuid-1.png';
      const result = await service.generateScript(imagePath);

      expect(result.script).toBeDefined();
      expect(result.script.length).toBeGreaterThan(0);
    });

    it('shouldHandleImageOnlySlide: 이미지/차트만 있는 슬라이드 처리', async () => {
      mockGenerateContent.mockResolvedValue({
        response: {
          text: () =>
            JSON.stringify({
              content: 'A pie chart showing market share distribution.',
              script:
                'This chart illustrates our market share compared to competitors.',
              keywords: ['pie chart', 'market share', 'distribution'],
              slideType: 'image',
            }),
        },
      });

      const imagePath = '/uploads/presentations/test-uuid/test-uuid-1.png';
      const result = await service.generateScript(imagePath);

      expect(result.script).toBeDefined();
      expect(result.script).toContain('chart');
    });

    it('shouldRetryOnApiFailure: API 실패 시 재시도 (exponential backoff)', async () => {
      mockGenerateContent
        .mockRejectedValueOnce(new Error('API rate limit exceeded'))
        .mockRejectedValueOnce(new Error('API rate limit exceeded'))
        .mockResolvedValueOnce({
          response: {
            text: () =>
              JSON.stringify({
                content: 'Success after retries.',
                script: 'This is the script after successful retry.',
                keywords: ['retry', 'success'],
              }),
          },
        });

      const imagePath = '/uploads/presentations/test-uuid/test-uuid-1.png';
      const result = await service.generateScript(imagePath);

      expect(mockGenerateContent).toHaveBeenCalledTimes(3);
      expect(result.script).toContain('retry');
    });
  });
});

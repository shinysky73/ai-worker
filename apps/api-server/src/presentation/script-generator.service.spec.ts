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
            visibleText: 'This slide shows a chart about sales growth.',
            charts: 'bar chart showing sales growth',
            images: '',
            layoutType: 'chart',
            keyMessage: 'Sales are increasing.',
            speakerNotes: 'Explain the details of the sales growth.',
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
      expect(result.charts).toBeDefined();
      expect(result.charts).toContain('chart');
    });
  });

  describe('generateScript', () => {
    it('shouldGenerateScriptForSlide: 슬라이드별 발표 스크립트 생성', async () => {
      const imagePath = '/uploads/presentations/test-uuid/test-uuid-1.png';
      const slideAnalysis = await service.analyzeSlide(imagePath);
      mockGenerateContent.mockResolvedValueOnce({
        response: {
          text: () =>
            JSON.stringify({
              script: 'This is a generated script.',
              transition: 'Next slide.',
            }),
        },
      });

      const scriptResult = await service.generateScriptWithContext(
        slideAnalysis,
        [],
      );

      expect(scriptResult.script).toBeDefined();
      expect(scriptResult.script.length).toBeGreaterThan(0);
      expect(scriptResult.slideNumber).toBe(1);
    });

    it('shouldCalculateEstimatedTime: 스크립트 기반 예상 시간 계산 (150단어/분)', async () => {
      // Script with exactly 25 words
      const scriptWith25Words =
        'One two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen twenty twenty-one twenty-two twenty-three twenty-four twenty-five';

      const imagePath = '/uploads/presentations/test-uuid/test-uuid-1.png';

      // Mock for analyzeSlide
      mockGenerateContent.mockResolvedValueOnce({
        response: {
          text: () =>
            JSON.stringify({
              visibleText: 'Test slide content',
              charts: '',
              images: '',
              layoutType: 'content',
              keyMessage: 'Key message',
              speakerNotes: 'Speaker notes',
            }),
        },
      });

      const slideAnalysis = await service.analyzeSlide(imagePath);

      // Mock for generateScriptWithContext
      mockGenerateContent.mockResolvedValueOnce({
        response: {
          text: () =>
            JSON.stringify({
              script: scriptWith25Words,
              transition: 'Next slide.',
            }),
        },
      });

      const scriptResult = await service.generateScriptWithContext(
        slideAnalysis,
        [],
      );

      // 25 words / 150 words per minute = 0.1667 minutes = 10 seconds (rounded)
      expect(scriptResult.estimatedSeconds).toBe(10);
    });

    it('shouldApplyFormalTone: 격식체 톤 적용', async () => {
      const imagePath = '/uploads/presentations/test-uuid/test-uuid-1.png';

      // Mock for analyzeSlide
      mockGenerateContent.mockResolvedValueOnce({
        response: {
          text: () =>
            JSON.stringify({
              visibleText: 'Some slide content.',
              charts: '',
              images: '',
              layoutType: 'content',
              keyMessage: 'Key message',
              speakerNotes: 'Speaker notes',
            }),
        },
      });

      const slideAnalysis = await service.analyzeSlide(imagePath);

      // Mock for generateScriptWithContext
      mockGenerateContent.mockResolvedValueOnce({
        response: {
          text: () =>
            JSON.stringify({
              script: 'This is a formal script.',
              transition: 'Next slide formally.',
            }),
        },
      });

      await service.generateScriptWithContext(slideAnalysis, [], {
        tone: 'formal',
      });

      // The second generateContent call (for script generation) should contain the formal tone instruction
      const scriptCall = mockGenerateContent.mock.calls[1];
      expect(scriptCall[0]).toEqual(expect.stringContaining('격식체를 사용하여'));
    });

    it('shouldApplyCasualTone: 비격식체 톤 적용', async () => {
      const imagePath = '/uploads/presentations/test-uuid/test-uuid-1.png';

      // Mock for analyzeSlide
      mockGenerateContent.mockResolvedValueOnce({
        response: {
          text: () =>
            JSON.stringify({
              visibleText: 'Some casual slide content.',
              charts: '',
              images: '',
              layoutType: 'content',
              keyMessage: 'Casual key message',
              speakerNotes: 'Casual speaker notes',
            }),
        },
      });

      const slideAnalysis = await service.analyzeSlide(imagePath);

      // Mock for generateScriptWithContext
      mockGenerateContent.mockResolvedValueOnce({
        response: {
          text: () =>
            JSON.stringify({
              script: 'This is a casual script.',
              transition: 'Next slide casually.',
            }),
        },
      });

      await service.generateScriptWithContext(slideAnalysis, [], {
        tone: 'casual',
      });

      // The second generateContent call (for script generation) should contain the casual tone instruction
      const scriptCall = mockGenerateContent.mock.calls[1];
      expect(scriptCall[0]).toEqual(expect.stringContaining('비격식체를 사용하여'));
    });

    it('shouldHandleTextOnlySlide: 텍스트만 있는 슬라이드 처리', async () => {
      const imagePath = '/uploads/presentations/test-uuid/test-uuid-1.png';

      // Mock for analyzeSlide
      mockGenerateContent.mockResolvedValueOnce({
        response: {
          text: () =>
            JSON.stringify({
              visibleText: 'This is a text-only slide with bullet points.',
              charts: '',
              images: '',
              layoutType: 'text',
              keyMessage: 'Key message for text slide',
              speakerNotes: 'Speaker notes for text slide',
            }),
        },
      });

      const slideAnalysis = await service.analyzeSlide(imagePath);

      // Mock for generateScriptWithContext
      mockGenerateContent.mockResolvedValueOnce({
        response: {
          text: () =>
            JSON.stringify({
              script: 'Let me walk you through these key points on the slide.',
              transition: 'Transition for text slide.',
            }),
        },
      });

      const scriptResult = await service.generateScriptWithContext(
        slideAnalysis,
        [],
      );

      expect(scriptResult.script).toBeDefined();
      expect(scriptResult.script.length).toBeGreaterThan(0);
    });

    it('shouldHandleImageOnlySlide: 이미지/차트만 있는 슬라이드 처리', async () => {
      const imagePath = '/uploads/presentations/test-uuid/test-uuid-1.png';

      // Mock for analyzeSlide
      mockGenerateContent.mockResolvedValueOnce({
        response: {
          text: () =>
            JSON.stringify({
              visibleText: '',
              charts: 'A pie chart showing market share distribution.',
              images: '',
              layoutType: 'image',
              keyMessage: 'Market share analysis.',
              speakerNotes: 'Details about market share distribution.',
            }),
        },
      });

      const slideAnalysis = await service.analyzeSlide(imagePath);

      // Mock for generateScriptWithContext
      mockGenerateContent.mockResolvedValueOnce({
        response: {
          text: () =>
            JSON.stringify({
              script:
                'This chart illustrates our market share compared to competitors.',
              transition: 'Transition for image slide.',
            }),
        },
      });

      const scriptResult = await service.generateScriptWithContext(
        slideAnalysis,
        [],
      );

      expect(scriptResult.script).toBeDefined();
      expect(scriptResult.script).toContain('chart');
    });

    it('shouldRetryOnApiFailure: API 실패 시 재시도 (exponential backoff)', async () => {
      const imagePath = '/uploads/presentations/test-uuid/test-uuid-1.png';

      // Mock for analyzeSlide (successful first try)
      mockGenerateContent.mockResolvedValueOnce({
        response: {
          text: () =>
            JSON.stringify({
              visibleText: 'Content for retry test.',
              charts: '',
              images: '',
              layoutType: 'content',
              keyMessage: 'Retry key message.',
              speakerNotes: 'Retry speaker notes.',
            }),
        },
      });

      const slideAnalysis = await service.analyzeSlide(imagePath);

      // Mocks for generateScriptWithContext (two failures, then success)
      mockGenerateContent
        .mockRejectedValueOnce(new Error('API rate limit exceeded'))
        .mockRejectedValueOnce(new Error('API rate limit exceeded'))
        .mockResolvedValueOnce({
          response: {
            text: () =>
              JSON.stringify({
                script: 'This is the script after successful retry.',
                transition: 'Retry transition.',
              }),
          },
        });

      const scriptResult = await service.generateScriptWithContext(
        slideAnalysis,
        [],
      );

      // The first call was for analyzeSlide, then three for generateScriptWithContext
      expect(mockGenerateContent).toHaveBeenCalledTimes(4);
      expect(scriptResult.script).toContain('retry');
    });
  });
});

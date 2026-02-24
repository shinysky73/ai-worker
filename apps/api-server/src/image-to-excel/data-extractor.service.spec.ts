import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { DataExtractorService } from './data-extractor.service';
import type { ReceiptData, NamecardData } from './types';

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

describe('DataExtractorService', () => {
  let service: DataExtractorService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DataExtractorService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('test-api-key'),
          },
        },
      ],
    }).compile();

    service = module.get<DataExtractorService>(DataExtractorService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('extractReceipt', () => {
    it('shouldExtractReceiptData: 영수증 이미지에서 구조화된 데이터 추출', async () => {
      mockGenerateContent.mockResolvedValue({
        response: {
          text: () => JSON.stringify({
            date: '2026-02-23',
            storeName: '스타벅스 강남점',
            items: '아메리카노 x2, 카페라떼 x1',
            totalAmount: '15000',
            paymentMethod: '카드',
            confidence: 'high',
          }),
        },
      });

      const result = await service.extractReceipt('/tmp/receipt.jpg');

      expect(result.data.date).toBe('2026-02-23');
      expect(result.data.storeName).toBe('스타벅스 강남점');
      expect(result.data.items).toBe('아메리카노 x2, 카페라떼 x1');
      expect(result.data.totalAmount).toBe('15000');
      expect(result.data.paymentMethod).toBe('카드');
      expect(result.confidence).toBe('high');
    });

    it('shouldHandleMissingFields: 추출 불가능한 필드는 빈 문자열 반환', async () => {
      mockGenerateContent.mockResolvedValue({
        response: {
          text: () => JSON.stringify({
            date: '2026-02-23',
            storeName: '알 수 없음',
            confidence: 'low',
          }),
        },
      });

      const result = await service.extractReceipt('/tmp/blurry.jpg');

      expect(result.data.items).toBe('');
      expect(result.data.totalAmount).toBe('');
      expect(result.data.paymentMethod).toBe('');
      expect(result.confidence).toBe('low');
    });

    it('shouldHandleCodeBlockResponse: ```json 코드 블록 감싸진 응답 파싱', async () => {
      mockGenerateContent.mockResolvedValue({
        response: {
          text: () => '```json\n{"date":"2026-01-01","storeName":"GS25","items":"","totalAmount":"3500","paymentMethod":"현금","confidence":"medium"}\n```',
        },
      });

      const result = await service.extractReceipt('/tmp/test.jpg');

      expect(result.data.date).toBe('2026-01-01');
      expect(result.confidence).toBe('medium');
    });

    it('shouldReturnLowConfidenceOnInvalidJson: 파싱 실패 시 빈 데이터 + low 신뢰도', async () => {
      mockGenerateContent.mockResolvedValue({
        response: {
          text: () => 'This is not a valid receipt image',
        },
      });

      const result = await service.extractReceipt('/tmp/not-receipt.jpg');

      expect(result.data.date).toBe('');
      expect(result.data.storeName).toBe('');
      expect(result.confidence).toBe('low');
    });
  });

  describe('extractNamecard', () => {
    it('shouldExtractNamecardData: 명함 이미지에서 구조화된 데이터 추출', async () => {
      mockGenerateContent.mockResolvedValue({
        response: {
          text: () => JSON.stringify({
            name: '김철수',
            title: '대리',
            company: '삼성전자',
            phone: '010-1234-5678',
            email: 'kim@samsung.com',
            address: '서울시 강남구',
            confidence: 'high',
          }),
        },
      });

      const result = await service.extractNamecard('/tmp/namecard.jpg');

      expect(result.data.name).toBe('김철수');
      expect(result.data.title).toBe('대리');
      expect(result.data.company).toBe('삼성전자');
      expect(result.data.phone).toBe('010-1234-5678');
      expect(result.data.email).toBe('kim@samsung.com');
      expect(result.confidence).toBe('high');
    });

    it('shouldHandlePartialNamecard: 일부 필드만 추출 가능한 경우', async () => {
      mockGenerateContent.mockResolvedValue({
        response: {
          text: () => JSON.stringify({
            name: '이영희',
            company: 'LG전자',
            confidence: 'medium',
          }),
        },
      });

      const result = await service.extractNamecard('/tmp/partial.jpg');

      expect(result.data.name).toBe('이영희');
      expect(result.data.title).toBe('');
      expect(result.data.phone).toBe('');
      expect(result.data.email).toBe('');
      expect(result.confidence).toBe('medium');
    });
  });
});

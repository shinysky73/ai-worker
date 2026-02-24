import { Test, TestingModule } from '@nestjs/testing';
import { ExcelGeneratorService } from './excel-generator.service';
import type { ReceiptData, NamecardData } from './types';
import * as ExcelJS from 'exceljs';

describe('ExcelGeneratorService', () => {
  let service: ExcelGeneratorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ExcelGeneratorService],
    }).compile();

    service = module.get<ExcelGeneratorService>(ExcelGeneratorService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateReceiptExcel', () => {
    it('shouldGenerateReceiptBuffer: 영수증 데이터 배열로 xlsx Buffer 생성', async () => {
      const receipts: ReceiptData[] = [
        {
          date: '2026-02-23',
          storeName: '스타벅스 강남점',
          items: '아메리카노 x2',
          totalAmount: '15000',
          paymentMethod: '카드',
          originalFilename: 'receipt1.jpg',
        },
      ];

      const buffer = await service.generateReceiptExcel(receipts);

      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.byteLength).toBeGreaterThan(0);

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer);
      const ws = workbook.getWorksheet(1)!;

      // Header row
      expect(ws.getRow(1).getCell(1).value).toBe('번호');
      expect(ws.getRow(1).getCell(2).value).toBe('날짜');
      expect(ws.getRow(1).getCell(3).value).toBe('상호명');
      expect(ws.getRow(1).getCell(4).value).toBe('항목요약');
      expect(ws.getRow(1).getCell(5).value).toBe('합계금액');
      expect(ws.getRow(1).getCell(6).value).toBe('결제수단');
      expect(ws.getRow(1).getCell(7).value).toBe('원본파일명');

      // Data row
      expect(ws.getRow(2).getCell(1).value).toBe(1);
      expect(ws.getRow(2).getCell(2).value).toBe('2026-02-23');
      expect(ws.getRow(2).getCell(3).value).toBe('스타벅스 강남점');
    });

    it('shouldHaveBoldHeaders: 첫 번째 행은 헤더(굵은 글씨)', async () => {
      const receipts: ReceiptData[] = [
        { date: '', storeName: '', items: '', totalAmount: '', paymentMethod: '', originalFilename: 'r.jpg' },
      ];

      const buffer = await service.generateReceiptExcel(receipts);
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer);
      const ws = workbook.getWorksheet(1)!;

      expect(ws.getRow(1).getCell(1).font?.bold).toBe(true);
      expect(ws.getRow(1).getCell(7).font?.bold).toBe(true);
    });

    it('shouldHandleEmptyValues: 모두 빈 값인 행도 포함, 원본파일명 표시', async () => {
      const receipts: ReceiptData[] = [
        { date: '', storeName: '', items: '', totalAmount: '', paymentMethod: '', originalFilename: 'blurry.png' },
      ];

      const buffer = await service.generateReceiptExcel(receipts);
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer);
      const ws = workbook.getWorksheet(1)!;

      expect(ws.getRow(2).getCell(1).value).toBe(1);
      expect(ws.getRow(2).getCell(2).value).toBe('');
      expect(ws.getRow(2).getCell(7).value).toBe('blurry.png');
    });

    it('shouldHandleSpecialCharacters: 특수문자 포함 데이터 처리', async () => {
      const receipts: ReceiptData[] = [
        {
          date: '2026-02-23',
          storeName: '카페 "행복" & Co.',
          items: '아이템 <1> 100%',
          totalAmount: '₩15,000',
          paymentMethod: '카드/현금',
          originalFilename: 'test (1).jpg',
        },
      ];

      const buffer = await service.generateReceiptExcel(receipts);
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer);
      const ws = workbook.getWorksheet(1)!;

      expect(ws.getRow(2).getCell(3).value).toBe('카페 "행복" & Co.');
      expect(ws.getRow(2).getCell(4).value).toBe('아이템 <1> 100%');
    });
  });

  describe('generateNamecardExcel', () => {
    it('shouldGenerateNamecardBuffer: 명함 데이터 배열로 xlsx Buffer 생성', async () => {
      const namecards: NamecardData[] = [
        {
          name: '김철수',
          title: '대리',
          company: '삼성전자',
          phone: '010-1234-5678',
          email: 'kim@samsung.com',
          address: '서울시 강남구 테헤란로 123',
          originalFilename: 'namecard1.jpg',
        },
      ];

      const buffer = await service.generateNamecardExcel(namecards);

      expect(buffer).toBeInstanceOf(Buffer);

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer);
      const ws = workbook.getWorksheet(1)!;

      // Header
      expect(ws.getRow(1).getCell(1).value).toBe('번호');
      expect(ws.getRow(1).getCell(2).value).toBe('이름');
      expect(ws.getRow(1).getCell(3).value).toBe('직함');
      expect(ws.getRow(1).getCell(4).value).toBe('회사명');
      expect(ws.getRow(1).getCell(5).value).toBe('전화번호');
      expect(ws.getRow(1).getCell(6).value).toBe('이메일');
      expect(ws.getRow(1).getCell(7).value).toBe('주소');
      expect(ws.getRow(1).getCell(8).value).toBe('원본파일명');

      // Data
      expect(ws.getRow(2).getCell(2).value).toBe('김철수');
      expect(ws.getRow(2).getCell(5).value).toBe('010-1234-5678');
    });

    it('shouldHandleMultipleNamecards: 여러 명함 데이터 처리', async () => {
      const namecards: NamecardData[] = [
        { name: '김철수', title: '대리', company: '삼성', phone: '', email: '', address: '', originalFilename: 'a.jpg' },
        { name: '이영희', title: '과장', company: 'LG', phone: '', email: '', address: '', originalFilename: 'b.jpg' },
      ];

      const buffer = await service.generateNamecardExcel(namecards);
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer);
      const ws = workbook.getWorksheet(1)!;

      expect(ws.getRow(2).getCell(1).value).toBe(1);
      expect(ws.getRow(3).getCell(1).value).toBe(2);
      expect(ws.getRow(3).getCell(2).value).toBe('이영희');
    });
  });
});

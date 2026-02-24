import { Injectable } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import type { ReceiptData, NamecardData } from './types';

const RECEIPT_HEADERS = ['번호', '날짜', '상호명', '항목요약', '합계금액', '결제수단', '원본파일명'];
const NAMECARD_HEADERS = ['번호', '이름', '직함', '회사명', '전화번호', '이메일', '주소', '원본파일명'];

@Injectable()
export class ExcelGeneratorService {
  async generateReceiptExcel(receipts: ReceiptData[]): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const ws = workbook.addWorksheet('영수증');

    ws.addRow(RECEIPT_HEADERS);
    ws.getRow(1).font = { bold: true };

    receipts.forEach((r, i) => {
      ws.addRow([i + 1, r.date, r.storeName, r.items, r.totalAmount, r.paymentMethod, r.originalFilename]);
    });

    this.autoFitColumns(ws);

    const arrayBuffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(arrayBuffer);
  }

  async generateNamecardExcel(namecards: NamecardData[]): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const ws = workbook.addWorksheet('명함');

    ws.addRow(NAMECARD_HEADERS);
    ws.getRow(1).font = { bold: true };

    namecards.forEach((n, i) => {
      ws.addRow([i + 1, n.name, n.title, n.company, n.phone, n.email, n.address, n.originalFilename]);
    });

    this.autoFitColumns(ws);

    const arrayBuffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(arrayBuffer);
  }

  private autoFitColumns(ws: ExcelJS.Worksheet): void {
    ws.columns.forEach((col) => {
      let maxLen = 10;
      col.eachCell!((cell) => {
        const len = String(cell.value ?? '').length;
        if (len > maxLen) maxLen = len;
      });
      col.width = Math.min(maxLen + 2, 50);
    });
  }
}

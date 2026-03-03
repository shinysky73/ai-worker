import { Injectable } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import type { InterviewQuestionResult } from './types';

const HEADERS = ['평가 역량', '질문', '평가 의도', '우수 답변 키워드', '평가기준(상)', '평가기준(중)', '평가기준(하)'];

@Injectable()
export class InterviewExcelGeneratorService {
  async generateInterviewExcel(result: InterviewQuestionResult): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const ws = workbook.addWorksheet('면접 질문');

    ws.addRow(HEADERS);
    ws.getRow(1).font = { bold: true };

    for (const q of result.questions) {
      const criteria = q.evaluationCriteria || [];
      ws.addRow([
        q.targetCompetency || '',
        q.question,
        q.intent,
        (q.goodAnswerKeywords || []).join(', '),
        criteria.find((c) => c.level === '상')?.description || '',
        criteria.find((c) => c.level === '중')?.description || '',
        criteria.find((c) => c.level === '하')?.description || '',
      ]);
    }

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

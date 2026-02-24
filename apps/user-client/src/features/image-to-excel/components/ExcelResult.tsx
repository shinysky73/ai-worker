import type { ExtractedDataResult } from '../services/imageToExcelApi';

interface ExcelResultProps {
  result: ExtractedDataResult;
  onDownload: () => void;
  onReset: () => void;
}

const RECEIPT_COLUMNS = ['날짜', '상호명', '항목요약', '합계금액', '결제수단', '원본파일명'];
const RECEIPT_KEYS = ['date', 'storeName', 'items', 'totalAmount', 'paymentMethod', 'originalFilename'];

const NAMECARD_COLUMNS = ['이름', '직함', '회사명', '전화번호', '이메일', '주소', '원본파일명'];
const NAMECARD_KEYS = ['name', 'title', 'company', 'phone', 'email', 'address', 'originalFilename'];

export function ExcelResult({ result, onDownload, onReset }: ExcelResultProps) {
  const columns = result.type === 'receipt' ? RECEIPT_COLUMNS : NAMECARD_COLUMNS;
  const keys = result.type === 'receipt' ? RECEIPT_KEYS : NAMECARD_KEYS;
  const typeLabel = result.type === 'receipt' ? '영수증' : '명함';

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            추출 완료 ({result.data.length}건)
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {typeLabel} 데이터가 추출되었습니다.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onDownload}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            엑셀 다운로드
          </button>
          <button
            onClick={onReset}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg transition-colors"
          >
            새로 변환
          </button>
        </div>
      </div>

      {/* Data table */}
      <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">#</th>
              {columns.map((col) => (
                <th key={col} className="px-3 py-2.5 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {result.data.map((row, i) => (
              <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                <td className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">{i + 1}</td>
                {keys.map((key) => (
                  <td key={key} className="px-3 py-2 text-sm text-gray-900 dark:text-gray-100 max-w-48 truncate">
                    {row[key] || '-'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

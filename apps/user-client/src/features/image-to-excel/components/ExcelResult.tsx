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
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            추출 완료 ({result.data.length}건)
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {typeLabel} 데이터가 추출되었습니다.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onDownload}
            className="px-3 py-1.5 text-sm font-medium text-white bg-gray-900 dark:bg-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
          >
            엑셀 다운로드
          </button>
          <button
            onClick={onReset}
            className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
          >
            새로 변환
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-800">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th className="px-3 py-2.5 text-left text-xs font-medium text-gray-500 dark:text-gray-400">#</th>
              {columns.map((col) => (
                <th key={col} className="px-3 py-2.5 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {result.data.map((row, i) => (
              <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-900/50">
                <td className="px-3 py-2 text-sm text-gray-400">{i + 1}</td>
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

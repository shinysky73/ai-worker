import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useImageToExcelHistory } from '../hooks/useImageToExcelHistory';
import { imageToExcelHistoryApi, type ImageToExcelHistoryItem } from '../services/imageToExcelHistoryApi';

const PAGE_SIZE = 10;

export function ImageToExcelHistoryPage() {
  const { items, total, loading, error, fetchList, deleteItem, downloadExcel } = useImageToExcelHistory();
  const [page, setPage] = useState(1);
  const [detailItem, setDetailItem] = useState<ImageToExcelHistoryItem | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    fetchList(page, PAGE_SIZE);
  }, [page, fetchList]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const handleViewDetail = useCallback(async (id: string) => {
    try {
      const detail = await imageToExcelHistoryApi.fetchDetail(id);
      setDetailItem(detail);
    } catch {
      // error handled by hook
    }
  }, []);

  const handleDelete = useCallback(async (id: string) => {
    await deleteItem(id);
    setDeleteConfirm(null);
    if (detailItem?.id === id) setDetailItem(null);
  }, [deleteItem, detailItem]);

  if (detailItem) {
    const columns = detailItem.type === 'receipt'
      ? ['날짜', '상호명', '항목요약', '합계금액', '결제수단', '원본파일명']
      : ['이름', '직함', '회사명', '전화번호', '이메일', '주소', '원본파일명'];
    const keys = detailItem.type === 'receipt'
      ? ['date', 'storeName', 'items', 'totalAmount', 'paymentMethod', 'originalFilename']
      : ['name', 'title', 'company', 'phone', 'email', 'address', 'originalFilename'];

    return (
      <div className="max-w-5xl mx-auto">
        <button
          onClick={() => setDetailItem(null)}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 mb-4"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          목록으로
        </button>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {detailItem.type === 'receipt' ? '영수증' : '명함'} 추출 결과
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {new Date(detailItem.createdAt).toLocaleString('ko-KR')} | {detailItem.imageCount}장
              </p>
            </div>
            <button
              onClick={() => downloadExcel(detailItem.id)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              엑셀 다운로드
            </button>
          </div>

          <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-600 dark:text-gray-400">#</th>
                  {columns.map((col) => (
                    <th key={col} className="px-3 py-2.5 text-left text-xs font-semibold text-gray-600 dark:text-gray-400">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {(detailItem.extractedData as Record<string, string>[]).map((row, i) => (
                  <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-3 py-2 text-sm text-gray-500">{i + 1}</td>
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
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <header className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">엑셀 변환 히스토리</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">이전 변환 결과를 확인하고 재다운로드할 수 있습니다.</p>
        </div>
        <Link
          to="/image-to-excel"
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          새 변환
        </Link>
      </header>

      {error && (
        <div className="mb-4 px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <svg className="animate-spin h-8 w-8 text-emerald-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <p>히스토리가 없습니다.</p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {items.map((item) => (
              <div
                key={item.id}
                className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 flex items-center gap-4"
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  item.type === 'receipt'
                    ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400'
                    : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                }`}>
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    {item.type === 'receipt' ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0" />
                    )}
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {item.type === 'receipt' ? '영수증' : '명함'} {item.imageCount}장
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(item.createdAt).toLocaleString('ko-KR')}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleViewDetail(item.id)}
                    className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    상세
                  </button>
                  <button
                    onClick={() => downloadExcel(item.id)}
                    className="text-xs text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 px-2 py-1 rounded hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                  >
                    다운로드
                  </button>
                  {deleteConfirm === item.id ? (
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="text-xs text-red-600 px-2 py-1 rounded bg-red-50 dark:bg-red-900/20 hover:bg-red-100"
                      >
                        확인
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(null)}
                        className="text-xs text-gray-500 px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        취소
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setDeleteConfirm(item.id)}
                      className="text-xs text-red-500 hover:text-red-700 px-2 py-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      삭제
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-gray-700 disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                이전
              </button>
              <span className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-gray-700 disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                다음
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

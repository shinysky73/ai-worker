import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useHistory } from '../hooks/useHistory';
import { historyApi, type HistoryItem } from '../services/historyApi';
import { SlideScriptCard } from '../../presentation/components/SlideScriptCard';
import { formatTime } from '../../presentation/utils/formatTime';

export function HistoryPage() {
  const { items, total, loading, error, fetchList, deleteItem } = useHistory();
  const [selectedItem, setSelectedItem] = useState<HistoryItem | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const limit = 20;

  useEffect(() => { fetchList(page, limit); }, [fetchList, page]);

  const handleViewDetail = useCallback(async (id: string) => {
    setDetailLoading(true);
    try {
      const detail = await historyApi.fetchDetail(id);
      setSelectedItem(detail);
    } catch {
      setSelectedItem(null);
    } finally {
      setDetailLoading(false);
    }
  }, []);

  const handleDelete = useCallback(async (id: string) => {
    await deleteItem(id);
    setDeleteConfirmId(null);
    if (selectedItem?.id === id) setSelectedItem(null);
  }, [deleteItem, selectedItem]);

  const totalPages = Math.ceil(total / limit);

  // Detail view
  if (selectedItem) {
    return (
      <div className="max-w-3xl mx-auto space-y-5">
        <button
          onClick={() => setSelectedItem(null)}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          목록으로
        </button>

        <div className="border-b border-gray-200 dark:border-gray-800 pb-5">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{selectedItem.filename}</h2>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500 dark:text-gray-400">
            <span className="flex items-center gap-1">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {formatTime(selectedItem.totalEstimatedSeconds)}
            </span>
            <span>{selectedItem.slides.length}장 슬라이드</span>
            {selectedItem.tone && (
              <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-full text-xs">
                {selectedItem.tone === 'formal' ? '격식체' : '비격식체'}
              </span>
            )}
            <span className="text-gray-400 dark:text-gray-500 text-xs">{new Date(selectedItem.createdAt).toLocaleString('ko-KR')}</span>
          </div>
        </div>

        <div className="space-y-3">
          {selectedItem.slides.map((slide) => (
            <SlideScriptCard key={slide.slideNumber} slide={slide} />
          ))}
        </div>
      </div>
    );
  }

  // List view
  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white">스크립트 히스토리</h1>
          {total > 0 && <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">총 {total}개</p>}
        </div>
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          새 스크립트
        </Link>
      </div>

      {loading && (
        <div className="text-center py-16">
          <div className="animate-spin h-8 w-8 mx-auto border-2 border-gray-200 dark:border-gray-700 border-t-gray-900 dark:border-t-white rounded-full" />
          <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">불러오는 중...</p>
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 dark:border-red-800 p-4">
          <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}

      {!loading && !error && items.length === 0 && (
        <div className="text-center py-20">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-lg mb-4">
            <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">히스토리가 없습니다</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">스크립트를 생성하면 여기에 기록됩니다.</p>
          <Link to="/" className="inline-flex items-center gap-1.5 mt-4 text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400">
            첫 스크립트 생성하기 →
          </Link>
        </div>
      )}

      {!loading && items.length > 0 && (
        <>
          <div className="space-y-2">
            {items.map((item) => (
              <div
                key={item.id}
                className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 transition-all duration-150"
              >
                <div className="flex items-center p-4 gap-3">
                  <div className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>

                  <button onClick={() => handleViewDetail(item.id)} className="flex-1 text-left min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{item.filename}</p>
                    <div className="mt-0.5 flex items-center gap-2.5 text-xs text-gray-500 dark:text-gray-400">
                      <span>{new Date(item.createdAt).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                      <span className="text-gray-300 dark:text-gray-600">·</span>
                      <span>{item.slides.length}장</span>
                      <span className="text-gray-300 dark:text-gray-600">·</span>
                      <span>{formatTime(item.totalEstimatedSeconds)}</span>
                    </div>
                  </button>

                  <div className="flex-shrink-0">
                    {deleteConfirmId === item.id ? (
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="text-xs px-2.5 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                        >
                          삭제
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(null)}
                          className="text-xs px-2.5 py-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                          취소
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeleteConfirmId(item.id)}
                        className="p-1.5 text-gray-300 dark:text-gray-600 hover:text-red-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
                        title="삭제"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 pt-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3.5 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-gray-800 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                이전
              </button>
              <span className="px-3 py-1.5 text-sm text-gray-500 dark:text-gray-400 tabular-nums">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3.5 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-gray-800 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                다음
              </button>
            </div>
          )}
        </>
      )}

      {detailLoading && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="animate-spin h-8 w-8 border-2 border-gray-200 dark:border-gray-700 border-t-gray-900 dark:border-t-white rounded-full" />
        </div>
      )}
    </div>
  );
}

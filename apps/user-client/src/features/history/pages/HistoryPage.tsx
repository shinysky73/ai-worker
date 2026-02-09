import { useEffect, useState, useCallback } from 'react';
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

  useEffect(() => {
    fetchList(page, limit);
  }, [fetchList, page]);

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
    if (selectedItem?.id === id) {
      setSelectedItem(null);
    }
  }, [deleteItem, selectedItem]);

  const handleBack = useCallback(() => {
    setSelectedItem(null);
  }, []);

  const totalPages = Math.ceil(total / limit);

  // Detail view
  if (selectedItem) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <button
            onClick={handleBack}
            className="inline-flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            목록으로
          </button>
        </div>

        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-6 border border-blue-200 dark:border-blue-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {selectedItem.filename}
          </h2>
          <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-600 dark:text-gray-400">
            <span>{formatTime(selectedItem.totalEstimatedSeconds)}</span>
            <span>{selectedItem.slides.length}장 슬라이드</span>
            {selectedItem.tone && <span>톤: {selectedItem.tone}</span>}
            <span>{new Date(selectedItem.createdAt).toLocaleString('ko-KR')}</span>
          </div>
        </div>

        <div className="space-y-4">
          {selectedItem.slides.map((slide) => (
            <SlideScriptCard key={slide.slideNumber} slide={slide} />
          ))}
        </div>
      </div>
    );
  }

  // List view
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
        히스토리
      </h1>

      {loading && (
        <div className="text-center py-12">
          <div className="animate-spin h-8 w-8 mx-auto border-4 border-indigo-500 border-t-transparent rounded-full" />
          <p className="mt-2 text-gray-500 dark:text-gray-400">불러오는 중...</p>
        </div>
      )}

      {error && (
        <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4">
          <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}

      {!loading && !error && items.length === 0 && (
        <div className="text-center py-16">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">
            히스토리가 없습니다
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            스크립트를 생성하면 여기에 기록됩니다.
          </p>
        </div>
      )}

      {!loading && items.length > 0 && (
        <>
          <div className="grid gap-4">
            {items.map((item) => (
              <div
                key={item.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => handleViewDetail(item.id)}
                    className="flex-1 text-left"
                  >
                    <h3 className="font-medium text-gray-900 dark:text-gray-100">
                      {item.filename}
                    </h3>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-500 dark:text-gray-400">
                      <span>{new Date(item.createdAt).toLocaleString('ko-KR')}</span>
                      <span>{item.slides.length}장</span>
                      <span>{formatTime(item.totalEstimatedSeconds)}</span>
                    </div>
                  </button>

                  <div className="ml-4">
                    {deleteConfirmId === item.id ? (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="text-xs px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                        >
                          삭제
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(null)}
                          className="text-xs px-2 py-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                        >
                          취소
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeleteConfirmId(item.id)}
                        className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                        title="삭제"
                      >
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 text-sm rounded border border-gray-300 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                이전
              </button>
              <span className="px-3 py-1 text-sm text-gray-600 dark:text-gray-400">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1 text-sm rounded border border-gray-300 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                다음
              </button>
            </div>
          )}
        </>
      )}

      {detailLoading && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
          <div className="animate-spin h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full" />
        </div>
      )}
    </div>
  );
}

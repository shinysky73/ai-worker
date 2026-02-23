import { useEffect, useState, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useImageAnalysisHistory } from '../hooks/useImageAnalysisHistory';
import { imageAnalysisHistoryApi, type ImageAnalysisHistoryItem } from '../services/imageAnalysisHistoryApi';

const IMAGE_TYPE_LABELS: Record<string, { label: string; color: string }> = {
  table: { label: '표', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' },
  chart: { label: '차트', color: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' },
  other: { label: '기타', color: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300' },
};

export function ImageAnalysisHistoryPage() {
  const { items, total, loading, error, fetchList, deleteItem } = useImageAnalysisHistory();
  const [selectedItem, setSelectedItem] = useState<ImageAnalysisHistoryItem | null>(null);
  const [imageBlobUrl, setImageBlobUrl] = useState<string | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const limit = 20;
  const prevBlobUrl = useRef<string | null>(null);

  useEffect(() => { fetchList(page, limit); }, [fetchList, page]);

  useEffect(() => {
    return () => {
      if (prevBlobUrl.current) URL.revokeObjectURL(prevBlobUrl.current);
    };
  }, []);

  const handleViewDetail = useCallback(async (id: string) => {
    setDetailLoading(true);
    if (prevBlobUrl.current) {
      URL.revokeObjectURL(prevBlobUrl.current);
      prevBlobUrl.current = null;
    }
    setImageBlobUrl(null);
    try {
      const [detail, blobUrl] = await Promise.all([
        imageAnalysisHistoryApi.fetchDetail(id),
        imageAnalysisHistoryApi.fetchImageBlobUrl(id).catch(() => null),
      ]);
      setSelectedItem(detail);
      prevBlobUrl.current = blobUrl;
      setImageBlobUrl(blobUrl);
    } catch {
      setSelectedItem(null);
    } finally {
      setDetailLoading(false);
    }
  }, []);

  const handleBack = useCallback(() => {
    if (prevBlobUrl.current) {
      URL.revokeObjectURL(prevBlobUrl.current);
      prevBlobUrl.current = null;
    }
    setImageBlobUrl(null);
    setSelectedItem(null);
  }, []);

  const handleDelete = useCallback(async (id: string) => {
    await deleteItem(id);
    setDeleteConfirmId(null);
    if (selectedItem?.id === id) handleBack();
  }, [deleteItem, selectedItem, handleBack]);

  const totalPages = Math.ceil(total / limit);

  // Detail view
  if (selectedItem) {
    const typeInfo = IMAGE_TYPE_LABELS[selectedItem.imageType] || IMAGE_TYPE_LABELS.other;
    return (
      <div className="max-w-3xl mx-auto space-y-5">
        <button
          onClick={handleBack}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          목록으로
        </button>

        <div className="bg-gradient-to-r from-violet-600 to-purple-600 rounded-2xl p-6 text-white">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">{selectedItem.filename}</h2>
              <p className="mt-1 text-violet-200 text-sm">
                {new Date(selectedItem.createdAt).toLocaleString('ko-KR')}
              </p>
            </div>
            <span className={`flex-shrink-0 px-2.5 py-1 rounded-full text-xs font-medium bg-white/20 text-white`}>
              {typeInfo.label}
            </span>
          </div>
        </div>

        {imageBlobUrl && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 flex items-center justify-center">
            <img
              src={imageBlobUrl}
              alt={selectedItem.filename}
              className="max-h-96 rounded-xl object-contain"
            />
          </div>
        )}

        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 space-y-5">
          <div>
            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">설명</h3>
            <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-wrap">
              {selectedItem.description}
            </p>
          </div>

          {selectedItem.insights.length > 0 && (
            <div className="border-t border-gray-100 dark:border-gray-700 pt-5">
              <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">핵심 인사이트</h3>
              <ul className="space-y-2.5">
                {selectedItem.insights.map((insight, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-gray-700 dark:text-gray-300">
                    <span className="mt-0.5 w-5 h-5 rounded-full bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-400 text-xs font-bold flex items-center justify-center flex-shrink-0">
                      {i + 1}
                    </span>
                    <span>{insight}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    );
  }

  // List view
  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">이미지 분석 히스토리</h1>
          {total > 0 && <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">총 {total}개</p>}
        </div>
        <Link
          to="/image-analysis"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-violet-600 hover:text-violet-700 dark:text-violet-400 dark:hover:text-violet-300 transition-colors"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          새 분석
        </Link>
      </div>

      {loading && (
        <div className="text-center py-16">
          <div className="animate-spin h-8 w-8 mx-auto border-[3px] border-violet-500 border-t-transparent rounded-full" />
          <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">불러오는 중...</p>
        </div>
      )}

      {error && (
        <div className="rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4">
          <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}

      {!loading && !error && items.length === 0 && (
        <div className="text-center py-20">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-2xl mb-4">
            <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">분석 히스토리가 없습니다</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">이미지를 분석하면 여기에 기록됩니다.</p>
          <Link to="/image-analysis" className="inline-flex items-center gap-1.5 mt-4 text-sm font-medium text-violet-600 hover:text-violet-700 dark:text-violet-400">
            첫 이미지 분석하기 →
          </Link>
        </div>
      )}

      {!loading && items.length > 0 && (
        <>
          <div className="space-y-2">
            {items.map((item) => {
              const typeInfo = IMAGE_TYPE_LABELS[item.imageType] || IMAGE_TYPE_LABELS.other;
              return (
                <div
                  key={item.id}
                  className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-violet-200 dark:hover:border-violet-700 hover:shadow-sm transition-all duration-150"
                >
                  <div className="flex items-center p-4 gap-3">
                    <div className="w-9 h-9 rounded-xl bg-violet-50 dark:bg-violet-900/30 flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>

                    <button onClick={() => handleViewDetail(item.id)} className="flex-1 text-left min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{item.filename}</p>
                      <div className="mt-0.5 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                        <span>{new Date(item.createdAt).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                        <span className="text-gray-300 dark:text-gray-600">·</span>
                        <span className={`px-1.5 py-0.5 rounded-md text-xs font-medium ${typeInfo.color}`}>
                          {typeInfo.label}
                        </span>
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
                          className="p-1.5 text-gray-300 dark:text-gray-600 hover:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
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
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 pt-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3.5 py-1.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                이전
              </button>
              <span className="px-3 py-1.5 text-sm text-gray-500 dark:text-gray-400 tabular-nums">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3.5 py-1.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                다음
              </button>
            </div>
          )}
        </>
      )}

      {detailLoading && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="animate-spin h-8 w-8 border-[3px] border-violet-500 border-t-transparent rounded-full" />
        </div>
      )}
    </div>
  );
}

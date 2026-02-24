import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useInterviewHistory } from '../hooks/useInterviewHistory';
import { interviewHistoryApi, type InterviewHistoryItem } from '../services/interviewHistoryApi';
import { InterviewResult } from '../components/InterviewResult';

const PAGE_SIZE = 10;

export function InterviewHistoryPage() {
  const { items, total, loading, error, fetchList, deleteItem, downloadExcel } = useInterviewHistory();
  const [page, setPage] = useState(1);
  const [detailItem, setDetailItem] = useState<InterviewHistoryItem | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    fetchList(page, PAGE_SIZE);
  }, [page, fetchList]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const handleViewDetail = useCallback(async (id: string) => {
    try {
      const detail = await interviewHistoryApi.fetchDetail(id);
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

  const handleDetailDownload = useCallback(async () => {
    if (detailItem) {
      await downloadExcel(detailItem.id);
    }
  }, [detailItem, downloadExcel]);

  const handleDetailCopy = useCallback(async () => {
    if (!detailItem?.questionsData) return;
    const result = detailItem.questionsData;
    const lines: string[] = [];
    for (const comp of result.competencies) {
      lines.push(`[${comp.name}]`);
      for (const q of comp.questions) {
        lines.push(`  Q: ${q.question}`);
        lines.push(`  의도: ${q.intent}`);
        lines.push(`  키워드: ${q.goodAnswerKeywords.join(', ')}`);
        for (const ec of q.evaluationCriteria) {
          lines.push(`  ${ec.level}: ${ec.description}`);
        }
        lines.push('');
      }
    }
    try {
      await navigator.clipboard.writeText(lines.join('\n'));
    } catch { /* no-op */ }
  }, [detailItem]);

  // Detail view
  if (detailItem) {
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
          <div className="mb-4 text-xs text-gray-500 dark:text-gray-400">
            {new Date(detailItem.createdAt).toLocaleString('ko-KR')} | {detailItem.jobCategory} | {detailItem.questionCount}개 질문
          </div>
          <InterviewResult
            result={detailItem.questionsData}
            onDownload={handleDetailDownload}
            onCopy={handleDetailCopy}
            onReset={() => setDetailItem(null)}
          />
        </div>
      </div>
    );
  }

  // List view
  return (
    <div className="max-w-5xl mx-auto">
      <header className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">면접 질문 히스토리</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">이전에 생성한 면접 질문을 확인하고 재다운로드할 수 있습니다.</p>
        </div>
        <Link
          to="/interview"
          className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          새 생성
        </Link>
      </header>

      {error && (
        <div className="mb-4 px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <svg className="animate-spin h-8 w-8 text-violet-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <svg className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p>아직 생성한 면접 질문이 없습니다</p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {items.map((item) => (
              <div
                key={item.id}
                className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 flex items-center gap-4"
              >
                <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                    {item.jdSummary}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {item.jobCategory} | {item.questionCount}개 질문 | {new Date(item.createdAt).toLocaleString('ko-KR')}
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
                    className="text-xs text-violet-600 hover:text-violet-700 dark:text-violet-400 dark:hover:text-violet-300 px-2 py-1 rounded hover:bg-violet-50 dark:hover:bg-violet-900/20"
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

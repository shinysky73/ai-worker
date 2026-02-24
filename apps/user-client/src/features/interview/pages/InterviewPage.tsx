import { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import { useInterview } from '../hooks/useInterview';
import { useInterviewStore } from '../stores/interviewStore';
import { JdTextInput } from '../components/JdTextInput';
import { JobCategorySelector } from '../components/JobCategorySelector';
import { InterviewProcessingStatus } from '../components/InterviewProcessingStatus';
import { InterviewResult } from '../components/InterviewResult';

export function InterviewPage() {
  const [jdText, setJdText] = useState('');
  const { options, setOptions } = useInterviewStore();
  const {
    state, result, error,
    submit, downloadExcel, copyToClipboard, reset,
  } = useInterview();

  const handleSubmit = useCallback(async () => {
    if (!jdText.trim()) return;
    await submit(jdText);
  }, [jdText, submit]);

  const handleReset = useCallback(() => {
    reset();
    setJdText('');
  }, [reset]);

  const isProcessing = state === 'submitting' || state === 'processing';
  const showForm = state === 'idle' || state === 'error';
  const showResult = state === 'completed' && result;
  const canSubmit = jdText.trim().length >= 50 && jdText.length <= 10000 && !isProcessing;

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <header className="relative text-center mb-8 pt-2">
        <Link
          to="/interview/history"
          className="absolute right-0 top-2 flex items-center gap-1.5 text-sm text-gray-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          히스토리
        </Link>
        <div className="inline-flex items-center justify-center w-12 h-12 bg-violet-100 dark:bg-violet-900/30 rounded-2xl mb-4">
          <svg className="w-6 h-6 text-violet-600 dark:text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">면접 질문 생성</h1>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          채용 공고(JD)를 붙여넣으면 AI가 직무에 맞는 면접 질문과 평가 기준을 자동으로 생성합니다.
        </p>
      </header>

      <main className="space-y-5">
        {showForm && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 space-y-6">
            {/* Job category */}
            <div>
              <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">직무 유형</h2>
              <JobCategorySelector
                value={options.jobCategory}
                onChange={(jobCategory) => setOptions({ jobCategory })}
                disabled={isProcessing}
              />
            </div>

            {/* JD Text input */}
            <div>
              <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">채용 공고 (JD)</h2>
              <JdTextInput
                value={jdText}
                onChange={setJdText}
                disabled={isProcessing}
              />
            </div>

            {error && (
              <div className="px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="w-full py-3 px-4 text-white font-semibold rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
            >
              {isProcessing && (
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              )}
              {isProcessing ? '생성 중...' : '면접 질문 생성'}
            </button>
          </div>
        )}

        {isProcessing && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <InterviewProcessingStatus state={state} />
          </div>
        )}

        {showResult && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <InterviewResult
              result={result}
              onDownload={downloadExcel}
              onCopy={copyToClipboard}
              onReset={handleReset}
            />
          </div>
        )}
      </main>
    </div>
  );
}

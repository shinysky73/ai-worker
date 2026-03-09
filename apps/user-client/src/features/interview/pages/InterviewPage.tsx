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
  const [resumeText, setResumeText] = useState('');
  const { options, setOptions } = useInterviewStore();
  const {
    state, result, error,
    submit, downloadExcel, copyToClipboard, reset,
  } = useInterview();

  const handleSubmit = useCallback(async () => {
    if (!jdText.trim()) return;
    await submit(jdText, resumeText || undefined);
  }, [jdText, resumeText, submit]);

  const handleReset = useCallback(() => {
    reset();
    setJdText('');
    setResumeText('');
  }, [reset]);

  const isProcessing = state === 'submitting' || state === 'processing';
  const showForm = state === 'idle' || state === 'error';
  const showResult = state === 'completed' && result;
  const canSubmit = jdText.trim().length >= 50 && jdText.length <= 10000 && !isProcessing;

  return (
    <div className="max-w-5xl mx-auto">
      <header className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white">면접 질문 생성</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            채용 공고(JD)를 붙여넣으면 직무에 맞는 면접 질문과 평가 기준을 생성합니다.
          </p>
        </div>
        <Link
          to="/interview/history"
          className="text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors shrink-0"
        >
          히스토리
        </Link>
      </header>

      <div className="space-y-5">
        {showForm && (
          <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-5 space-y-5">
            <div>
              <h2 className="text-sm font-medium text-gray-900 dark:text-white mb-3">직무 유형</h2>
              <JobCategorySelector
                value={options.jobCategory}
                onChange={(jobCategory) => setOptions({ jobCategory })}
                disabled={isProcessing}
              />
            </div>

            <div>
              <h2 className="text-sm font-medium text-gray-900 dark:text-white mb-3">채용 공고 (JD)</h2>
              <JdTextInput
                value={jdText}
                onChange={setJdText}
                disabled={isProcessing}
              />
            </div>

            <div>
              <div className="flex items-center gap-2 mb-3">
                <h2 className="text-sm font-medium text-gray-900 dark:text-white">이력서/경력서</h2>
                <span className="text-xs text-gray-400">(선택)</span>
              </div>
              <textarea
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
                disabled={isProcessing}
                placeholder="지원자의 이력서/경력서 내용을 붙여넣으면 맞춤 질문을 생성합니다."
                maxLength={10000}
                rows={5}
                className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 resize-y focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-400 focus:border-transparent disabled:opacity-50 transition-shadow"
              />
              {resumeText.length > 0 && (
                <p className="mt-1 text-xs text-gray-400 text-right">
                  {resumeText.length.toLocaleString()} / 10,000
                </p>
              )}
            </div>

            {error && (
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            )}

            <button
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="w-full py-2.5 px-4 text-sm font-medium text-white rounded-lg bg-gray-900 dark:bg-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {isProcessing ? '생성 중...' : '면접 질문 생성'}
            </button>
          </div>
        )}

        {isProcessing && (
          <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-5">
            <InterviewProcessingStatus state={state} />
          </div>
        )}

        {showResult && (
          <InterviewResult
            result={result}
            onDownload={downloadExcel}
            onCopy={copyToClipboard}
            onReset={handleReset}
          />
        )}
      </div>
    </div>
  );
}

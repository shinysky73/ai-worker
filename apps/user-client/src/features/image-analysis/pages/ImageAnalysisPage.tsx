import { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import { useImageAnalysis } from '../hooks/useImageAnalysis';
import { ImageUploader } from '../components/ImageUploader';
import { AnalysisOptionsForm } from '../components/AnalysisOptionsForm';
import { AnalysisStatus } from '../components/AnalysisStatus';
import { AnalysisResult } from '../components/AnalysisResult';

export function ImageAnalysisPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { state, progress, message, result, error, imagePreviewUrl, upload, reset } = useImageAnalysis();

  const handleFileSelect = useCallback((file: File) => setSelectedFile(file), []);

  const handleSubmit = useCallback(async () => {
    if (!selectedFile) return;
    await upload(selectedFile);
  }, [selectedFile, upload]);

  const handleReset = useCallback(() => {
    reset();
    setSelectedFile(null);
  }, [reset]);

  const isProcessing = state === 'uploading' || state === 'processing';
  const showForm = state === 'idle' || state === 'error';
  const showResult = state === 'completed' && result;

  return (
    <div className="max-w-3xl mx-auto">
      <header className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white">이미지 분석</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            표·차트 이미지를 업로드하면 내용을 분석하고 텍스트로 설명합니다.
          </p>
        </div>
        <Link
          to="/image-analysis/history"
          className="text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors shrink-0"
        >
          히스토리
        </Link>
      </header>

      <div className="space-y-5">
        {showForm && (
          <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-5 space-y-5">
            <ImageUploader onFileSelect={handleFileSelect} disabled={isProcessing} />

            {selectedFile && (
              <>
                <div className="flex items-center justify-between px-3.5 py-2.5 bg-gray-50 dark:bg-gray-900 rounded-lg text-sm">
                  <span className="text-gray-700 dark:text-gray-300 truncate">{selectedFile.name}</span>
                  <div className="flex items-center gap-3 shrink-0 ml-3">
                    <span className="text-xs text-gray-400">{(selectedFile.size / 1024 / 1024).toFixed(1)} MB</span>
                    <button
                      onClick={() => setSelectedFile(null)}
                      aria-label="파일 제거"
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>

                <div className="border-t border-gray-100 dark:border-gray-800 pt-5">
                  <h2 className="text-sm font-medium text-gray-900 dark:text-white mb-3">분석 옵션</h2>
                  <AnalysisOptionsForm disabled={isProcessing} />
                </div>

                {error && (
                  <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                )}

                <button
                  onClick={handleSubmit}
                  disabled={isProcessing}
                  className="w-full py-2.5 px-4 text-sm font-medium text-white rounded-lg bg-gray-900 dark:bg-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  {isProcessing ? '분석 중...' : '이미지 분석'}
                </button>
              </>
            )}
          </div>
        )}

        {isProcessing && (
          <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-5">
            <AnalysisStatus state={state} progress={progress} message={message} error={error} />
          </div>
        )}

        {showResult && (
          <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-5">
            <AnalysisResult result={result} imagePreviewUrl={imagePreviewUrl} onReset={handleReset} />
          </div>
        )}
      </div>
    </div>
  );
}

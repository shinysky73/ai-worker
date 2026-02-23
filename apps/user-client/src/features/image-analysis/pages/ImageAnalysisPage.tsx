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
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <header className="relative text-center mb-8 pt-2">
        <Link
          to="/image-analysis/history"
          className="absolute right-0 top-2 flex items-center gap-1.5 text-sm text-gray-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          히스토리
        </Link>
        <div className="inline-flex items-center justify-center w-12 h-12 bg-violet-100 dark:bg-violet-900/30 rounded-2xl mb-4">
          <svg className="w-6 h-6 text-violet-600 dark:text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">이미지 분석기</h1>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          표·차트 이미지를 업로드하면 AI가 내용을 분석하고 텍스트로 설명합니다.
        </p>
      </header>

      <main className="space-y-5">
        {showForm && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 space-y-6">
            <ImageUploader onFileSelect={handleFileSelect} disabled={isProcessing} />

            {selectedFile && (
              <>
                <div className="flex items-center gap-3 px-4 py-3 bg-violet-50 dark:bg-violet-900/20 rounded-xl border border-violet-100 dark:border-violet-900">
                  <svg className="h-5 w-5 text-violet-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-sm text-violet-700 dark:text-violet-300 truncate flex-1 font-medium">
                    {selectedFile.name}
                  </span>
                  <span className="text-xs text-violet-500 dark:text-violet-400 flex-shrink-0">
                    {(selectedFile.size / 1024 / 1024).toFixed(1)} MB
                  </span>
                  <button
                    onClick={() => setSelectedFile(null)}
                    aria-label="파일 제거"
                    className="text-violet-400 hover:text-violet-600 dark:hover:text-violet-300 transition-colors flex-shrink-0"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="border-t border-gray-100 dark:border-gray-700 pt-5">
                  <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
                    분석 옵션
                  </h2>
                  <AnalysisOptionsForm disabled={isProcessing} />
                </div>

                {error && (
                  <div className="px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
                    <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                  </div>
                )}

                <button
                  onClick={handleSubmit}
                  disabled={isProcessing}
                  className="w-full py-3 px-4 text-white font-semibold rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
                >
                  {isProcessing && (
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  )}
                  {isProcessing ? '분석 중...' : '이미지 분석하기'}
                </button>
              </>
            )}
          </div>
        )}

        {isProcessing && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <AnalysisStatus state={state} progress={progress} message={message} error={error} />
          </div>
        )}

        {showResult && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <AnalysisResult result={result} imagePreviewUrl={imagePreviewUrl} onReset={handleReset} />
          </div>
        )}
      </main>
    </div>
  );
}

import { useCallback, useState } from 'react';
import { useImageAnalysis } from '../hooks/useImageAnalysis';
import { ImageUploader } from '../components/ImageUploader';
import { AnalysisOptionsForm } from '../components/AnalysisOptionsForm';
import { AnalysisStatus } from '../components/AnalysisStatus';
import { AnalysisResult } from '../components/AnalysisResult';

export function ImageAnalysisPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { state, progress, message, result, error, imagePreviewUrl, upload, reset } =
    useImageAnalysis();

  const handleFileSelect = useCallback((file: File) => {
    setSelectedFile(file);
  }, []);

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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-5xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <header className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            이미지 분석기
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            표나 차트 이미지를 업로드하면 AI가 내용을 텍스트로 설명해드립니다.
          </p>
        </header>

        <main className="space-y-6">
          {showForm && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 space-y-6">
              <ImageUploader
                onFileSelect={handleFileSelect}
                disabled={isProcessing}
              />

              {selectedFile && (
                <>
                  {/* Selected file info */}
                  <div className="flex items-center gap-2 p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-md">
                    <svg
                      className="h-5 w-5 text-indigo-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    <span className="text-sm text-indigo-700 dark:text-indigo-300">
                      {selectedFile.name}
                    </span>
                    <span className="text-xs text-indigo-500 dark:text-indigo-400">
                      ({(selectedFile.size / 1024 / 1024).toFixed(1)} MB)
                    </span>
                    <button
                      onClick={() => setSelectedFile(null)}
                      aria-label="파일 제거"
                      className="ml-auto text-indigo-500 hover:text-indigo-700"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  {/* Options */}
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                    <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                      분석 옵션
                    </h2>
                    <AnalysisOptionsForm disabled={isProcessing} />
                  </div>

                  {/* Error display */}
                  {error && (
                    <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                      <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                    </div>
                  )}

                  {/* Submit button */}
                  <button
                    onClick={handleSubmit}
                    disabled={isProcessing}
                    className="
                      w-full py-3 px-4 text-white font-medium rounded-md
                      bg-indigo-600 hover:bg-indigo-700
                      disabled:opacity-50 disabled:cursor-not-allowed
                      transition-colors duration-200
                      flex items-center justify-center gap-2
                    "
                  >
                    {isProcessing && (
                      <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
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
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
              <AnalysisStatus
                state={state}
                progress={progress}
                message={message}
                error={error}
              />
            </div>
          )}

          {showResult && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <AnalysisResult
                result={result}
                imagePreviewUrl={imagePreviewUrl}
                onReset={handleReset}
              />
            </div>
          )}
        </main>

        <footer className="mt-12 text-center text-sm text-gray-500 dark:text-gray-400">
          <p>AI Worker - 이미지 분석기</p>
        </footer>
      </div>
    </div>
  );
}

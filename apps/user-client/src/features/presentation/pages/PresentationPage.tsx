import { useCallback, useState } from 'react';
import { usePresentation } from '../hooks/usePresentation';
import { usePresentationStore, PresentationOptions } from '../stores/presentationStore';
import { FileUploader } from '../components/FileUploader';
import { OptionsForm } from '../components/OptionsForm';
import { ProcessingStatus } from '../components/ProcessingStatus';
import { SlideScriptCard } from '../components/SlideScriptCard';
import { ResultSummary } from '../components/ResultSummary';

export function PresentationPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { state, progress, result, error, upload, reset } = usePresentation();
  const { options, setOptions } = usePresentationStore();

  const handleFileSelect = useCallback((file: File) => {
    setSelectedFile(file);
  }, []);

  const handleOptionsChange = useCallback(
    (newOptions: PresentationOptions) => {
      setOptions(newOptions);
    },
    [setOptions],
  );

  const handleSubmit = useCallback(async () => {
    if (!selectedFile) return;
    await upload(selectedFile);
  }, [selectedFile, upload]);

  const handleReset = useCallback(() => {
    reset();
    setSelectedFile(null);
    setOptions({});
  }, [reset, setOptions]);

  const isProcessing = state === 'uploading' || state === 'processing';
  const showForm = state === 'idle' || state === 'error';
  const showResult = state === 'completed' && result;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <header className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            발표 스크립트 생성기
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            PPT 파일을 업로드하면 AI가 각 슬라이드에 맞는 발표 스크립트를
            생성해드립니다.
          </p>
        </header>

        <main className="space-y-6">
          {showForm && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 space-y-6">
              <FileUploader
                onFileSelect={handleFileSelect}
                disabled={isProcessing}
              />

              {selectedFile && (
                <>
                  <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                    <svg
                      className="h-5 w-5 text-blue-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    <span className="text-sm text-blue-700 dark:text-blue-300">
                      {selectedFile.name}
                    </span>
                    <button
                      onClick={() => setSelectedFile(null)}
                      className="ml-auto text-blue-500 hover:text-blue-700"
                    >
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>

                  <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                    <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                      옵션 설정 (선택사항)
                    </h2>
                    <OptionsForm
                      options={options}
                      onChange={handleOptionsChange}
                      disabled={isProcessing}
                    />
                  </div>

                  <button
                    onClick={handleSubmit}
                    disabled={isProcessing}
                    className="
                      w-full py-3 px-4 text-white font-medium rounded-md
                      bg-blue-600 hover:bg-blue-700
                      disabled:opacity-50 disabled:cursor-not-allowed
                      transition-colors duration-200
                    "
                  >
                    스크립트 생성하기
                  </button>
                </>
              )}
            </div>
          )}

          {isProcessing && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <ProcessingStatus
                state={state}
                progress={progress}
                error={error}
                filename={selectedFile?.name}
              />
            </div>
          )}

          {showResult && (
            <div className="space-y-6">
              <ResultSummary result={result} onReset={handleReset} />

              <div className="space-y-4">
                {result.slides.map((slide) => (
                  <SlideScriptCard key={slide.slideNumber} slide={slide} />
                ))}
              </div>
            </div>
          )}
        </main>

        <footer className="mt-12 text-center text-sm text-gray-500 dark:text-gray-400">
          <p>AI Worker - 발표 스크립트 생성기</p>
        </footer>
      </div>
    </div>
  );
}

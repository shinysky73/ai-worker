import { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import { useImageToExcel } from '../hooks/useImageToExcel';
import { useImageToExcelStore } from '../stores/imageToExcelStore';
import { MultiImageUploader } from '../components/MultiImageUploader';
import { TypeSelector } from '../components/TypeSelector';
import { ProcessingStatus } from '../components/ProcessingStatus';
import { ExcelResult } from '../components/ExcelResult';

export function ImageToExcelPage() {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const { options, setOptions } = useImageToExcelStore();
  const {
    state, progress, totalFiles, completedFiles, images, result, error,
    upload, downloadExcel, reset,
  } = useImageToExcel();

  const handleSubmit = useCallback(async () => {
    if (selectedFiles.length === 0) return;
    await upload(selectedFiles);
  }, [selectedFiles, upload]);

  const handleReset = useCallback(() => {
    reset();
    setSelectedFiles([]);
  }, [reset]);

  const isProcessing = state === 'uploading' || state === 'processing';
  const showForm = state === 'idle' || state === 'error';
  const showResult = state === 'completed' && result;

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <header className="relative text-center mb-8 pt-2">
        <Link
          to="/image-to-excel/history"
          className="absolute right-0 top-2 flex items-center gap-1.5 text-sm text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          히스토리
        </Link>
        <div className="inline-flex items-center justify-center w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl mb-4">
          <svg className="w-6 h-6 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">엑셀 변환</h1>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          영수증이나 명함 이미지를 업로드하면 AI가 정보를 추출하여 엑셀 파일로 변환합니다.
        </p>
      </header>

      <main className="space-y-5">
        {showForm && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 space-y-6">
            {/* Type selector */}
            <div>
              <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">이미지 타입</h2>
              <TypeSelector
                value={options.type}
                onChange={(type) => setOptions({ type })}
                disabled={isProcessing}
              />
            </div>

            {/* Multi-file uploader */}
            <MultiImageUploader
              files={selectedFiles}
              onFilesChange={setSelectedFiles}
              disabled={isProcessing}
            />

            {selectedFiles.length > 0 && (
              <>
                {error && (
                  <div className="px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
                    <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                  </div>
                )}

                <button
                  onClick={handleSubmit}
                  disabled={isProcessing}
                  className="w-full py-3 px-4 text-white font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
                >
                  {isProcessing && (
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  )}
                  {isProcessing ? '변환 중...' : `${selectedFiles.length}장 엑셀로 변환`}
                </button>
              </>
            )}
          </div>
        )}

        {isProcessing && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <ProcessingStatus
              progress={progress}
              totalFiles={totalFiles}
              completedFiles={completedFiles}
              images={images}
              error={error}
            />
          </div>
        )}

        {showResult && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <ExcelResult result={result} onDownload={downloadExcel} onReset={handleReset} />
          </div>
        )}
      </main>
    </div>
  );
}

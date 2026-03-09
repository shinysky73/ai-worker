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
    <div className="max-w-3xl mx-auto">
      <header className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white">엑셀 변환</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            영수증이나 명함 이미지에서 데이터를 추출하여 엑셀 파일로 변환합니다.
          </p>
        </div>
        <Link
          to="/image-to-excel/history"
          className="text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors shrink-0"
        >
          히스토리
        </Link>
      </header>

      <div className="space-y-5">
        {showForm && (
          <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-5 space-y-5">
            <div>
              <h2 className="text-sm font-medium text-gray-900 dark:text-white mb-3">이미지 타입</h2>
              <TypeSelector
                value={options.type}
                onChange={(type) => setOptions({ type })}
                disabled={isProcessing}
              />
            </div>

            <MultiImageUploader
              files={selectedFiles}
              onFilesChange={setSelectedFiles}
              disabled={isProcessing}
            />

            {selectedFiles.length > 0 && (
              <>
                {error && (
                  <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                )}

                <button
                  onClick={handleSubmit}
                  disabled={isProcessing}
                  className="w-full py-2.5 px-4 text-sm font-medium text-white rounded-lg bg-gray-900 dark:bg-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  {isProcessing ? '변환 중...' : `${selectedFiles.length}장 엑셀로 변환`}
                </button>
              </>
            )}
          </div>
        )}

        {isProcessing && (
          <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-5">
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
          <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-5">
            <ExcelResult result={result} onDownload={downloadExcel} onReset={handleReset} />
          </div>
        )}
      </div>
    </div>
  );
}

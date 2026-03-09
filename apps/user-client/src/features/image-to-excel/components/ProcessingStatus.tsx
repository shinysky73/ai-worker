import type { ImageStatus } from '../services/imageToExcelApi';

interface ProcessingStatusProps {
  progress: number;
  totalFiles: number;
  completedFiles: number;
  images: ImageStatus[];
  error: string | null;
}

export function ProcessingStatus({ progress, totalFiles, completedFiles, images, error }: ProcessingStatusProps) {
  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-gray-700 dark:text-gray-300">
            처리 중 ({completedFiles}/{totalFiles})
          </span>
          <span className="text-gray-400 tabular-nums">{progress}%</span>
        </div>
        <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-1 overflow-hidden">
          <div
            className="bg-gray-900 dark:bg-white h-1 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {images.length > 0 && (
        <div className="space-y-1">
          {images.map((img, i) => (
            <div
              key={i}
              className="flex items-center justify-between px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-900 text-sm"
            >
              <span className="text-gray-700 dark:text-gray-300 truncate">{img.filename}</span>
              <span className={`text-xs shrink-0 ml-3 ${
                img.status === 'completed' ? 'text-green-600 dark:text-green-400' :
                img.status === 'error' ? 'text-red-500 dark:text-red-400' :
                img.status === 'processing' ? 'text-gray-600 dark:text-gray-400' :
                'text-gray-400'
              }`}>
                {img.status === 'completed' ? '완료' :
                 img.status === 'error' ? '실패' :
                 img.status === 'processing' ? '처리 중' : '대기'}
              </span>
            </div>
          ))}
        </div>
      )}

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}

import { useCallback, useState } from 'react';
import type { DragEvent, ChangeEvent } from 'react';

interface MultiImageUploaderProps {
  files: File[];
  onFilesChange: (files: File[]) => void;
  disabled?: boolean;
  maxFiles?: number;
}

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE = 10 * 1024 * 1024;

export function MultiImageUploader({
  files,
  onFilesChange,
  disabled = false,
  maxFiles = 20,
}: MultiImageUploaderProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addFiles = useCallback(
    (newFiles: FileList) => {
      const validFiles: File[] = [];
      const errors: string[] = [];

      for (const file of Array.from(newFiles)) {
        if (!ALLOWED_TYPES.includes(file.type)) {
          errors.push(`${file.name}: 지원하지 않는 형식`);
          continue;
        }
        if (file.size > MAX_SIZE) {
          errors.push(`${file.name}: 10MB 초과`);
          continue;
        }
        if (file.size === 0) {
          errors.push(`${file.name}: 빈 파일`);
          continue;
        }
        validFiles.push(file);
      }

      const combined = [...files, ...validFiles];
      if (combined.length > maxFiles) {
        errors.push(`최대 ${maxFiles}장까지 업로드 가능합니다`);
        onFilesChange(combined.slice(0, maxFiles));
      } else {
        onFilesChange(combined);
      }

      setError(errors.length > 0 ? errors.join(', ') : null);
    },
    [files, maxFiles, onFilesChange],
  );

  const removeFile = useCallback(
    (index: number) => {
      const next = files.filter((_, i) => i !== index);
      onFilesChange(next);
      setError(null);
    },
    [files, onFilesChange],
  );

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!disabled) setIsDragOver(true);
  }, [disabled]);

  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    if (disabled) return;
    if (e.dataTransfer.files.length > 0) {
      addFiles(e.dataTransfer.files);
    }
  }, [disabled, addFiles]);

  const handleInputChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addFiles(e.target.files);
    }
    e.target.value = '';
  }, [addFiles]);

  return (
    <div className="w-full space-y-3">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative rounded-lg border border-dashed p-8 text-center cursor-pointer transition-colors
          ${disabled ? 'opacity-50 cursor-not-allowed border-gray-200 dark:border-gray-800' : ''}
          ${isDragOver
            ? 'border-gray-400 bg-gray-50 dark:border-gray-600 dark:bg-gray-900'
            : !disabled
            ? 'border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600'
            : ''}
        `}
      >
        <input
          type="file"
          accept=".jpg,.jpeg,.png,.webp"
          multiple
          onChange={handleInputChange}
          disabled={disabled}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
        />
        <p className="text-sm text-gray-500 dark:text-gray-400">
          <span className="font-medium text-gray-700 dark:text-gray-300">이미지를 선택</span>하거나 드래그하여 업로드
        </p>
        <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
          JPEG, PNG, WebP · 최대 {maxFiles}장, 개별 10MB
        </p>
      </div>

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      {files.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {files.length}/{maxFiles}장 선택됨
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {files.map((file, i) => (
              <div
                key={`${file.name}-${i}`}
                className="relative group rounded-lg overflow-hidden border border-gray-200 dark:border-gray-800"
              >
                <img
                  src={URL.createObjectURL(file)}
                  alt={file.name}
                  className="w-full h-20 object-cover"
                  onLoad={(e) => URL.revokeObjectURL((e.target as HTMLImageElement).src)}
                />
                <div className="px-2 py-1.5">
                  <p className="text-xs text-gray-600 dark:text-gray-400 truncate">{file.name}</p>
                </div>
                {!disabled && (
                  <button
                    onClick={() => removeFile(i)}
                    className="absolute top-1 right-1 bg-black/50 hover:bg-black/70 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label={`${file.name} 제거`}
                  >
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

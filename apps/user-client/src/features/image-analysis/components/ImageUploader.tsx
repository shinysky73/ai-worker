import { useCallback, useState } from 'react';
import type { DragEvent, ChangeEvent } from 'react';

interface ImageUploaderProps {
  onFileSelect: (file: File) => void;
  disabled?: boolean;
}

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE = 10 * 1024 * 1024;

export function ImageUploader({ onFileSelect, disabled = false }: ImageUploaderProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateFile = useCallback((file: File): boolean => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError('JPEG, PNG, WebP 파일만 업로드할 수 있습니다.');
      return false;
    }
    if (file.size > MAX_SIZE) {
      setError('10MB 이하의 파일만 업로드할 수 있습니다.');
      return false;
    }
    setError(null);
    return true;
  }, []);

  const handleFile = useCallback(
    (file: File) => {
      if (validateFile(file)) onFileSelect(file);
    },
    [validateFile, onFileSelect],
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
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [disabled, handleFile]);

  const handleInputChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  return (
    <div className="w-full">
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
          onChange={handleInputChange}
          disabled={disabled}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
        />
        <p className="text-sm text-gray-500 dark:text-gray-400">
          <span className="font-medium text-gray-700 dark:text-gray-300">이미지를 선택</span>하거나 드래그하여 업로드
        </p>
        <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">JPEG, PNG, WebP · 최대 10MB</p>
      </div>
      {error && (
        <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}

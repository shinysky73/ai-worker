import { useState, useCallback } from 'react';
import Markdown from 'react-markdown';
import type { ImageAnalysisResult } from '../services/imageAnalysisApi';

interface AnalysisResultProps {
  result: ImageAnalysisResult;
  imagePreviewUrl: string | null;
  onReset: () => void;
}

const IMAGE_TYPE_LABELS: Record<string, { label: string; color: string }> = {
  table: { label: '표', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' },
  chart: { label: '차트', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' },
  other: { label: '기타', color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300' },
};

export function AnalysisResult({ result, imagePreviewUrl, onReset }: AnalysisResultProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    const text = [
      `[${IMAGE_TYPE_LABELS[result.imageType]?.label || result.imageType}]`,
      '',
      result.description,
      '',
      '핵심 인사이트:',
      ...result.insights.map((insight, i) => `${i + 1}. ${insight}`),
    ].join('\n');

    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [result]);

  const typeInfo = IMAGE_TYPE_LABELS[result.imageType] || IMAGE_TYPE_LABELS.other;

  return (
    <div className="space-y-6">
      {/* Header with type badge and actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${typeInfo.color}`}>
            {typeInfo.label}
          </span>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {result.filename}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="
              flex items-center gap-1 px-3 py-1.5 text-sm rounded-md
              border border-gray-300 dark:border-gray-600
              text-gray-700 dark:text-gray-300
              hover:bg-gray-50 dark:hover:bg-gray-700
              transition-colors
            "
          >
            {copied ? (
              <>
                <svg className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                복사됨
              </>
            ) : (
              <>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                복사
              </>
            )}
          </button>
          <button
            onClick={onReset}
            className="
              px-3 py-1.5 text-sm rounded-md
              bg-indigo-600 text-white
              hover:bg-indigo-700
              transition-colors
            "
          >
            새 이미지 분석
          </button>
        </div>
      </div>

      {/* Content: Image preview + Description */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Image Preview */}
        {imagePreviewUrl && (
          <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 flex items-center justify-center">
            <img
              src={imagePreviewUrl}
              alt="업로드한 이미지"
              className="max-w-full max-h-96 rounded-md object-contain"
            />
          </div>
        )}

        {/* Description */}
        <div className={imagePreviewUrl ? '' : 'lg:col-span-2'}>
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-3">
              분석 결과
            </h3>
            <div className="prose prose-sm dark:prose-invert max-w-none text-gray-700 dark:text-gray-300">
              <Markdown>{result.description}</Markdown>
            </div>
          </div>
        </div>
      </div>

      {/* Insights */}
      {result.insights.length > 0 && (
        <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-200 dark:border-indigo-800 p-6">
          <h3 className="text-lg font-medium text-indigo-900 dark:text-indigo-200 mb-3">
            핵심 인사이트
          </h3>
          <ul className="space-y-2">
            {result.insights.map((insight, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="flex-shrink-0 w-6 h-6 bg-indigo-200 dark:bg-indigo-800 rounded-full flex items-center justify-center text-xs font-medium text-indigo-800 dark:text-indigo-200">
                  {index + 1}
                </span>
                <span className="text-gray-700 dark:text-gray-300">{insight}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

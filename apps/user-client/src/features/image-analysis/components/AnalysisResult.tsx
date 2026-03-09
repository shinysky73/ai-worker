import { useState, useCallback } from 'react';
import Markdown from 'react-markdown';
import type { ImageAnalysisResult } from '../services/imageAnalysisApi';

interface AnalysisResultProps {
  result: ImageAnalysisResult;
  imagePreviewUrl: string | null;
  onReset: () => void;
}

const IMAGE_TYPE_LABELS: Record<string, string> = {
  table: '표',
  chart: '차트',
  other: '기타',
};

export function AnalysisResult({ result, imagePreviewUrl, onReset }: AnalysisResultProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    const text = [
      `[${IMAGE_TYPE_LABELS[result.imageType] || result.imageType}]`,
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

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">
            {IMAGE_TYPE_LABELS[result.imageType] || result.imageType}
          </span>
          <span className="text-sm text-gray-500 dark:text-gray-400">{result.filename}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
          >
            {copied ? '복사됨' : '복사'}
          </button>
          <button
            onClick={onReset}
            className="px-3 py-1.5 text-sm font-medium text-white bg-gray-900 dark:bg-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
          >
            새 분석
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {imagePreviewUrl && (
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 flex items-center justify-center">
            <img
              src={imagePreviewUrl}
              alt="업로드한 이미지"
              className="max-w-full max-h-96 rounded object-contain"
            />
          </div>
        )}

        <div className={imagePreviewUrl ? '' : 'lg:col-span-2'}>
          <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-5">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">분석 결과</h3>
            <div className="prose prose-sm dark:prose-invert max-w-none text-gray-700 dark:text-gray-300">
              <Markdown>{result.description}</Markdown>
            </div>
          </div>
        </div>
      </div>

      {/* Insights */}
      {result.insights.length > 0 && (
        <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-5">
          <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">핵심 인사이트</h3>
          <ul className="space-y-2">
            {result.insights.map((insight, index) => (
              <li key={index} className="flex items-start gap-2.5 text-sm text-gray-700 dark:text-gray-300">
                <span className="text-xs text-gray-400 dark:text-gray-500 tabular-nums mt-0.5 shrink-0">{index + 1}.</span>
                <span>{insight}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

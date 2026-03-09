import { useCallback, useState } from 'react';
import type { PresentationResult } from '../services/presentationApi';
import { formatTime } from '../utils/formatTime';

interface ResultSummaryProps {
  result: PresentationResult;
  onReset: () => void;
}

export function ResultSummary({ result, onReset }: ResultSummaryProps) {
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>('idle');

  const handleCopyAll = useCallback(async () => {
    const allScripts = result.slides
      .map((slide) => {
        let text = `[슬라이드 ${slide.slideNumber}]\n${slide.script}`;
        if (slide.transition) text += `\n→ ${slide.transition}`;
        return text;
      })
      .join('\n\n');
    try {
      await navigator.clipboard.writeText(allScripts);
      setCopyState('copied');
      setTimeout(() => setCopyState('idle'), 2000);
    } catch {
      setCopyState('failed');
      setTimeout(() => setCopyState('idle'), 2000);
    }
  }, [result.slides]);

  const handleDownload = useCallback(() => {
    const content = result.slides
      .map((slide) => {
        let text = `[슬라이드 ${slide.slideNumber}] (${formatTime(slide.estimatedSeconds)})\n${slide.script}`;
        if (slide.transition) text += `\n\n→ 전환: ${slide.transition}`;
        return text;
      })
      .join('\n\n---\n\n');

    const header = `# 발표 스크립트\n\n총 발표 시간: ${formatTime(result.totalEstimatedSeconds)}\n총 슬라이드: ${result.slides.length}장\n\n---\n\n`;
    const blob = new Blob([header + content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `presentation-script-${result.id}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [result]);

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-4 border-b border-gray-200 dark:border-gray-800 mb-1">
      <div>
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">스크립트 생성 완료</h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
          {result.slides.length}장 · 총 {formatTime(result.totalEstimatedSeconds)}
        </p>
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleCopyAll}
          className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
        >
          {copyState === 'copied' ? '복사됨' : '전체 복사'}
        </button>
        <button
          onClick={handleDownload}
          className="px-3 py-1.5 text-sm font-medium text-white bg-gray-900 dark:bg-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
        >
          다운로드
        </button>
        <button
          onClick={onReset}
          className="px-3 py-1.5 text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        >
          새로 시작
        </button>
      </div>
    </div>
  );
}

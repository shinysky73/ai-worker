import { useState, useCallback } from 'react';
import type { SlideResult } from '../services/presentationApi';
import { formatTime } from '../utils/formatTime';

interface SlideScriptCardProps {
  slide: SlideResult;
}

export function SlideScriptCard({ slide }: SlideScriptCardProps) {
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>('idle');

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(slide.script);
      setCopyState('copied');
      setTimeout(() => setCopyState('idle'), 2000);
    } catch {
      setCopyState('failed');
      setTimeout(() => setCopyState('idle'), 2000);
    }
  }, [slide.script]);

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400 tabular-nums">
            {slide.slideNumber}
          </span>
          <span className="text-sm text-gray-700 dark:text-gray-300">
            슬라이드 {slide.slideNumber}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400 dark:text-gray-500 tabular-nums">
            {formatTime(slide.estimatedSeconds)}
          </span>
          <button
            onClick={handleCopy}
            className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            aria-label="스크립트 복사"
          >
            {copyState === 'copied' ? '복사됨' : '복사'}
          </button>
        </div>
      </div>

      <div className="px-4 py-3.5">
        <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
          {slide.script}
        </p>
        {slide.transition && (
          <p className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800 text-xs text-gray-400 dark:text-gray-500 italic">
            {slide.transition}
          </p>
        )}
      </div>
    </div>
  );
}

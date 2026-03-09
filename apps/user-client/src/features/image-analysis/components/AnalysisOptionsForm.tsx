import { useImageAnalysisStore } from '../stores/imageAnalysisStore';
import type { ImageAnalysisOptions } from '../stores/imageAnalysisStore';

interface AnalysisOptionsFormProps {
  disabled?: boolean;
}

const inputClass = `
  w-full rounded-lg border border-gray-300 dark:border-gray-700
  bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100
  px-3 py-2 text-sm
  focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-400 focus:border-transparent
  disabled:opacity-50 transition-shadow
`;

export function AnalysisOptionsForm({ disabled = false }: AnalysisOptionsFormProps) {
  const { options, setOptions } = useImageAnalysisStore();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div>
        <label htmlFor="detailLevel" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          설명 수준
        </label>
        <select
          id="detailLevel"
          value={options.detailLevel}
          onChange={(e) => setOptions({ detailLevel: e.target.value as ImageAnalysisOptions['detailLevel'] })}
          disabled={disabled}
          className={inputClass}
        >
          <option value="detailed">상세</option>
          <option value="brief">간략</option>
        </select>
      </div>

      <div>
        <label htmlFor="language" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          출력 언어
        </label>
        <select
          id="language"
          value={options.language}
          onChange={(e) => setOptions({ language: e.target.value as ImageAnalysisOptions['language'] })}
          disabled={disabled}
          className={inputClass}
        >
          <option value="ko">한국어</option>
          <option value="en">English</option>
        </select>
      </div>
    </div>
  );
}

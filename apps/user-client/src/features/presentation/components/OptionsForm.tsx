import type { ChangeEvent } from 'react';
import type { PresentationOptions } from '../stores/presentationStore';

interface OptionsFormProps {
  options: PresentationOptions;
  onChange: (options: PresentationOptions) => void;
  disabled?: boolean;
}

export function OptionsForm({
  options,
  onChange,
  disabled = false,
}: OptionsFormProps) {
  const handleToneChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const tone = e.target.value as 'formal' | 'casual' | undefined;
    onChange({ ...options, tone: tone || undefined });
  };

  const handleMinutesChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const targetMinutes = value ? parseInt(value, 10) : undefined;
    onChange({ ...options, targetMinutes });
  };

  return (
    <div className="space-y-4">
      <div>
        <label
          htmlFor="tone"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          발표 톤
        </label>
        <select
          id="tone"
          value={options.tone || ''}
          onChange={handleToneChange}
          disabled={disabled}
          className="
            w-full px-3 py-2 border border-gray-300 dark:border-gray-600
            rounded-md shadow-sm bg-white dark:bg-gray-800
            text-gray-900 dark:text-gray-100
            focus:ring-2 focus:ring-blue-500 focus:border-blue-500
            disabled:opacity-50 disabled:cursor-not-allowed
          "
        >
          <option value="">기본</option>
          <option value="formal">격식체 (비즈니스/공식 발표)</option>
          <option value="casual">비격식체 (친근한/캐주얼)</option>
        </select>
      </div>

      <div>
        <label
          htmlFor="targetMinutes"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          목표 발표 시간 (분)
        </label>
        <input
          type="number"
          id="targetMinutes"
          value={options.targetMinutes || ''}
          onChange={handleMinutesChange}
          min={1}
          max={120}
          placeholder="예: 15"
          disabled={disabled}
          className="
            w-full px-3 py-2 border border-gray-300 dark:border-gray-600
            rounded-md shadow-sm bg-white dark:bg-gray-800
            text-gray-900 dark:text-gray-100
            focus:ring-2 focus:ring-blue-500 focus:border-blue-500
            disabled:opacity-50 disabled:cursor-not-allowed
          "
        />
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          1~120분 사이로 설정하세요. 비워두면 자동으로 계산됩니다.
        </p>
      </div>
    </div>
  );
}

import type { ChangeEvent } from 'react';
import type { PresentationOptions } from '../stores/presentationStore';

interface OptionsFormProps {
  options: PresentationOptions;
  onChange: (options: PresentationOptions) => void;
  disabled?: boolean;
}

const selectClass = `
  w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-600
  rounded-xl shadow-sm bg-white dark:bg-gray-700/50
  text-gray-900 dark:text-gray-100
  focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
  disabled:opacity-50 disabled:cursor-not-allowed
  transition-colors
`;

export function OptionsForm({ options, onChange, disabled = false }: OptionsFormProps) {
  const handleToneChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const tone = e.target.value as 'formal' | 'casual' | undefined;
    onChange({ ...options, tone: tone || undefined });
  };

  const handleMinutesChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (!value) { onChange({ ...options, targetMinutes: undefined }); return; }
    const parsed = parseInt(value, 10);
    if (!isNaN(parsed) && parsed >= 1 && parsed <= 120) {
      onChange({ ...options, targetMinutes: parsed });
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div>
        <label htmlFor="tone" className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">
          발표 톤
        </label>
        <select id="tone" value={options.tone || ''} onChange={handleToneChange} disabled={disabled} className={selectClass}>
          <option value="">기본</option>
          <option value="formal">격식체 (비즈니스·공식)</option>
          <option value="casual">비격식체 (친근·캐주얼)</option>
        </select>
      </div>

      <div>
        <label htmlFor="targetMinutes" className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">
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
          className={selectClass}
        />
        <p className="mt-1.5 text-xs text-gray-400 dark:text-gray-500">1~120분 · 비워두면 자동 계산</p>
      </div>
    </div>
  );
}

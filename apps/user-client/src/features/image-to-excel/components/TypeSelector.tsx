import type { ImageToExcelType } from '../services/imageToExcelApi';

interface TypeSelectorProps {
  value: ImageToExcelType;
  onChange: (type: ImageToExcelType) => void;
  disabled?: boolean;
}

const TYPES: { value: ImageToExcelType; label: string; icon: string }[] = [
  { value: 'receipt', label: '영수증', icon: 'M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z' },
  { value: 'namecard', label: '명함', icon: 'M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0' },
];

export function TypeSelector({ value, onChange, disabled = false }: TypeSelectorProps) {
  return (
    <div className="flex gap-3">
      {TYPES.map((t) => (
        <button
          key={t.value}
          onClick={() => onChange(t.value)}
          disabled={disabled}
          className={`
            flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 text-sm font-medium transition-all
            ${value === t.value
              ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-500'
              : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600'
            }
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `}
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={t.icon} />
          </svg>
          {t.label}
        </button>
      ))}
    </div>
  );
}

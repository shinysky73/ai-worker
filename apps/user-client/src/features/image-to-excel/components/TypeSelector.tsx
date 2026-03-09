import type { ImageToExcelType } from '../services/imageToExcelApi';

interface TypeSelectorProps {
  value: ImageToExcelType;
  onChange: (type: ImageToExcelType) => void;
  disabled?: boolean;
}

const TYPES: { value: ImageToExcelType; label: string }[] = [
  { value: 'receipt', label: '영수증' },
  { value: 'namecard', label: '명함' },
];

export function TypeSelector({ value, onChange, disabled = false }: TypeSelectorProps) {
  return (
    <div className="flex gap-2">
      {TYPES.map((t) => (
        <button
          key={t.value}
          onClick={() => onChange(t.value)}
          disabled={disabled}
          className={`px-4 py-2 rounded-lg text-sm transition-colors ${
            value === t.value
              ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
              : 'border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-400 dark:hover:border-gray-500'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

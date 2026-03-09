import type { JobCategory } from '../services/interviewApi';

const CATEGORIES: { value: JobCategory; label: string }[] = [
  { value: '개발', label: '개발' },
  { value: '디자인', label: '디자인' },
  { value: '기획/PM', label: '기획/PM' },
  { value: '마케팅', label: '마케팅' },
  { value: '영업', label: '영업' },
  { value: '일반/기타', label: '일반/기타' },
];

interface JobCategorySelectorProps {
  value: JobCategory;
  onChange: (value: JobCategory) => void;
  disabled?: boolean;
}

export function JobCategorySelector({ value, onChange, disabled }: JobCategorySelectorProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {CATEGORIES.map((cat) => (
        <button
          key={cat.value}
          onClick={() => onChange(cat.value)}
          disabled={disabled}
          className={`px-3.5 py-1.5 rounded-lg text-sm transition-colors ${
            value === cat.value
              ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
              : 'border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-400 dark:hover:border-gray-500'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {cat.label}
        </button>
      ))}
    </div>
  );
}

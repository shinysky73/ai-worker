import { useCallback } from 'react';

const MIN_LENGTH = 50;
const MAX_LENGTH = 10000;

interface JdTextInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function JdTextInput({ value, onChange, disabled }: JdTextInputProps) {
  const charCount = value.length;
  const isTooShort = charCount > 0 && charCount < MIN_LENGTH;
  const isTooLong = charCount > MAX_LENGTH;

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
  }, [onChange]);

  return (
    <div>
      <textarea
        value={value}
        onChange={handleChange}
        disabled={disabled}
        placeholder="채용 공고(JD) 텍스트를 붙여넣기 해주세요. 직무 설명, 자격 요건, 우대 사항 등이 포함되면 더 좋은 질문이 생성됩니다."
        className={`w-full h-48 px-3.5 py-2.5 text-sm rounded-lg border resize-none transition-shadow focus:outline-none focus:ring-2 ${
          isTooShort || isTooLong
            ? 'border-red-300 dark:border-red-700 focus:ring-red-200 dark:focus:ring-red-800'
            : 'border-gray-300 dark:border-gray-700 focus:ring-gray-900 dark:focus:ring-gray-400'
        } focus:border-transparent bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 disabled:opacity-50 disabled:cursor-not-allowed`}
      />
      <div className="flex justify-between items-center mt-1 px-0.5">
        <div>
          {isTooShort && (
            <span className="text-xs text-red-500">최소 50자 이상 입력해주세요</span>
          )}
          {isTooLong && (
            <span className="text-xs text-red-500">최대 10,000자까지 입력 가능합니다</span>
          )}
        </div>
        <span className={`text-xs ${isTooShort || isTooLong ? 'text-red-500' : 'text-gray-400'}`}>
          {charCount.toLocaleString()} / {MAX_LENGTH.toLocaleString()}자
        </span>
      </div>
    </div>
  );
}

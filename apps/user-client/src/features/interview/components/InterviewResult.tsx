import { useState } from 'react';
import type { InterviewQuestionResult } from '../services/interviewApi';

interface InterviewResultProps {
  result: InterviewQuestionResult;
  onDownload: () => Promise<void>;
  onCopy: () => Promise<void>;
  onReset: () => void;
}

export function InterviewResult({ result, onDownload, onCopy, onReset }: InterviewResultProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await onCopy();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-200 dark:border-gray-800">
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            면접 질문 생성 완료
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {result.jdSummary} · {result.totalQuestions}개 질문
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onDownload}
            className="px-3 py-1.5 text-sm font-medium text-white bg-gray-900 dark:bg-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
          >
            엑셀 다운로드
          </button>
          <button
            onClick={handleCopy}
            className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
          >
            {copied ? '복사됨' : '전체 복사'}
          </button>
          <button
            onClick={onReset}
            className="px-3 py-1.5 text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            새로 생성
          </button>
        </div>
      </div>

      {/* Questions */}
      <div className="space-y-4">
        {result.questions.map((q, qi) => (
          <div
            key={qi}
            className="rounded-lg border border-gray-200 dark:border-gray-800 p-4 space-y-3"
          >
            {/* Question */}
            <div className="flex items-start gap-3">
              <span className="text-xs font-medium text-gray-400 dark:text-gray-500 tabular-nums mt-0.5 shrink-0">
                {String(qi + 1).padStart(2, '0')}
              </span>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-white leading-relaxed">
                  {q.question}
                </p>
                <span className="inline-block mt-1.5 text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">
                  {q.targetCompetency}
                </span>
              </div>
            </div>

            {/* Intent */}
            <div className="ml-8 text-xs text-gray-500 dark:text-gray-400">
              <span className="font-medium text-gray-600 dark:text-gray-300">평가 의도</span> — {q.intent}
            </div>

            {/* Keywords */}
            <div className="ml-8 flex flex-wrap gap-1.5">
              {q.goodAnswerKeywords.map((kw, ki) => (
                <span
                  key={ki}
                  className="text-xs px-2 py-0.5 rounded bg-gray-50 dark:bg-gray-900 text-gray-600 dark:text-gray-400 border border-gray-150 dark:border-gray-800"
                >
                  {kw}
                </span>
              ))}
            </div>

            {/* Evaluation criteria */}
            <div className="ml-8 grid grid-cols-3 gap-2">
              {q.evaluationCriteria.map((ec) => (
                <div
                  key={ec.level}
                  className="text-xs px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800"
                >
                  <span className={`font-medium ${
                    ec.level === '상' ? 'text-green-600 dark:text-green-400' :
                    ec.level === '중' ? 'text-amber-600 dark:text-amber-400' :
                    'text-red-500 dark:text-red-400'
                  }`}>{ec.level}</span>
                  <p className="mt-0.5 text-gray-600 dark:text-gray-400">{ec.description}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

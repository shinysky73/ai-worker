import { useState } from 'react';
import type { InterviewQuestionResult } from '../services/interviewApi';

interface InterviewResultProps {
  result: InterviewQuestionResult;
  onDownload: () => Promise<void>;
  onCopy: () => Promise<void>;
  onReset: () => void;
}

export function InterviewResult({ result, onDownload, onCopy, onReset }: InterviewResultProps) {
  const [expandedCompetency, setExpandedCompetency] = useState<string | null>(
    result.competencies[0]?.name || null,
  );
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await onCopy();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-5">
      {/* Summary */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            면접 질문 생성 완료
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {result.jdSummary} | {result.competencies.length}개 역량 | {result.totalQuestions}개 질문
          </p>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-2">
        <button
          onClick={onDownload}
          className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          엑셀 다운로드
        </button>
        <button
          onClick={handleCopy}
          className="flex items-center gap-2 px-4 py-2 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
          </svg>
          {copied ? '복사 완료!' : '전체 복사'}
        </button>
        <button
          onClick={onReset}
          className="flex items-center gap-2 px-4 py-2 text-gray-500 dark:text-gray-400 text-sm font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ml-auto"
        >
          새로 생성
        </button>
      </div>

      {/* Competencies accordion */}
      <div className="space-y-3">
        {result.competencies.map((comp) => (
          <div
            key={comp.name}
            className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden"
          >
            {/* Competency header */}
            <button
              onClick={() =>
                setExpandedCompetency(expandedCompetency === comp.name ? null : comp.name)
              }
              className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 text-xs font-bold">
                  {comp.questions.length}
                </span>
                <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {comp.name}
                </span>
              </div>
              <svg
                className={`h-4 w-4 text-gray-400 transition-transform ${
                  expandedCompetency === comp.name ? 'rotate-180' : ''
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Questions list */}
            {expandedCompetency === comp.name && (
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {comp.questions.map((q, qi) => (
                  <div key={qi} className="px-4 py-4 space-y-3">
                    {/* Question text */}
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      Q{qi + 1}. {q.question}
                    </p>

                    {/* Intent */}
                    <div className="flex items-start gap-2">
                      <span className="text-xs font-semibold text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/20 px-2 py-0.5 rounded-md shrink-0">
                        평가 의도
                      </span>
                      <span className="text-xs text-gray-600 dark:text-gray-400">
                        {q.intent}
                      </span>
                    </div>

                    {/* Good answer keywords */}
                    <div className="flex items-start gap-2">
                      <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-md shrink-0">
                        핵심 키워드
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {q.goodAnswerKeywords.map((kw, ki) => (
                          <span
                            key={ki}
                            className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                          >
                            {kw}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Evaluation criteria */}
                    <div className="grid grid-cols-3 gap-2">
                      {q.evaluationCriteria.map((ec) => (
                        <div
                          key={ec.level}
                          className={`text-xs px-3 py-2 rounded-lg ${
                            ec.level === '상'
                              ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800'
                              : ec.level === '중'
                                ? 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800'
                                : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800'
                          }`}
                        >
                          <span className="font-semibold">{ec.level}</span>
                          <p className="mt-0.5">{ec.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

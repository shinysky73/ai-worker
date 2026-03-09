import { Link } from 'react-router-dom';
import type { ReactNode } from 'react';

const features: { title: string; description: string; link: string; icon: ReactNode }[] = [
  {
    title: '스크립트 생성',
    description: 'PPT/PDF를 업로드하면 슬라이드별 발표 스크립트를 생성합니다.',
    link: '/presentation',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    title: '이미지 분석',
    description: '이미지를 업로드하면 내용을 분석하고 텍스트로 설명합니다.',
    link: '/image-analysis',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    title: '엑셀 변환',
    description: '영수증·명함 이미지에서 데이터를 추출하여 엑셀로 변환합니다.',
    link: '/image-to-excel',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    title: '면접 질문',
    description: 'JD를 입력하면 직무에 맞는 면접 질문과 평가 기준을 생성합니다.',
    link: '/interview',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
      </svg>
    ),
  },
];

export function HomePage() {
  return (
    <div className="max-w-5xl mx-auto pt-4">
      <header className="mb-10">
        <h1 className="text-lg font-semibold text-gray-900 dark:text-white">도구 모음</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          AI 기반 업무 자동화 도구를 선택하세요.
        </p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {features.map((feature) => (
          <Link
            key={feature.link}
            to={feature.link}
            className="flex items-start gap-4 px-5 py-5 rounded-lg border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors group"
          >
            <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center shrink-0 text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors">
              {feature.icon}
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-medium text-gray-900 dark:text-white">
                {feature.title}
              </h2>
              <p className="text-[13px] text-gray-500 dark:text-gray-400 mt-0.5 leading-snug">
                {feature.description}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

import { Link } from 'react-router-dom';

const features = [
  {
    title: '스크립트 생성',
    description: 'PPT/PDF를 업로드하면 AI가 슬라이드별 발표 스크립트를 생성합니다.',
    link: '/presentation',
    color: 'indigo',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    title: '이미지 분석',
    description: '이미지를 업로드하면 AI가 내용을 분석하고 설명합니다.',
    link: '/image-analysis',
    color: 'violet',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    title: '엑셀 변환',
    description: '이미지 속 표 데이터를 AI가 인식하여 Excel 파일로 변환합니다.',
    link: '/image-to-excel',
    color: 'emerald',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    title: '면접 질문',
    description: 'JD를 입력하면 AI가 맞춤형 면접 질문을 생성합니다.',
    link: '/interview',
    color: 'violet',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
      </svg>
    ),
  },
] as const;

const colorMap = {
  indigo: {
    bg: 'bg-indigo-50 dark:bg-indigo-900/20',
    icon: 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400',
    hover: 'hover:border-indigo-300 dark:hover:border-indigo-700',
    link: 'text-indigo-600 dark:text-indigo-400',
  },
  violet: {
    bg: 'bg-violet-50 dark:bg-violet-900/20',
    icon: 'bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-400',
    hover: 'hover:border-violet-300 dark:hover:border-violet-700',
    link: 'text-violet-600 dark:text-violet-400',
  },
  emerald: {
    bg: 'bg-emerald-50 dark:bg-emerald-900/20',
    icon: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400',
    hover: 'hover:border-emerald-300 dark:hover:border-emerald-700',
    link: 'text-emerald-600 dark:text-emerald-400',
  },
};

export function HomePage() {
  return (
    <div className="max-w-3xl mx-auto">
      <header className="text-center mb-10 pt-2">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-2xl mb-4">
          <svg className="w-6 h-6 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">AI Worker</h1>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          AI 기반 업무 자동화 도구 모음
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {features.map((feature) => {
          const colors = colorMap[feature.color];
          return (
            <Link
              key={feature.link}
              to={feature.link}
              className={`block rounded-2xl border border-gray-200 dark:border-gray-700 ${colors.hover} bg-white dark:bg-gray-800 p-6 transition-all duration-200 hover:shadow-md`}
            >
              <div className={`inline-flex items-center justify-center w-10 h-10 rounded-xl ${colors.icon} mb-4`}>
                {feature.icon}
              </div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
                {feature.title}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                {feature.description}
              </p>
              <span className={`text-sm font-medium ${colors.link}`}>
                바로가기 &rarr;
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuthStore } from '../stores/authStore';

type Tab = 'login' | 'register';

export function LoginPage() {
  const navigate = useNavigate();
  const { isAuthenticated, setToken } = useAuthStore();

  const [tab, setTab] = useState<Tab>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const url = tab === 'login' ? '/api/auth/login' : '/api/auth/register';
      const body = tab === 'login' ? { email, password } : { email, password, name };
      const { data } = await axios.post<{ accessToken: string }>(url, body);
      setToken(data.accessToken);
      navigate('/', { replace: true });
    } catch (err: any) {
      const message = err?.response?.data?.message;
      if (typeof message === 'string') {
        setError(message);
      } else {
        setError(tab === 'login' ? '로그인에 실패했습니다.' : '회원가입에 실패했습니다.');
      }
    } finally {
      setLoading(false);
    }
  };

  const switchTab = (next: Tab) => {
    setTab(next);
    setError('');
  };

  return (
    <div className="min-h-screen flex">
      {/* Left: Brand panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-700 flex-col justify-between p-14">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <span className="text-white text-xl font-bold tracking-tight">AI Worker</span>
        </div>

        <div className="space-y-10">
          <div>
            <h1 className="text-5xl font-bold text-white leading-tight">
              AI Worker
            </h1>
            <p className="mt-4 text-indigo-200 text-lg leading-relaxed">
              PPT·PDF를 업로드하면 슬라이드별<br />맞춤 스크립트를 즉시 생성합니다.
            </p>
          </div>

          <div className="space-y-4">
            {[
              { icon: '🎯', text: '슬라이드별 맞춤 스크립트 생성' },
              { icon: '⚡', text: '3단계 AI 파이프라인으로 정확한 분석' },
              { icon: '📊', text: '표·차트·이미지 자동 인식 및 설명' },
            ].map(({ icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <span className="w-9 h-9 bg-white/10 rounded-lg flex items-center justify-center text-lg flex-shrink-0">
                  {icon}
                </span>
                <span className="text-indigo-100">{text}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-indigo-400 text-sm">Powered by Gemini 2.5 Flash</p>
      </div>

      {/* Right: Login/Register card */}
      <div className="flex-1 flex items-center justify-center p-8 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-sm w-full">
          {/* Mobile-only branding */}
          <div className="lg:hidden text-center mb-10">
            <div className="inline-flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <span className="text-xl font-bold text-gray-900 dark:text-white">AI Worker</span>
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-sm">AI 기반 발표 스크립트 자동 생성기</p>
          </div>

          {/* Tab switcher */}
          <div className="flex mb-8 border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={() => switchTab('login')}
              className={`flex-1 pb-3 text-sm font-medium border-b-2 transition-colors ${
                tab === 'login'
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              로그인
            </button>
            <button
              onClick={() => switchTab('register')}
              className={`flex-1 pb-3 text-sm font-medium border-b-2 transition-colors ${
                tab === 'register'
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              회원가입
            </button>
          </div>

          {error && (
            <div className="mb-6 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4">
              <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {tab === 'register' && (
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  이름
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="홍길동"
                />
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                이메일
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="email@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                비밀번호
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-indigo-600 px-6 py-3.5 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading
                ? '처리 중...'
                : tab === 'login'
                  ? '로그인'
                  : '회원가입'}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-gray-400 dark:text-gray-500">
            {tab === 'login' ? '계정이 없으신가요? ' : '이미 계정이 있으신가요? '}
            <button
              onClick={() => switchTab(tab === 'login' ? 'register' : 'login')}
              className="text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              {tab === 'login' ? '회원가입' : '로그인'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

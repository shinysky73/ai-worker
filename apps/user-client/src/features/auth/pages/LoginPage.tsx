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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 relative overflow-hidden">
      {/* Animated aurora background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="animate-aurora-1 absolute -top-32 left-1/4 w-[500px] h-[500px] bg-indigo-300/30 rounded-full blur-[100px]" />
        <div className="animate-aurora-2 absolute top-1/3 -right-20 w-[400px] h-[400px] bg-violet-300/25 rounded-full blur-[100px]" />
        <div className="animate-aurora-3 absolute -bottom-20 left-1/3 w-[450px] h-[450px] bg-blue-300/20 rounded-full blur-[100px]" />
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-[420px] px-6">
        {/* Logo & branding */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 via-violet-500 to-purple-600 shadow-lg shadow-indigo-500/25 mb-5">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
              />
            </svg>
          </div>
          <h1 className="text-[22px] font-semibold text-gray-900 tracking-tight">AI Worker</h1>
          <p className="mt-2 text-[13px] text-gray-500 leading-relaxed">
            AI 기반 업무 자동화 도구 모음
          </p>
        </div>

        {/* Glass card */}
        <div className="rounded-2xl border border-gray-200/60 bg-white/70 backdrop-blur-2xl p-7 shadow-[0_8px_40px_rgba(0,0,0,0.06)]">
          {/* Tab switcher */}
          <div className="flex p-0.5 mb-6 rounded-xl bg-gray-100/80 border border-gray-200/50">
            {(['login', 'register'] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => switchTab(t)}
                className={`flex-1 py-2.5 text-[13px] font-medium rounded-[10px] transition-all duration-300 ${
                  tab === t
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                {t === 'login' ? '로그인' : '회원가입'}
              </button>
            ))}
          </div>

          {/* Error */}
          {error && (
            <div className="mb-5 flex items-center gap-2.5 rounded-xl bg-red-50 border border-red-200/60 px-4 py-3">
              <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-[13px] text-red-600">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {tab === 'register' && (
              <div>
                <label htmlFor="name" className="block text-[11px] font-medium text-gray-400 uppercase tracking-widest mb-2">
                  이름
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full rounded-xl border border-gray-200/60 bg-white/50 px-4 py-3 text-[14px] text-gray-900 placeholder-gray-400 focus:outline-none focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200"
                  placeholder="홍길동"
                />
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-[11px] font-medium text-gray-400 uppercase tracking-widest mb-2">
                이메일
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-xl border border-gray-200/60 bg-white/50 px-4 py-3 text-[14px] text-gray-900 placeholder-gray-400 focus:outline-none focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200"
                placeholder="email@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-[11px] font-medium text-gray-400 uppercase tracking-widest mb-2">
                비밀번호
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full rounded-xl border border-gray-200/60 bg-white/50 px-4 py-3 text-[14px] text-gray-900 placeholder-gray-400 focus:outline-none focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-3 w-full rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-3 text-[14px] font-medium text-white shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/30 hover:brightness-110 active:scale-[0.98] transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none disabled:hover:brightness-100 disabled:active:scale-100"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  처리 중...
                </span>
              ) : tab === 'login' ? (
                '로그인'
              ) : (
                '회원가입'
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-gray-200/60" />
            <span className="text-[11px] text-gray-400 uppercase tracking-wider">or</span>
            <div className="flex-1 h-px bg-gray-200/60" />
          </div>

          <p className="text-center text-[13px] text-gray-500">
            {tab === 'login' ? '계정이 없으신가요? ' : '이미 계정이 있으신가요? '}
            <button
              onClick={() => switchTab(tab === 'login' ? 'register' : 'login')}
              className="text-indigo-600 hover:text-indigo-500 font-medium transition-colors duration-200"
            >
              {tab === 'login' ? '회원가입' : '로그인'}
            </button>
          </p>
        </div>

      </div>
    </div>
  );
}

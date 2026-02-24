import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuthStore } from '../features/auth';

export function Navbar() {
  const { user, logout } = useAuthStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all duration-150 ${
      isActive
        ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300'
        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-100 dark:hover:bg-gray-800'
    }`;

  const initial = user?.name?.charAt(0)?.toUpperCase() || '?';

  return (
    <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-14">
          {/* Left: Logo + Nav */}
          <div className="flex items-center gap-6">
            <NavLink to="/" className="flex items-center gap-2 group">
              <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center group-hover:bg-indigo-700 transition-colors">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <span className="text-base font-bold text-gray-900 dark:text-white tracking-tight">AI Worker</span>
            </NavLink>

            <div className="hidden sm:flex items-center gap-1">
              <NavLink to="/presentation" className={navLinkClass}>
                스크립트 생성
              </NavLink>
              <NavLink to="/image-analysis" className={navLinkClass}>
                이미지 분석
              </NavLink>
              <NavLink to="/image-to-excel" className={navLinkClass}>
                엑셀 변환
              </NavLink>
              <NavLink to="/interview" className={navLinkClass}>
                면접 질문
              </NavLink>
            </div>
          </div>

          {/* Right: Profile */}
          <div className="flex items-center gap-2">
            {user && (
              <div className="relative">
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-2 rounded-xl px-2 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  {user.picture ? (
                    <img
                      src={user.picture}
                      alt={user.name}
                      className="h-7 w-7 rounded-full ring-2 ring-gray-200 dark:ring-gray-700"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                        (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                  ) : null}
                  <span
                    className={`h-7 w-7 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-semibold ${user.picture ? 'hidden' : ''}`}
                  >
                    {initial}
                  </span>
                  <span className="hidden sm:block text-sm font-medium text-gray-700 dark:text-gray-300 max-w-32 truncate">
                    {user.name}
                  </span>
                  <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {profileOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setProfileOpen(false)} />
                    <div className="absolute right-0 mt-1.5 w-44 rounded-xl shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black/5 dark:ring-white/10 z-20 py-1 overflow-hidden">
                      <div className="px-3 py-2 border-b border-gray-100 dark:border-gray-700">
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email || user.name}</p>
                      </div>
                      <button
                        onClick={() => { logout(); setProfileOpen(false); }}
                        className="flex items-center gap-2 w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        로그아웃
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Mobile hamburger */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="sm:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {menuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="sm:hidden border-t border-gray-100 dark:border-gray-800 px-4 py-3 space-y-1 bg-white dark:bg-gray-900">
          <NavLink to="/presentation" className={navLinkClass} onClick={() => setMenuOpen(false)}>
            스크립트 생성
          </NavLink>
          <NavLink to="/image-analysis" className={navLinkClass} onClick={() => setMenuOpen(false)}>
            이미지 분석
          </NavLink>
          <NavLink to="/image-to-excel" className={navLinkClass} onClick={() => setMenuOpen(false)}>
            엑셀 변환
          </NavLink>
          <NavLink to="/interview" className={navLinkClass} onClick={() => setMenuOpen(false)}>
            면접 질문
          </NavLink>
        </div>
      )}
    </nav>
  );
}

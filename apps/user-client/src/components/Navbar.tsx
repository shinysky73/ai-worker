import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuthStore } from '../features/auth';

export function Navbar() {
  const { user, logout } = useAuthStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `px-3 py-1.5 text-sm transition-colors ${
      isActive
        ? 'text-gray-900 dark:text-white font-semibold'
        : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
    }`;

  const initial = user?.name?.charAt(0)?.toUpperCase() || '?';

  return (
    <nav className="border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-950">
      <div className="max-w-6xl mx-auto px-5 sm:px-8">
        <div className="flex justify-between h-14">
          <div className="flex items-center gap-8">
            <NavLink to="/" className="text-[15px] font-bold text-gray-900 dark:text-white tracking-tight">
              AI Worker
            </NavLink>

            <div className="hidden sm:flex items-center">
              <NavLink to="/presentation" className={navLinkClass}>
                스크립트
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

          <div className="flex items-center gap-2">
            {user && (
              <div className="relative">
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
                >
                  {user.picture ? (
                    <img
                      src={user.picture}
                      alt={user.name}
                      className="h-6 w-6 rounded-full"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                        (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                  ) : null}
                  <span
                    className={`h-6 w-6 rounded-full bg-gray-900 dark:bg-gray-700 text-white flex items-center justify-center text-xs font-medium ${user.picture ? 'hidden' : ''}`}
                  >
                    {initial}
                  </span>
                  <span className="hidden sm:block text-sm text-gray-700 dark:text-gray-300 max-w-32 truncate">
                    {user.name}
                  </span>
                </button>

                {profileOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setProfileOpen(false)} />
                    <div className="absolute right-0 mt-1 w-44 rounded-lg bg-white dark:bg-gray-900 ring-1 ring-gray-200 dark:ring-gray-800 z-20 py-1 overflow-hidden">
                      <div className="px-3 py-2 border-b border-gray-100 dark:border-gray-800">
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email || user.name}</p>
                      </div>
                      <button
                        onClick={() => { logout(); setProfileOpen(false); }}
                        className="flex items-center gap-2 w-full text-left px-3 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                      >
                        로그아웃
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}

            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="sm:hidden p-2 text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {menuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {menuOpen && (
        <div className="sm:hidden border-t border-gray-100 dark:border-gray-800 px-5 py-3 space-y-1 bg-white dark:bg-gray-950">
          <NavLink to="/presentation" className={navLinkClass} onClick={() => setMenuOpen(false)}>
            스크립트
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

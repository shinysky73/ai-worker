import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuthStore } from '../features/auth';

export function Navbar() {
  const { user, logout } = useAuthStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
      isActive
        ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-200'
        : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
    }`;

  const initial = user?.name?.charAt(0)?.toUpperCase() || '?';

  return (
    <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-14">
          {/* Left: Logo + Nav */}
          <div className="flex items-center gap-4">
            <NavLink to="/" className="text-lg font-bold text-gray-900 dark:text-white">
              AI Worker
            </NavLink>
            <div className="hidden sm:flex items-center gap-1">
              <NavLink to="/" end className={navLinkClass}>
                스크립트 생성
              </NavLink>
              <NavLink to="/history" className={navLinkClass}>
                히스토리
              </NavLink>
            </div>
          </div>

          {/* Right: Profile */}
          <div className="flex items-center gap-2">
            {user && (
              <div className="relative">
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-2 rounded-full p-1 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  {user.picture ? (
                    <img
                      src={user.picture}
                      alt={user.name}
                      className="h-8 w-8 rounded-full"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                        (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                  ) : null}
                  <span
                    className={`h-8 w-8 rounded-full bg-indigo-500 text-white flex items-center justify-center text-sm font-medium ${user.picture ? 'hidden' : ''}`}
                  >
                    {initial}
                  </span>
                  <span className="hidden sm:block text-sm text-gray-700 dark:text-gray-300">
                    {user.name}
                  </span>
                </button>

                {profileOpen && (
                  <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white dark:bg-gray-700 ring-1 ring-black ring-opacity-5 z-50">
                    <button
                      onClick={() => {
                        logout();
                        setProfileOpen(false);
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-md"
                    >
                      로그아웃
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Mobile hamburger */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="sm:hidden p-2 rounded-md text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
        <div className="sm:hidden border-t border-gray-200 dark:border-gray-700 px-4 py-2 space-y-1">
          <NavLink to="/" end className={navLinkClass} onClick={() => setMenuOpen(false)}>
            스크립트 생성
          </NavLink>
          <NavLink to="/history" className={navLinkClass} onClick={() => setMenuOpen(false)}>
            히스토리
          </NavLink>
        </div>
      )}
    </nav>
  );
}

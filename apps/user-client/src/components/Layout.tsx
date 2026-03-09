import { Outlet, Navigate } from 'react-router-dom';
import { useAuthStore } from '../features/auth';
import { Navbar } from './Navbar';

export function Layout() {
  const { isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <Navbar />
      <main className="max-w-6xl mx-auto px-5 sm:px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
}

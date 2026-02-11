import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { PresentationPage } from './features/presentation';
import { LoginPage, AuthCallbackPage, setupInterceptors, useAuthStore } from './features/auth';
import { Layout } from './components/Layout';
import { HistoryPage } from './features/history/pages/HistoryPage';
import { ImageAnalysisPage } from './features/image-analysis';

function AppContent() {
  const { setToken } = useAuthStore();

  useEffect(() => {
    // Restore token from localStorage on app start
    const token = localStorage.getItem('token');
    if (token) {
      setToken(token);
    }
  }, [setToken]);

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/auth/callback" element={<AuthCallbackPage />} />
      <Route element={<Layout />}>
        <Route path="/" element={<PresentationPage />} />
        <Route path="/presentation" element={<PresentationPage />} />
        <Route path="/history" element={<HistoryPage />} />
        <Route path="/image-analysis" element={<ImageAnalysisPage />} />
      </Route>
    </Routes>
  );
}

// Setup axios interceptors once
setupInterceptors();

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;

import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { PresentationPage } from './features/presentation';
import { LoginPage, setupInterceptors, useAuthStore } from './features/auth';
import { Layout } from './components/Layout';
import { HistoryPage } from './features/history/pages/HistoryPage';
import { HomePage } from './pages/HomePage';
import { ImageAnalysisPage, ImageAnalysisHistoryPage } from './features/image-analysis';
import { ImageToExcelPage, ImageToExcelHistoryPage } from './features/image-to-excel';
import { InterviewPage, InterviewHistoryPage } from './features/interview';

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
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/presentation" element={<PresentationPage />} />
        <Route path="/presentation/history" element={<HistoryPage />} />
        <Route path="/image-analysis" element={<ImageAnalysisPage />} />
        <Route path="/image-analysis/history" element={<ImageAnalysisHistoryPage />} />
        <Route path="/image-to-excel" element={<ImageToExcelPage />} />
        <Route path="/image-to-excel/history" element={<ImageToExcelHistoryPage />} />
        <Route path="/interview" element={<InterviewPage />} />
        <Route path="/interview/history" element={<InterviewHistoryPage />} />
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

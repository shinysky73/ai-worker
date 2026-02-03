import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { PresentationPage } from './features/presentation';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<PresentationPage />} />
        <Route path="/presentation" element={<PresentationPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

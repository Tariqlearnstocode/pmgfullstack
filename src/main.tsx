import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.tsx';
import { DataProvider } from './contexts/DataContext';
import { AIProvider } from './contexts/AIContext';
import { ApiProvider } from './contexts/ApiContext';
import { AuthProvider } from './contexts/AuthContext';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <AIProvider>
          <ApiProvider>
            <DataProvider>
              <App />
            </DataProvider>
          </ApiProvider>
        </AIProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);

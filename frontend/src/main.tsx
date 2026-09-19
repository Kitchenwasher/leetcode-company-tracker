import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeAccentProvider } from './context/ThemeAccentContext';
import { App } from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <ThemeAccentProvider>
          <App />
        </ThemeAccentProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);

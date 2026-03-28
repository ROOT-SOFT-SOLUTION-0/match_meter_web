import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ThemeProvider } from './providers/ThemeProvider';
import './index.css';

// Initialize Firebase Auth state
import authService from './services/auth.service';

authService.onAuthStateChange((user) => {
  console.log('Auth state changed:', user?.email);
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </React.StrictMode>,
);

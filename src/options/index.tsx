import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { OptionsApp } from './options-app';
import { ErrorBoundary } from '../components/ErrorBoundary';
import '../styles/globals.css';

function App() {
  useEffect(() => {
    // Listen for theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleThemeChange = (e: MediaQueryListEvent | MediaQueryList) => {
      if (e.matches) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    };

    // Set initial theme
    handleThemeChange(mediaQuery);

    // Listen for changes
    mediaQuery.addEventListener('change', handleThemeChange);

    return () => {
      mediaQuery.removeEventListener('change', handleThemeChange);
    };
  }, []);

  return <OptionsApp />;
}

const root = document.getElementById('root');
if (root) {
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </React.StrictMode>
  );
}

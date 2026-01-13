import React from 'react';
import ReactDOM from 'react-dom/client';
import { PopupApp } from './popup-app';
import '../styles/globals.css';

const root = document.getElementById('root');
if (root) {
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <PopupApp />
    </React.StrictMode>
  );
}

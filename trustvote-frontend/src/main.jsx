import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import './polyfills';

// Optional: also polyfill process if needed
import process from 'process';
globalThis.process = process;

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import './polyfills';

// Import Node polyfills
import { Buffer } from 'buffer';
import {process} from 'process';

// Optionally also polyfill process if needed
import process from 'process';
globalThis.process = process;

import { Buffer } from 'buffer';
globalThis.Buffer = Buffer;
// window.Buffer = Buffer;
// window.process = process;

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

import React from 'react';
  import ReactDOM from 'react-dom/client';
  import { BrowserRouter } from 'react-router-dom';
  import App from './App';
  import './index.css';

  try {
    const root = document.getElementById('root');
    if (!root) throw new Error('root div missing');
    ReactDOM.createRoot(root).render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    );
    console.log('[REACT] Mounted successfully');
  } catch (err) {
    console.error('[REACT CRASH]', err);
    document.body.innerHTML = `<div style="padding:40px;background:#0a0f1e;color:#f87171;font-family:monospace;min-height:100vh">
      <h1>⚠️ React Mount Failed</h1>
      <pre style="background:rgba(0,0,0,0.5);padding:20px;border-radius:8px;white-space:pre-wrap">${err.message}\n\n${err.stack || ''}</pre>
      <p style="color:#94a3b8">Browser console check karo (F12 → Console)</p>
    </div>`;
  }
  
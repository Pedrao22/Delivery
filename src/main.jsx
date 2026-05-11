import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import { ErrorBoundary } from './components/shared/ErrorBoundary.jsx'
import { reportError } from './lib/errorReporter.js'
import './index.css'

// Auto-recover from stale chunk errors after a new deploy.
window.addEventListener('error', (e) => {
  const msg = e?.message || '';
  if (msg.includes('Loading chunk') || msg.includes('Failed to fetch dynamically imported module') || msg.includes('Importing a module script failed')) {
    const reloaded = sessionStorage.getItem('chunk_reload');
    if (!reloaded) {
      sessionStorage.setItem('chunk_reload', '1');
      window.location.reload();
    }
    return;
  }
  // Outros erros JS não tratados → reporta para o super admin
  reportError({
    message:   msg || 'Erro JS desconhecido',
    page:      window.location.pathname,
    stack:     e?.error?.stack,
    context:   { filename: e?.filename, lineno: e?.lineno, colno: e?.colno },
  });
});

window.addEventListener('unhandledrejection', (e) => {
  const msg = String(e?.reason?.message || e?.reason || '');
  if (msg.includes('Loading chunk') || msg.includes('Failed to fetch dynamically imported module') || msg.includes('Importing a module script failed')) {
    const reloaded = sessionStorage.getItem('chunk_reload');
    if (!reloaded) {
      sessionStorage.setItem('chunk_reload', '1');
      window.location.reload();
    }
    return;
  }
  // Promise rejections não tratadas → reporta
  reportError({
    message: msg || 'Promise rejection não tratada',
    page:    window.location.pathname,
    stack:   e?.reason?.stack,
    context: { type: 'unhandledrejection' },
  });
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>,
)

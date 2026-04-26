import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './index.css'

// Auto-recover from stale chunk errors after a new deploy.
// When a dynamic import 404s (old hash no longer on server), reload once.
window.addEventListener('error', (e) => {
  const msg = e?.message || '';
  if (msg.includes('Loading chunk') || msg.includes('Failed to fetch dynamically imported module') || msg.includes('Importing a module script failed')) {
    const reloaded = sessionStorage.getItem('chunk_reload');
    if (!reloaded) {
      sessionStorage.setItem('chunk_reload', '1');
      window.location.reload();
    }
  }
});

window.addEventListener('unhandledrejection', (e) => {
  const msg = String(e?.reason?.message || e?.reason || '');
  if (msg.includes('Loading chunk') || msg.includes('Failed to fetch dynamically imported module') || msg.includes('Importing a module script failed')) {
    const reloaded = sessionStorage.getItem('chunk_reload');
    if (!reloaded) {
      sessionStorage.setItem('chunk_reload', '1');
      window.location.reload();
    }
  }
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)

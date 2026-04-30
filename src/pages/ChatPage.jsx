import { useState, useEffect } from 'react';
import { ExternalLink, Loader2, MessageSquare } from 'lucide-react';
import { API_URL } from '../lib/supabase';
import './ChatPage.css';

const CHATWOOT_URL = 'https://app.uply.chat';

export default function ChatPage() {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('pedirecebe_token') ||
      document.cookie.split('; ').find(r => r.startsWith('sb-access-token='))?.split('=')[1];

    fetch(`${API_URL}/chatwoot/config`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.success) setConfig(d.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="chat-page chat-loading">
        <Loader2 size={36} className="animate-spin" style={{ color: 'var(--accent)' }} />
        <p style={{ color: 'var(--text-tertiary)', marginTop: 12 }}>Carregando atendimento...</p>
      </div>
    );
  }

  const iframeUrl = `${CHATWOOT_URL}`;

  return (
    <div className="chat-page chat-chatwoot-page">
      <div className="chatwoot-topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <MessageSquare size={18} style={{ color: 'var(--accent)' }} />
          <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Atendimento — Chatwoot</span>
        </div>
        <a
          href={CHATWOOT_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="chatwoot-open-btn"
        >
          <ExternalLink size={14} />
          Abrir em nova aba
        </a>
      </div>

      <iframe
        src={iframeUrl}
        className="chatwoot-iframe"
        title="Chatwoot — Atendimento"
        allow="microphone; camera"
      />
    </div>
  );
}

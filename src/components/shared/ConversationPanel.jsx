import { useState, useEffect, useRef } from 'react';
import { Send, Loader2, MessageSquare } from 'lucide-react';
import { API_URL } from '../../lib/supabase';
import './ConversationPanel.css';

function timeAgo(dateStr) {
  if (!dateStr) return '';
  // Chatwoot sends created_at as Unix seconds (integer), not ISO string
  const ms = typeof dateStr === 'number' ? dateStr * 1000 : new Date(dateStr).getTime();
  const diff = Date.now() - ms;
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'agora';
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

function formatWA(text) {
  if (!text) return null;
  // Split preserving bold (*) and italic (_) markers
  const parts = text.split(/(\*[^*]+\*|_[^_]+_)/g);
  return parts.map((part, i) => {
    if (part.startsWith('*') && part.endsWith('*') && part.length > 2)
      return <strong key={i}>{part.slice(1, -1)}</strong>;
    if (part.startsWith('_') && part.endsWith('_') && part.length > 2)
      return <em key={i}>{part.slice(1, -1)}</em>;
    return part;
  });
}

function authHeaders() {
  const token = localStorage.getItem('pedirecebe_token') ||
    document.cookie.split('; ').find(r => r.startsWith('sb-access-token='))?.split('=')[1];
  return token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
}

/**
 * Reusable chat panel. Pass either:
 *   - conversationId (number) — direct
 *   - phone (string) — looks up conversation by phone first
 */
export default function ConversationPanel({ conversationId: propConvId, phone }) {
  const [convId, setConvId] = useState(propConvId ?? null);
  const [messages, setMessages] = useState([]);
  const [replyText, setReplyText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const messagesEndRef = useRef(null);
  const convIdRef = useRef(convId);
  convIdRef.current = convId;

  // If phone provided, look up conversation ID first
  useEffect(() => {
    if (propConvId) { setConvId(propConvId); return; }
    if (!phone) { setLoading(false); setNotFound(true); return; }

    const normalized = phone.replace(/\D/g, '');
    fetch(`${API_URL}/chatwoot/by-phone/${encodeURIComponent(normalized)}`, {
      headers: authHeaders(),
    })
      .then(r => r.json())
      .then(d => {
        if (d?.success && d.data?.id) {
          setConvId(d.data.id);
        } else {
          setNotFound(true);
          setLoading(false);
        }
      })
      .catch(() => { setNotFound(true); setLoading(false); });
  }, [phone, propConvId]);

  const fetchMessages = async (id, silent = false) => {
    if (!id) return;
    if (!silent) setLoading(true);
    try {
      const res = await fetch(`${API_URL}/chatwoot/conversations/${id}/messages`, { headers: authHeaders() });
      const d = await res.json();
      if (d?.success) setMessages(d.data ?? []);
    } catch {}
    finally { if (!silent) setLoading(false); }
  };

  useEffect(() => {
    if (!convId) return;
    fetchMessages(convId);
  }, [convId]);

  // Auto-refresh every 8s
  useEffect(() => {
    if (!convId) return;
    const t = setInterval(() => fetchMessages(convIdRef.current, true), 8000);
    return () => clearInterval(t);
  }, [convId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    const content = replyText.trim();
    if (!content || !convId || sending) return;
    setSending(true);
    try {
      await fetch(`${API_URL}/chatwoot/conversations/${convId}/reply`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ conversationId: convId, content }),
      });
      setReplyText('');
      await fetchMessages(convId, true);
    } catch {}
    finally { setSending(false); }
  };

  if (notFound) {
    return (
      <div className="conv-panel conv-panel-empty">
        <MessageSquare size={28} />
        <p>Nenhuma conversa encontrada para esse cliente.</p>
        <p style={{ fontSize: '0.75rem' }}>A conversa é criada automaticamente quando o cliente faz um pedido com telefone.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="conv-panel conv-panel-empty">
        <Loader2 size={24} className="animate-spin" style={{ color: 'var(--accent)' }} />
      </div>
    );
  }

  const sorted = [...messages].sort((a, b) =>
    new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  return (
    <div className="conv-panel">
      <div className="conv-messages">
        {sorted.length === 0 && (
          <div className="conv-panel-empty" style={{ flex: 1 }}>
            <MessageSquare size={24} style={{ color: 'var(--text-tertiary)' }} />
            <p>Nenhuma mensagem ainda.</p>
          </div>
        )}
        {sorted.map(msg => {
          const isActivity = msg.message_type === 2;
          const isOut = msg.message_type === 1 || msg.message_type === 'outgoing';
          const senderName = msg.sender?.name || (isOut ? 'Você' : 'Cliente');
          if (isActivity) {
            return (
              <div key={msg.id} className="conv-msg-activity">
                <span className="conv-activity-dot" />
                <span className="conv-activity-text">{msg.content}</span>
                <span className="conv-activity-time">{timeAgo(msg.created_at)}</span>
              </div>
            );
          }
          return (
            <div key={msg.id} className={`conv-msg ${isOut ? 'outgoing' : 'incoming'}`}>
              <div className="conv-msg-sender">{senderName}</div>
              <div className="conv-bubble">{formatWA(msg.content)}</div>
              <div className="conv-msg-time">{timeAgo(msg.created_at)}</div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <div className="conv-reply-bar">
        <input
          className="conv-reply-input"
          placeholder="Responder cliente..."
          value={replyText}
          onChange={e => setReplyText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
        />
        <button
          className="conv-send-btn"
          onClick={handleSend}
          disabled={!replyText.trim() || sending}
        >
          {sending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
        </button>
      </div>
    </div>
  );
}

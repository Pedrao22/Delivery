import { useState, useEffect, useRef } from 'react';
import { Send, Loader2, MessageSquare, ChevronUp, RefreshCw, AlertCircle } from 'lucide-react';
import { apiFetch, API_URL, getAuthHeaders } from '../../lib/supabase';
import './ConversationPanel.css';

const PAGE_SIZE = 20; // Chatwoot's default page size

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
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [fetchError, setFetchError] = useState(false);
  const messagesEndRef = useRef(null);
  const messagesTopRef = useRef(null);
  const convIdRef = useRef(convId);
  convIdRef.current = convId;
  // Track whether user is at the bottom so auto-refresh doesn't interrupt scrolling up
  const atBottomRef = useRef(true);
  const containerRef = useRef(null);

  // If phone provided, look up conversation ID first
  useEffect(() => {
    if (propConvId) { setConvId(propConvId); return; }
    if (!phone) { setLoading(false); setNotFound(true); return; }

    const normalized = phone.replace(/\D/g, '');
    apiFetch(`/chatwoot/by-phone/${encodeURIComponent(normalized)}`)
      .then(d => {
        if (d?.data?.id) {
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
    if (!silent) { setLoading(true); setFetchError(false); }
    try {
      const d = await apiFetch(`/chatwoot/conversations/${id}/messages`);
      const incoming = d?.data ?? [];
      setHasMore(incoming.length >= PAGE_SIZE);
      setFetchError(false);
      setMessages(prev => {
        if (!silent) return incoming; // carga inicial: substitui tudo
        // Refresh silencioso: preserva mensagens otimistas (_opt_) que o Chatwoot
        // ainda não confirmou (casamento por conteúdo entre mensagens outgoing)
        const outReal = incoming.filter(m => m.message_type === 1 || m.message_type === 'outgoing');
        const pendingOpt = prev.filter(m => {
          if (!String(m.id).startsWith('_opt_')) return false;
          return !outReal.some(r => r.content === m.content);
        });
        return pendingOpt.length > 0 ? [...incoming, ...pendingOpt] : incoming;
      });
    } catch (e) {
      // Erro silencioso não interrompe refresh — só mostra erro na carga inicial
      if (!silent) setFetchError(true);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const loadOlderMessages = async () => {
    if (!convId || loadingMore || !hasMore) return;
    setLoadingMore(true);
    const oldest = messages.reduce((min, m) =>
      (m.id && m.id < (min ?? Infinity)) ? m.id : min, null);
    try {
      const suffix = oldest ? `?before=${oldest}` : '';
      const d = await apiFetch(`/chatwoot/conversations/${convId}/messages${suffix}`);
      const older = d?.data ?? [];
      setHasMore(older.length >= PAGE_SIZE);
      if (older.length > 0) {
        setMessages(prev => {
          const existingIds = new Set(prev.map(m => m.id));
          const newOnes = older.filter(m => !existingIds.has(m.id));
          return [...newOnes, ...prev];
        });
        setTimeout(() => messagesTopRef.current?.scrollIntoView({ block: 'start' }), 0);
      }
    } catch {}
    finally { setLoadingMore(false); }
  };

  useEffect(() => {
    if (!convId) return;
    setMessages([]);
    setHasMore(false);
    setFetchError(false);
    fetchMessages(convId);
  }, [convId]);

  // Auto-refresh every 3s
  useEffect(() => {
    if (!convId) return;
    const t = setInterval(() => fetchMessages(convIdRef.current, true), 3000);
    return () => clearInterval(t);
  }, [convId]);

  // Scroll to bottom only on initial load or when user was already at the bottom
  useEffect(() => {
    if (atBottomRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSend = async () => {
    const content = replyText.trim();
    if (!content || !convId || sending) return;
    setSending(true);
    atBottomRef.current = true; // força scroll ao fim após envio

    // Otimista — exibe a mensagem imediatamente
    const optId = `_opt_${Date.now()}`;
    const optimistic = {
      id: optId,
      message_type: 1,
      content,
      created_at: Math.floor(Date.now() / 1000),
      sender: { name: 'Você' },
    };
    setMessages(prev => [...prev, optimistic]);
    setReplyText('');

    try {
      await apiFetch(`/chatwoot/conversations/${convId}/reply`, {
        method: 'POST',
        body: JSON.stringify({ conversationId: convId, content }),
      });
      // Aguarda o Chatwoot indexar a mensagem antes de buscar
      await new Promise(r => setTimeout(r, 900));
      await fetchMessages(convId, true);
    } catch {
      // Reverte otimista em caso de falha
      setMessages(prev => prev.filter(m => m.id !== optId));
      setReplyText(content);
    } finally {
      setSending(false);
    }
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

  if (fetchError) {
    return (
      <div className="conv-panel conv-panel-empty">
        <AlertCircle size={28} style={{ color: 'var(--danger, #e74c3c)' }} />
        <p>Erro ao carregar mensagens.</p>
        <button
          className="conv-load-more-btn"
          style={{ marginTop: 8 }}
          onClick={() => fetchMessages(convId)}
        >
          <RefreshCw size={13} /> Tentar novamente
        </button>
      </div>
    );
  }

  // created_at do Chatwoot é Unix timestamp em segundos (inteiro)
  const toMs = (v) => typeof v === 'number' ? v * 1000 : new Date(v).getTime();
  const sorted = [...messages].sort((a, b) => toMs(a.created_at) - toMs(b.created_at));

  return (
    <div className="conv-panel">
      <div
        className="conv-messages"
        ref={containerRef}
        onScroll={e => {
          const el = e.currentTarget;
          atBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 60;
        }}
      >
        {hasMore && (
          <div className="conv-load-more">
            <button
              className="conv-load-more-btn"
              onClick={loadOlderMessages}
              disabled={loadingMore}
            >
              {loadingMore
                ? <Loader2 size={13} className="animate-spin" />
                : <ChevronUp size={13} />}
              {loadingMore ? 'Carregando...' : 'Carregar mensagens anteriores'}
            </button>
          </div>
        )}
        <div ref={messagesTopRef} />
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

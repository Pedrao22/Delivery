import { useState, useEffect, useRef } from 'react';
import { MessageSquare, RefreshCw, Send, ExternalLink, Loader2, User } from 'lucide-react';
import { API_URL } from '../lib/supabase';
import './ChatPage.css';

const CHATWOOT_URL = 'https://app.uply.chat';

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'agora';
  if (m < 60) return `${m}m atrás`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h atrás`;
  return `${Math.floor(h / 24)}d atrás`;
}

function authHeaders() {
  const token = localStorage.getItem('pedirecebe_token') ||
    document.cookie.split('; ').find(r => r.startsWith('sb-access-token='))?.split('=')[1];
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function ChatPage() {
  const [conversations, setConversations] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [replyText, setReplyText] = useState('');
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  const selectedIdRef = useRef(null);
  selectedIdRef.current = selectedId;

  const fetchConversations = async (silent = false) => {
    if (!silent) setLoadingConvs(true);
    try {
      const res = await fetch(`${API_URL}/chatwoot/conversations`, { headers: authHeaders() });
      const d = await res.json();
      if (d?.success) setConversations(d.data ?? []);
    } catch {}
    finally { if (!silent) setLoadingConvs(false); }
  };

  const fetchMessages = async (id, silent = false) => {
    if (!id) return;
    if (!silent) setLoadingMsgs(true);
    try {
      const res = await fetch(`${API_URL}/chatwoot/conversations/${id}/messages`, { headers: authHeaders() });
      const d = await res.json();
      if (d?.success) setMessages(d.data ?? []);
    } catch {}
    finally { if (!silent) setLoadingMsgs(false); }
  };

  // Initial load
  useEffect(() => { fetchConversations(); }, []);

  // Auto-refresh conversations every 15s
  useEffect(() => {
    const t = setInterval(() => fetchConversations(true), 15000);
    return () => clearInterval(t);
  }, []);

  // Load messages when conversation changes
  useEffect(() => {
    fetchMessages(selectedId);
  }, [selectedId]);

  // Auto-refresh messages every 8s when a conversation is open
  useEffect(() => {
    if (!selectedId) return;
    const t = setInterval(() => fetchMessages(selectedIdRef.current, true), 8000);
    return () => clearInterval(t);
  }, [selectedId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    const content = replyText.trim();
    if (!content || !selectedId || sending) return;
    setSending(true);
    try {
      await fetch(`${API_URL}/chatwoot/conversations/${selectedId}/reply`, {
        method: 'POST',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId: selectedId, content }),
      });
      setReplyText('');
      await fetchMessages(selectedId);
    } catch {}
    finally { setSending(false); }
  };

  const selectedConv = conversations.find(c => c.id === selectedId);

  const sortedConvs = [...conversations].sort((a, b) => {
    const ta = a.last_activity_at ?? a.created_at ?? 0;
    const tb = b.last_activity_at ?? b.created_at ?? 0;
    return new Date(tb).getTime() - new Date(ta).getTime();
  });

  const sortedMsgs = [...messages].sort((a, b) =>
    new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  return (
    <div className="chat-page">
      {/* Sidebar */}
      <aside className="chat-sidebar">
        <div className="chat-sidebar-header">
          <div className="chat-sidebar-title">
            <MessageSquare size={16} />
            <span>Atendimento</span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="chat-icon-btn" onClick={fetchConversations} title="Atualizar">
              <RefreshCw size={14} className={loadingConvs ? 'animate-spin' : ''} />
            </button>
            <a href={CHATWOOT_URL} target="_blank" rel="noopener noreferrer" className="chat-icon-btn" title="Abrir Chatwoot">
              <ExternalLink size={14} />
            </a>
          </div>
        </div>

        <div className="chat-conv-list">
          {loadingConvs && (
            <div className="chat-center">
              <Loader2 size={24} className="animate-spin" style={{ color: 'var(--accent)' }} />
            </div>
          )}
          {!loadingConvs && sortedConvs.length === 0 && (
            <div className="chat-empty">
              <MessageSquare size={32} style={{ color: 'var(--text-tertiary)' }} />
              <p>Nenhuma conversa ainda.</p>
              <p style={{ fontSize: '0.75rem' }}>As conversas aparecem aqui quando clientes fazem pedidos.</p>
            </div>
          )}
          {sortedConvs.map(conv => {
            const name = conv.contact_name || `Conversa #${conv.id}`;
            const phone = conv.contact_phone || '';
            const preview = conv.last_message || '';
            const unread = conv.unread_count ?? 0;
            const isSelected = conv.id === selectedId;
            return (
              <button
                key={conv.id}
                className={`chat-conv-item${isSelected ? ' selected' : ''}`}
                onClick={() => setSelectedId(conv.id)}
              >
                <div className="chat-conv-avatar">
                  <User size={16} />
                </div>
                <div className="chat-conv-info">
                  <div className="chat-conv-top">
                    <span className="chat-conv-name">{name}</span>
                    <span className="chat-conv-time">{timeAgo(conv.last_activity_at ?? conv.created_at)}</span>
                  </div>
                  <div className="chat-conv-preview">
                    <span className="chat-conv-text">{phone || preview || 'Sem mensagens'}</span>
                    {unread > 0 && <span className="chat-conv-badge">{unread}</span>}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </aside>

      {/* Main panel */}
      <main className="chat-main">
        {!selectedId ? (
          <div className="chat-center chat-placeholder">
            <MessageSquare size={48} style={{ color: 'var(--text-tertiary)' }} />
            <p>Selecione uma conversa para ver as mensagens</p>
          </div>
        ) : (
          <>
            <div className="chat-main-header">
              <div className="chat-conv-avatar lg">
                <User size={20} />
              </div>
              <div>
                <div className="chat-main-name">
                  {selectedConv?.contact_name || `Conversa #${selectedId}`}
                </div>
                {selectedConv?.contact_phone && (
                  <div className="chat-main-phone">{selectedConv.contact_phone}</div>
                )}
              </div>
              <a
                href={`${CHATWOOT_URL}/app/accounts/${import.meta.env.VITE_CHATWOOT_ACCOUNT_ID || ''}/conversations/${selectedId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="chat-icon-btn"
                style={{ marginLeft: 'auto' }}
                title="Abrir no Chatwoot"
              >
                <ExternalLink size={14} />
              </a>
            </div>

            <div className="chat-messages">
              {loadingMsgs ? (
                <div className="chat-center">
                  <Loader2 size={24} className="animate-spin" style={{ color: 'var(--accent)' }} />
                </div>
              ) : (
                sortedMsgs.map(msg => {
                  const isOut = msg.message_type === 1 || msg.message_type === 'outgoing';
                  return (
                    <div key={msg.id} className={`chat-msg ${isOut ? 'outgoing' : 'incoming'}`}>
                      <div className="chat-bubble">{msg.content}</div>
                      <div className="chat-msg-time">{timeAgo(msg.created_at)}</div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="chat-reply-bar">
              <input
                className="chat-reply-input"
                placeholder="Digite uma resposta..."
                value={replyText}
                onChange={e => setReplyText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
              />
              <button
                className="chat-send-btn"
                onClick={handleSend}
                disabled={!replyText.trim() || sending}
              >
                {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              </button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

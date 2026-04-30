import { useState, useEffect } from 'react';
import { MessageSquare, RefreshCw, ExternalLink, Loader2, User, RefreshCcw } from 'lucide-react';
import { API_URL } from '../lib/supabase';
import ConversationPanel from '../components/shared/ConversationPanel';
import './ChatPage.css';

const CHATWOOT_URL = 'https://app.uply.chat';
const ACCOUNT_ID = '12113';

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
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState(null);

  const fetchConversations = async (silent = false) => {
    if (!silent) setLoadingConvs(true);
    try {
      const res = await fetch(`${API_URL}/chatwoot/conversations`, { headers: authHeaders() });
      const d = await res.json();
      if (d?.success) setConversations(d.data ?? []);
    } catch {}
    finally { if (!silent) setLoadingConvs(false); }
  };

  const handleSync = async () => {
    setSyncing(true);
    setSyncMsg(null);
    try {
      const res = await fetch(`${API_URL}/chatwoot/sync`, {
        method: 'POST',
        headers: authHeaders(),
      });
      const d = await res.json();
      const count = d?.synced ?? 0;
      setSyncMsg(count > 0 ? `${count} conversa(s) sincronizada(s)` : 'Nenhuma conversa nova encontrada');
      await fetchConversations(true);
    } catch {
      setSyncMsg('Erro ao sincronizar');
    } finally {
      setSyncing(false);
      setTimeout(() => setSyncMsg(null), 4000);
    }
  };

  useEffect(() => { fetchConversations(); }, []);

  useEffect(() => {
    const t = setInterval(() => fetchConversations(true), 15000);
    return () => clearInterval(t);
  }, []);

  const selectedConv = conversations.find(c => c.id === selectedId);

  const sortedConvs = [...conversations].sort((a, b) =>
    new Date(b.last_activity_at ?? b.created_at ?? 0).getTime() -
    new Date(a.last_activity_at ?? a.created_at ?? 0).getTime()
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
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {syncMsg && (
              <span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', maxWidth: 140, textAlign: 'right' }}>
                {syncMsg}
              </span>
            )}
            <button
              className="chat-icon-btn"
              onClick={handleSync}
              disabled={syncing}
              title="Sincronizar conversas do histórico"
            >
              {syncing
                ? <Loader2 size={14} className="animate-spin" />
                : <RefreshCcw size={14} />}
            </button>
            <button className="chat-icon-btn" onClick={() => fetchConversations()} title="Atualizar">
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
                href={`${CHATWOOT_URL}/app/accounts/${ACCOUNT_ID}/conversations/${selectedId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="chat-icon-btn"
                style={{ marginLeft: 'auto' }}
                title="Abrir no Chatwoot"
              >
                <ExternalLink size={14} />
              </a>
            </div>

            <ConversationPanel conversationId={selectedId} />
          </>
        )}
      </main>
    </div>
  );
}

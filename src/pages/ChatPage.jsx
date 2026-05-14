import { useState, useEffect } from 'react';
import { MessageSquare, RefreshCw, ExternalLink, Loader2, User, RefreshCcw, Search, CheckCircle, XCircle, ShoppingCart } from 'lucide-react';
import { API_URL, apiFetch, getAuthHeaders } from '../lib/supabase';
import { useOrdersContext } from '../context/OrdersContext';
import { useCart } from '../hooks/useCart';
import ConversationPanel from '../components/shared/ConversationPanel';
import MenuGrid from '../components/menu/MenuGrid';
import Cart from '../components/menu/Cart';
import Modal from '../components/shared/Modal';
import Button from '../components/shared/Button';
import './ChatPage.css';

const CHATWOOT_URL = 'https://app.uply.chat';
const ACCOUNT_ID = '12113';

const TYPE_LABEL = { delivery: '🛵 Delivery', pickup: '🏪 Retirada', local: '🍽️ Local' };

function buildOrderSummary(newOrder, orderData, settings = {}) {
  const code = newOrder?.confirmCode || '';
  const items = (orderData.items || [])
    .filter(i => i && typeof i === 'object' && !Array.isArray(i));

  const itemLines = items.map(i => {
    const name = i.nome || i.name || '?';
    const qty  = i.qty || 1;
    let line = `➡️ ${qty}x ${name}`;
    if (i.variation) line += `\n   ${i.variation}`;
    if (Array.isArray(i.complements) && i.complements.length > 0) {
      i.complements.forEach(c => {
        const cName = c.nome || c.name || String(c);
        const cQty  = c.qty || c.quantidade || 1;
        line += `\n     ${cQty}x ${cName}`;
      });
    }
    return line;
  }).join('\n');

  const total      = (orderData.total || 0).toFixed(2).replace('.', ',');
  const payment    = orderData.payment || '';
  const type       = orderData.type || '';
  const address    = orderData.customer?.address || '';
  const discounts  = parseFloat(orderData.discounts || orderData.discount || 0);
  const deliveryFee = orderData.delivery_fee != null ? parseFloat(orderData.delivery_fee) : null;

  const rawTime  = settings.deliveryTime || '30 a 45 min';
  const nums     = rawTime.match(/\d+/g) || [];
  const timeStr  = nums.length >= 2
    ? `entre ${nums[0]}~${nums[1]} minutos`
    : rawTime;

  const lines = [];
  lines.push(`*Pedido nº ${code}*`);
  lines.push('');
  lines.push('📦 *Itens:*');
  lines.push(itemLines);
  lines.push('');
  lines.push(`💳 ${payment}`);

  if (type === 'delivery') {
    const taxaStr = deliveryFee != null
      ? ` (taxa de: R$ ${deliveryFee.toFixed(2).replace('.', ',')})`
      : '';
    lines.push(`🛵 Delivery${taxaStr}`);
    if (address) lines.push(`🏠 ${address}`);
    lines.push(`⏱️ Estimativa: ${timeStr}`);
  } else if (type === 'pickup') {
    lines.push('🏪 Retirada no local');
  } else if (type === 'local') {
    lines.push('🍽️ Consumo local');
  }

  if (discounts > 0) {
    lines.push(`💸 Desconto: R$ ${discounts.toFixed(2).replace('.', ',')}`);
  }

  lines.push('');
  lines.push(`💰 *Total: R$ ${total}*`);
  lines.push('');
  lines.push('Obrigado pela preferência! Se precisar de algo é só chamar 😉');

  return lines.join('\n');
}

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

const STATUS_LABEL = { pending: 'Pendente', open: 'Atendendo', resolved: 'Encerrado' };
const STATUS_DOT   = { pending: 'var(--warning)', open: 'var(--success)', resolved: 'var(--text-tertiary)' };

export default function ChatPage() {
  const { addOrder, restaurantSettings } = useOrdersContext();
  const { items, total, count, addItem, removeItem, updateQty, clearCart } = useCart();

  const [conversations, setConversations] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState(null);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('pending');
  const [actionLoading, setActionLoading] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showCart, setShowCart] = useState(false);

  const fetchConversations = async (silent = false) => {
    if (!silent) setLoadingConvs(true);
    try {
      const d = await apiFetch('/chatwoot/conversations');
      setConversations(d?.data ?? d ?? []);
    } catch {}
    finally { if (!silent) setLoadingConvs(false); }
  };

  const handleSync = async () => {
    setSyncing(true);
    setSyncMsg(null);
    try {
      const d = await apiFetch('/chatwoot/sync', { method: 'POST' });
      const count = d?.synced ?? 0;
      setSyncMsg(count > 0 ? `${count} sincronizada(s)` : 'Nenhuma nova');
      await fetchConversations(true);
    } catch {
      setSyncMsg('Erro ao sincronizar');
    } finally {
      setSyncing(false);
      setTimeout(() => setSyncMsg(null), 4000);
    }
  };

  const handleConfirmOrder = async (orderData) => {
    // Passa o ID da conversa Chatwoot para vincular o pedido automaticamente
    const newOrder = await addOrder({ ...orderData, chatwoot_conversation_id: selectedId ?? undefined });
    if (selectedId) {
      try {
        const summary = buildOrderSummary(newOrder, orderData, restaurantSettings);
        await fetch(`${API_URL}/chatwoot/conversations/${selectedId}/reply`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({ conversationId: selectedId, content: summary }),
        });
      } catch (err) {
        console.warn('Não foi possível enviar resumo ao cliente:', err);
      }
    }
    setShowCart(false);
    clearCart();
  };

  const handleStatusChange = async (convId, newStatus) => {
    setActionLoading(true);
    try {
      await apiFetch(`/chatwoot/conversations/${convId}/status`, {
        method: 'POST',
        body: JSON.stringify({ status: newStatus }),
      });
      setConversations(prev =>
        prev.map(c => c.id === convId ? { ...c, status: newStatus } : c)
      );
      if (newStatus === 'resolved') setSelectedId(null);
    } catch {}
    finally { setActionLoading(false); }
  };

  useEffect(() => {
    fetchConversations();
    apiFetch('/chatwoot/sync', { method: 'POST' }).catch(() => {});
  }, []);
  useEffect(() => {
    const t = setInterval(() => fetchConversations(true), 5000);
    return () => clearInterval(t);
  }, []);

  const selectedConv = conversations.find(c => c.id === selectedId);

  const pendente  = conversations.filter(c => c.status === 'pending').length;
  const atendendo = conversations.filter(c => c.status === 'open').length;

  const sortedConvs = [...conversations]
    .sort((a, b) =>
      new Date(b.last_activity_at ?? b.created_at ?? 0).getTime() -
      new Date(a.last_activity_at ?? a.created_at ?? 0).getTime()
    )
    .filter(c => {
      if (activeTab === 'pending'  && c.status !== 'pending')  return false;
      if (activeTab === 'open'     && c.status !== 'open')     return false;
      if (activeTab === 'all'      && c.status === 'resolved') return false;
      if (activeTab === 'resolved' && c.status !== 'resolved') return false;
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        (c.contact_name  || '').toLowerCase().includes(q) ||
        (c.contact_phone || '').toLowerCase().includes(q) ||
        (c.last_message  || '').toLowerCase().includes(q)
      );
    });

  if (!restaurantSettings.chatwootInboxId) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        minHeight: '70vh', gap: '24px', padding: '40px 24px', textAlign: 'center',
      }}>
        <div style={{
          width: 72, height: 72, borderRadius: '20px',
          background: 'linear-gradient(135deg, rgba(37,211,102,0.15), rgba(37,211,102,0.05))',
          border: '1px solid rgba(37,211,102,0.25)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem',
        }}>
          💬
        </div>
        <div>
          <h2 style={{ color: 'var(--text-primary)', fontWeight: 800, fontSize: '1.4rem', margin: '0 0 8px 0' }}>
            WhatsApp não configurado
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: 420, margin: '0 auto', lineHeight: 1.6 }}>
            Para usar o chat com clientes, você precisa conectar seu número de WhatsApp. Siga os passos abaixo:
          </p>
        </div>
        <div style={{
          background: 'var(--card-bg, rgba(255,255,255,0.04))',
          border: '1px solid var(--border-color, rgba(255,255,255,0.08))',
          borderRadius: '16px', padding: '24px 32px', maxWidth: 440, width: '100%', textAlign: 'left',
        }}>
          {[
            { n: 1, text: 'Acesse o Uply.chat clicando no botão abaixo' },
            { n: 2, text: 'Vá em Configurações → Caixas de entrada → Nova caixa' },
            { n: 3, text: 'Escolha o canal WhatsApp e escaneie o QR code com seu celular' },
            { n: 4, text: 'Após conectar, avise o suporte para ativar o chat aqui no painel' },
          ].map(({ n, text }) => (
            <div key={n} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: n < 4 ? 14 : 0 }}>
              <div style={{
                width: 26, height: 26, borderRadius: '50%', flexShrink: 0, marginTop: 1,
                background: 'rgba(37,211,102,0.15)', border: '1px solid rgba(37,211,102,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.72rem', fontWeight: 800, color: '#25d366',
              }}>{n}</div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0, lineHeight: 1.5 }}>{text}</p>
            </div>
          ))}
        </div>
        <a
          href="https://app.uply.chat"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '13px 28px', borderRadius: '12px',
            background: 'linear-gradient(135deg, #25d366, #128c7e)',
            color: '#fff', fontWeight: 700, fontSize: '0.95rem',
            textDecoration: 'none', boxShadow: '0 4px 20px rgba(37,211,102,0.3)',
          }}
        >
          <ExternalLink size={16} />
          Abrir Uply.chat para conectar
        </a>
      </div>
    );
  }

  return (
    <div className="chat-page">
      {/* Sidebar */}
      <aside className="chat-sidebar">
        <div className="chat-sidebar-header">
          <div className="chat-sidebar-title">
            <MessageSquare size={16} />
            <span>Atendimento</span>
          </div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            {syncMsg && (
              <span style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)' }}>{syncMsg}</span>
            )}
            <button className="chat-icon-btn" onClick={handleSync} disabled={syncing} title="Sincronizar histórico">
              {syncing ? <Loader2 size={14} className="animate-spin" /> : <RefreshCcw size={14} />}
            </button>
            <button className="chat-icon-btn" onClick={() => fetchConversations()} title="Atualizar">
              <RefreshCw size={14} className={loadingConvs ? 'animate-spin' : ''} />
            </button>
            <a href={CHATWOOT_URL} target="_blank" rel="noopener noreferrer" className="chat-icon-btn" title="Abrir Chatwoot">
              <ExternalLink size={14} />
            </a>
          </div>
        </div>

        {/* Search */}
        <div className="chat-search-wrap">
          <Search size={13} className="chat-search-icon" />
          <input
            className="chat-search-input"
            type="text"
            placeholder="Procurar por mensagens nas conversas"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Counters — clickable */}
        <div className="chat-counters">
          <button
            className={`chat-counter-btn${activeTab === 'pending' ? ' active' : ''}`}
            onClick={() => setActiveTab('pending')}
          >
            <span className="chat-counter-label">Pendente</span>
            <span className="chat-counter-value pending">{pendente}</span>
          </button>
          <div className="chat-counter-divider" />
          <button
            className={`chat-counter-btn${activeTab === 'open' ? ' active' : ''}`}
            onClick={() => setActiveTab('open')}
          >
            <span className="chat-counter-label">Atendendo</span>
            <span className="chat-counter-value attending">{atendendo}</span>
          </button>
        </div>

        {/* Tabs */}
        <div className="chat-tabs">
          {[
            { key: 'all',      label: 'Todos' },
            { key: 'pending',  label: 'Pendente' },
            { key: 'open',     label: 'Atendendo' },
            { key: 'resolved', label: 'Encerrados' },
          ].map(tab => (
            <button
              key={tab.key}
              className={`chat-tab${activeTab === tab.key ? ' active' : ''}`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
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
              <p>Nenhuma conversa nesta categoria.</p>
            </div>
          )}
          {sortedConvs.map(conv => {
            const name    = conv.contact_name || `Conversa #${conv.id}`;
            const phone   = conv.contact_phone || '';
            const preview = conv.last_message || '';
            const unread  = conv.unread_count ?? 0;
            const isSelected = conv.id === selectedId;
            return (
              <button
                key={conv.id}
                className={`chat-conv-item${isSelected ? ' selected' : ''}`}
                onClick={() => setSelectedId(conv.id)}
              >
                <div className="chat-conv-avatar" style={{ position: 'relative' }}>
                  <User size={16} />
                  <span
                    className="chat-status-dot"
                    style={{ background: STATUS_DOT[conv.status] ?? STATUS_DOT.open }}
                  />
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
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="chat-main-name">
                  {selectedConv?.contact_name || `Conversa #${selectedId}`}
                </div>
                {selectedConv?.contact_phone && (
                  <div className="chat-main-phone">{selectedConv.contact_phone}</div>
                )}
              </div>

              {/* Action buttons */}
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <button
                  className="chat-action-btn order"
                  onClick={() => setShowOrderModal(true)}
                  title="Criar pedido para este cliente"
                >
                  <ShoppingCart size={13} />
                  Fazer Pedido
                </button>
                {selectedConv?.status === 'pending' && (
                  <button
                    className="chat-action-btn accept"
                    disabled={actionLoading}
                    onClick={() => handleStatusChange(selectedId, 'open')}
                    title="Aceitar chamado"
                  >
                    {actionLoading ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle size={13} />}
                    Aceitar
                  </button>
                )}
                {selectedConv?.status === 'open' && (
                  <button
                    className="chat-action-btn close"
                    disabled={actionLoading}
                    onClick={() => handleStatusChange(selectedId, 'resolved')}
                    title="Encerrar conversa"
                  >
                    {actionLoading ? <Loader2 size={13} className="animate-spin" /> : <XCircle size={13} />}
                    Encerrar
                  </button>
                )}
                {selectedConv?.status === 'resolved' && (
                  <button
                    className="chat-action-btn reopen"
                    disabled={actionLoading}
                    onClick={() => handleStatusChange(selectedId, 'open')}
                    title="Reabrir conversa"
                  >
                    {actionLoading ? <Loader2 size={13} className="animate-spin" /> : <RefreshCcw size={13} />}
                    Reabrir
                  </button>
                )}
                <a
                  href={`${CHATWOOT_URL}/app/accounts/${ACCOUNT_ID}/conversations/${selectedId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="chat-icon-btn"
                  title="Abrir no Chatwoot"
                >
                  <ExternalLink size={14} />
                </a>
              </div>
            </div>

            <ConversationPanel conversationId={selectedId} />
          </>
        )}
      </main>
      {/* New Order Modal — Menu */}
      <Modal
        isOpen={showOrderModal}
        onClose={() => setShowOrderModal(false)}
        title={`Novo Pedido — ${selectedConv?.contact_name || 'Cliente'}`}
        size="full"
        footer={
          count > 0 ? (
            <Button onClick={() => { setShowOrderModal(false); setShowCart(true); }} icon={<ShoppingCart size={16} />}>
              Ver Carrinho ({count}) — R$ {total.toFixed(2).replace('.', ',')}
            </Button>
          ) : null
        }
      >
        <MenuGrid onAddToCart={addItem} />
      </Modal>

      {/* Cart — pre-filled with chat customer */}
      <Cart
        items={items}
        total={total}
        count={count}
        onUpdateQty={updateQty}
        onRemove={removeItem}
        onClear={clearCart}
        onConfirm={handleConfirmOrder}
        isOpen={showCart}
        onClose={() => setShowCart(false)}
        initialCustomer={{
          name: selectedConv?.contact_name || '',
          phone: selectedConv?.contact_phone || '',
        }}
      />
    </div>
  );
}

import { MapPin, Phone, CreditCard, MessageSquare, ChevronRight, XCircle, Send } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useOrdersContext } from '../../context/OrdersContext';
import Modal from '../shared/Modal';
import Badge from '../shared/Badge';
import Button from '../shared/Button';
import './OrderModal.css';

const typeConfig = {
  delivery: { icon: '🛵', label: 'Delivery', variant: 'delivery' },
  pickup: { icon: '🏪', label: 'Retirada', variant: 'pickup' },
  local: { icon: '🍽️', label: 'Local', variant: 'local' },
};

const statusConfig = {
  analyzing: { label: 'Em Análise', next: 'production', nextLabel: 'Aceitar Pedido', variant: 'info' },
  production: { label: 'Em Produção', next: 'ready', nextLabel: 'Marcar como Pronto', variant: 'warning' },
  ready: { label: 'Pronto', next: null, nextLabel: null, variant: 'success' },
};

export default function OrderModal({ order, isOpen, onClose, onMoveOrder }) {
  const { addChatMessage } = useOrdersContext();
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [message, setMessage] = useState('');
  const chatEndRef = useRef(null);

  useEffect(() => {
    if (isChatOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isChatOpen, order?.chat]);

  if (!order) return null;

  const type = typeConfig[order.type];
  const status = statusConfig[order.status];

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    addChatMessage(order.id, message, 'admin');
    setMessage('');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Pedido ${order.id}`}
      headerActions={
        <button 
          className={`sidebar-theme-toggle ${isChatOpen ? 'active' : ''}`} 
          style={{ width: '40px', height: '40px', padding: 0, justifyContent: 'center', marginBottom: 0 }}
          onClick={() => setIsChatOpen(!isChatOpen)}
          title="Abrir Chat"
        >
          <MessageSquare size={20} />
        </button>
      }
      footer={
        <>
          {order.status !== 'ready' && (
            <Button variant="secondary" onClick={() => { onMoveOrder(order.id, 'cancelled'); onClose(); }} icon={<XCircle size={16} />}>
              Cancelar
            </Button>
          )}
          {status.next && (
            <Button onClick={() => { onMoveOrder(order.id, status.next); onClose(); }} icon={<ChevronRight size={16} />}>
              {status.nextLabel}
            </Button>
          )}
        </>
      }
    >
      {/* Status & Type */}
      <div className="order-modal-section">
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <Badge variant={status.variant} dot size="md">{status.label}</Badge>
          <Badge variant={type.variant} size="md">{type.icon} {type.label}</Badge>
        </div>
      </div>

      {/* Customer Info */}
      <div className="order-modal-section">
        <div className="order-modal-section-title">Cliente</div>
        <div className="order-modal-info-grid">
          <div className="order-modal-info-item">
            <div className="order-modal-info-label">Nome</div>
            <div className="order-modal-info-value">{order.customer.name}</div>
          </div>
          <div className="order-modal-info-item">
            <div className="order-modal-info-label">
              <Phone size={12} style={{ display: 'inline', marginRight: 4 }} />Telefone
            </div>
            <div className="order-modal-info-value">{order.customer.phone}</div>
          </div>
          {order.customer.address && (
            <div className="order-modal-info-item" style={{ gridColumn: '1 / -1' }}>
              <div className="order-modal-info-label">
                <MapPin size={12} style={{ display: 'inline', marginRight: 4 }} />Endereço
              </div>
              <div className="order-modal-info-value">{order.customer.address}</div>
            </div>
          )}
        </div>
      </div>

      {/* Items */}
      <div className="order-modal-section">
        <div className="order-modal-section-title">Itens do Pedido</div>
        {order.items.map((item, index) => (
          <div key={index} className="order-modal-item-row">
            <div style={{ flex: 1 }}>
              <div className="order-modal-item-name">
                {item.qty}x {item.name}
              </div>
              <div className="order-modal-item-detail">
                {[item.variation, ...item.complements].filter(Boolean).join(' • ')}
              </div>
              {item.obs && (
                <div className="order-modal-item-detail" style={{ color: 'var(--warning-dark)', fontStyle: 'italic' }}>
                  "{item.obs}"
                </div>
              )}
            </div>
            <div className="order-modal-item-price">
              R$ {(item.price * item.qty).toFixed(2).replace('.', ',')}
            </div>
          </div>
        ))}
        <div className="order-modal-total">
          <span className="order-modal-total-label">Total</span>
          <span className="order-modal-total-value">
            R$ {order.total.toFixed(2).replace('.', ',')}
          </span>
        </div>
      </div>

      {/* Payment */}
      <div className="order-modal-section">
        <div className="order-modal-section-title">Pagamento</div>
        <div className="order-modal-info-item">
          <div className="order-modal-info-label">
            <CreditCard size={12} style={{ display: 'inline', marginRight: 4 }} />Forma de Pagamento
          </div>
          <div className="order-modal-info-value" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>{order.payment}</span>
            {order.payment === 'DINHEIRO' && order.cashPaid && (
              <div className="order-modal-change-badge">
                <div className="change-label">Recebido: R$ {order.cashPaid.toFixed(2).replace('.', ',')}</div>
                <div className="change-value">Troco: R$ {(order.cashPaid - order.total).toFixed(2).replace('.', ',')}</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mock Chat Overlay */}
      {isChatOpen && (
        <div className="order-chat-container">
          <div className="order-chat-header">
            <div className="chat-customer-info">
              <div className="chat-avatar">{order.customer.name.charAt(0)}</div>
              <div>
                <div className="chat-name">{order.customer.name}</div>
                <div className="chat-status">Online</div>
              </div>
            </div>
          </div>
          
          <div className="order-chat-messages">
            {order.chat?.map((msg) => (
              <div key={msg.id} className={`chat-message-bubble ${msg.sender}`}>
                <div className="chat-message-text">{msg.text}</div>
                <div className="chat-message-time">{msg.time}</div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          <form className="order-chat-input" onSubmit={handleSendMessage}>
            <input 
              type="text" 
              placeholder="Digite uma mensagem..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
            <button type="submit" disabled={!message.trim()}>
              <Send size={18} />
            </button>
          </form>
        </div>
      )}

      {/* Observations */}
      {order.obs && (
        <div className="order-modal-section">
          <div className="order-modal-section-title">
            <MessageSquare size={12} style={{ display: 'inline', marginRight: 4 }} />Observações
          </div>
          <div className="order-modal-obs">{order.obs}</div>
        </div>
      )}

      {/* Confirmation Code */}
      <div className="order-modal-section">
        <div className="order-modal-code">
          <div className="order-modal-code-label">Código de Confirmação</div>
          <div className="order-modal-code-value">{order.confirmCode}</div>
        </div>
      </div>
    </Modal>
  );
}

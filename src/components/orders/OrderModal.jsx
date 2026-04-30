import { MapPin, Phone, CreditCard, MessageSquare, ChevronRight, XCircle, Truck, Hash } from 'lucide-react';
import { useState } from 'react';
import { useOrdersContext } from '../../context/OrdersContext';
import Modal from '../shared/Modal';
import Badge from '../shared/Badge';
import Button from '../shared/Button';
import ConversationPanel from '../shared/ConversationPanel';
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
  const { drivers, assignDriverToOrder, tables } = useOrdersContext();
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [showDriverSelect, setShowDriverSelect] = useState(false);

  if (!order) return null;

  const type = typeConfig[order.type];
  const status = statusConfig[order.status];
  const assignedDriver = order.driverId ? drivers.find(d => d.id === order.driverId) : null;
  const assignedTable = order.tableId ? tables.find(t => t.id === order.tableId) : null;

  const handleAssignDriver = (driverId) => {
    assignDriverToOrder(order.id, driverId);
    setShowDriverSelect(false);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Pedido ${order.confirmCode || order.codigo || order.id}`}
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
          {assignedTable && (
            <Badge variant="info" size="md"><Hash size={12} style={{ marginRight: 4 }} /> Mesa {assignedTable.number}</Badge>
          )}
        </div>
      </div>

      {/* Driver Assignment (for Delivery) */}
      {order.type === 'delivery' && (
        <div className="order-modal-section">
          <div className="order-modal-section-title">Logística / Entregador</div>
          {assignedDriver ? (
            <div className="assigned-driver-view">
              <div className="driver-avatar-small">{assignedDriver.photo}</div>
              <div className="driver-info-mini">
                <div className="driver-name-mini">{assignedDriver.name}</div>
                <div className="driver-sub-mini">{assignedDriver.vehicle} • Em rota</div>
              </div>
              <Button size="xs" variant="secondary" onClick={() => setShowDriverSelect(true)}>Trocar</Button>
            </div>
          ) : (
            <div className="assign-driver-placeholder">
              {showDriverSelect ? (
                <div className="driver-selection-list">
                  {drivers.filter(d => d.status === 'available').length > 0 ? (
                    drivers.filter(d => d.status === 'available').map(d => (
                      <button key={d.id} className="driver-select-option" onClick={() => handleAssignDriver(d.id)}>
                        {d.photo} {d.name}
                      </button>
                    ))
                  ) : (
                    <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-tertiary)' }}>Nenhum entregador disponível</div>
                  )}
                  <button className="driver-select-cancel" onClick={() => setShowDriverSelect(false)}>Cancelar</button>
                </div>
              ) : (
                <Button size="sm" variant="secondary" fullWidth onClick={() => setShowDriverSelect(true)} icon={<Truck size={14} />}>
                  Atribuir Entregador
                </Button>
              )}
            </div>
          )}
        </div>
      )}

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
        {order.items.map((item, index) => {
          const itemName  = item.nome  || item.name     || '—';
          const itemQty   = item.qty   || item.quantity || item.qtd || 1;
          const itemPrice = item.price || item.preco    || item.valor || 0;
          return (
            <div key={index} className="order-modal-item-row">
              <div style={{ flex: 1 }}>
                <div className="order-modal-item-name">
                  {itemQty}x {itemName}
                </div>
                <div className="order-modal-item-detail">
                  {[item.variation, ...(item.complements || [])].filter(Boolean).join(' • ')}
                </div>
                {item.obs && (
                  <div className="order-modal-item-detail" style={{ color: 'var(--warning-dark)', fontStyle: 'italic' }}>
                    "{item.obs}"
                  </div>
                )}
              </div>
              <div className="order-modal-item-price">
                R$ {(itemPrice * itemQty).toFixed(2).replace('.', ',')}
              </div>
            </div>
          );
        })}
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

      {/* Chatwoot Conversation */}
      {isChatOpen && (
        <div className="order-modal-section">
          <div className="order-modal-section-title">
            <MessageSquare size={12} style={{ display: 'inline', marginRight: 4 }} />Conversa com Cliente
          </div>
          <div style={{ height: 340 }}>
            <ConversationPanel
              conversationId={order.chatwootConversationId ?? undefined}
              phone={!order.chatwootConversationId ? order.customer.phone : undefined}
            />
          </div>
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

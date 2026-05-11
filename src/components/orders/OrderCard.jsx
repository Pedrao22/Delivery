import { useState } from 'react';
import { Clock, MessageSquare, Check, ChevronDown } from 'lucide-react';
import { useTimer } from '../../hooks/useTimer';
import './OrderCard.css';

const typeConfig = {
  delivery: { icon: '🛵', label: 'Delivery', cls: 'delivery' },
  pickup: { icon: '🏪', label: 'Retirada', cls: 'pickup' },
  local: { icon: '🍽️', label: 'Local', cls: 'local' },
};

const paymentIcons = {
  'Pix Online': '💠',
  'Cartão de Crédito': '💳',
  'Cartão de Débito': '💳',
  'Dinheiro': '💵',
  'Pix Balcão': '💠',
};

export default function OrderCard({ order, onClick, onFinalize, drivers, onAssignDriver, style }) {
  const { color, label, isUrgent } = useTimer(order.criado_em || order.createdAt);
  const [showPicker, setShowPicker] = useState(false);
  const type = typeConfig[order.type || order.tipo] || typeConfig.delivery;
  const isDelivery = (order.type || order.tipo) === 'delivery';
  const availableDrivers = (drivers || []).filter(d => d.ativo !== false);
  
  const nomeExibicao = order.cliente_nome || order.customer?.name || 'Cliente';
  const initials = nomeExibicao.split(' ').map(n => n[0]).join('').slice(0, 2);
  
  const items = (order.items || []).filter(i => i && typeof i === 'object' && !Array.isArray(i));
  const maxItems = 3;
  const visibleItems = items.slice(0, maxItems);
  const remaining = items.length - maxItems;

  return (
    <div className={`order-card ${isUrgent ? 'urgent' : ''}`} onClick={() => onClick(order)} style={style}>
      <div className="order-card-urgency" style={{ background: color }} />
      
      <div className="order-card-inner">
        {/* Header: Code + Timer */}
        <div className="order-card-header">
          <div className="order-card-header-left">
            <span className="order-card-id">{order.codigo || order.id}</span>
            <span className={`order-card-type-badge ${type.cls}`}>
              {type.icon} {type.label} {(order.mesa_id || order.tableId) && ` • Mesa ${order.mesa_id || order.tableId}`}
            </span>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {order.status === 'ready' && (
              <button 
                className="order-card-finalize-single"
                onClick={(e) => { e.stopPropagation(); onFinalize(order.id); }}
                title="Finalizar este pedido"
              >
                <Check size={14} />
              </button>
            )}
            <div className={`order-card-timer ${isUrgent ? 'flashing' : ''}`} style={{ background: `${color}18`, color }}>
              <Clock size={12} />
              {label}
            </div>
          </div>
        </div>

        {/* Customer Info */}
        <div className="order-card-customer-row">
          <div className="order-card-avatar">{initials}</div>
          <div className="order-card-customer-info">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div className="order-card-customer">{nomeExibicao}</div>
              {(order.tax_id || order.taxId) && <span className="order-card-tax-badge">CPF</span>}
            </div>
            <div className="order-card-customer-phone">{order.cliente_telefone || order.customer?.phone || ''}</div>
          </div>
        </div>

        {/* Items list */}
        <div className="order-card-items-list">
          {visibleItems.map((item, i) => {
            const qty = item.qty || item.quantity || 1;
            const unitPrice = item.unitPrice ?? item.price ?? 0;
            return (
              <div key={i} className="order-card-item-row">
                <span className="order-card-item-name">{qty}x {item.nome || item.name || '—'}</span>
                <span className="order-card-item-price">R$ {(unitPrice * qty).toFixed(2).replace('.', ',')}</span>
              </div>
            );
          })}
          {remaining > 0 && (
            <div className="order-card-item-more">+ {remaining} {remaining === 1 ? 'item' : 'itens'}</div>
          )}
        </div>

        {/* Obs */}
        {order.obs && (
          <div className="order-card-obs-indicator">
            <MessageSquare size={10} />
            {order.obs.length > 40 ? order.obs.slice(0, 40) + '...' : order.obs}
          </div>
        )}
      </div>

      {/* Footer with divider */}
      <div className="order-card-divider" />
      <div className="order-card-footer">
        <div className="order-card-total">
          <small>R$ </small>{parseFloat(order.total).toFixed(2).replace('.', ',')}
        </div>
        <div className="order-card-meta">
          {(order.coupon_used || order.couponUsed) && (
            <span className="order-card-coupon-badge">🎟️ {order.coupon_used || order.couponUsed}</span>
          )}
          <span className="order-card-payment">
            {paymentIcons[order.pagamento || order.payment] || '💳'} {order.pagamento || order.payment}
          </span>
        </div>
      </div>

      {/* Driver strip — delivery orders in production/ready */}
      {isDelivery && (order.status === 'production' || order.status === 'ready') && (
        <div className="order-card-driver-strip" onClick={e => e.stopPropagation()}>
          {order.entregadorNome ? (
            <div className="order-card-driver-assigned">
              <span>🛵</span>
              <span className="order-card-driver-name">{order.entregadorNome}</span>
            </div>
          ) : (
            <div className="order-card-driver-picker-wrap">
              <button
                className="order-card-assign-btn"
                onClick={() => setShowPicker(v => !v)}
              >
                🛵 Atribuir entregador
                {availableDrivers.length > 0 && <ChevronDown size={12} />}
              </button>
              {showPicker && (
                <div className="order-card-driver-picker">
                  {availableDrivers.length === 0 ? (
                    <div className="order-card-driver-empty">Nenhum entregador disponível</div>
                  ) : availableDrivers.map(d => (
                    <button
                      key={d.id}
                      className="order-card-driver-option"
                      onClick={() => { onAssignDriver?.(order, d); setShowPicker(false); }}
                    >
                      <span>{d.foto_emoji || d.foto || '🛵'}</span>
                      <span>{d.nome || d.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

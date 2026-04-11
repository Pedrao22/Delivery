import { Clock, MessageSquare, CreditCard } from 'lucide-react';
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

export default function OrderCard({ order, onClick, style }) {
  const { color, label } = useTimer(order.createdAt);
  const type = typeConfig[order.type] || typeConfig.delivery;
  const initials = order.customer.name.split(' ').map(n => n[0]).join('').slice(0, 2);
  const maxItems = 3;
  const visibleItems = order.items.slice(0, maxItems);
  const remaining = order.items.length - maxItems;

  return (
    <div className="order-card" onClick={() => onClick(order)} style={style}>
      <div className="order-card-urgency" style={{ background: color }} />
      
      <div className="order-card-inner">
        {/* Header: ID + Timer */}
        <div className="order-card-header">
          <div className="order-card-header-left">
            <span className="order-card-id">{order.id}</span>
            <span className={`order-card-type-badge ${type.cls}`}>
              {type.icon} {type.label}
            </span>
          </div>
          <div className="order-card-timer" style={{ background: `${color}18`, color }}>
            <Clock size={12} />
            {label}
          </div>
        </div>

        {/* Customer */}
        <div className="order-card-customer-row">
          <div className="order-card-avatar">{initials}</div>
          <div className="order-card-customer-info">
            <div className="order-card-customer">{order.customer.name}</div>
            <div className="order-card-customer-phone">{order.customer.phone}</div>
          </div>
        </div>

        {/* Items list */}
        <div className="order-card-items-list">
          {visibleItems.map((item, i) => (
            <div key={i} className="order-card-item-row">
              <span className="order-card-item-name">{item.qty}x {item.name}</span>
              <span className="order-card-item-price">R$ {(item.price * item.qty).toFixed(2).replace('.', ',')}</span>
            </div>
          ))}
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
          <small>R$ </small>{order.total.toFixed(2).replace('.', ',')}
        </div>
        <div className="order-card-meta">
          <span className="order-card-payment">
            {paymentIcons[order.payment] || '💳'} {order.payment}
          </span>
        </div>
      </div>
    </div>
  );
}

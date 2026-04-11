import { useState } from 'react';
import { X, Trash2, ShoppingBag } from 'lucide-react';
import Button from '../shared/Button';
import EmptyState from '../shared/EmptyState';
import './Cart.css';

export default function Cart({ items, total, count, onUpdateQty, onRemove, onClear, onConfirm, isOpen, onClose }) {
  const [orderType, setOrderType] = useState('delivery');
  const [payment, setPayment] = useState('pix');
  const [cashGiven, setCashGiven] = useState('');

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (items.length === 0) return;
    onConfirm({
      items: items.map(i => ({
        name: i.name,
        variation: i.variation,
        complements: i.complements,
        qty: i.qty,
        price: i.unitPrice,
        obs: i.obs || '',
      })),
      total,
      type: orderType,
      payment: payment === 'pix' ? 'Pix Online' : payment === 'card' ? 'Cartão de Crédito' : payment === 'cash' ? 'Dinheiro' : 'Pix Balcão',
      cashPaid: payment === 'cash' ? parseFloat(cashGiven) || 0 : undefined,
      customer: {
        name: 'Cliente Balcão',
        phone: '(00) 00000-0000',
        address: orderType === 'delivery' ? 'Endereço do cliente' : '',
      },
      obs: payment === 'cash' && cashGiven ? `Troco para R$ ${cashGiven}` : '',
    });
    setCashGiven('');
    onClear();
    onClose();
  };

  return (
    <>
      <div className="cart-overlay" onClick={onClose} />
      <div className="cart-panel">
        <div className="cart-header">
          <h3>
            Carrinho
            {count > 0 && <span className="cart-count">{count}</span>}
          </h3>
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="cart-body">
          {items.length === 0 ? (
            <EmptyState icon="🛒" title="Carrinho vazio" description="Adicione itens do cardápio" />
          ) : (
            items.map(item => (
              <div key={item.id} className="cart-item">
                <div className="cart-item-info">
                  <div className="cart-item-name">{item.name}</div>
                  <div className="cart-item-detail">
                    {[item.variation, ...item.complements].filter(Boolean).join(' • ')}
                  </div>
                  <div className="cart-item-price">
                    R$ {item.price.toFixed(2).replace('.', ',')}
                  </div>
                </div>
                <div className="cart-item-actions">
                  <button className="cart-item-qty-btn" onClick={() => onUpdateQty(item.id, item.qty - 1)}>−</button>
                  <span className="cart-item-qty">{item.qty}</span>
                  <button className="cart-item-qty-btn" onClick={() => onUpdateQty(item.id, item.qty + 1)}>+</button>
                </div>
              </div>
            ))
          )}
        </div>

        {items.length > 0 && (
          <div className="cart-footer">
            <div className="cart-order-type">
              <button className={`cart-order-type-btn ${orderType === 'delivery' ? 'active' : ''}`} onClick={() => setOrderType('delivery')}>
                🛵 <span>Delivery</span>
              </button>
              <button className={`cart-order-type-btn ${orderType === 'pickup' ? 'active' : ''}`} onClick={() => setOrderType('pickup')}>
                🏪 <span>Retirada</span>
              </button>
              <button className={`cart-order-type-btn ${orderType === 'local' ? 'active' : ''}`} onClick={() => setOrderType('local')}>
                🍽️ <span>Local</span>
              </button>
            </div>

            <select className="cart-payment-select" value={payment} onChange={(e) => setPayment(e.target.value)}>
              <option value="pix">💠 Pix Online</option>
              <option value="card">💳 Cartão</option>
              <option value="cash">💵 Dinheiro</option>
              <option value="pix_counter">💠 Pix Balcão</option>
            </select>

            {payment === 'cash' && (
              <div className="cart-cash-input-row" style={{ marginTop: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>
                <label style={{ fontSize: 'var(--font-xs)', color: 'var(--text-tertiary)', display: 'block', marginBottom: 4 }}>Troco para quanto?</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 'var(--font-sm)', color: 'var(--text-tertiary)' }}>R$</span>
                  <input
                    type="number"
                    className="cart-cash-input"
                    placeholder="Ex: 50,00"
                    value={cashGiven}
                    onChange={(e) => setCashGiven(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 10px 10px 35px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border)',
                      fontSize: 'var(--font-sm)',
                      background: 'var(--bg-secondary)',
                      color: 'var(--text-primary)',
                      outline: 'none',
                    }}
                  />
                </div>
              </div>
            )}

            <div className="cart-total-row">
              <span className="cart-total-label">Total</span>
              <span className="cart-total-value">R$ {total.toFixed(2).replace('.', ',')}</span>
            </div>

            <Button fullWidth onClick={handleConfirm} icon={<ShoppingBag size={16} />}>
              Confirmar Pedido
            </Button>
          </div>
        )}
      </div>
    </>
  );
}

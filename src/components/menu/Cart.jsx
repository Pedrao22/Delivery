import { useState, useEffect } from 'react';
import { X, Trash2, ShoppingBag } from 'lucide-react';
import Button from '../shared/Button';
import EmptyState from '../shared/EmptyState';
import './Cart.css';

export default function Cart({ items, total, count, onUpdateQty, onRemove, onClear, onConfirm, isOpen, onClose, initialCustomer }) {
  const [orderType, setOrderType] = useState('delivery');
  const [payment, setPayment] = useState('pix');
  const [cashGiven, setCashGiven] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [address, setAddress] = useState('');

  useEffect(() => {
    if (isOpen && initialCustomer) {
      setCustomerName(initialCustomer.name || '');
      setCustomerPhone(initialCustomer.phone || '');
    }
  }, [isOpen, initialCustomer]);

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
        name: customerName.trim() || 'Cliente Balcão',
        phone: customerPhone.trim(),
        address: orderType === 'delivery' ? address.trim() : '',
      },
      obs: payment === 'cash' && cashGiven ? `Troco para R$ ${cashGiven}` : '',
    });
    setCashGiven('');
    setCustomerName('');
    setCustomerPhone('');
    setAddress('');
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

        {/* Single scrollable area: items + form */}
        <div className="cart-scroll">
          {items.length === 0 ? (
            <EmptyState icon="🛒" title="Carrinho vazio" description="Adicione itens do cardápio" />
          ) : (
            <>
              <div className="cart-body">
                {items.map(item => (
                  <div key={item.id} className="cart-item">
                    <div className="cart-item-info">
                      <div className="cart-item-name">{item.name}</div>
                      <div className="cart-item-detail">
                        {[item.variation, ...(item.complements || [])].filter(Boolean).join(' • ')}
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
                ))}
              </div>

              <div className="cart-form">
                <div className="cart-customer-fields">
                  <input
                    className="cart-customer-input"
                    type="text"
                    placeholder="Nome do cliente"
                    value={customerName}
                    onChange={e => setCustomerName(e.target.value)}
                  />
                  <input
                    className="cart-customer-input"
                    type="tel"
                    placeholder="Telefone"
                    value={customerPhone}
                    onChange={e => setCustomerPhone(e.target.value)}
                  />
                </div>

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

                {orderType === 'delivery' && (
                  <input
                    className="cart-customer-input"
                    type="text"
                    placeholder="Endereço de entrega"
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                  />
                )}

                <select className="cart-payment-select" value={payment} onChange={(e) => setPayment(e.target.value)}>
                  <option value="pix">💠 Pix Online</option>
                  <option value="card">💳 Cartão</option>
                  <option value="cash">💵 Dinheiro</option>
                  <option value="pix_counter">💠 Pix Balcão</option>
                </select>

                {payment === 'cash' && (
                  <div className="cart-cash-row">
                    <label>Troco para quanto?</label>
                    <div className="cart-cash-prefix-wrap">
                      <span className="cart-cash-prefix">R$</span>
                      <input
                        type="number"
                        className="cart-cash-input"
                        placeholder="Ex: 50,00"
                        value={cashGiven}
                        onChange={(e) => setCashGiven(e.target.value)}
                      />
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Sticky bottom: total + confirm */}
        {items.length > 0 && (
          <div className="cart-actions">
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

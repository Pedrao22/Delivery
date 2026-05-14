import { useState, useEffect, useRef } from 'react';
import { X, Trash2, ShoppingBag, MapPin, Loader2, AlertTriangle, CheckCircle } from 'lucide-react';
import { apiFetch } from '../../lib/supabase';
import Button from '../shared/Button';
import EmptyState from '../shared/EmptyState';
import './Cart.css';

function useDeliveryFee(address, orderType) {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    if (orderType !== 'delivery' || !address || address.trim().length < 10) {
      setResult(null);
      return;
    }

    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const d = await apiFetch('/delivery-zones/calculate', {
          method: 'POST',
          body: JSON.stringify({ address: address.trim() }),
        });
        setResult(d?.data ?? null);
      } catch {
        setResult(null);
      } finally {
        setLoading(false);
      }
    }, 700);

    return () => clearTimeout(timerRef.current);
  }, [address, orderType]);

  return { result, loading };
}

export default function Cart({ items, total, count, onUpdateQty, onRemove, onClear, onConfirm, isOpen, onClose, initialCustomer }) {
  const [orderType, setOrderType] = useState('delivery');
  const [payment, setPayment] = useState('pix');
  const [cashGiven, setCashGiven] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [address, setAddress] = useState('');

  const { result: feeResult, loading: feeLoading } = useDeliveryFee(address, orderType);

  const deliveryFee = feeResult && !feeResult.error && !feeResult.out_of_range
    ? Number(feeResult.fee)
    : 0;

  const grandTotal = total + deliveryFee;

  useEffect(() => {
    if (isOpen && initialCustomer) {
      setCustomerName(initialCustomer.name || '');
      setCustomerPhone(initialCustomer.phone || '');
    }
  }, [isOpen, initialCustomer]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (items.length === 0) return;
    const validItems = items.filter(i => i && typeof i === 'object' && !Array.isArray(i));
    onConfirm({
      items: validItems.map(i => ({
        nome: i.name,
        name: i.name,
        variation: i.variation || '',
        complements: Array.isArray(i.complements) ? i.complements : [],
        qty: i.qty || 1,
        unitPrice: i.unitPrice,
        price: i.unitPrice,
        obs: i.obs || '',
      })),
      total: grandTotal,
      subtotal: total,
      delivery_fee: orderType === 'delivery' ? deliveryFee : 0,
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
                  <>
                    <input
                      className="cart-customer-input"
                      type="text"
                      placeholder="Endereço de entrega (Rua, número, bairro, cidade)"
                      value={address}
                      onChange={e => setAddress(e.target.value)}
                    />

                    {/* Fee status */}
                    {address.trim().length >= 10 && (
                      <div className={`cart-fee-badge ${
                        feeLoading ? 'loading' :
                        feeResult?.error ? 'error' :
                        feeResult?.out_of_range ? 'warn' :
                        feeResult ? 'ok' : ''
                      }`}>
                        {feeLoading && <><Loader2 size={13} className="animate-spin" /> Calculando distância...</>}
                        {!feeLoading && feeResult?.error && <><AlertTriangle size={13} /> {feeResult.error}</>}
                        {!feeLoading && feeResult?.out_of_range && (
                          <><AlertTriangle size={13} /> Fora da área de entrega ({feeResult.distance_km} km)</>
                        )}
                        {!feeLoading && feeResult && !feeResult.error && !feeResult.out_of_range && (
                          <>
                            <CheckCircle size={13} />
                            <span><MapPin size={11} /> {feeResult.distance_km} km</span>
                            <span className="cart-fee-sep">·</span>
                            <span>Taxa: <strong>R$ {Number(feeResult.fee).toFixed(2).replace('.', ',')}</strong></span>
                            {feeResult.zone?.label && <span className="cart-fee-zone">{feeResult.zone.label}</span>}
                          </>
                        )}
                      </div>
                    )}
                  </>
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

        {/* Sticky bottom: totals + confirm */}
        {items.length > 0 && (
          <div className="cart-actions">
            <div className="cart-total-rows">
              <div className="cart-total-row sub">
                <span className="cart-total-label">Subtotal</span>
                <span className="cart-total-value-sub">R$ {total.toFixed(2).replace('.', ',')}</span>
              </div>
              {orderType === 'delivery' && deliveryFee > 0 && (
                <div className="cart-total-row sub">
                  <span className="cart-total-label">Taxa de entrega</span>
                  <span className="cart-total-value-sub">R$ {deliveryFee.toFixed(2).replace('.', ',')}</span>
                </div>
              )}
              <div className="cart-total-row">
                <span className="cart-total-label">Total</span>
                <span className="cart-total-value">R$ {grandTotal.toFixed(2).replace('.', ',')}</span>
              </div>
            </div>
            <Button
              fullWidth
              onClick={handleConfirm}
              icon={<ShoppingBag size={16} />}
              disabled={orderType === 'delivery' && feeResult?.out_of_range}
            >
              {orderType === 'delivery' && feeResult?.out_of_range
                ? 'Fora da área de entrega'
                : 'Confirmar Pedido'}
            </Button>
          </div>
        )}
      </div>
    </>
  );
}

import React, { useState, useEffect } from 'react';
import { Phone, ShoppingCart, ArrowLeft, Check, MapPin, CreditCard, QrCode, Wallet, Info } from 'lucide-react';
import Modal from '../shared/Modal';
import { menuCategories, menuItems } from '../../data/menuItems';
import { customers, loyaltyTiers } from '../../data/customers';
import ProductCard from '../menu/ProductCard';
import ProductModal from '../menu/ProductModal';
import Button from '../shared/Button';
import { useOrders } from '../../hooks/useOrders';
import Badge from '../shared/Badge';
import './CustomerView.css';

export default function CustomerView() {
  const { orders, addOrder } = useOrders();
  const [step, setStep] = useState(() => localStorage.getItem('foodflow_customer_step') || 'login'); 
  const [phone, setPhone] = useState('');
  const [customer, setCustomer] = useState(null);
  const [cart, setCart] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeOrderId, setActiveOrderId] = useState(() => localStorage.getItem('foodflow_active_order_id'));
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [checkoutForm, setCheckoutForm] = useState({
    customerName: '',
    customerPhone: '',
    type: 'delivery',
    address: '',
    reference: '',
    paymentMethod: 'pix_online',
    needsChange: false,
    cashAmount: ''
  });

  // Pre-fill form when customer logs in
  useEffect(() => {
    if (customer) {
      setCheckoutForm(prev => ({
        ...prev,
        customerName: customer.name,
        customerPhone: customer.phone
      }));
    }
  }, [customer]);

  // Sync state to localStorage
  useEffect(() => {
    localStorage.setItem('foodflow_customer_step', step);
    if (activeOrderId) localStorage.setItem('foodflow_active_order_id', activeOrderId);
    else localStorage.removeItem('foodflow_active_order_id');
  }, [step, activeOrderId]);

  const trackingOrder = activeOrderId ? orders.find(o => o.id === activeOrderId) : null;

  const handleLogin = () => {
    const found = customers.find(c => c.phone === phone);
    if (found) {
      setCustomer(found);
    } else {
      setCustomer({ name: 'Novo Cliente', phone, orders: 0, points: 0, since: new Date().toISOString().slice(0, 7) });
    }
    setStep('menu');
  };

  const addToCart = (product, variation, complements, qty, obs) => {
    const complementsTotal = complements.reduce((sum, c) => sum + c.price, 0);
    const variationPrice = variation ? variation.price : 0;
    const unitPrice = product.price + variationPrice + complementsTotal;
    setCart(prev => [...prev, {
      id: Date.now(),
      name: product.name,
      variation: variation?.name || '',
      complements: complements.map(c => c.name),
      qty,
      unitPrice,
      price: unitPrice * qty,
    }]);
  };

  const cartTotal = cart.reduce((sum, i) => sum + i.price, 0);
  const cartCount = cart.reduce((sum, i) => sum + i.qty, 0);

  const handleOrder = () => {
    setIsCheckoutOpen(true);
  };

  const handleFinalConfirm = () => {
    const orderId = addOrder({
      customer: {
        name: checkoutForm.customerName || customer?.name || 'Cliente',
        phone: checkoutForm.customerPhone || customer?.phone || phone,
        address: checkoutForm.type === 'delivery' ? checkoutForm.address : (checkoutForm.type === 'pickup' ? 'Retirada no Local' : 'Consumo no Local'),
        reference: checkoutForm.reference,
      },
      items: cart,
      total: cartTotal,
      type: checkoutForm.type,
      payment: checkoutForm.paymentMethod.replace('_', ' ').toUpperCase(),
      cashPaid: checkoutForm.paymentMethod === 'dinheiro' && checkoutForm.needsChange ? parseFloat(checkoutForm.cashAmount) : null,
    });
    
    setActiveOrderId(orderId);
    setCart([]);
    setIsCheckoutOpen(false);
    setStep('tracking');
  };

  const getTier = (points) => loyaltyTiers.find(t => points >= t.minPoints && points <= t.maxPoints) || loyaltyTiers[0];
  const tier = customer ? getTier(customer.points) : null;

  const filtered = activeCategory === 'all' ? menuItems : menuItems.filter(i => i.category === activeCategory);

  // Login step
  if (step === 'login') {
    return (
      <div className="customer-view">
        <div className="customer-header">
          <h1>🍽️ FoodFlow</h1>
          <p>Faça seu pedido de forma rápida e prática</p>
        </div>
        <div className="customer-login">
          <h2>Bem-vindo!</h2>
          <p>Digite seu telefone para começar</p>
          <input
            className="customer-phone-input"
            placeholder="(00) 00000-0000"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
          />
          <Button fullWidth onClick={handleLogin} icon={<Phone size={16} />}>
            Entrar
          </Button>
          <p style={{ marginTop: 'var(--space-3)', fontSize: 'var(--font-xs)', color: 'var(--text-tertiary)' }}>
            Teste: (11) 98765-4321
          </p>
        </div>
      </div>
    );
  }

  // Tracking step
  if (step === 'tracking' && trackingOrder) {
    const steps = [
      { label: 'Pedido Recebido', desc: 'Seu pedido foi enviado ao restaurante', status: 'completed' },
      { label: 'Em Análise', desc: 'O restaurante está verificando seu pedido', status: trackingOrder.status === 'analyzing' ? 'active' : 'completed' },
      { label: 'Em Produção', desc: 'Seu pedido está sendo preparado', status: trackingOrder.status === 'production' ? 'active' : (trackingOrder.status === 'ready' ? 'completed' : 'pending') },
      { label: 'Pronto!', desc: 'Seu pedido está pronto para entrega', status: trackingOrder.status === 'ready' ? 'active' : 'pending' },
    ];

    return (
      <div className="customer-view">
        <div className="customer-header">
          <h1>Acompanhe seu Pedido</h1>
          <p>{trackingOrder.id}</p>
        </div>
        <div className="customer-content">
          <div className="customer-tracking">
            <div style={{ textAlign: 'center', marginBottom: 'var(--space-5)' }}>
              <div style={{ fontSize: '3rem', marginBottom: 'var(--space-2)' }}>👨‍🍳</div>
              <h3 style={{ fontSize: 'var(--font-lg)', fontWeight: 'var(--fw-semibold)' }}>
                Preparando seu pedido...
              </h3>
              <p style={{ fontSize: 'var(--font-sm)', color: 'var(--text-tertiary)' }}>
                Tempo estimado: 20-30 min
              </p>
            </div>

            <div className="tracking-steps">
              {steps.map((s, i) => (
                <div key={i} className="tracking-step">
                  <div className={`tracking-step-dot ${s.status}`}>
                    {s.status === 'completed' ? <Check size={16} /> : i + 1}
                  </div>
                  {i < steps.length - 1 && (
                    <div className={`tracking-step-line ${s.status === 'completed' ? 'completed' : 'pending'}`} />
                  )}
                  <div className="tracking-step-info">
                    <h4>{s.label}</h4>
                    <p>{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ marginTop: 'var(--space-4)', textAlign: 'center' }}>
            <Button variant="secondary" onClick={() => { setStep('menu'); setActiveOrderId(null); }} icon={<ArrowLeft size={16} />}>
              Fazer Novo Pedido
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Menu step
  return (
    <div className="customer-view" style={{ paddingBottom: cartCount > 0 ? '80px' : '0' }}>
      <div className="customer-header">
        <h1>🍽️ FoodFlow</h1>
        <p>Olá, {customer?.name}!</p>
      </div>

      <div className="customer-content">
        {/* Welcome */}
        <div className="customer-welcome">
          <h3>Olá, {customer?.name?.split(' ')[0]}! 👋</h3>
          <p style={{ fontSize: 'var(--font-sm)', color: 'var(--text-secondary)' }}>
            {customer?.orders > 0 ? `${customer.orders} pedidos realizados` : 'Primeiro pedido? Aproveite!'}
          </p>
        </div>

        {/* Loyalty */}
        {customer && customer.points > 0 && tier && (
          <div className="customer-loyalty">
            <div className="customer-loyalty-header">
              <div>
                <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-secondary)', marginBottom: 2 }}>Seus Pontos</div>
                <div className="customer-loyalty-points">{customer.points} pts</div>
              </div>
              <span className="customer-loyalty-tier" style={{ background: tier.color, color: 'white' }}>
                {tier.name}
              </span>
            </div>
            <div className="customer-benefits">
              {tier.benefits.map((b, i) => (
                <div key={i} className="customer-benefit">{b}</div>
              ))}
            </div>
          </div>
        )}

        {/* Categories */}
        <div className="menu-categories-scroll" style={{ marginBottom: 'var(--space-4)' }}>
          <button className={`menu-category-chip ${activeCategory === 'all' ? 'active' : ''}`} onClick={() => setActiveCategory('all')}>
            🍽️ Todos
          </button>
          {menuCategories.map(cat => (
            <button key={cat.id} className={`menu-category-chip ${activeCategory === cat.id ? 'active' : ''}`} onClick={() => setActiveCategory(cat.id)}>
              {cat.icon} {cat.name}
            </button>
          ))}
        </div>

        {/* Products */}
        <div className="menu-products-grid">
          {filtered.map((product, i) => (
            <ProductCard key={product.id} product={product} onClick={() => setSelectedProduct(product)} delay={i * 40} />
          ))}
        </div>
      </div>

      {/* Checkout Modal */}
      <Modal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        title="Finalizar Pedido"
        size="large"
      >
        <div className="checkout-form">
          <section className="checkout-section">
            <h4>Seus Dados</h4>
            <div className="checkout-grid">
              <div className="checkout-field">
                <label>Nome</label>
                <input 
                  type="text" 
                  value={checkoutForm.customerName}
                  onChange={(e) => setCheckoutForm({...checkoutForm, customerName: e.target.value})}
                  placeholder="Seu nome completo"
                />
              </div>
              <div className="checkout-field">
                <label>Telefone</label>
                <input 
                  type="text" 
                  value={checkoutForm.customerPhone}
                  onChange={(e) => setCheckoutForm({...checkoutForm, customerPhone: e.target.value})}
                  placeholder="(00) 00000-0000"
                />
              </div>
            </div>
          </section>

          <section className="checkout-section">
            <h4>Como deseja receber?</h4>
            <div className="checkout-type-selector">
              <button 
                className={`checkout-type-btn ${checkoutForm.type === 'delivery' ? 'active' : ''}`}
                onClick={() => setCheckoutForm({...checkoutForm, type: 'delivery'})}
              >
                <MapPin size={20} />
                <span>Entrega</span>
              </button>
              <button 
                className={`checkout-type-btn ${checkoutForm.type === 'pickup' ? 'active' : ''}`}
                onClick={() => setCheckoutForm({...checkoutForm, type: 'pickup'})}
              >
                <ShoppingCart size={20} />
                <span>Retirada</span>
              </button>
              <button 
                className={`checkout-type-btn ${checkoutForm.type === 'local' ? 'active' : ''}`}
                onClick={() => setCheckoutForm({...checkoutForm, type: 'local'})}
              >
                <Check size={20} />
                <span>Local</span>
              </button>
            </div>

            {checkoutForm.type === 'delivery' && (
              <div className="checkout-animation-fade">
                <div className="checkout-field" style={{ marginTop: 'var(--space-3)' }}>
                  <label>Endereço de Entrega</label>
                  <input 
                    type="text" 
                    value={checkoutForm.address}
                    onChange={(e) => setCheckoutForm({...checkoutForm, address: e.target.value})}
                    placeholder="Rua, número, bairro..."
                  />
                </div>
                <div className="checkout-field" style={{ marginTop: 'var(--space-2)' }}>
                  <label>Referência (Opcional)</label>
                  <input 
                    type="text" 
                    value={checkoutForm.reference}
                    onChange={(e) => setCheckoutForm({...checkoutForm, reference: e.target.value})}
                    placeholder="Ex: Próximo ao mercado..."
                  />
                </div>
              </div>
            )}
          </section>

          <section className="checkout-section">
            <h4>Forma de Pagamento</h4>
            <div className="checkout-payment-grid">
              {[
                { id: 'pix_online', label: 'Pix Online', icon: <QrCode size={18} /> },
                { id: 'pix_balcao', label: 'Pix Balcão', icon: <QrCode size={18} /> },
                { id: 'cartao', label: 'Cartão', icon: <CreditCard size={18} /> },
                { id: 'dinheiro', label: 'Dinheiro', icon: <Wallet size={18} /> },
              ].map(method => (
                <button 
                  key={method.id}
                  className={`checkout-payment-btn ${checkoutForm.paymentMethod === method.id ? 'active' : ''}`}
                  onClick={() => setCheckoutForm({...checkoutForm, paymentMethod: method.id})}
                >
                  {method.icon}
                  <span>{method.label}</span>
                </button>
              ))}
            </div>

            {checkoutForm.paymentMethod === 'dinheiro' && (
              <div className="checkout-animation-fade" style={{ marginTop: 'var(--space-4)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
                  <input 
                    type="checkbox" 
                    id="needsChange"
                    checked={checkoutForm.needsChange}
                    onChange={(e) => setCheckoutForm({...checkoutForm, needsChange: e.target.checked})}
                    style={{ width: 18, height: 18, accentColor: 'var(--accent)' }}
                  />
                  <label htmlFor="needsChange" style={{ fontSize: 'var(--font-sm)', fontWeight: 600 }}>Precisa de troco?</label>
                </div>
                
                {checkoutForm.needsChange && (
                  <div className="checkout-field">
                    <label>Troco para quanto?</label>
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }}>R$</span>
                      <input 
                        type="number" 
                        value={checkoutForm.cashAmount}
                        onChange={(e) => setCheckoutForm({...checkoutForm, cashAmount: e.target.value})}
                        placeholder="Ex: 50,00"
                        style={{ paddingLeft: '32px' }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>

          <section className="checkout-section summary">
            <div className="checkout-summary-header">
              <h4>Resumo do Pedido</h4>
              <span>{cartCount} {cartCount === 1 ? 'item' : 'itens'}</span>
            </div>
            <div className="checkout-summary-list">
              {cart.map(item => (
                <div key={item.id} className="checkout-summary-item">
                  <span>{item.qty}x {item.name} {item.variation && `(${item.variation})`}</span>
                  <span>R$ {item.price.toFixed(2).replace('.', ',')}</span>
                </div>
              ))}
              
              {checkoutForm.paymentMethod === 'dinheiro' && checkoutForm.needsChange && checkoutForm.cashAmount && (
                <div className="checkout-summary-item" style={{ borderTop: '1px solid var(--border-light)', paddingTop: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
                  <span style={{ color: 'var(--text-tertiary)' }}>Troco (R$ {checkoutForm.cashAmount} - R$ {cartTotal.toFixed(2)})</span>
                  <span style={{ color: 'var(--success-dark)', fontWeight: 600 }}>
                    R$ {(parseFloat(checkoutForm.cashAmount) - cartTotal).toFixed(2).replace('.', ',')}
                  </span>
                </div>
              )}
            </div>
            <div className="checkout-summary-total">
              <span>Total</span>
              <span>R$ {cartTotal.toFixed(2).replace('.', ',')}</span>
            </div>
          </section>

          <Button fullWidth size="large" onClick={handleFinalConfirm}>
            Confirmar Pedido
          </Button>
        </div>
      </Modal>

      {/* Product Modal */}
      {selectedProduct && (
        <ProductModal
          product={selectedProduct}
          isOpen={!!selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onAdd={(v, c, q, o) => { addToCart(selectedProduct, v, c, q, o); setSelectedProduct(null); }}
        />
      )}

      {/* Cart Bar */}
      {cartCount > 0 && (
        <div className="customer-cart-bar">
          <div>
            <div style={{ fontWeight: 600 }}>{cartCount} {cartCount === 1 ? 'item' : 'itens'}</div>
            <div style={{ fontSize: 'var(--font-lg)', fontWeight: 700, color: 'var(--accent)' }}>
              R$ {cartTotal.toFixed(2).replace('.', ',')}
            </div>
          </div>
          <Button onClick={handleOrder} icon={<ShoppingCart size={16} />}>
            Finalizar Pedido
          </Button>
        </div>
      )}
    </div>
  );
}

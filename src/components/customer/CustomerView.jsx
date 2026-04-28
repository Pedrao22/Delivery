import React, { useState, useEffect, useMemo } from 'react';
import {
  Phone, ShoppingCart, ArrowLeft, Check,
  MapPin, CreditCard, QrCode, Wallet, Info,
  Star, Clock, ChevronRight, Search,
  ChevronDown, MessageCircle, Heart
} from 'lucide-react';
import Modal from '../shared/Modal';
import { menuCategories, menuItems } from '../../data/menuItems';
import { customers, loyaltyTiers } from '../../data/customers';
import ProductCard from '../menu/ProductCard';
import ProductModal from '../menu/ProductModal';
import Button from '../shared/Button';
import { useOrdersContext } from '../../context/OrdersContext';
import { useAuth } from '../../context/AuthContext';
import { API_URL } from '../../lib/supabase';
import Badge from '../shared/Badge';
import './CustomerView.css';

export default function CustomerView({ ridOverride } = {}) {
  const { orders, addOrder, coupons, restaurantSettings, products, categories } = useOrdersContext();
  const { profile } = useAuth();

  const [publicData, setPublicData] = useState(null);
  const [loadingPublic, setLoadingPublic] = useState(true);

  // Is this a public customer-facing view (via /m/:slug or ?rid=)?
  const rid = ridOverride || new URLSearchParams(window.location.search).get('rid');
  const isPublic = !!rid;

  useEffect(() => {
    if (!rid) { setLoadingPublic(false); return; }
    fetch(`${API_URL}/public/menu/${rid}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.success) setPublicData(data.data); })
      .catch(() => {})
      .finally(() => setLoadingPublic(false));
  }, [rid]); // eslint-disable-line

  const [step, setStep] = useState(() => {
    if (ridOverride || new URLSearchParams(window.location.search).get('rid')) return 'menu';
    return localStorage.getItem('pedirecebe_customer_step') || 'login';
  });
  const [phone, setPhone] = useState('');
  const [customer, setCustomer] = useState(null);
  const [cart, setCart] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeOrderId, setActiveOrderId] = useState(() => localStorage.getItem('pedirecebe_active_order_id'));
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [orderError, setOrderError] = useState('');

  const [checkoutForm, setCheckoutForm] = useState({
    customerName: '',
    customerPhone: '',
    type: 'delivery',
    address: '',
    reference: '',
    paymentMethod: 'pix_online',
    needsChange: false,
    cashAmount: '',
    taxId: '',
    couponCode: '',
    couponDiscount: 0
  });

  // Effective Brand Data — public API takes priority over context (which needs auth)
  const publicRestaurant = publicData?.restaurante;
  const brandName    = publicRestaurant?.nome        || restaurantSettings.name         || 'Pedi&Recebe';
  const primaryColor = publicRestaurant?.cor_primaria || restaurantSettings.primaryColor || '#E53935';
  const brandLogo    = publicRestaurant?.logo_url     || restaurantSettings.logo         || '🍽️';
  const deliveryTime = publicRestaurant?.delivery_time || restaurantSettings.deliveryTime || '30-45 min';
  const isOpen       = publicRestaurant?.is_open ?? restaurantSettings.isOpen ?? true;

  // Payment options — normalize legacy keys (pix→pix_online, card→card_credit, pix_counter→pix_balcao)
  const rawPayments = publicRestaurant?.payments_config || restaurantSettings.payments || {};
  const pc = {
    pix_online:  rawPayments.pix_online  ?? rawPayments.pix   ?? false,
    pix_balcao:  rawPayments.pix_balcao  ?? rawPayments.pix_counter ?? false,
    card_credit: rawPayments.card_credit ?? rawPayments.card  ?? false,
    card_debit:  rawPayments.card_debit  ?? false,
    cash:        rawPayments.cash        ?? false,
  };
  const hasAny = Object.values(pc).some(Boolean);
  const paymentOptions = [
    { id: 'pix_online',  label: 'Pix',       icon: <QrCode size={18} /> },
    { id: 'pix_balcao',  label: 'Pix Balcão', icon: <QrCode size={18} /> },
    { id: 'card_credit', label: 'Crédito',    icon: <CreditCard size={18} /> },
    { id: 'card_debit',  label: 'Débito',     icon: <CreditCard size={18} /> },
    { id: 'cash',        label: 'Dinheiro',   icon: <Wallet size={18} /> },
  ].filter(m => !hasAny || pc[m.id]);

  // Catalog Data — public API preferred, then context, then static fallback
  const displayProducts = publicData?.produtos?.length > 0 ? publicData.produtos : (products?.length > 0 ? products : menuItems);
  const displayCategories = publicData?.categorias?.length > 0 ? publicData.categorias : (categories?.length > 0 ? categories : menuCategories);

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
    localStorage.setItem('pedirecebe_customer_step', step);
    if (activeOrderId) localStorage.setItem('pedirecebe_active_order_id', activeOrderId);
    else localStorage.removeItem('pedirecebe_active_order_id');
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
    const unitPrice = parseFloat(product.preco || 0) + variationPrice + complementsTotal;
    setCart(prev => [...prev, {
      id: Date.now(),
      name: product.nome,
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
    const minOrder = publicRestaurant?.min_order ?? restaurantSettings.minOrder ?? 0;
    if (minOrder > 0 && cartTotal < minOrder) {
      setOrderError(`Pedido mínimo: R$ ${minOrder.toFixed(2).replace('.', ',')}`);
      setTimeout(() => setOrderError(''), 3000);
      return;
    }
    setIsCheckoutOpen(true);
  };

  const handleFinalConfirm = async () => {
    if (!checkoutForm.customerPhone?.trim()) {
      setOrderError('Informe seu WhatsApp ou telefone para continuar.');
      return;
    }
    if (checkoutForm.type === 'delivery' && !checkoutForm.address?.trim()) {
      setOrderError('Informe o endereço de entrega.');
      return;
    }
    setOrderError('');
    setSubmitting(true);
    const finalTotal = cartTotal - (checkoutForm.couponDiscount || 0);

    try {
      if (isPublic) {
        const res = await fetch(`${API_URL}/public/orders`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            restaurante_id: publicRestaurant?.id,
            cliente_nome: checkoutForm.customerName,
            cliente_telefone: checkoutForm.customerPhone,
            tipo: checkoutForm.type,
            endereco: checkoutForm.type === 'delivery' ? checkoutForm.address : null,
            pagamento: checkoutForm.paymentMethod,
            itens: cart,
            total: finalTotal,
            subtotal: cartTotal,
          }),
        });
        const result = await res.json();
        if (result.success) {
          setCart([]);
          setIsCheckoutOpen(false);
          setStep('success');
        } else {
          setOrderError(result.message || 'Erro ao enviar pedido. Tente novamente.');
        }
      } else {
        const orderId = await addOrder({
          customer: {
            name: checkoutForm.customerName || customer?.name || 'Cliente',
            phone: checkoutForm.customerPhone || customer?.phone || phone,
            address: checkoutForm.type === 'delivery' ? checkoutForm.address : (checkoutForm.type === 'pickup' ? 'Retirada no Local' : 'Consumo no Local'),
            reference: checkoutForm.reference,
          },
          items: cart, total: finalTotal, subtotal: cartTotal, type: checkoutForm.type,
          payment: checkoutForm.paymentMethod.replace('_', ' ').toUpperCase(),
          couponUsed: checkoutForm.couponCode, discounts: checkoutForm.couponDiscount,
        });
        setActiveOrderId(orderId);
        setCart([]);
        setIsCheckoutOpen(false);
        setCheckoutForm(prev => ({ ...prev, couponCode: '', couponDiscount: 0, taxId: '' }));
        setStep('tracking');
      }
    } catch {
      setOrderError('Erro de conexão. Verifique sua internet e tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = useMemo(() => {
    return displayProducts.filter(i => {
      const matchesCategory = activeCategory === 'all' || i.categoria_id === activeCategory;
      const matchesSearch = (i.nome || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                            (i.descricao || '').toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch && i.ativo !== false;
    });
  }, [activeCategory, searchQuery, displayProducts]);

  // Loading screen for public menu
  if (isPublic && loadingPublic) {
    return (
      <div className="customer-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="cv-spinner" />
          <p style={{ color: '#AAA', fontSize: '0.9rem', marginTop: 16 }}>Carregando cardápio...</p>
        </div>
      </div>
    );
  }

  // Success step (after public order)
  if (step === 'success') {
    return (
      <div className="customer-wrapper success-step" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: 24 }}>
        <div style={{ textAlign: 'center', maxWidth: 400, width: '100%' }}>
          <div style={{ fontSize: '5rem', marginBottom: 24, animation: 'successPop 0.5s cubic-bezier(0.16,1,0.3,1)' }}>🎉</div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 900, marginBottom: 12, letterSpacing: '-0.03em' }}>Pedido enviado!</h2>
          <p style={{ color: '#666', lineHeight: 1.6, marginBottom: 8 }}>Recebemos seu pedido e em breve entraremos em contato.</p>
          <p style={{ color: '#AAA', fontSize: '0.85rem', marginBottom: 36 }}>⏱ Previsão: {deliveryTime}</p>
          <button
            onClick={() => setStep('menu')}
            style={{ width: '100%', padding: '16px', background: primaryColor, color: '#fff', border: 'none', borderRadius: 16, fontWeight: 800, fontSize: '1rem', cursor: 'pointer', fontFamily: 'inherit' }}
          >
            Fazer outro pedido
          </button>
        </div>
      </div>
    );
  }

  // 1. Login Step (admin preview only — public menu skips this)
  if (step === 'login') {
    return (
      <div className="customer-wrapper login-step">
        <div className="login-card">
          <div className="login-branding">
            {brandLogo && brandLogo !== '🍽️' ? (
              brandLogo.startsWith('http') ? (
                <div className="login-logo-image"><img src={brandLogo} alt={brandName} /></div>
              ) : (
                <div className="login-logo-emoji" style={{ background: `${primaryColor}15` }}>{brandLogo}</div>
              )
            ) : (
              <div className="login-logo-emoji" style={{ background: `${primaryColor}15` }}>🍽️</div>
            )}
            <h1>{brandName}</h1>
            <p>Seja bem-vindo de volta! 👋</p>
          </div>
          
          <div className="login-form">
            <div className="input-group">
              <label>Seu Telefone</label>
              <input
                type="tel"
                placeholder="(00) 00000-0000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              />
            </div>
            <button className="btn-primary" onClick={handleLogin} style={{ backgroundColor: primaryColor }}>
              Entrar e pedir
            </button>
            <span className="login-helper">Não precisa de senha, entraremos com seu número</span>
          </div>
        </div>
      </div>
    );
  }

  // 2. Tracking Step
  if (step === 'tracking' && trackingOrder) {
    const steps = [
      { label: 'Recebido', icon: <Check size={16} />, status: 'completed' },
      { label: 'Análise', icon: <Search size={16} />, status: trackingOrder.status === 'analyzing' ? 'active' : 'completed' },
      { label: 'Preparo', icon: <ChefHat size={16} />, status: trackingOrder.status === 'production' ? 'active' : (['ready', 'delivery', 'completed'].includes(trackingOrder.status) ? 'completed' : 'pending') },
      { label: 'Pronto', icon: <Star size={16} />, status: trackingOrder.status === 'ready' ? 'active' : (['delivery', 'completed'].includes(trackingOrder.status) ? 'completed' : 'pending') },
    ];

    return (
      <div className="customer-wrapper tracking-step">
        <header className="tracking-header">
           <button className="back-btn" onClick={() => { setStep('menu'); setActiveOrderId(null); }}>
             <ArrowLeft size={20} />
           </button>
           <div className="header-info">
             <h2>Acompanhar Pedido</h2>
             <span>#{trackingOrder.id.slice(-4).toUpperCase()}</span>
           </div>
        </header>

        <div className="tracking-content">
          <div className="status-hero">
            <div className="status-animation">🚚</div>
            <h3>{trackingOrder.status === 'ready' ? 'Seu pedido está pronto!' : 'Estamos cuidando de tudo'}</h3>
            <p>Previsão: {deliveryTime}</p>
          </div>

          <div className="timeline">
            {steps.map((s, i) => (
              <div key={i} className={`timeline-step ${s.status}`}>
                <div className="step-marker">{s.icon}</div>
                <div className="step-text">
                  <strong>{s.label}</strong>
                </div>
                {i < steps.length - 1 && <div className="step-line" />}
              </div>
            ))}
          </div>

          <div className="order-summary-card">
             <h4>Resumo do Pedido</h4>
             <div className="summary-items">
                {trackingOrder.items.map((item, idx) => (
                  <div key={idx} className="summary-item">
                    <span>{item.qty}x {item.name}</span>
                    <span>R$ {(item.price ?? (item.unitPrice ?? 0) * (item.qty ?? 1)).toFixed(2)}</span>
                  </div>
                ))}
             </div>
             <div className="summary-total">
               <span>Total Pago</span>
               <strong>R$ {(trackingOrder.total ?? 0).toFixed(2)}</strong>
             </div>
          </div>
          
          <button className="btn-support" style={{ border: `1px solid ${primaryColor}`, color: primaryColor }}>
            <MessageCircle size={18} /> Preciso de ajuda
          </button>
        </div>
      </div>
    );
  }

  // 3. Menu Step
  return (
    <div className="customer-wrapper menu-step">
      {/* Sticky Header */}
      <header className="menu-header" style={{ borderTop: `3px solid ${primaryColor}` }}>
        <div className="menu-header-inner">
          <div className="header-top">
            <div className="brand-box">
              <div className="brand-logo">
                {brandLogo?.startsWith('http') ? (
                  <img src={brandLogo} alt={brandName} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 14 }} />
                ) : (brandLogo || '🍽️')}
              </div>
              <div className="brand-meta">
                <h1>{brandName}</h1>
                <div className="brand-status">
                  {isOpen ? (
                    <span className="status-tag open">Aberto</span>
                  ) : (
                    <span className="status-tag closed">Fechado</span>
                  )}
                  <span className="status-info"><Clock size={12} /> {deliveryTime}</span>
                </div>
              </div>
            </div>
            <button className="user-points">
              <div className="points-label">Meus Pontos</div>
              <div className="points-val">★ {customer?.points || 0}</div>
            </button>
          </div>

          <div className="search-bar" style={{ '--focus-color': primaryColor }}>
            <Search size={17} />
            <input
              type="text"
              placeholder="O que você quer comer hoje?"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Categories — inside header so they stick together */}
        <nav className="categories-nav">
          <button
            className={`cat-pill ${activeCategory === 'all' ? 'active' : ''}`}
            onClick={() => setActiveCategory('all')}
            style={activeCategory === 'all' ? { backgroundColor: primaryColor } : {}}
          >
            Todos
          </button>
          {displayCategories.map(cat => (
            <button
              key={cat.id}
              className={`cat-pill ${activeCategory === cat.id ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat.id)}
              style={activeCategory === cat.id ? { backgroundColor: primaryColor } : {}}
            >
              {cat.icone} {cat.nome}
            </button>
          ))}
        </nav>
      </header>

      <main className="menu-inner">
        {/* Bestsellers Section */}
        {activeCategory === 'all' && !searchQuery && displayProducts.some(p => p.bestseller) && (
          <section className="menu-section">
            <h2 className="section-title"><Star size={18} fill="currentColor" /> Os mais pedidos</h2>
            <div className="products-scroll">
              {displayProducts.filter(p => p.bestseller).map(product => (
                <div key={product.id} className="bestseller-card-wrapper">
                    <ProductCard product={product} onAdd={() => setSelectedProduct(product)} compact />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Main Grid */}
        <section className="menu-section">
          <h2 className="section-title">{activeCategory === 'all' ? 'Cardápio Completo' : displayCategories.find(c => c.id === activeCategory)?.nome}</h2>
          <div className="products-grid">
            {filtered.map(product => (
              <ProductCard 
                key={product.id} 
                product={product} 
                onAdd={() => setSelectedProduct(product)}
              />
            ))}
          </div>
        </section>
      </main>

      {/* Premium Floating Cart — hidden when checkout modal is open */}
      {cartCount > 0 && !isCheckoutOpen && (
        <div className="floating-cart-bar">
          <div className="cart-content" onClick={handleOrder} style={{ backgroundColor: primaryColor }}>
            <div className="cart-left">
               <div className="cart-count">{cartCount}</div>
               <div className="cart-text">Ver carrinho</div>
            </div>
            <div className="cart-right">
               <span>R$ {cartTotal.toFixed(2).replace('.', ',')}</span>
               <ChevronRight size={18} />
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      {selectedProduct && (
        <ProductModal
          product={selectedProduct}
          isOpen={!!selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onAdd={(v, c, q, o) => { addToCart(selectedProduct, v, c, q, o); setSelectedProduct(null); }}
        />
      )}

      <Modal
        isOpen={isCheckoutOpen}
        onClose={() => !submitting && setIsCheckoutOpen(false)}
        title="Finalizar Pedido"
        size="large"
      >
        <div className="checkout-revamp">
          <div className="revamp-section">
            <h4>Seus Dados</h4>
            <div className="animated-fields">
              <input
                type="tel"
                placeholder="WhatsApp / Telefone *"
                value={checkoutForm.customerPhone}
                onChange={e => setCheckoutForm({...checkoutForm, customerPhone: e.target.value})}
                autoFocus
              />
              <input
                placeholder="Seu Nome (Opcional)"
                value={checkoutForm.customerName}
                onChange={e => setCheckoutForm({...checkoutForm, customerName: e.target.value})}
              />
            </div>
          </div>

          <div className="revamp-section">
             <h4>Tipo de Pedido</h4>
             <div className="revamp-toggle">
                <button className={checkoutForm.type === 'delivery' ? 'active' : ''} onClick={() => setCheckoutForm({...checkoutForm, type: 'delivery'})}>Entrega</button>
                <button className={checkoutForm.type === 'pickup' ? 'active' : ''} onClick={() => setCheckoutForm({...checkoutForm, type: 'pickup'})}>Retirada</button>
             </div>

             {checkoutForm.type === 'delivery' && (
               <div className="animated-fields">
                  <input placeholder="Endereço Completo *" value={checkoutForm.address} onChange={e => setCheckoutForm({...checkoutForm, address: e.target.value})} />
                  <input placeholder="Referência (Opcional)" value={checkoutForm.reference} onChange={e => setCheckoutForm({...checkoutForm, reference: e.target.value})} />
               </div>
             )}
          </div>

          <div className="revamp-section">
             <h4>Forma de Pagamento</h4>
             <div className={`payment-grid-modern cols-${Math.min((paymentOptions.length || 3), 3)}`}>
                {(paymentOptions.length > 0 ? paymentOptions : [
                  { id: 'pix_online', label: 'Pix', icon: <QrCode size={18} /> },
                  { id: 'card_credit', label: 'Cartão', icon: <CreditCard size={18} /> },
                  { id: 'cash', label: 'Dinheiro', icon: <Wallet size={18} /> },
                ]).map(m => (
                  <button
                    key={m.id}
                    className={`pay-btn ${checkoutForm.paymentMethod === m.id ? 'active' : ''}`}
                    onClick={() => setCheckoutForm({...checkoutForm, paymentMethod: m.id})}
                    style={checkoutForm.paymentMethod === m.id ? { borderColor: primaryColor, color: primaryColor } : {}}
                  >
                    {m.icon}
                    <span>{m.label}</span>
                  </button>
                ))}
             </div>
          </div>

          {orderError && (
            <div style={{ background: '#FFF3F3', border: '1px solid #FFCDD2', borderRadius: 12, padding: '12px 16px', color: '#C62828', fontSize: '0.85rem', fontWeight: 600 }}>
              {orderError}
            </div>
          )}

          <div className="checkout-footer-sticky">
             <div className="final-sum">
                <span>Total a pagar</span>
                <strong>R$ {(cartTotal - (checkoutForm.couponDiscount || 0)).toFixed(2).replace('.', ',')}</strong>
             </div>
             <button
               className="confirm-btn"
               style={{ backgroundColor: submitting ? '#CCC' : primaryColor, cursor: submitting ? 'not-allowed' : 'pointer' }}
               onClick={handleFinalConfirm}
               disabled={submitting}
             >
               {submitting ? 'Enviando...' : 'Confirmar agora'}
             </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function ChefHat(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 13.8V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v9.8" />
      <path d="M6 13c-2 0-3 1-3 3s1 3 3 3h12c2 0 3-1 3-3s-1-3-3-3" />
      <path d="M9 20h6" />
      <path d="M10 22h4" />
    </svg>
  );
}

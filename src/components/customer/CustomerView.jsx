import React, { useState, useEffect, useMemo } from 'react';
import {
  ShoppingCart, ArrowLeft, Check,
  CreditCard, QrCode, Wallet,
  Star, ChevronRight, Search,
  MessageCircle, Share2,
  Navigation, Loader2, Tag, X as XIcon
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
  const [locating, setLocating] = useState(false);
  const [couponInput, setCouponInput] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState('');
  const [carouselIdx, setCarouselIdx] = useState(0);

  const handleApplyCoupon = async () => {
    const code = couponInput.trim().toUpperCase();
    if (!code) return;
    setCouponError('');
    setCouponLoading(true);
    try {
      if (isPublic) {
        const res = await fetch(`${API_URL}/public/validate-coupon`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ restaurante_id: publicRestaurant?.id, codigo: code, total: cartTotal }),
        });
        const result = await res.json();
        if (!result.success) { setCouponError(result.message || 'Cupom inválido'); return; }
        setCheckoutForm(prev => ({ ...prev, couponCode: result.codigo, couponDiscount: result.desconto }));
      } else {
        const found = coupons.find(c => (c.code || '').toUpperCase() === code && c.active !== false);
        if (!found) { setCouponError('Cupom inválido ou expirado'); return; }
        if (cartTotal < (found.minOrder || 0)) {
          setCouponError(`Pedido mínimo: R$ ${(found.minOrder || 0).toFixed(2).replace('.', ',')}`);
          return;
        }
        const desconto = found.type === 'percentage'
          ? (cartTotal * found.value) / 100
          : found.value;
        setCheckoutForm(prev => ({ ...prev, couponCode: found.code, couponDiscount: Math.min(desconto, cartTotal) }));
      }
      setCouponInput('');
    } catch { setCouponError('Erro ao validar cupom. Tente novamente.'); }
    finally { setCouponLoading(false); }
  };

  const handleRemoveCoupon = () => {
    setCheckoutForm(prev => ({ ...prev, couponCode: '', couponDiscount: 0 }));
    setCouponError('');
    setCouponInput('');
  };

  const handleUseLocation = async () => {
    if (!navigator.geolocation) {
      setOrderError('Seu navegador não suporta geolocalização.');
      return;
    }
    setLocating(true);
    try {
      const pos = await new Promise((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000, enableHighAccuracy: true })
      );
      const { latitude, longitude } = pos.coords;
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=pt-BR`,
        { headers: { 'Accept-Language': 'pt-BR' } }
      );
      const data = await res.json();
      const a = data.address || {};
      const parts = [
        a.road,
        a.house_number,
        a.suburb || a.neighbourhood || a.quarter,
        a.city || a.town || a.village || a.municipality,
      ].filter(Boolean);
      const formatted = parts.length > 0 ? parts.join(', ') : data.display_name;
      setCheckoutForm(prev => ({ ...prev, address: formatted }));
    } catch (err) {
      const msg = err.code === 1
        ? 'Permissão de localização negada. Habilite nas configurações do navegador.'
        : 'Não foi possível obter sua localização. Tente novamente.';
      setOrderError(msg);
    } finally {
      setLocating(false);
    }
  };

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
  const horarios     = publicRestaurant?.horarios     || restaurantSettings.horarios     || null;

  // Calcula aberto/fechado com base nos horários por dia da semana
  const isOpen = useMemo(() => {
    if (!horarios) return publicRestaurant?.is_open ?? restaurantSettings.isOpen ?? true;
    const days = ['domingo','segunda','terca','quarta','quinta','sexta','sabado'];
    const today = days[new Date().getDay()];
    const s = horarios[today];
    if (!s?.ativo) return false;
    const now = new Date().getHours() * 60 + new Date().getMinutes();
    const [hA, mA] = (s.abertura || '00:00').split(':').map(Number);
    const [hF, mF] = (s.fechamento || '23:59').split(':').map(Number);
    return now >= hA * 60 + mA && now < hF * 60 + mF;
  }, [horarios, publicRestaurant, restaurantSettings.isOpen]);

  // Próximo horário de abertura (exibido quando fechado)
  const nextOpenTime = useMemo(() => {
    if (!horarios || isOpen) return null;
    const days = ['domingo','segunda','terca','quarta','quinta','sexta','sabado'];
    const labels = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
    const todayIdx = new Date().getDay();
    for (let i = 0; i < 7; i++) {
      const idx = (todayIdx + i) % 7;
      const s = horarios[days[idx]];
      if (!s?.ativo) continue;
      const now = new Date().getHours() * 60 + new Date().getMinutes();
      const [hA, mA] = (s.abertura || '00:00').split(':').map(Number);
      if (i > 0 || now < hA * 60 + mA) {
        return i === 0 ? `hoje às ${s.abertura}` : `${labels[idx]} às ${s.abertura}`;
      }
    }
    return null;
  }, [horarios, isOpen]);

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

  const carouselItems = displayProducts.filter(p => p.imagem_url && p.ativo !== false);

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

  // Carousel auto-slide
  useEffect(() => {
    if (carouselItems.length < 2) return;
    const t = setInterval(() => setCarouselIdx(i => (i + 1) % carouselItems.length), 4000);
    return () => clearInterval(t);
  }, [carouselItems.length]);

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
            restaurante_id: publicRestaurant?.id || restaurantSettings?.id,
            cliente_nome: checkoutForm.customerName,
            cliente_telefone: checkoutForm.customerPhone,
            tipo: checkoutForm.type,
            endereco: checkoutForm.type === 'delivery' ? checkoutForm.address : null,
            pagamento: checkoutForm.paymentMethod,
            itens: cart,
            total: finalTotal,
            subtotal: cartTotal,
            descontos: checkoutForm.couponDiscount || 0,
            coupon_code: checkoutForm.couponCode || null,
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
        const newOrder = await addOrder({
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
        setActiveOrderId(newOrder?.id || newOrder);
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
  const minOrderVal = publicRestaurant?.min_order ?? restaurantSettings.minOrder ?? 0;

  return (
    <div className="customer-wrapper menu-step">
      <header className="menu-header">
        {/* Brand bar */}
        <div className="cv-brand-bar" style={{ background: primaryColor }}>
          <div className="cv-brand-logo">
            {brandLogo?.startsWith('http') ? (
              <img src={brandLogo} alt={brandName} />
            ) : (
              <span>{brandLogo || '🍽️'}</span>
            )}
          </div>
          <div className="cv-brand-text">
            <h1 className="cv-brand-title">{brandName}</h1>
            <div className="cv-brand-chips">
              <span className={isOpen ? 'cv-chip-open' : 'cv-chip-closed'}>
                {isOpen ? 'Aberto' : 'Fechado'}
              </span>
              <span className="cv-chip-sep">·</span>
              <span className="cv-chip-time">⏱ {deliveryTime}</span>
              {minOrderVal > 0 && (
                <>
                  <span className="cv-chip-sep">·</span>
                  <span className="cv-chip-min">Mín. R$&nbsp;{minOrderVal.toFixed(2).replace('.', ',')}</span>
                </>
              )}
            </div>
          </div>
          <div className="cv-brand-actions">
            <button
              className="cv-hdr-btn"
              onClick={() => navigator.share?.({ title: brandName, url: window.location.href })}
              aria-label="Compartilhar"
            >
              <Share2 size={19} />
            </button>
          </div>
        </div>

        {/* Closed banner */}
        {!isOpen && (
          <div className="cv-closed-banner">
            <span>⏰ Loja fechada no momento</span>
            {nextOpenTime && <span className="cv-closed-next">Abre {nextOpenTime}</span>}
          </div>
        )}

        {/* Search */}
        <div className="cv-search-row">
          <div className="cv-search-bar">
            <Search size={15} />
            <input
              type="text"
              placeholder="Buscar no cardápio..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Category pills */}
        <nav className="cv-cats-nav">
          <button
            className={`cv-cat-btn${activeCategory === 'all' ? ' active' : ''}`}
            onClick={() => setActiveCategory('all')}
            style={activeCategory === 'all' ? { backgroundColor: primaryColor, borderColor: primaryColor, color: '#fff' } : {}}
          >
            🍽️ Todos
          </button>
          {displayCategories.map(cat => (
            <button
              key={cat.id}
              className={`cv-cat-btn${activeCategory === cat.id ? ' active' : ''}`}
              onClick={() => setActiveCategory(cat.id)}
              style={activeCategory === cat.id ? { backgroundColor: primaryColor, borderColor: primaryColor, color: '#fff' } : {}}
            >
              {cat.icone} {cat.nome}
            </button>
          ))}
        </nav>
      </header>

      <main className="menu-inner">
        {/* Carousel */}
        {activeCategory === 'all' && !searchQuery && carouselItems.length >= 1 && (
          <div className="cv-carousel">
            <div
              className="cv-carousel-track"
              style={{ transform: `translateX(-${carouselIdx * 100}%)` }}
            >
              {carouselItems.map(p => (
                <div key={p.id} className="cv-carousel-slide" onClick={() => setSelectedProduct(p)}>
                  <img src={p.imagem_url} alt={p.nome} />
                  <div className="cv-carousel-caption">
                    <span className="cv-carousel-name">{p.nome}</span>
                    <span className="cv-carousel-price">R$ {parseFloat(p.preco || 0).toFixed(2).replace('.', ',')}</span>
                  </div>
                </div>
              ))}
            </div>
            {carouselItems.length > 1 && (
              <>
                <button
                  className="cv-carousel-btn cv-carousel-prev"
                  onClick={e => { e.stopPropagation(); setCarouselIdx(i => (i - 1 + carouselItems.length) % carouselItems.length); }}
                >‹</button>
                <button
                  className="cv-carousel-btn cv-carousel-next"
                  onClick={e => { e.stopPropagation(); setCarouselIdx(i => (i + 1) % carouselItems.length); }}
                >›</button>
                <div className="cv-carousel-dots">
                  {carouselItems.map((_, i) => (
                    <button
                      key={i}
                      className={`cv-carousel-dot${i === carouselIdx ? ' active' : ''}`}
                      onClick={e => { e.stopPropagation(); setCarouselIdx(i); }}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        )}

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
          <div
            className={`cart-content ${!isOpen ? 'cart-disabled' : ''}`}
            onClick={isOpen ? handleOrder : undefined}
            style={{ backgroundColor: isOpen ? primaryColor : '#9E9E9E' }}
          >
            <div className="cart-left">
               <div className="cart-count">{cartCount}</div>
               <div className="cart-text">{isOpen ? 'Ver carrinho' : 'Loja fechada'}</div>
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
          storeOpen={isOpen}
          nextOpenTime={nextOpenTime}
          onClose={() => setSelectedProduct(null)}
          onAdd={(v, c, q, o) => { addToCart(selectedProduct, v, c, q, o); setSelectedProduct(null); }}
        />
      )}

      <Modal
        isOpen={isCheckoutOpen}
        onClose={() => !submitting && setIsCheckoutOpen(false)}
        title="Finalizar Pedido"
        size="large"
        footer={
          <div className="checkout-footer-sticky">
            <div className="final-sum">
              {checkoutForm.couponDiscount > 0 && (
                <div className="final-sum-discount">
                  <span>Subtotal</span>
                  <span>R$ {cartTotal.toFixed(2).replace('.', ',')}</span>
                </div>
              )}
              {checkoutForm.couponDiscount > 0 && (
                <div className="final-sum-discount green">
                  <span>🎟️ Desconto</span>
                  <span>− R$ {(checkoutForm.couponDiscount).toFixed(2).replace('.', ',')}</span>
                </div>
              )}
              <div className="final-sum-total">
                <span>Total a pagar</span>
                <strong>R$ {(cartTotal - (checkoutForm.couponDiscount || 0)).toFixed(2).replace('.', ',')}</strong>
              </div>
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
        }
      >
        <div className="checkout-revamp">
          <div className="revamp-section">
            <h4>Seu Pedido</h4>
            <div className="checkout-items-list">
              {cart.map((item, idx) => (
                <div key={idx} className="checkout-item-row">
                  <span className="checkout-item-qty">{item.qty}x</span>
                  <span className="checkout-item-name">{item.name}{item.variation ? ` (${item.variation})` : ''}</span>
                  <span className="checkout-item-price">R$ {(item.price ?? item.unitPrice * item.qty).toFixed(2).replace('.', ',')}</span>
                </div>
              ))}
              <div className="checkout-items-total">
                <span>Subtotal</span>
                <strong>R$ {cartTotal.toFixed(2).replace('.', ',')}</strong>
              </div>
            </div>
          </div>

          <div className="revamp-section">
            <h4>Seus Dados</h4>
            <div className="animated-fields">
              <input
                type="tel"
                placeholder="WhatsApp / Telefone *"
                value={checkoutForm.customerPhone}
                onChange={e => setCheckoutForm({...checkoutForm, customerPhone: e.target.value})}
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
                <div className="cv-address-row">
                  <input
                    placeholder="Endereço Completo *"
                    value={checkoutForm.address}
                    onChange={e => setCheckoutForm({...checkoutForm, address: e.target.value})}
                    className="cv-address-input"
                  />
                  <button
                    type="button"
                    className="cv-location-btn"
                    onClick={handleUseLocation}
                    disabled={locating}
                    title="Usar minha localização atual"
                  >
                    {locating ? <Loader2 size={16} className="cv-spin" /> : <Navigation size={16} />}
                  </button>
                </div>
                <input placeholder="Referência (Opcional)" value={checkoutForm.reference} onChange={e => setCheckoutForm({...checkoutForm, reference: e.target.value})} />
              </div>
            )}
          </div>

          {/* ── Cupom de desconto ── */}
          <div className="revamp-section">
            <h4><Tag size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />Cupom de Desconto</h4>
            {checkoutForm.couponCode ? (
              <div className="cv-coupon-applied">
                <span className="cv-coupon-badge">
                  🎟️ {checkoutForm.couponCode}
                  <span className="cv-coupon-value">
                    − R$ {(checkoutForm.couponDiscount || 0).toFixed(2).replace('.', ',')}
                  </span>
                </span>
                <button className="cv-coupon-remove" onClick={handleRemoveCoupon} title="Remover cupom">
                  <XIcon size={14} />
                </button>
              </div>
            ) : (
              <div className="cv-coupon-row">
                <input
                  className="cv-coupon-input"
                  placeholder="Código do cupom"
                  value={couponInput}
                  onChange={e => { setCouponInput(e.target.value.toUpperCase()); setCouponError(''); }}
                  onKeyDown={e => e.key === 'Enter' && handleApplyCoupon()}
                />
                <button
                  className="cv-coupon-btn"
                  style={{ background: primaryColor }}
                  onClick={handleApplyCoupon}
                  disabled={couponLoading || !couponInput.trim()}
                >
                  {couponLoading ? <Loader2 size={14} className="cv-spin" /> : 'Aplicar'}
                </button>
              </div>
            )}
            {couponError && <p className="cv-coupon-error">{couponError}</p>}
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

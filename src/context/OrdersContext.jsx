import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';
import { apiFetch } from '../lib/supabase';

const OrdersContext = createContext();

function mapOrder(o) {
  return {
    id: o.id,
    status: o.status || 'analyzing',
    createdAt: o.criado_em || o.createdAt,
    total: o.total || 0,
    subtotal: o.subtotal || 0,
    type: o.tipo || o.type,
    payment: o.pagamento || o.payment,
    discounts: o.descontos || o.discounts || 0,
    items: o.items || [],
    chat: o.chat || [],
    confirmCode: o.codigo || o.confirmCode,
    customer: o.customer || { name: o.cliente_nome, phone: o.cliente_telefone, address: o.cliente_endereco },
    mesa_id: o.mesa_id,
  };
}

function mapProduct(p) {
  return {
    id: p.id,
    nome: p.nome,
    descricao: p.descricao,
    preco: p.preco,
    categoria_id: p.categoria_id,
    imagem_emoji: p.imagem_emoji,
    imagem_url: p.imagem_url,
    bestseller: !!p.bestseller,
    ativo: p.ativo !== false,
    variacoes: p.variacoes || [],
    complementos: p.complementos || [],
    config: p.config || {},
  };
}

function mapCategory(c) {
  return { id: c.id, nome: c.nome, icone: c.icone || '🍽️', ordem: c.ordem || 0 };
}

function mapTable(t) {
  return { id: t.id, numero: t.numero, seats: t.capacidade || t.seats || 4, status: t.status || 'free', pedido_atual_id: t.pedido_atual_id };
}

function mapCoupon(c) {
  return { id: c.id, code: c.codigo || c.code, type: (c.tipo || c.type) === 'percent' ? 'percentage' : (c.tipo || c.type), value: c.valor ?? c.value, minOrder: c.pedido_minimo ?? c.minOrder ?? 0, active: c.ativo ?? c.active ?? true };
}

function mapLoyalty(config, premios) {
  return {
    pointsPerReal: config?.pontos_por_real ?? config?.pointsPerReal ?? 1,
    active: config?.ativo ?? config?.active ?? false,
    rewards: (premios || []).map(p => ({ id: p.id, points: p.pontos ?? p.points, label: p.label, type: p.tipo ?? p.type, value: p.valor ?? p.value ?? 0 })),
  };
}

function playBeep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.5);
  } catch {}
}

const DEFAULT_SETTINGS = {
  name: 'Meu Restaurante', logo: '🍽️', primaryColor: '#e74c3c',
  isOpen: true, deliveryTime: '30 a 45 min', minOrder: 0,
  payments: { pix: true, card: true, cash: true, pix_counter: true },
};

const DEFAULT_LOYALTY = {
  pointsPerReal: 1, active: false,
  rewards: [
    { id: 1, points: 100, label: '5% de desconto', type: 'discount', value: 5 },
    { id: 2, points: 300, label: 'Frete grátis', type: 'shipping', value: 0 },
    { id: 3, points: 500, label: 'R$10 de desconto', type: 'cash', value: 10 },
  ],
};

export function OrdersProvider({ children }) {
  const { profile } = useAuth();
  const restauranteId = profile?.restaurante_id;

  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [tables, setTables] = useState([]);
  const [leads, setLeads] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [loyaltySettings, setLoyaltySettings] = useState(DEFAULT_LOYALTY);
  const [restaurantSettings, setRestaurantSettings] = useState(DEFAULT_SETTINGS);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [loadingMenu, setLoadingMenu] = useState(false);

  const prevOrderCountRef = useRef(0);
  const leadsRef = useRef([]);
  leadsRef.current = leads;
  const ordersRef = useRef([]);
  ordersRef.current = orders;

  useEffect(() => {
    if (!restauranteId) return;
    loadAll();
  }, [restauranteId]); // eslint-disable-line

  useEffect(() => {
    if (!restauranteId) return;
    const interval = setInterval(refreshOrders, 30_000);
    return () => clearInterval(interval);
  }, [restauranteId]); // eslint-disable-line

  async function loadAll() {
    await Promise.allSettled([
      refreshOrders(),
      refreshMenu(),
      refreshTables(),
      refreshLeads(),
      refreshInventory(),
      refreshDrivers(),
      refreshCoupons(),
      refreshLoyalty(),
      refreshSettings(),
    ]);
  }

  async function refreshOrders() {
    setLoadingOrders(true);
    try {
      const result = await apiFetch('/orders');
      const mapped = (result.data || []).map(mapOrder);
      const activeCount = mapped.filter(o => ['analyzing', 'production', 'ready'].includes(o.status)).length;
      if (prevOrderCountRef.current > 0 && activeCount > prevOrderCountRef.current) playBeep();
      prevOrderCountRef.current = activeCount;
      setOrders(mapped);
    } catch (err) { console.warn('Erro ao carregar pedidos:', err); }
    finally { setLoadingOrders(false); }
  }

  async function refreshMenu() {
    setLoadingMenu(true);
    try {
      const [catRes, prodRes] = await Promise.all([apiFetch('/menu/categories'), apiFetch('/menu/products')]);
      setCategories((catRes.data || []).map(mapCategory));
      setProducts((prodRes.data || []).map(mapProduct));
    } catch (err) { console.warn('Erro ao carregar cardápio:', err); }
    finally { setLoadingMenu(false); }
  }

  async function refreshTables() {
    try { const r = await apiFetch('/tables'); setTables((r.data || []).map(mapTable)); }
    catch (err) { console.warn('Erro ao carregar mesas:', err); }
  }

  async function refreshLeads() {
    try { const r = await apiFetch('/leads'); setLeads(r.data || []); }
    catch (err) { console.warn('Erro ao carregar leads:', err); }
  }

  async function refreshInventory() {
    try { const r = await apiFetch('/inventory'); setInventory(r.data || []); }
    catch (err) { console.warn('Erro ao carregar estoque:', err); }
  }

  async function refreshDrivers() {
    try { const r = await apiFetch('/drivers'); setDrivers(r.data || []); }
    catch (err) { console.warn('Erro ao carregar entregadores:', err); }
  }

  async function refreshCoupons() {
    try { const r = await apiFetch('/coupons'); setCoupons((r.data || []).map(mapCoupon)); }
    catch (err) { console.warn('Erro ao carregar cupons:', err); }
  }

  async function refreshLoyalty() {
    try {
      const r = await apiFetch('/loyalty');
      setLoyaltySettings(mapLoyalty(r.data?.config, r.data?.premios));
    } catch (err) { console.warn('Erro ao carregar fidelidade:', err); }
  }

  async function refreshSettings() {
    try {
      const r = await apiFetch('/restaurants/me');
      const d = r.data;
      setRestaurantSettings({
        name: d.nome || 'Meu Restaurante',
        logo: d.logo_url || '🍽️',
        primaryColor: d.cor_primaria || '#e74c3c',
        isOpen: d.is_open !== false,
        deliveryTime: d.delivery_time || '30 a 45 min',
        minOrder: d.min_order || 0,
        payments: d.payments_config || { pix: true, card: true, cash: true, pix_counter: true },
        pixKey: d.pix_key || '',
        cnpj: d.cnpj || '',
        email: d.email || '',
        telefone: d.telefone || '',
        endereco: d.endereco || '',
      });
    } catch (err) { console.warn('Erro ao carregar configurações:', err); }
  }

  // ORDERS
  const moveOrder = useCallback(async (orderId, newStatus) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    try { await apiFetch(`/orders/${orderId}/status`, { method: 'PATCH', body: JSON.stringify({ status: newStatus }) }); }
    catch { refreshOrders(); }
  }, []); // eslint-disable-line

  const addOrder = useCallback(async (orderData) => {
    try {
      const result = await apiFetch('/orders', {
        method: 'POST',
        body: JSON.stringify({
          items: orderData.items, total: orderData.total, subtotal: orderData.subtotal,
          tipo: orderData.type, pagamento: orderData.payment, customer: orderData.customer,
          obs: orderData.obs, table_id: orderData.table_id, descontos: orderData.discounts,
          taxa_entrega: orderData.delivery_fee, cupom_usado: orderData.couponUsed,
        }),
      });
      const newOrder = mapOrder(result.data);
      setOrders(prev => [newOrder, ...prev]);
      return newOrder.id;
    } catch {
      const id = `PED-${String(Date.now()).slice(-4)}`;
      const newOrder = { ...orderData, id, confirmCode: String(Math.floor(1000 + Math.random() * 9000)), status: 'analyzing', createdAt: new Date().toISOString(), chat: [] };
      setOrders(prev => [newOrder, ...prev]);
      return id;
    }
  }, []);

  const removeOrder = useCallback(async (orderId) => {
    setOrders(prev => prev.filter(o => o.id !== orderId));
    try { await apiFetch(`/orders/${orderId}/status`, { method: 'PATCH', body: JSON.stringify({ status: 'canceled' }) }); } catch {}
  }, []);

  const finalizeReady = useCallback(async () => {
    const ready = ordersRef.current.filter(o => o.status === 'ready');
    setOrders(prev => prev.filter(o => o.status !== 'ready'));
    await Promise.allSettled(ready.map(o => apiFetch(`/orders/${o.id}/status`, { method: 'PATCH', body: JSON.stringify({ status: 'completed' }) })));
  }, []);

  const finalizeSingleOrder = useCallback(async (orderId) => {
    setOrders(prev => prev.filter(o => o.id !== orderId));
    try { await apiFetch(`/orders/${orderId}/status`, { method: 'PATCH', body: JSON.stringify({ status: 'completed' }) }); } catch {}
  }, []);

  const addChatMessage = useCallback(async (orderId, text, sender = 'admin') => {
    const msg = { id: Date.now(), text, sender, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
    setOrders(prev => prev.map(o => o.id !== orderId ? o : { ...o, chat: [...(o.chat || []), msg] }));
    try {
      const order = ordersRef.current.find(o => o.id === orderId);
      const chat = [...(order?.chat || []), msg];
      await apiFetch(`/orders/${orderId}/chat`, { method: 'PATCH', body: JSON.stringify({ chat }) });
    } catch {}
  }, []);

  // PRODUCTS
  const addProduct = useCallback(async (data) => {
    try { const r = await apiFetch('/menu/products', { method: 'POST', body: JSON.stringify(data) }); const p = mapProduct(r.data); setProducts(prev => [...prev, p]); return p; }
    catch (err) { throw err; }
  }, []);

  const updateProduct = useCallback(async (idOrItem, data) => {
    const id = data !== undefined ? idOrItem : idOrItem.id;
    const payload = data !== undefined ? data : idOrItem;
    setProducts(prev => prev.map(x => x.id === id ? { ...x, ...payload } : x));
    try { await apiFetch(`/menu/products/${id}`, { method: 'PUT', body: JSON.stringify(payload) }); }
    catch { refreshMenu(); }
  }, []); // eslint-disable-line

  const deleteProduct = useCallback(async (id) => {
    setProducts(prev => prev.filter(x => x.id !== id));
    try { await apiFetch(`/menu/products/${id}`, { method: 'DELETE' }); } catch {}
  }, []);

  // CATEGORIES
  const addCategory = useCallback(async (c) => {
    try { const r = await apiFetch('/menu/categories', { method: 'POST', body: JSON.stringify(c) }); setCategories(prev => [...prev, mapCategory(r.data)]); }
    catch (err) { throw err; }
  }, []);

  const updateCategory = useCallback(async (idOrItem, data) => {
    const id = data !== undefined ? idOrItem : idOrItem.id;
    const payload = data !== undefined ? data : idOrItem;
    setCategories(prev => prev.map(x => x.id === id ? { ...x, ...payload } : x));
    try { await apiFetch(`/menu/categories/${id}`, { method: 'PUT', body: JSON.stringify(payload) }); }
    catch { refreshMenu(); }
  }, []); // eslint-disable-line

  const deleteCategory = useCallback(async (id) => {
    setCategories(prev => prev.filter(x => x.id !== id));
    try { await apiFetch(`/menu/categories/${id}`, { method: 'DELETE' }); } catch {}
  }, []);

  // INVENTORY
  const addInventoryItem = useCallback(async (item) => {
    try { const r = await apiFetch('/inventory', { method: 'POST', body: JSON.stringify(item) }); setInventory(prev => [...prev, r.data]); }
    catch (err) { throw err; }
  }, []);

  const updateInventoryItem = useCallback(async (item) => {
    setInventory(prev => prev.map(i => i.id === item.id ? { ...i, ...item } : i));
    try { await apiFetch(`/inventory/${item.id}`, { method: 'PATCH', body: JSON.stringify(item) }); }
    catch { refreshInventory(); }
  }, []); // eslint-disable-line

  const deleteInventoryItem = useCallback(async (id) => {
    setInventory(prev => prev.filter(i => i.id !== id));
    try { await apiFetch(`/inventory/${id}`, { method: 'DELETE' }); } catch {}
  }, []);

  // TABLES
  const addTable = useCallback(async (t) => {
    try { const r = await apiFetch('/tables', { method: 'POST', body: JSON.stringify({ numero: String(t.numero), capacidade: t.seats || t.capacidade || 4 }) }); setTables(prev => [...prev, mapTable(r.data)]); }
    catch (err) { throw err; }
  }, []);

  const updateTable = useCallback(async (id, data) => {
    setTables(prev => prev.map(t => t.id === id ? { ...t, ...data } : t));
    try { await apiFetch(`/tables/${id}`, { method: 'PATCH', body: JSON.stringify(data) }); }
    catch { refreshTables(); }
  }, []); // eslint-disable-line

  const deleteTable = useCallback(async (id) => {
    setTables(prev => prev.filter(t => t.id !== id));
    try { await apiFetch(`/tables/${id}`, { method: 'DELETE' }); } catch {}
  }, []);

  // LEADS
  const addLeadMessage = useCallback(async (leadId, text, sender = 'admin') => {
    setLeads(prev => prev.map(l => {
      if (l.id !== leadId) return l;
      const msg = { text, sender, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
      return { ...l, chat: [...(l.chat || []), msg], lastMessage: text, unread: sender === 'customer' };
    }));
    try {
      const lead = leadsRef.current.find(l => l.id === leadId);
      const chat = [...(lead?.chat || []), { text, sender, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }];
      await apiFetch(`/leads/${leadId}`, { method: 'PATCH', body: JSON.stringify({ chat, lastMessage: text, unread: sender === 'customer' }) });
    } catch {}
  }, []);

  const markLeadAsRead = useCallback(async (leadId) => {
    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, unread: false } : l));
    try { await apiFetch(`/leads/${leadId}`, { method: 'PATCH', body: JSON.stringify({ unread: false }) }); } catch {}
  }, []);

  // DRIVERS
  const addDriver = useCallback(async (d) => {
    try { const r = await apiFetch('/drivers', { method: 'POST', body: JSON.stringify(d) }); setDrivers(prev => [...prev, r.data]); }
    catch (err) { throw err; }
  }, []);

  const removeDriver = useCallback(async (id) => {
    setDrivers(prev => prev.filter(d => d.id !== id));
    try { await apiFetch(`/drivers/${id}`, { method: 'DELETE' }); } catch {}
  }, []);

  // COUPONS
  const addCoupon = useCallback(async (data) => {
    try {
      const r = await apiFetch('/coupons', { method: 'POST', body: JSON.stringify({ codigo: data.code, tipo: data.type === 'percentage' ? 'percent' : 'fixed', valor: data.value, pedido_minimo: data.minOrder || 0 }) });
      setCoupons(prev => [...prev, mapCoupon(r.data)]);
    } catch (err) { throw err; }
  }, []);

  const updateCoupon = useCallback(async (id, data) => {
    const bd = {};
    if (data.code !== undefined) bd.codigo = data.code;
    if (data.type !== undefined) bd.tipo = data.type === 'percentage' ? 'percent' : 'fixed';
    if (data.value !== undefined) bd.valor = data.value;
    if (data.minOrder !== undefined) bd.pedido_minimo = data.minOrder;
    if (data.active !== undefined) bd.ativo = data.active;
    setCoupons(prev => prev.map(c => c.id === id ? { ...c, ...data } : c));
    try { await apiFetch(`/coupons/${id}`, { method: 'PATCH', body: JSON.stringify(bd) }); }
    catch { refreshCoupons(); }
  }, []); // eslint-disable-line

  const deleteCoupon = useCallback(async (id) => {
    setCoupons(prev => prev.filter(c => c.id !== id));
    try { await apiFetch(`/coupons/${id}`, { method: 'DELETE' }); } catch {}
  }, []);

  // LOYALTY
  const updateLoyaltyConfig = useCallback(async (data) => {
    setLoyaltySettings(prev => ({ ...prev, ...data }));
    try { await apiFetch('/loyalty', { method: 'PATCH', body: JSON.stringify({ pontos_por_real: data.pointsPerReal, ativo: data.active }) }); }
    catch { refreshLoyalty(); }
  }, []); // eslint-disable-line

  const addLoyaltyReward = useCallback(async () => {
    try {
      const r = await apiFetch('/loyalty/rewards', { method: 'POST', body: JSON.stringify({ pontos: 500, label: 'Nova Recompensa', tipo: 'discount', valor: 10 }) });
      const mapped = { id: r.data.id, points: r.data.pontos, label: r.data.label, type: r.data.tipo, value: r.data.valor || 0 };
      setLoyaltySettings(prev => ({ ...prev, rewards: [...prev.rewards, mapped] }));
    } catch {}
  }, []);

  const removeLoyaltyReward = useCallback(async (id) => {
    setLoyaltySettings(prev => ({ ...prev, rewards: prev.rewards.filter(r => r.id !== id) }));
    try { await apiFetch(`/loyalty/rewards/${id}`, { method: 'DELETE' }); } catch {}
  }, []);

  // SETTINGS
  const updateSettings = useCallback(async (data) => {
    setRestaurantSettings(prev => ({ ...prev, ...data, payments: data.payments || prev.payments }));
    try {
      await apiFetch('/restaurants/me', {
        method: 'PATCH',
        body: JSON.stringify({
          nome: data.name, logo_url: data.logo, cor_primaria: data.primaryColor,
          is_open: data.isOpen, delivery_time: data.deliveryTime, min_order: data.minOrder,
          payments_config: data.payments, pix_key: data.pixKey,
          cnpj: data.cnpj, email: data.email, telefone: data.telefone, endereco: data.endereco,
        }),
      });
    } catch { refreshSettings(); }
  }, []); // eslint-disable-line

  // STATS
  const getStatsForPeriod = useCallback((days) => {
    const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - parseInt(days, 10));
    const all = ordersRef.current.filter(o => new Date(o.createdAt) >= cutoff);
    const revenue = all.reduce((s, o) => s + (o.total || 0), 0);
    const prevCutoff = new Date(cutoff); prevCutoff.setDate(prevCutoff.getDate() - parseInt(days, 10));
    const prev = ordersRef.current.filter(o => { const d = new Date(o.createdAt); return d >= prevCutoff && d < cutoff; });
    const prevRev = prev.reduce((s, o) => s + (o.total || 0), 0);
    const payments = { cash: 0, card: 0, pix: 0, other: 0 };
    all.forEach(o => {
      const m = (o.payment || '').toLowerCase();
      if (m.includes('dinheiro') || m.includes('cash')) payments.cash += o.total || 0;
      else if (m.includes('cart') || m.includes('card') || m.includes('cr') || m.includes('db')) payments.card += o.total || 0;
      else if (m.includes('pix')) payments.pix += o.total || 0;
      else payments.other += o.total || 0;
    });
    return { orders: all.length, revenue, avgTicket: all.length ? revenue / all.length : 0, growth: prevRev ? ((revenue - prevRev) / prevRev) * 100 : 0, payments };
  }, []);

  const value = {
    orders, analyzing: orders.filter(o => o.status === 'analyzing'),
    production: orders.filter(o => o.status === 'production'),
    ready: orders.filter(o => o.status === 'ready'),
    loadingOrders, refreshOrders,
    products, categories, loadingMenu,
    inventory, tables, leads, drivers,
    restaurantSettings, loyaltySettings, coupons,
    setCoupons, setLoyaltySettings,
    moveOrder, addOrder, addChatMessage, removeOrder, finalizeSingleOrder, finalizeReady,
    addProduct, updateProduct, deleteProduct,
    addCategory, updateCategory, deleteCategory,
    addInventoryItem, updateInventoryItem, deleteInventoryItem,
    addTable, updateTable, deleteTable,
    addLeadMessage, markLeadAsRead,
    addDriver, removeDriver,
    addCoupon, updateCoupon, deleteCoupon,
    updateLoyaltyConfig, addLoyaltyReward, removeLoyaltyReward,
    updateSettings,
    getStatsForPeriod,
  };

  return <OrdersContext.Provider value={value}>{children}</OrdersContext.Provider>;
}

export const useOrdersContext = () => {
  const context = useContext(OrdersContext);
  if (!context) throw new Error('useOrdersContext must be used within an OrdersProvider');
  return context;
};

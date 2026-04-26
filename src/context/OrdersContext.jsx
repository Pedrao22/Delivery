import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useAuth } from './AuthContext';

const OrdersContext = createContext();

const DEFAULT_RESTAURANT_SETTINGS = {
  name: 'Meu Restaurante',
  logo: '🍽️',
  primaryColor: '#e74c3c',
  isOpen: true,
  deliveryTime: '30 a 45 min',
  minOrder: 0,
  payments: { pix: true, card: true, cash: true, pix_counter: true },
};

const DEFAULT_LOYALTY = {
  pointsPerReal: 1,
  rewards: [
    { id: 1, points: 100, label: '5% de desconto', type: 'discount', value: 5 },
    { id: 2, points: 300, label: 'Frete grátis', type: 'shipping', value: 0 },
    { id: 3, points: 500, label: 'R$10 de desconto', type: 'cash', value: 10 },
  ],
};

const DEFAULT_TABLES = [
  { id: 1, numero: 1, seats: 4, status: 'free' },
  { id: 2, numero: 2, seats: 2, status: 'free' },
  { id: 3, numero: 3, seats: 6, status: 'free' },
  { id: 4, numero: 4, seats: 4, status: 'free' },
  { id: 5, numero: 5, seats: 6, status: 'free' },
  { id: 6, numero: 6, seats: 4, status: 'free' },
];

function readStorage(key, fallback) {
  try {
    const stored = localStorage.getItem(key);
    if (stored) return JSON.parse(stored);
  } catch {}
  return fallback;
}

export function OrdersProvider({ children }) {
  const { user, profile } = useAuth();

  // Isolate all data by restaurant/user — prevents cross-user data leakage
  const tenantId = profile?.restaurante_id || user?.id || 'default';
  const k = (name) => `pedirecebe_${name}_${tenantId}`;

  const [orders, setOrders]                   = useState(() => readStorage(k('orders'), []));
  const [products, setProducts]               = useState(() => readStorage(k('products'), []));
  const [categories, setCategories]           = useState(() => readStorage(k('categories'), []));
  const [inventory, setInventory]             = useState(() => readStorage(k('inventory'), []));
  const [tables, setTables]                   = useState(() => readStorage(k('tables'), DEFAULT_TABLES));
  const [leads, setLeads]                     = useState(() => readStorage(k('leads'), []));
  const [drivers, setDrivers]                 = useState(() => readStorage(k('drivers'), []));
  const [coupons, setCoupons]                 = useState(() => readStorage(k('coupons'), []));
  const [loyaltySettings, setLoyaltySettings] = useState(() => readStorage(k('loyalty'), DEFAULT_LOYALTY));
  const [restaurantSettings, setRestaurantSettings] = useState(() =>
    readStorage(k('settings'), DEFAULT_RESTAURANT_SETTINGS)
  );

  // Persist — tenant-scoped keys
  useEffect(() => { localStorage.setItem(k('orders'),    JSON.stringify(orders));    }, [orders,    tenantId]); // eslint-disable-line
  useEffect(() => { localStorage.setItem(k('products'),  JSON.stringify(products));  }, [products,  tenantId]); // eslint-disable-line
  useEffect(() => { localStorage.setItem(k('categories'),JSON.stringify(categories));}, [categories,tenantId]); // eslint-disable-line
  useEffect(() => { localStorage.setItem(k('inventory'), JSON.stringify(inventory)); }, [inventory, tenantId]); // eslint-disable-line
  useEffect(() => { localStorage.setItem(k('tables'),    JSON.stringify(tables));    }, [tables,    tenantId]); // eslint-disable-line
  useEffect(() => { localStorage.setItem(k('leads'),     JSON.stringify(leads));     }, [leads,     tenantId]); // eslint-disable-line
  useEffect(() => { localStorage.setItem(k('drivers'),   JSON.stringify(drivers));   }, [drivers,   tenantId]); // eslint-disable-line
  useEffect(() => { localStorage.setItem(k('coupons'),   JSON.stringify(coupons));   }, [coupons,   tenantId]); // eslint-disable-line
  useEffect(() => { localStorage.setItem(k('loyalty'),   JSON.stringify(loyaltySettings)); }, [loyaltySettings, tenantId]); // eslint-disable-line
  useEffect(() => { localStorage.setItem(k('settings'),  JSON.stringify(restaurantSettings)); }, [restaurantSettings, tenantId]); // eslint-disable-line

  // Cross-tab sync for orders
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === k('orders') && e.newValue) {
        try { setOrders(JSON.parse(e.newValue)); } catch {}
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [tenantId]); // eslint-disable-line

  // Orders
  const moveOrder = useCallback((orderId, newStatus) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
  }, []);

  const addOrder = useCallback((orderData) => {
    const id = `PED-${String(Date.now()).slice(-4)}`;
    const newOrder = {
      ...orderData,
      id,
      confirmCode: String(Math.floor(1000 + Math.random() * 9000)),
      status: 'analyzing',
      createdAt: new Date().toISOString(),
      chat: [{
        id: 1,
        text: 'Olá! Acabei de fazer meu pedido. Pode confirmar se receberam?',
        sender: 'customer',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]
    };
    setOrders(prev => [newOrder, ...prev]);
    return id;
  }, []);

  const removeOrder = useCallback((orderId) => {
    setOrders(prev => prev.filter(o => o.id !== orderId));
  }, []);

  const finalizeReady = useCallback(() => {
    setOrders(prev => prev.filter(o => o.status !== 'ready'));
  }, []);

  const finalizeSingleOrder = useCallback((orderId) => {
    setOrders(prev => prev.filter(o => o.id !== orderId));
  }, []);

  const addChatMessage = useCallback((orderId, text, sender = 'admin') => {
    setOrders(prev => prev.map(o => {
      if (o.id !== orderId) return o;
      return {
        ...o,
        chat: [...(o.chat || []), {
          id: Date.now(), text, sender,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }]
      };
    }));
  }, []);

  // Products
  const addProduct    = useCallback((data) => setProducts(prev => [...prev, { ...data, id: Date.now(), ativo: true }]), []);
  const updateProduct = useCallback((idOrItem, data) => {
    if (data !== undefined) {
      setProducts(prev => prev.map(x => x.id === idOrItem ? { ...x, ...data } : x));
    } else {
      setProducts(prev => prev.map(x => x.id === idOrItem.id ? idOrItem : x));
    }
  }, []);
  const deleteProduct = useCallback((id) => setProducts(prev => prev.filter(x => x.id !== id)), []);

  // Categories
  const addCategory    = useCallback((c) => setCategories(prev => [...prev, { ...c, id: c.id || Date.now() }]), []);
  const updateCategory = useCallback((idOrItem, data) => {
    if (data !== undefined) {
      setCategories(prev => prev.map(x => x.id === idOrItem ? { ...x, ...data } : x));
    } else {
      setCategories(prev => prev.map(x => x.id === idOrItem.id ? idOrItem : x));
    }
  }, []);
  const deleteCategory = useCallback((id) => setCategories(prev => prev.filter(x => x.id !== id)), []);

  // Drivers
  const addDriver    = useCallback((d) => setDrivers(prev => [...prev, { ...d, id: Date.now() }]), []);
  const removeDriver = useCallback((id) => setDrivers(prev => prev.filter(d => d.id !== id)), []);

  // Inventory
  const addInventoryItem    = useCallback((item) => setInventory(prev => [...prev, { ...item, id: Date.now() }]), []);
  const updateInventoryItem = useCallback((item) => setInventory(prev => prev.map(i => i.id === item.id ? item : i)), []);
  const deleteInventoryItem = useCallback((id) => setInventory(prev => prev.filter(i => i.id !== id)), []);

  // Tables
  const addTable    = useCallback((t) => setTables(prev => [...prev, { ...t, id: Date.now() }]), []);
  const updateTable = useCallback((id, data) => setTables(prev => prev.map(t => t.id === id ? { ...t, ...data } : t)), []);
  const deleteTable = useCallback((id) => setTables(prev => prev.filter(t => t.id !== id)), []);

  // Leads
  const addLeadMessage = useCallback((leadId, text, sender = 'admin') => {
    setLeads(prev => prev.map(l => {
      if (l.id !== leadId) return l;
      const msg = { text, sender, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
      return { ...l, chat: [...(l.chat || []), msg], lastMessage: text, unread: sender === 'customer' };
    }));
  }, []);

  const markLeadAsRead = useCallback((leadId) => {
    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, unread: false } : l));
  }, []);

  // Stats por período — usado em Dashboard e Financeiro
  const getStatsForPeriod = useCallback((days) => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - parseInt(days, 10));

    const periodOrders = orders.filter(o => new Date(o.createdAt) >= cutoff);
    const revenue = periodOrders.reduce((sum, o) => sum + (o.total || 0), 0);
    const prevCutoff = new Date(cutoff);
    prevCutoff.setDate(prevCutoff.getDate() - parseInt(days, 10));
    const prevOrders = orders.filter(o => {
      const d = new Date(o.createdAt);
      return d >= prevCutoff && d < cutoff;
    });
    const prevRevenue = prevOrders.reduce((sum, o) => sum + (o.total || 0), 0);

    const payments = { cash: 0, card: 0, pix: 0, other: 0 };
    periodOrders.forEach(o => {
      const m = (o.payment || '').toLowerCase();
      if (m.includes('dinheiro') || m.includes('cash'))                   payments.cash  += o.total || 0;
      else if (m.includes('cart') || m.includes('card') || m.includes('cr') || m.includes('db')) payments.card  += o.total || 0;
      else if (m.includes('pix'))                                          payments.pix   += o.total || 0;
      else                                                                 payments.other += o.total || 0;
    });

    return {
      orders:    periodOrders.length,
      revenue,
      avgTicket: periodOrders.length ? revenue / periodOrders.length : 0,
      growth:    prevRevenue ? ((revenue - prevRevenue) / prevRevenue) * 100 : 0,
      payments,
    };
  }, [orders]);

  // Settings
  const updateSettings = useCallback((data) => {
    setRestaurantSettings(prev => ({
      ...prev,
      ...data,
      payments: data.payments || prev.payments,
    }));
  }, []);

  const value = {
    orders,
    analyzing: orders.filter(o => o.status === 'analyzing'),
    production: orders.filter(o => o.status === 'production'),
    ready: orders.filter(o => o.status === 'ready'),
    loadingOrders: false,
    refreshOrders: () => {},
    products,
    categories,
    loadingMenu: false,
    inventory,
    tables,
    leads,
    drivers,
    restaurantSettings,
    loyaltySettings,
    coupons,
    setCoupons,
    setLoyaltySettings,
    moveOrder,
    addOrder,
    addChatMessage,
    removeOrder,
    finalizeSingleOrder,
    finalizeReady,
    addProduct,
    updateProduct,
    deleteProduct,
    addCategory,
    updateCategory,
    deleteCategory,
    addInventoryItem,
    updateInventoryItem,
    deleteInventoryItem,
    addTable,
    updateTable,
    deleteTable,
    addLeadMessage,
    markLeadAsRead,
    updateSettings,
    addDriver,
    removeDriver,
    getStatsForPeriod,
  };

  return (
    <OrdersContext.Provider value={value}>
      {children}
    </OrdersContext.Provider>
  );
}

export const useOrdersContext = () => {
  const context = useContext(OrdersContext);
  if (!context) throw new Error('useOrdersContext must be used within an OrdersProvider');
  return context;
};

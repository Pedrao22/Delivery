import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { initialOrders } from '../data/orders';
import { menuCategories as initialCategories, menuItems as initialProducts } from '../data/menuItems';
import { inventoryItems as initialInventory } from '../data/inventory';
import { drivers as initialDrivers } from '../data/drivers';

const OrdersContext = createContext();

const STORAGE_KEY = 'foodflow_orders';

const DEFAULT_RESTAURANT_SETTINGS = {
  name: 'Pedi&Recebe',
  logo: '🍔',
  primaryColor: '#e74c3c',
  isOpen: true,
  deliveryTime: '40 a 60 min',
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

const DEFAULT_COUPONS = [
  { id: 1, code: 'BEMVINDO10', type: 'percentage', value: '10', minOrder: '30', active: true },
  { id: 2, code: 'FRETE0', type: 'shipping', value: '0', minOrder: '50', active: true },
];

export function OrdersProvider({ children }) {
  const [orders, setOrders] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try { return JSON.parse(saved); }
      catch { return initialOrders; }
    }
    return initialOrders;
  });

  const [products, setProducts] = useState(() => {
    try {
      const saved = localStorage.getItem('foodflow_products');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Validate new format — old cache has 'name', new has 'nome'
        if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].nome) return parsed;
      }
    } catch {}
    localStorage.removeItem('foodflow_products');
    return initialProducts;
  });

  const [categories, setCategories] = useState(() => {
    try {
      const saved = localStorage.getItem('foodflow_categories');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Validate new format — old cache has 'name', new has 'nome'
        if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].nome) return parsed;
      }
    } catch {}
    localStorage.removeItem('foodflow_categories');
    return initialCategories;
  });

  const [inventory, setInventory] = useState(() => {
    const saved = localStorage.getItem('foodflow_inventory');
    return saved ? JSON.parse(saved) : initialInventory;
  });

  const [tables, setTables] = useState(() => {
    const saved = localStorage.getItem('foodflow_tables');
    return saved ? JSON.parse(saved) : [
      { id: 1, numero: 1, seats: 4, status: 'free' },
      { id: 2, numero: 2, seats: 2, status: 'free' },
      { id: 3, numero: 3, seats: 6, status: 'free' },
      { id: 4, numero: 4, seats: 4, status: 'free' },
      { id: 5, numero: 5, seats: 6, status: 'free' },
      { id: 6, numero: 6, seats: 4, status: 'free' },
    ];
  });

  const [leads, setLeads] = useState(() => {
    const saved = localStorage.getItem('foodflow_leads');
    return saved ? JSON.parse(saved) : [];
  });

  const [restaurantSettings, setRestaurantSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('foodflow_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Discard cache with old brand name
        if (parsed.name && parsed.name !== 'FoodFlow' && parsed.name !== 'Admin Silva') return parsed;
      }
    } catch {}
    localStorage.removeItem('foodflow_settings');
    return DEFAULT_RESTAURANT_SETTINGS;
  });

  const [loyaltySettings, setLoyaltySettings] = useState(() => {
    const saved = localStorage.getItem('foodflow_loyalty');
    return saved ? JSON.parse(saved) : DEFAULT_LOYALTY;
  });

  const [coupons, setCoupons] = useState(() => {
    const saved = localStorage.getItem('foodflow_coupons');
    return saved ? JSON.parse(saved) : DEFAULT_COUPONS;
  });

  const [drivers, setDrivers] = useState(() => {
    const saved = localStorage.getItem('foodflow_drivers');
    return saved ? JSON.parse(saved) : initialDrivers;
  });

  // Persist all state
  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(orders)); }, [orders]);
  useEffect(() => { localStorage.setItem('foodflow_products', JSON.stringify(products)); }, [products]);
  useEffect(() => { localStorage.setItem('foodflow_categories', JSON.stringify(categories)); }, [categories]);
  useEffect(() => { localStorage.setItem('foodflow_inventory', JSON.stringify(inventory)); }, [inventory]);
  useEffect(() => { localStorage.setItem('foodflow_tables', JSON.stringify(tables)); }, [tables]);
  useEffect(() => { localStorage.setItem('foodflow_leads', JSON.stringify(leads)); }, [leads]);
  useEffect(() => { localStorage.setItem('foodflow_settings', JSON.stringify(restaurantSettings)); }, [restaurantSettings]);
  useEffect(() => { localStorage.setItem('foodflow_loyalty', JSON.stringify(loyaltySettings)); }, [loyaltySettings]);
  useEffect(() => { localStorage.setItem('foodflow_coupons', JSON.stringify(coupons)); }, [coupons]);
  useEffect(() => { localStorage.setItem('foodflow_drivers', JSON.stringify(drivers)); }, [drivers]);

  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === STORAGE_KEY && e.newValue) setOrders(JSON.parse(e.newValue));
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

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

  // Products — updateProduct accepts (id, data) OR (item) signature
  const addProduct = useCallback((data) => setProducts(prev => [...prev, { ...data, id: Date.now(), ativo: true }]), []);
  const updateProduct = useCallback((idOrItem, data) => {
    if (data !== undefined) {
      setProducts(prev => prev.map(x => x.id === idOrItem ? { ...x, ...data } : x));
    } else {
      setProducts(prev => prev.map(x => x.id === idOrItem.id ? idOrItem : x));
    }
  }, []);
  const deleteProduct = useCallback((id) => setProducts(prev => prev.filter(x => x.id !== id)), []);

  // Categories — updateCategory accepts (id, data) OR (item) signature
  const addCategory = useCallback((c) => setCategories(prev => [...prev, { ...c, id: c.id || Date.now() }]), []);
  const updateCategory = useCallback((idOrItem, data) => {
    if (data !== undefined) {
      setCategories(prev => prev.map(x => x.id === idOrItem ? { ...x, ...data } : x));
    } else {
      setCategories(prev => prev.map(x => x.id === idOrItem.id ? idOrItem : x));
    }
  }, []);
  const deleteCategory = useCallback((id) => setCategories(prev => prev.filter(x => x.id !== id)), []);

  // Drivers
  const addDriver = useCallback((d) => setDrivers(prev => [...prev, { ...d, id: Date.now() }]), []);
  const removeDriver = useCallback((id) => setDrivers(prev => prev.filter(d => d.id !== id)), []);

  // Inventory
  const addInventoryItem = useCallback((item) => setInventory(prev => [...prev, { ...item, id: Date.now() }]), []);
  const updateInventoryItem = useCallback((item) => setInventory(prev => prev.map(i => i.id === item.id ? item : i)), []);
  const deleteInventoryItem = useCallback((id) => setInventory(prev => prev.filter(i => i.id !== id)), []);

  // Tables
  const addTable = useCallback((t) => setTables(prev => [...prev, { ...t, id: Date.now() }]), []);
  const updateTable = useCallback((id, data) => setTables(prev => prev.map(t => t.id === id ? { ...t, ...data } : t)), []);
  const deleteTable = useCallback((id) => setTables(prev => prev.filter(t => t.id !== id)), []);

  // Leads / Chat
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

  // Restaurant Settings
  const updateSettings = useCallback((data) => {
    setRestaurantSettings(prev => ({ ...prev, ...data, payments: data.payments || prev.payments }));
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

import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiFetch } from '../lib/supabase';
import { useAuth } from './AuthContext';

const OrdersContext = createContext();

export const useOrdersContext = () => useContext(OrdersContext);

export const OrdersProvider = ({ children }) => {
  const { user, profile, impersonatedId } = useAuth();
  
  // --- catalog (Products & Categories) ---
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loadingMenu, setLoadingMenu] = useState(false);

  const refreshMenu = async () => {
    setLoadingMenu(true);
    try {
      const [pRes, cRes] = await Promise.all([
        apiFetch('/menu/products'),
        apiFetch('/menu/categories')
      ]);
      if (pRes) setProducts(pRes);
      if (cRes) setCategories(cRes);
    } finally {
      setLoadingMenu(false);
    }
  };

  const addCategory = async (data) => {
    const res = await apiFetch('/menu/categories', { method: 'POST', body: JSON.stringify(data) });
    if (res) refreshMenu();
    return res;
  };

  const updateCategory = async (id, data) => {
    const res = await apiFetch(`/menu/categories/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
    if (res) refreshMenu();
    return res;
  };

  const deleteCategory = async (id) => {
    await apiFetch(`/menu/categories/${id}`, { method: 'DELETE' });
    refreshMenu();
  };

  const addProduct = async (data) => {
    const res = await apiFetch('/menu/products', { method: 'POST', body: JSON.stringify(data) });
    if (res) refreshMenu();
    return res;
  };

  const updateProduct = async (id, data) => {
    const res = await apiFetch(`/menu/products/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
    if (res) refreshMenu();
    return res;
  };

  const deleteProduct = async (id) => {
    await apiFetch(`/menu/products/${id}`, { method: 'DELETE' });
    refreshMenu();
  };

  // --- ORDERS, TABLES & SETTINGS (DATABASE DRIVEN) ---
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [tables, setTables] = useState([]);
  const [leads, setLeads] = useState([]);
  const [restaurantSettings, setRestaurantSettings] = useState({
    name: 'Pedi&Recebe',
    logo: '🍔',
    primaryColor: '#e74c3c',
    isOpen: true,
    payments: {}
  });

  // Fetch all operational data
  const refreshAll = async () => {
    if (!user) return;

    setLoadingOrders(true);
    try {
      const results = await Promise.allSettled([
        apiFetch('/orders'),
        apiFetch('/restaurants/me'),
        apiFetch('/tables'),
        apiFetch('/leads'),
      ]);

      const [ordRes, setRes, tabRes, leadRes] = results.map(r =>
        r.status === 'fulfilled' ? r.value : null
      );

      // Unwrap {success, data} envelope where present
      if (ordRes) {
        setOrders(Array.isArray(ordRes) ? ordRes : (ordRes?.data || []));
      }
      if (setRes) {
        const restaurant = setRes?.success ? setRes.data : setRes;
        if (restaurant) setRestaurantSettings({ ...restaurant, payments: restaurant.payments_config || {} });
      }
      if (tabRes) {
        setTables(tabRes?.success ? tabRes.data : (Array.isArray(tabRes) ? tabRes : []));
      }
      if (leadRes) {
        setLeads(leadRes?.success ? leadRes.data : (Array.isArray(leadRes) ? leadRes : []));
      }
    } catch (err) {
      console.error('Erro ao sincronizar dados:', err);
    } finally {
      setLoadingOrders(false);
    }
  };

  useEffect(() => {
    if (user && profile) {
      // Super admin sem impersonação não gerencia um restaurante específico
      const isSuperWithoutRestaurant = profile.role === 'super_admin' && !impersonatedId;
      if (!isSuperWithoutRestaurant) {
        refreshMenu();
        refreshAll();
      }
    }
  }, [user, profile, impersonatedId]);

  // --- SETTINGS ACTIONS ---
  const updateSettings = async (formData) => {
    const res = await apiFetch('/restaurants/me', {
      method: 'PATCH',
      body: JSON.stringify({
        ...formData,
        payments_config: formData.payments
      })
    });
    if (res) {
      setRestaurantSettings({ ...res, payments: res.payments_config });
      return res;
    }
  };

  // --- TABLE ACTIONS ---
  const addTable = async (tableData) => {
    const res = await apiFetch('/tables', {
      method: 'POST',
      body: JSON.stringify(tableData)
    });
    if (res) refreshAll();
    return res;
  };

  const updateTable = async (id, tableData) => {
    const res = await apiFetch(`/tables/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(tableData)
    });
    if (res) refreshAll();
    return res;
  };

  const deleteTable = async (id) => {
    await apiFetch(`/tables/${id}`, { method: 'DELETE' });
    refreshAll();
  };

  // --- ORDER ACTIONS ---
  const addOrder = async (orderData) => {
    const res = await apiFetch('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData)
    });
    if (res) refreshAll();
    return res;
  };

  const moveOrder = async (orderId, newStatus) => {
    const res = await apiFetch(`/orders/${orderId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: newStatus })
    });
    if (res) refreshAll();
    return res;
  };

  const finalizeReady = () => setOrders(prev => prev.filter(o => o.status !== 'ready'));
  const finalizeSingleOrder = (orderId) => setOrders(prev => prev.filter(o => o.id !== orderId));
  const removeOrder = (orderId) => setOrders(prev => prev.filter(o => o.id !== orderId));

  // --- LEAD ACTIONS ---
  const addLeadMessage = async (leadId, text, sender = 'admin') => {
    // Busca o lead atual
    const lead = leads.find(l => l.id === leadId);
    if (!lead) return;

    const newMessage = {
      text,
      sender,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const updatedChat = [...(lead.chat || []), newMessage];

    await apiFetch(`/leads/${leadId}`, {
      method: 'PATCH',
      body: JSON.stringify({
        chat: updatedChat,
        lastMessage: text,
        unread: sender === 'customer'
      })
    });

    refreshAll();
  };

  const markLeadAsRead = async (leadId) => {
    await apiFetch(`/leads/${leadId}`, {
      method: 'PATCH',
      body: JSON.stringify({ unread: false })
    });
    refreshAll();
  };

  // --- DASHBOARD STATS LOGIC ---
  const getStatsForPeriod = (days) => {
    const now = new Date();
    const cutoff = new Date();
    cutoff.setDate(now.getDate() - parseInt(days));
    
    // Filter orders in period
    const periodOrders = orders.filter(o => new Date(o.criado_em) >= cutoff);
    
    // Previous period for growth calculation
    const prevCutoff = new Date(cutoff);
    prevCutoff.setDate(prevCutoff.getDate() - parseInt(days));
    const prevOrders = orders.filter(o => {
      const d = new Date(o.criado_em);
      return d >= prevCutoff && d < cutoff;
    });

    const revenue = periodOrders.reduce((sum, o) => sum + Number(o.total), 0);
    const prevRevenue = prevOrders.reduce((sum, o) => sum + Number(o.total), 0);
    const growth = prevRevenue === 0 ? 100 : ((revenue - prevRevenue) / prevRevenue) * 100;

    // Payments breakdown
    const payments = { pix: 0, card: 0, cash: 0 };
    periodOrders.forEach(o => {
      const p = (o.pagamento || '').toLowerCase();
      if (p.includes('pix')) payments.pix += Number(o.total);
      else if (p.includes('cart') || p.includes('deb') || p.includes('cred')) payments.card += Number(o.total);
      else payments.cash += Number(o.total);
    });

    // Daily data for chart (simple mock integration)
    const dailyData = Array.from({ length: parseInt(days) === 1 ? 24 : parseInt(days) }, (_, i) => {
      const label = parseInt(days) === 1 ? `${i}h` : `Dia ${i + 1}`;
      return { label, value: Math.floor(Math.random() * (revenue / (parseInt(days) || 1)) * 1.5) };
    });

    return {
      revenue,
      ordersCount: periodOrders.length,
      ticket: periodOrders.length === 0 ? 0 : revenue / periodOrders.length,
      growth,
      dailyData,
      payments
    };
  };

  const analyzing = orders.filter(o => o.status === 'analyzing');
  const production = orders.filter(o => o.status === 'production');
  const ready = orders.filter(o => o.status === 'ready');

  return (
    <OrdersContext.Provider value={{
      orders, analyzing, production, ready, leads,
      tables, addTable, updateTable, deleteTable,
      addOrder, moveOrder, removeOrder, finalizeReady, finalizeSingleOrder,
      addLeadMessage, markLeadAsRead,
      products, categories, loadingMenu, refreshMenu,
      addCategory, updateCategory, deleteCategory,
      addProduct, updateProduct, deleteProduct,
      restaurantSettings, updateSettings, refreshOrders: refreshAll,
      getStatsForPeriod
    }}>
      {children}
    </OrdersContext.Provider>
  );
};

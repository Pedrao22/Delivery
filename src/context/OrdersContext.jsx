import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { initialOrders } from '../data/orders';
import { menuCategories as initialCategories, menuItems as initialProducts } from '../data/menuItems';

const OrdersContext = createContext();

const STORAGE_KEY = 'foodflow_orders';

export function OrdersProvider({ children }) {
  const [orders, setOrders] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved orders', e);
        return initialOrders;
      }
    }
    return initialOrders;
  });

  const [products, setProducts] = useState(() => {
    const saved = localStorage.getItem('foodflow_products');
    return saved ? JSON.parse(saved) : initialProducts;
  });

  const [categories, setCategories] = useState(() => {
    const saved = localStorage.getItem('foodflow_categories');
    return saved ? JSON.parse(saved) : initialCategories;
  });

  // Save to localStorage whenever data changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem('foodflow_products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('foodflow_categories', JSON.stringify(categories));
  }, [categories]);

  // Sync state across tabs
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        setOrders(JSON.parse(e.newValue));
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const moveOrder = useCallback((orderId, newStatus) => {
    setOrders(prev => prev.map(order =>
      order.id === orderId ? { ...order, status: newStatus } : order
    ));
  }, []);

  const addChatMessage = useCallback((orderId, text, sender = 'admin') => {
    setOrders(prev => prev.map(order => {
      if (order.id === orderId) {
        return {
          ...order,
          chat: [...(order.chat || []), {
            id: Date.now(),
            text,
            sender,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }]
        };
      }
      return order;
    }));
  }, []);

  const addOrder = useCallback((orderData) => {
    const id = `PED-${String(orders.length + 1).padStart(3, '0')}`;
    const confirmCode = String(Math.floor(1000 + Math.random() * 9000));
    const newOrder = {
      ...orderData,
      id,
      confirmCode,
      status: 'analyzing',
      createdAt: new Date().toISOString(),
      chat: [
        { 
          id: 1, 
          text: `Olá! Acabei de fazer meu pedido. Pode confirmar se receberam?`, 
          sender: 'customer', 
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
        }
      ]
    };
    setOrders(prev => [newOrder, ...prev]);
    return id;
  }, [orders.length]);

  const removeOrder = useCallback((orderId) => {
    setOrders(prev => prev.filter(o => o.id !== orderId));
  }, []);

  // Product Management
  const updateProduct = useCallback((updatedProduct) => {
    setProducts(prev => prev.map(p => p.id === updatedProduct.id ? updatedProduct : p));
  }, []);

  const addProduct = useCallback((newProduct) => {
    setProducts(prev => [...prev, { ...newProduct, id: Date.now() }]);
  }, []);

  const deleteProduct = useCallback((id) => {
    setProducts(prev => prev.filter(p => p.id !== id));
  }, []);

  // Category Management
  const addCategory = useCallback((category) => {
    setCategories(prev => [...prev, category]);
  }, []);

  const updateCategory = useCallback((updatedCat) => {
    setCategories(prev => prev.map(c => c.id === updatedCat.id ? updatedCat : c));
  }, []);

  const deleteCategory = useCallback((id) => {
    setCategories(prev => prev.filter(c => c.id !== id));
  }, []);

  const finalizeReady = useCallback(() => {
    setOrders(prev => prev.filter(o => o.status !== 'ready'));
  }, []);

  const value = {
    orders,
    analyzing: orders.filter(o => o.status === 'analyzing'),
    production: orders.filter(o => o.status === 'production'),
    ready: orders.filter(o => o.status === 'ready'),
    products,
    categories,
    moveOrder,
    addOrder,
    addChatMessage,
    removeOrder,
    finalizeReady,
    updateProduct,
    addProduct,
    deleteProduct,
    addCategory,
    updateCategory,
    deleteCategory,
  };

  return (
    <OrdersContext.Provider value={value}>
      {children}
    </OrdersContext.Provider>
  );
}

export const useOrdersContext = () => {
  const context = useContext(OrdersContext);
  if (!context) {
    throw new Error('useOrdersContext must be used within an OrdersProvider');
  }
  return context;
};

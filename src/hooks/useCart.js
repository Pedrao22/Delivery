import { useState, useCallback } from 'react';

export function useCart() {
  const [items, setItems] = useState([]);

  const addItem = useCallback((product, variation = null, complements = [], qty = 1, obs = '') => {
    const id = Date.now() + Math.random();
    const complementsTotal = complements.reduce((sum, c) => sum + (c.price || 0), 0);
    const variationPrice = variation ? (variation.price || 0) : 0;
    const unitPrice = parseFloat(product.preco || 0) + variationPrice + complementsTotal;

    setItems(prev => [...prev, {
      id,
      productId: product.id,
      name: product.nome,
      variation: variation?.name || '',
      complements: complements.map(c => c.name || c),
      qty,
      unitPrice,
      price: unitPrice * qty,
      obs,
    }]);
  }, []);

  const removeItem = useCallback((itemId) => {
    setItems(prev => prev.filter(i => i.id !== itemId));
  }, []);

  const updateQty = useCallback((itemId, newQty) => {
    if (newQty <= 0) {
      setItems(prev => prev.filter(i => i.id !== itemId));
      return;
    }
    setItems(prev => prev.map(i =>
      i.id === itemId ? { ...i, qty: newQty, price: i.unitPrice * newQty } : i
    ));
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const total = items.reduce((sum, i) => sum + i.price, 0);
  const count = items.reduce((sum, i) => sum + i.qty, 0);

  return {
    items,
    total,
    count,
    addItem,
    removeItem,
    updateQty,
    clearCart,
  };
}

import React, { useState, useMemo, useEffect } from 'react';
import { 
  Search, Filter, ShoppingCart, User, Phone, 
  Trash2, Edit3, Save, ChevronRight, X,
  LayoutGrid, Utensils, CheckCircle2, Clock, Printer
} from 'lucide-react';
import Modal from '../components/shared/Modal';
import { useOrdersContext } from '../context/OrdersContext';
import { useCart } from '../hooks/useCart';
import { useLocation } from 'react-router-dom';
import Button from '../components/shared/Button';
import PrintReceipt from '../components/shared/PrintReceipt';
import './PosPage.css';

export default function PosPage() {
  const { products, categories, tables, addOrder, restaurantSettings, loadingOrders } = useOrdersContext();
  const { items, total, addItem, removeItem, updateQty, clearCart } = useCart();
  const location = useLocation();
  
  const [activeTab, setActiveTab] = useState('delivery');
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [customerInfo, setCustomerInfo] = useState({ name: '', phone: '' });
  const [obs, setObs] = useState('');
  const [selectedTable, setSelectedTable] = useState(null);
  
  // Modals & Options
  const [activeModal, setActiveModal] = useState(null); 
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selection, setSelection] = useState({ variation: null, complements: [], comboItems: [] });
  
  const [deliveryDetails, setDeliveryDetails] = useState({ type: 'delivery', fee: 0, address: '', reference: '' });
  const [paymentDetails, setPaymentDetails] = useState({ method: 'Pix Balcão' });
  const [adjustments, setAdjustments] = useState({ discount: 0, addition: 0 });

  const [lastOrderCreated, setLastOrderCreated] = useState(null);

  // Filter items
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = p.nome.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = activeCategory === 'all' || p.categoria_id === activeCategory;
      return matchesSearch && matchesCategory && p.ativo !== false;
    });
  }, [products, search, activeCategory]);

  const handleProductClick = (product) => {
    if (product.variacoes?.length > 0 || product.config?.is_combo) {
      setSelectedProduct(product);
      setSelection({ variation: product.variacoes?.[0] || null, complements: [], comboItems: [] });
      setActiveModal('options');
    } else {
      addItem(product);
    }
  };

  const handleAddWithOptions = () => {
    addItem(selectedProduct, selection.variation, selection.complements, 1, '');
    setActiveModal(null);
    setSelectedProduct(null);
  };

  const handleGenerateOrder = async () => {
    if (items.length === 0) return;
    
    const orderData = {
      items: items.map(i => ({
        nome: i.name,
        variation: i.variation,
        qty: i.qty,
        price: i.unitPrice,
        obs: i.obs || '',
      })),
      total: total + deliveryDetails.fee + adjustments.addition - adjustments.discount,
      type: deliveryDetails.type,
      payment: paymentDetails.method,
      customer: {
        name: customerInfo.name || 'Cliente Balcão',
        phone: customerInfo.phone,
        address: deliveryDetails.address,
        reference: deliveryDetails.reference
      },
      obs: obs,
      table_id: activeTab === 'tables' ? selectedTable : null,
      discounts: adjustments.discount,
      additions: adjustments.addition,
      delivery_fee: deliveryDetails.fee
    };

    try {
      const res = await addOrder(orderData);
      if (res) {
        setLastOrderCreated(res);
        // Delay slighty to ensure component renders before print
        setTimeout(() => {
          window.print();
          resetForm();
        }, 500);
      }
    } catch (err) {
      alert('Erro ao gerar pedido: ' + err.message);
    }
  };

  const resetForm = () => {
    clearCart();
    setCustomerInfo({ name: '', phone: '' });
    setObs('');
    setLastOrderCreated(null);
    setAdjustments({ discount: 0, addition: 0 });
  };

  return (
    <div className="pos-page">
      <div className="pos-main">
        <div className="pos-tabs">
          <button className={`pos-tab ${activeTab === 'delivery' ? 'active' : ''}`} onClick={() => setActiveTab('delivery')}>[ D ] Delivery</button>
          <button className={`pos-tab ${activeTab === 'tables' ? 'active' : ''}`} onClick={() => setActiveTab('tables')}>[ M ] Mesas</button>
        </div>

        <div className="pos-controls">
          <div className="pos-search-wrapper">
            <Search size={18} className="pos-search-icon" />
            <input type="text" placeholder="Buscar produto..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>

        <div className="pos-categories-grid">
          <div className={`pos-category-card ${activeCategory === 'all' ? 'active' : ''}`} onClick={() => setActiveCategory('all')}>
            <span>🍽️</span><p>TODOS</p>
          </div>
          {categories.map(cat => (
            <div key={cat.id} className={`pos-category-card ${activeCategory === cat.id ? 'active' : ''}`} onClick={() => setActiveCategory(cat.id)}>
              <span>{cat.icone}</span><p>{cat.nome.toUpperCase()}</p>
            </div>
          ))}
        </div>

        <div className="pos-products-grid">
          {filteredProducts.map(product => (
            <div key={product.id} className="pos-product-card" onClick={() => handleProductClick(product)}>
              <div className="pos-product-image">{product.imagem_emoji}</div>
              <div className="pos-product-info">
                <div className="pos-product-name">{product.nome}</div>
                <div className="pos-product-price">R$ {parseFloat(product.preco).toFixed(2)}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="pos-sidebar">
        <div className="pos-cart-container">
          <div className="pos-cart-title">Itens do Pedido</div>
          <div className="pos-cart-list">
            {items.length === 0 ? <div className="pos-cart-empty">Carrinho vazio</div> : (
              items.map(item => (
                <div key={item.id} className="pos-cart-item">
                  <div className="pos-cart-item-main">
                    <span className="pos-cart-item-name">{item.qty}x {item.name} {item.variation && `(${item.variation})`}</span>
                    <span className="pos-cart-item-total">R$ {item.price.toFixed(2)}</span>
                  </div>
                  <div className="pos-cart-item-actions">
                    <button onClick={() => updateQty(item.id, item.qty - 1)}>-</button>
                    <button onClick={() => updateQty(item.id, item.qty + 1)}>+</button>
                    <button onClick={() => removeItem(item.id)}><X size={12} /></button>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="pos-summary">
            <div className="pos-summary-row"><span>Subtotal</span><span>R$ {total.toFixed(2)}</span></div>
            <div className="pos-total-row"><span>Total</span><span>R$ {(total + deliveryDetails.fee - adjustments.discount).toFixed(2)}</span></div>
          </div>
          <div className="pos-customer-form">
            <input type="text" placeholder="Nome do cliente" value={customerInfo.name} onChange={e => setCustomerInfo({...customerInfo, name: e.target.value})} />
            <div className="pos-action-buttons">
              <button onClick={() => setActiveModal('delivery')}>Entrega</button>
              <button onClick={() => setActiveModal('payment')}>{paymentDetails.method.split(' ')[0]}</button>
            </div>
          </div>
          <button className="pos-generate-btn" onClick={handleGenerateOrder} disabled={items.length === 0}>
            [ ENTER ] Gerar e Imprimir
          </button>
        </div>
      </div>

      {/* Options Modal */}
      <Modal isOpen={activeModal === 'options'} onClose={() => setActiveModal(null)} title="Opções do Produto">
        {selectedProduct && (
          <div className="options-modal-content">
            {selectedProduct.variacoes?.length > 0 && (
              <div className="options-section">
                <h4>Selecione o Tamanho/Sabor</h4>
                <div className="options-grid">
                  {selectedProduct.variacoes.map((v, i) => (
                    <button key={i} className={`option-chip ${selection.variation?.name === v.name ? 'active' : ''}`} onClick={() => setSelection({...selection, variation: v})}>
                      {v.name} (+R$ {v.price})
                    </button>
                  ))}
                </div>
              </div>
            )}
            {selectedProduct.config?.is_combo && (
              <div className="options-section">
                <h4>Itens do Combo</h4>
                <p>Este item inclui uma seleção pré-definida.</p>
              </div>
            )}
            <Button fullWidth onClick={handleAddWithOptions}>Adicionar ao Pedido</Button>
          </div>
        )}
      </Modal>

      {/* Other Modals (Delivery/Payment) - Simplified for brevity */}
      <Modal isOpen={activeModal === 'delivery'} onClose={() => setActiveModal(null)} title="Entrega">
        <div className="form-group">
          <label>Endereço</label>
          <input type="text" value={deliveryDetails.address} onChange={e => setDeliveryDetails({...deliveryDetails, address: e.target.value})} />
        </div>
        <div className="form-group">
          <label>Taxa (R$)</label>
          <input type="number" value={deliveryDetails.fee} onChange={e => setDeliveryDetails({...deliveryDetails, fee: parseFloat(e.target.value) || 0})} />
        </div>
        <Button onClick={() => setActiveModal(null)}>Confirmar</Button>
      </Modal>

      {/* Receipt Preview (Hidden from screen, visible on print) */}
      {lastOrderCreated && <PrintReceipt order={lastOrderCreated} settings={restaurantSettings} />}
    </div>
  );
}

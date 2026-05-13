import { useState, useEffect, useRef } from 'react';
import { Plus, ShoppingCart, Loader2 } from 'lucide-react';
import { useOrdersContext } from '../context/OrdersContext';
import TopBar from '../components/layout/TopBar';
import KanbanBoard from '../components/orders/KanbanBoard';
import MenuGrid from '../components/menu/MenuGrid';
import Cart from '../components/menu/Cart';
import SearchInput from '../components/shared/SearchInput';
import FilterTabs from '../components/shared/FilterTabs';
import Button from '../components/shared/Button';
import Modal from '../components/shared/Modal';
import ThermalTicket from '../components/orders/ThermalTicket';
import { useCart } from '../hooks/useCart';
import './OrdersPage.css';

const filterTabs = [
  { value: 'all', label: 'Todos' },
  { value: 'delivery', label: '🛵 Delivery' },
  { value: 'pickup', label: '🏪 Retirada' },
  { value: 'local', label: '🍽️ Local' },
];

export default function OrdersPage({ onMenuToggle }) {
  const {
    orders, loadingOrders, refreshOrders,
    moveOrder, finalizeReady, finalizeSingleOrder, addOrder,
    restaurantSettings, drivers, assignDriverToOrder,
  } = useOrdersContext();

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [showNewOrder, setShowNewOrder] = useState(false);
  const [showCart, setShowCart] = useState(false);
  const [printOrder, setPrintOrder] = useState(null);
  const printRef = useRef(false);
  const { items, total, count, addItem, removeItem, updateQty, clearCart } = useCart();

  const printerEnabled = restaurantSettings?.printerEnabled ?? false;
  const printerCopies  = Math.max(1, Math.min(3, restaurantSettings?.printerCopies || 1));

  // Auto-print when an order moves to production
  const handleMoveOrder = (orderId, newStatus) => {
    if (newStatus === 'production' && printerEnabled) {
      const order = orders.find(o => o.id === orderId);
      if (order) setPrintOrder({ ...order, status: 'production' });
    }
    return moveOrder(orderId, newStatus);
  };

  useEffect(() => {
    if (!printOrder || printRef.current) return;
    printRef.current = true;
    const timer = setTimeout(async () => {
      for (let i = 0; i < printerCopies; i++) {
        if (i > 0) await new Promise(r => setTimeout(r, 800));
        window.print();
      }
      setTimeout(() => {
        setPrintOrder(null);
        printRef.current = false;
      }, 500);
    }, 300);
    return () => clearTimeout(timer);
  }, [printOrder]); // eslint-disable-line

  // Real-time polling
  useEffect(() => {
    const interval = setInterval(() => {
      refreshOrders();
    }, 30000); // 30s
    return () => clearInterval(interval);
  }, []);

  // Filter orders
  let filteredOrders = orders;
  if (filter !== 'all') {
    filteredOrders = filteredOrders.filter(o => o.type === filter);
  }
  if (search.trim()) {
    const q = search.toLowerCase();
    filteredOrders = filteredOrders.filter(o =>
      o.cliente_nome?.toLowerCase().includes(q) ||
      o.codigo?.toLowerCase().includes(q)
    );
  }

  const handleConfirmOrder = async (orderData) => {
    await addOrder(orderData);
    setShowNewOrder(false);
    clearCart();
  };

  return (
    <>
      <TopBar
        title="Gestão de Pedidos"
        subtitle={loadingOrders ? 'Atualizando...' : `${orders.length} pedidos ativos`}
        onMenuClick={onMenuToggle}
      >
        <div className="orders-topbar-search">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Buscar por cliente ou código..."
          />
        </div>
        <Button size="sm" onClick={() => setShowNewOrder(true)} icon={loadingOrders ? <Loader2 className="animate-spin" size={14} /> : <Plus size={14} />}>
          Novo Pedido
        </Button>
      </TopBar>

      <div className="orders-filter-bar">
        <FilterTabs tabs={filterTabs} active={filter} onChange={setFilter} />
        <span className="orders-count-label">
          {filteredOrders.length} {filteredOrders.length === 1 ? 'pedido' : 'pedidos'}
        </span>
      </div>

      <KanbanBoard
        orders={filteredOrders}
        onMoveOrder={handleMoveOrder}
        onFinalizeReady={finalizeReady}
        onFinalizeOrder={finalizeSingleOrder}
        drivers={drivers}
        onAssignDriver={assignDriverToOrder}
        restaurantAddress={restaurantSettings?.endereco || ''}
      />

      <ThermalTicket
        order={printOrder}
        restaurantName={restaurantSettings?.name || restaurantSettings?.nome}
        paperWidth={restaurantSettings?.printerWidth || '58mm'}
      />

      {/* New Order Modal */}
      <Modal
        isOpen={showNewOrder}
        onClose={() => setShowNewOrder(false)}
        title="Novo Pedido"
        size="full"
        footer={
          count > 0 ? (
            <Button onClick={() => { setShowNewOrder(false); setShowCart(true); }} icon={<ShoppingCart size={16} />}>
              Ver Carrinho ({count}) — R$ {total.toFixed(2).replace('.', ',')}
            </Button>
          ) : null
        }
      >
        <MenuGrid onAddToCart={addItem} />
      </Modal>

      {/* Cart */}
      <Cart
        items={items}
        total={total}
        count={count}
        onUpdateQty={updateQty}
        onRemove={removeItem}
        onClear={clearCart}
        onConfirm={handleConfirmOrder}
        isOpen={showCart}
        onClose={() => setShowCart(false)}
      />
    </>
  );
}

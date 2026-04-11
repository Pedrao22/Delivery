import { useState } from 'react';
import { Plus, ShoppingCart } from 'lucide-react';
import TopBar from '../components/layout/TopBar';
import KanbanBoard from '../components/orders/KanbanBoard';
import MenuGrid from '../components/menu/MenuGrid';
import Cart from '../components/menu/Cart';
import SearchInput from '../components/shared/SearchInput';
import FilterTabs from '../components/shared/FilterTabs';
import Button from '../components/shared/Button';
import Modal from '../components/shared/Modal';
import { useCart } from '../hooks/useCart';

const filterTabs = [
  { value: 'all', label: 'Todos' },
  { value: 'delivery', label: '🛵 Delivery' },
  { value: 'pickup', label: '🏪 Retirada' },
  { value: 'local', label: '🍽️ Local' },
];

export default function OrdersPage({ orders, onMoveOrder, onFinalizeReady, onAddOrder, onMenuToggle }) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [showNewOrder, setShowNewOrder] = useState(false);
  const [showCart, setShowCart] = useState(false);
  const { items, total, count, addItem, removeItem, updateQty, clearCart } = useCart();

  // Filter orders
  let filteredOrders = orders;
  if (filter !== 'all') {
    filteredOrders = filteredOrders.filter(o => o.type === filter);
  }
  if (search.trim()) {
    const q = search.toLowerCase();
    filteredOrders = filteredOrders.filter(o =>
      o.customer.name.toLowerCase().includes(q) ||
      o.id.toLowerCase().includes(q)
    );
  }

  const handleConfirmOrder = (orderData) => {
    onAddOrder(orderData);
    setShowNewOrder(false);
  };

  return (
    <>
      <TopBar
        title="Pedidos"
        subtitle={`${orders.length} pedidos ativos`}
        onMenuClick={onMenuToggle}
      >
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Buscar pedido..."
        />
        <FilterTabs tabs={filterTabs} active={filter} onChange={setFilter} />
        <Button onClick={() => setShowNewOrder(true)} icon={<Plus size={16} />}>
          Novo Pedido
        </Button>
      </TopBar>

      <KanbanBoard
        orders={filteredOrders}
        onMoveOrder={onMoveOrder}
        onFinalizeReady={onFinalizeReady}
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

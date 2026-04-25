import { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import Sidebar from './components/layout/Sidebar';
import TopBar from './components/layout/TopBar';
import OrdersPage from './pages/OrdersPage';
import MenuManagementPage from './pages/MenuManagementPage';
import DashboardPage from './components/dashboard/DashboardPage';
import InventoryPage from './components/inventory/InventoryPage';
import DeliveryPage from './components/delivery/DeliveryPage';
import FinancialPage from './components/financial/FinancialPage';
import CustomerView from './components/customer/CustomerView';
import { useOrdersContext, OrdersProvider } from './context/OrdersContext';
import { useTheme } from './hooks/useTheme';
import './App.css';

function PageWrapper({ title, subtitle, onMenuToggle, children }) {
  return (
    <>
      <TopBar title={title} subtitle={subtitle} onMenuClick={onMenuToggle} />
      <div className="page-content">
        {children}
      </div>
    </>
  );
}

function AppContent() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { orders, analyzing, production, ready, moveOrder, addOrder, removeOrder, finalizeReady } = useOrdersContext();
  const { theme, toggleTheme, isDark } = useTheme();
  const [toast, setToast] = useState(null);

  const toggleSidebar = () => setSidebarOpen(prev => !prev);

  const handleAddOrder = (orderData) => {
    const id = addOrder(orderData);
    showToast(`✅ Pedido ${id} criado com sucesso!`);
  };

  const handleMoveOrder = (orderId, newStatus) => {
    if (newStatus === 'cancelled') {
      removeOrder(orderId);
      showToast(`❌ Pedido ${orderId} cancelado`);
    } else {
      moveOrder(orderId, newStatus);
      const labels = { production: 'Em Produção', ready: 'Pronto para Entrega' };
      showToast(`✅ Pedido ${orderId} movido para ${labels[newStatus] || newStatus}`);
    }
  };

  const handleFinalizeReady = () => {
    const count = ready.length;
    finalizeReady();
    showToast(`✅ ${count} pedidos finalizados!`);
  };

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <div className="app-layout">
      <Sidebar
        isOpen={sidebarOpen}
        onToggle={toggleSidebar}
        orderCount={analyzing.length}
        isDark={isDark}
        onToggleTheme={toggleTheme}
      />

      <main className="app-main">
        <Routes>
          <Route
            path="/"
            element={
              <OrdersPage
                orders={orders}
                onMoveOrder={handleMoveOrder}
                onFinalizeReady={handleFinalizeReady}
                onAddOrder={handleAddOrder}
                onMenuToggle={toggleSidebar}
              />
            }
          />
          <Route
            path="/dashboard"
            element={
              <PageWrapper title="Dashboard" subtitle="Meu Desempenho" onMenuToggle={toggleSidebar}>
                <DashboardPage />
              </PageWrapper>
            }
          />
          <Route
            path="/cardapio"
            element={
              <PageWrapper title="Cardápio" subtitle="Gestão de Produtos" onMenuToggle={toggleSidebar}>
                <MenuManagementPage />
              </PageWrapper>
            }
          />
          <Route
            path="/estoque"
            element={
              <PageWrapper title="Estoque" subtitle="Controle de Insumos" onMenuToggle={toggleSidebar}>
                <InventoryPage />
              </PageWrapper>
            }
          />
          <Route
            path="/entregas"
            element={
              <PageWrapper title="Entregas" subtitle="Gestão de Entregadores" onMenuToggle={toggleSidebar}>
                <DeliveryPage />
              </PageWrapper>
            }
          />
          <Route
            path="/financeiro"
            element={
              <PageWrapper title="Financeiro" subtitle="Visão de Receitas" onMenuToggle={toggleSidebar}>
                <FinancialPage />
              </PageWrapper>
            }
          />
          <Route
            path="/cliente"
            element={<CustomerView />}
          />
        </Routes>
      </main>

      {/* Toast */}
      {toast && <div className="toast success">{toast}</div>}
    </div>
  );
}

function App() {
  return (
    <OrdersProvider>
      <AppContent />
    </OrdersProvider>
  );
}

export default App;

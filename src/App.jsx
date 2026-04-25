import { useState, useEffect } from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import Sidebar from './components/layout/Sidebar';
import TopBar from './components/layout/TopBar';
import OrdersPage from './pages/OrdersPage';
import MenuManagementPage from './pages/MenuManagementPage';
import DashboardPage from './components/dashboard/DashboardPage';
import InventoryPage from './components/inventory/InventoryPage';
import DeliveryPage from './components/delivery/DeliveryPage';
import FinancialPage from './components/financial/FinancialPage';
import CustomerView from './components/customer/CustomerView';
import PosPage from './pages/PosPage';
import TablesPage from './pages/TablesPage';
import ChatPage from './pages/ChatPage';
import SettingsPage from './pages/SettingsPage';
import LoyaltyPage from './pages/LoyaltyPage';
import CouponsPage from './pages/CouponsPage';

// Auth & Super Admin
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProtectedRoute } from './components/shared/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import SuperAdminLayout from './pages/super/SuperAdminLayout';
import SuperDashboard from './pages/super/SuperDashboard';
import SuperRestaurantsManagement from './pages/super/RestaurantsManagement';
import SuperLoginPage from './pages/super/SuperLoginPage';
import SuperPasswordReset from './pages/super/SuperPasswordReset';
import AuditHistory from './pages/super/AuditHistory';
import PlansManager from './pages/super/PlansManager';
import GlobalSettings from './pages/super/GlobalSettings';

import { useOrdersContext, OrdersProvider } from './context/OrdersContext';
import { useTheme } from './hooks/useTheme';
import './App.css';

function PageWrapper({ title, subtitle, onMenuToggle, children }) {
  return (
    <>
      <TopBar title={title} subtitle={subtitle} onMenuClick={onMenuToggle} />
      <div className="page-content" style={{ padding: 0 }}>
        {children}
      </div>
    </>
  );
}

function AppContent() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { analyzing } = useOrdersContext();
  const { toggleTheme, isDark } = useTheme();
  const { profile, impersonatedId, stopImpersonating, impersonate } = useAuth();
  const [toast, setToast] = useState(null);
  const location = useLocation();

  const toggleSidebar = () => setSidebarOpen(prev => !prev);

  // Lê ?impersonate=ID vindo do painel super admin
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('impersonate');
    if (id && profile?.role === 'super_admin') {
      window.history.replaceState({}, '', window.location.pathname);
      impersonate(id);
    }
  }, [profile]);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const isCustomerView = location.pathname === '/cliente';

  if (isCustomerView) {
    return (
      <div className="app-customer-mode">
        <Routes>
          <Route path="/cliente" element={<CustomerView />} />
        </Routes>
        {toast && <div className="toast success">{toast}</div>}
      </div>
    );
  }

  // Se for super_admin e não estiver na rota /super, redireciona (opcional)
  if (profile?.role === 'super_admin' && !location.pathname.startsWith('/super') && location.pathname !== '/login' && !impersonatedId) {
     return <Navigate to="/super" replace />;
  }

  return (
    <div className="app-layout">
      {/* Banner de Impersonation (Suporte) */}
      {impersonatedId && (
        <div style={{
          background: 'var(--accent)',
          color: 'white',
          padding: '8px',
          textAlign: 'center',
          fontSize: '0.85rem',
          fontWeight: 700,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '12px',
          zIndex: 9999,
          position: 'sticky',
          top: 0
        }}>
          <span>🛡️ MODO SUPORTE ATIVO: Você está visualizando os dados de um restaurante.</span>
          <button 
            onClick={stopImpersonating}
            style={{
              background: 'white',
              color: 'var(--accent)',
              border: 'none',
              padding: '4px 12px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 800,
              fontSize: '0.75rem'
            }}
          >
            SAIR DO SUPORTE
          </button>
        </div>
      )}

      {/* Sidebar só aparece no Admin de Restaurante */}
      {!location.pathname.startsWith('/super') && (
        <Sidebar
          isOpen={sidebarOpen}
          onToggle={toggleSidebar}
          orderCount={analyzing.length}
          isDark={isDark}
          onToggleTheme={toggleTheme}
        />
      )}

      <main className="app-main">
        <Routes>
          {/* Rota Raiz */}
          <Route
            path="/"
            element={<ProtectedRoute roles={['admin','super_admin']}><OrdersPage onMenuToggle={toggleSidebar} /></ProtectedRoute>}
          />

          {/* Rotas de Restaurante (Admin) - Requerem autenticação */}
          <Route path="/dashboard" element={<ProtectedRoute roles={['admin','super_admin']}><PageWrapper title="Dashboard" subtitle="Meu Desempenho" onMenuToggle={toggleSidebar}><DashboardPage /></PageWrapper></ProtectedRoute>} />
          <Route path="/cardapio" element={<ProtectedRoute roles={['admin','super_admin']}><PageWrapper title="Cardápio" subtitle="Gestão de Produtos" onMenuToggle={toggleSidebar}><MenuManagementPage /></PageWrapper></ProtectedRoute>} />
          <Route path="/estoque" element={<ProtectedRoute roles={['admin','super_admin']}><PageWrapper title="Estoque" subtitle="Controle de Insumos" onMenuToggle={toggleSidebar}><InventoryPage /></PageWrapper></ProtectedRoute>} />
          <Route path="/entregas" element={<ProtectedRoute roles={['admin','super_admin']}><PageWrapper title="Entregas" subtitle="Gestão de Entregadores" onMenuToggle={toggleSidebar}><DeliveryPage /></PageWrapper></ProtectedRoute>} />
          <Route path="/financeiro" element={<ProtectedRoute roles={['admin','super_admin']}><PageWrapper title="Financeiro" subtitle="Visão de Receitas" onMenuToggle={toggleSidebar}><FinancialPage /></PageWrapper></ProtectedRoute>} />
          <Route path="/pdv" element={<ProtectedRoute roles={['admin','super_admin']}><PageWrapper title="Caixa (PDV)" subtitle="Novo Pedido" onMenuToggle={toggleSidebar}><PosPage /></PageWrapper></ProtectedRoute>} />
          <Route path="/mesas" element={<ProtectedRoute roles={['admin','super_admin']}><PageWrapper title="Mesas" subtitle="Mapa de Salão" onMenuToggle={toggleSidebar}><TablesPage /></PageWrapper></ProtectedRoute>} />
          <Route path="/atendimento" element={<ProtectedRoute roles={['admin','super_admin']}><PageWrapper title="Atendimento" subtitle="Lead Management" onMenuToggle={toggleSidebar}><ChatPage /></PageWrapper></ProtectedRoute>} />
          <Route path="/fidelidade" element={<ProtectedRoute roles={['admin','super_admin']}><PageWrapper title="Fidelidade" subtitle="Gestão de Prêmios e Pontos" onMenuToggle={toggleSidebar}><LoyaltyPage /></PageWrapper></ProtectedRoute>} />
          <Route path="/cupons" element={<ProtectedRoute roles={['admin','super_admin']}><PageWrapper title="Cupons" subtitle="Gestão de Descontos" onMenuToggle={toggleSidebar}><CouponsPage /></PageWrapper></ProtectedRoute>} />
          <Route path="/configuracoes" element={<ProtectedRoute roles={['admin','super_admin']}><PageWrapper title="Configurações" subtitle="Dados do Negócio" onMenuToggle={toggleSidebar}><SettingsPage /></PageWrapper></ProtectedRoute>} />

          {/* Rotas de Login */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/super/login" element={<SuperLoginPage />} />
          <Route path="/super/reset-password" element={<SuperPasswordReset />} />

          {/* Rotas Super Admin */}
          <Route path="/super" element={<ProtectedRoute roles={['super_admin']}><SuperAdminLayout /></ProtectedRoute>}>
            <Route index element={<SuperDashboard />} />
            <Route path="restaurantes" element={<SuperRestaurantsManagement />} />
            <Route path="planos" element={<PlansManager />} />
            <Route path="audit" element={<AuditHistory />} />
            <Route path="config" element={<GlobalSettings />} />
          </Route>

          {/* 404/Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* Toast */}
      {toast && <div className="toast success">{toast}</div>}
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <OrdersProvider>
        <AppContent />
      </OrdersProvider>
    </AuthProvider>
  );
}

export default App;

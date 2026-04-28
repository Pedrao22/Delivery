import { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
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
import LoginPage from './pages/LoginPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import OnboardingPage from './pages/OnboardingPage';
import SuperLoginPage from './pages/super/SuperLoginPage';
import SuperAdminLayout from './pages/super/SuperAdminLayout';
import SuperDashboard from './pages/super/SuperDashboard';
import RestaurantsManagement from './pages/super/RestaurantsManagement';
import PlansManager from './pages/super/PlansManager';
import AuditHistory from './pages/super/AuditHistory';
import GlobalSettings from './pages/super/GlobalSettings';
import SuperPasswordReset from './pages/super/SuperPasswordReset';
import MenuPublico from './pages/MenuPublico';
import { OrdersProvider, useOrdersContext } from './context/OrdersContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProtectedRoute } from './components/shared/ProtectedRoute';
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
  const { analyzing, updateSettings } = useOrdersContext();
  const { toggleTheme, isDark } = useTheme();
  const [toast, setToast] = useState(null);
  const { user, profile } = useAuth();

  // Onboarding — check per-user flag so each new tenant goes through the wizard
  const tenantId = profile?.restaurante_id || user?.id || 'default';
  const obKey = `pedirecebe_onboarding_${tenantId}`;
  const [onboardingDone, setOnboardingDone] = useState(() => !!localStorage.getItem(obKey));

  const handleOnboardingComplete = (settings) => {
    updateSettings(settings);
    localStorage.setItem(obKey, '1');
    setOnboardingDone(true);
  };

  if (!onboardingDone) {
    return <OnboardingPage onComplete={handleOnboardingComplete} />;
  }

  const toggleSidebar = () => setSidebarOpen(prev => !prev);

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
          <Route path="/" element={<OrdersPage onMenuToggle={toggleSidebar} />} />
          <Route path="/dashboard" element={
            <PageWrapper title="Dashboard" subtitle="Meu Desempenho" onMenuToggle={toggleSidebar}>
              <DashboardPage />
            </PageWrapper>
          } />
          <Route path="/cardapio" element={
            <PageWrapper title="Cardápio" subtitle="Gestão de Produtos" onMenuToggle={toggleSidebar}>
              <MenuManagementPage />
            </PageWrapper>
          } />
          <Route path="/estoque" element={
            <PageWrapper title="Estoque" subtitle="Controle de Insumos" onMenuToggle={toggleSidebar}>
              <InventoryPage />
            </PageWrapper>
          } />
          <Route path="/entregas" element={
            <PageWrapper title="Entregas" subtitle="Gestão de Entregadores" onMenuToggle={toggleSidebar}>
              <DeliveryPage />
            </PageWrapper>
          } />
          <Route path="/financeiro" element={
            <PageWrapper title="Financeiro" subtitle="Visão de Receitas" onMenuToggle={toggleSidebar}>
              <FinancialPage />
            </PageWrapper>
          } />
          <Route path="/pdv" element={
            <PageWrapper title="Caixa (PDV)" subtitle="Novo Pedido" onMenuToggle={toggleSidebar}>
              <PosPage />
            </PageWrapper>
          } />
          <Route path="/mesas" element={
            <PageWrapper title="Mesas" subtitle="Mapa de Salão" onMenuToggle={toggleSidebar}>
              <TablesPage />
            </PageWrapper>
          } />
          <Route path="/atendimento" element={
            <PageWrapper title="Atendimento" subtitle="Lead Management" onMenuToggle={toggleSidebar}>
              <ChatPage />
            </PageWrapper>
          } />
          <Route path="/fidelidade" element={
            <PageWrapper title="Fidelidade" subtitle="Gestão de Prêmios e Pontos" onMenuToggle={toggleSidebar}>
              <LoyaltyPage />
            </PageWrapper>
          } />
          <Route path="/cupons" element={
            <PageWrapper title="Cupons" subtitle="Gestão de Descontos" onMenuToggle={toggleSidebar}>
              <CouponsPage />
            </PageWrapper>
          } />
          <Route path="/configuracoes" element={
            <PageWrapper title="Configurações" subtitle="Dados do Negócio" onMenuToggle={toggleSidebar}>
              <SettingsPage />
            </PageWrapper>
          } />
          <Route path="/cliente" element={<CustomerView />} />
        </Routes>
      </main>
      {toast && <div className="toast success">{toast}</div>}
    </div>
  );
}

function SuperProtectedRoute({ children }) {
  const { user, profile, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/super/login" replace />;
  if (profile && profile.role !== 'super_admin') return <Navigate to="/super/login" replace />;
  return children;
}

function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/cliente" element={
          <OrdersProvider>
            <CustomerView />
          </OrdersProvider>
        } />
        <Route path="/m/:slug" element={<MenuPublico />} />

        {/* Super Admin */}
        <Route path="/super/login" element={<SuperLoginPage />} />
        <Route path="/super/password-reset" element={<SuperPasswordReset />} />
        <Route path="/super" element={
          <SuperProtectedRoute>
            <SuperAdminLayout />
          </SuperProtectedRoute>
        }>
          <Route index element={<SuperDashboard />} />
          <Route path="restaurantes" element={<RestaurantsManagement />} />
          <Route path="planos" element={<PlansManager />} />
          <Route path="audit" element={<AuditHistory />} />
          <Route path="config" element={<GlobalSettings />} />
        </Route>

        {/* App principal */}
        <Route path="*" element={
          <ProtectedRoute>
            <OrdersProvider>
              <AppContent />
            </OrdersProvider>
          </ProtectedRoute>
        } />
      </Routes>
    </AuthProvider>
  );
}

export default App;

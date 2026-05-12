import React from 'react';
import { Outlet, Link, useNavigate, useLocation, Navigate } from 'react-router-dom';
import {
  BarChart3,
  Store,
  CreditCard,
  History,
  Settings,
  LogOut,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import superLogo from '../../assets/super-logo.svg';
import './SuperAdminLayout.css';

const SuperAdminLayout = () => {
  const { logout, profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  if (profile && profile.role !== 'super_admin') {
    return <Navigate to="/dashboard" replace />;
  }

  const handleLogout = async () => {
    await logout();
    navigate('/super/login');
  };

  const menuItems = [
    { icon: <BarChart3 size={20} />, label: 'Visão Geral', path: '/super' },
    { icon: <Store size={20} />, label: 'Restaurantes', path: '/super/restaurantes' },
    { icon: <CreditCard size={20} />, label: 'Planos & Assinaturas', path: '/super/planos' },
    { icon: <History size={20} />, label: 'Logs de Auditoria', path: '/super/audit' },
    { icon: <Settings size={20} />, label: 'Configurações Globais', path: '/super/config' },
  ];

  return (
    <div className="super-layout">
      {/* Sidebar */}
      <aside className="super-sidebar">
        <div className="super-sidebar-header">
          <img src={superLogo} alt="Pedi&Recebe SuperAdmin" className="super-logo-img" />
        </div>

        <nav className="super-nav">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link 
                key={item.path} 
                to={item.path} 
                className={`super-nav-item ${isActive ? 'active' : ''}`}
              >
                {item.icon}
                <span>{item.label}</span>
                {isActive && <ChevronRight size={16} className="active-indicator" />}
              </Link>
            );
          })}
        </nav>

        <div className="super-sidebar-footer">
          <div className="super-user-info">
            <div className="super-user-avatar">
              {profile?.nome?.charAt(0) || 'S'}
            </div>
            <div className="super-user-details">
              <p className="super-user-name">{profile?.nome || 'Super Admin'}</p>
              <p className="super-user-role">Administrador Global</p>
            </div>
          </div>
          <button onClick={handleLogout} className="super-logout-btn">
            <LogOut size={18} />
            <span>Sair do Painel</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="super-main">
        <header className="super-main-header">
          <div className="header-blur-bg"></div>
          <div className="header-left relative z-10">
            <h2 className="header-title">
              {menuItems.find(i => i.path === location.pathname)?.label || 'Painel de Controle'}
            </h2>
          </div>
          <div className="header-right relative z-10">
             {/* Notificações/Busca Global podem vir aqui */}
          </div>
        </header>
        <div className="super-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default SuperAdminLayout;

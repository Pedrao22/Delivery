import { NavLink, useLocation } from 'react-router-dom';
import {
  ClipboardList, LayoutDashboard, UtensilsCrossed, Package,
  Truck, DollarSign, User, Menu, X, Moon, Sun
} from 'lucide-react';
import './Sidebar.css';

const navItems = [
  { to: '/', icon: ClipboardList, label: 'Pedidos', section: 'main' },
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', section: 'main' },
  { to: '/cardapio', icon: UtensilsCrossed, label: 'Cardápio', section: 'main' },
  { to: '/estoque', icon: Package, label: 'Estoque', section: 'gestao' },
  { to: '/entregas', icon: Truck, label: 'Entregas', section: 'gestao' },
  { to: '/financeiro', icon: DollarSign, label: 'Financeiro', section: 'gestao' },
  { to: '/cliente', icon: User, label: 'Visão Cliente', section: 'extra' },
];

export default function Sidebar({ isOpen, onToggle, orderCount, isDark, onToggleTheme }) {
  const location = useLocation();

  const renderLinks = (section) =>
    navItems
      .filter(item => item.section === section)
      .map(item => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          onClick={() => window.innerWidth <= 1024 && onToggle()}
          end={item.to === '/'}
        >
          <span className="sidebar-link-icon">
            <item.icon size={20} />
          </span>
          <span>{item.label}</span>
          {item.to === '/' && orderCount > 0 && (
            <span className="sidebar-badge">{orderCount}</span>
          )}
        </NavLink>
      ));

  return (
    <>
      <div
        className={`sidebar-mobile-overlay ${isOpen ? 'visible' : ''}`}
        onClick={onToggle}
      />

      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">🍽️</div>
          <div className="sidebar-brand">
            <h1>FoodFlow</h1>
            <span>Gestão de Restaurante</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="sidebar-section-title">Principal</div>
          {renderLinks('main')}

          <div className="sidebar-section-title">Gestão</div>
          {renderLinks('gestao')}

          <div className="sidebar-section-title">Extra</div>
          {renderLinks('extra')}
        </nav>

        <div className="sidebar-footer">
          <button className="sidebar-theme-toggle" onClick={onToggleTheme} title={isDark ? 'Modo Claro' : 'Modo Escuro'}>
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
            <span>{isDark ? 'Modo Claro' : 'Modo Escuro'}</span>
          </button>
          <div className="sidebar-user">
            <div className="sidebar-avatar">AS</div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">Admin Silva</div>
              <div className="sidebar-user-role">Gerente</div>
            </div>
          </div>
        </div>
      </aside>

      <button className="sidebar-toggle-mobile" onClick={onToggle}>
        {isOpen ? <X size={22} /> : <Menu size={22} />}
      </button>
    </>
  );
}

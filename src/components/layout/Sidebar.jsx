import { NavLink } from 'react-router-dom';
import {
  ClipboardList, LayoutDashboard, UtensilsCrossed, Package,
  Truck, DollarSign, User, Menu, X, Moon, Sun,
  Monitor, Map, MessageSquare, Gift, Ticket, Settings
} from 'lucide-react';
import './Sidebar.css';

const navItems = [
  { to: '/',             icon: ClipboardList,   label: 'Pedidos',       section: 'main' },
  { to: '/dashboard',    icon: LayoutDashboard, label: 'Dashboard',     section: 'main' },
  { to: '/cardapio',     icon: UtensilsCrossed, label: 'Cardápio',      section: 'main' },
  { to: '/pdv',          icon: Monitor,         label: 'PDV / Caixa',   section: 'main' },
  { to: '/mesas',        icon: Map,             label: 'Mesas',         section: 'main' },
  { to: '/atendimento',  icon: MessageSquare,   label: 'Atendimento',   section: 'main' },
  { to: '/estoque',      icon: Package,         label: 'Estoque',       section: 'gestao' },
  { to: '/entregas',     icon: Truck,           label: 'Entregas',      section: 'gestao' },
  { to: '/financeiro',   icon: DollarSign,      label: 'Financeiro',    section: 'gestao' },
  { to: '/fidelidade',   icon: Gift,            label: 'Fidelidade',    section: 'extra' },
  { to: '/cupons',       icon: Ticket,          label: 'Cupons',        section: 'extra' },
  { to: '/configuracoes',icon: Settings,        label: 'Configurações', section: 'extra' },
  { to: '/cliente',      icon: User,            label: 'Visão Cliente', section: 'extra' },
];

export default function Sidebar({ isOpen, onToggle, orderCount, isDark, onToggleTheme }) {
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
          <div className="sidebar-logo-wide">
            <img
              src="/logo_wide.png"
              alt="Pedi&Recebe"
              className="sidebar-logo-img"
            />
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
            <div className="sidebar-avatar">PR</div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">Pedi&amp;Recebe</div>
              <div className="sidebar-user-role">Administrador</div>
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

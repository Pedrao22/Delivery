import { NavLink, useNavigate } from 'react-router-dom';
import {
  ClipboardList, LayoutDashboard, UtensilsCrossed, Package,
  Truck, DollarSign, User, Menu, X, Moon, Sun,
  Monitor, Map, MessageSquare, Gift, Ticket, Settings, LogOut, Megaphone, HelpCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './Sidebar.css';

const navItems = [
  // Operações — trabalho do dia a dia
  { to: '/',             icon: ClipboardList,   label: 'Pedidos',       section: 'ops' },
  { to: '/pdv',          icon: Monitor,         label: 'PDV / Caixa',   section: 'ops' },
  { to: '/mesas',        icon: Map,             label: 'Mesas',         section: 'ops' },
  { to: '/atendimento',  icon: MessageSquare,   label: 'Atendimento',   section: 'ops' },
  // Cardápio — produtos e estoque
  { to: '/cardapio',     icon: UtensilsCrossed, label: 'Cardápio',      section: 'menu' },
  { to: '/estoque',      icon: Package,         label: 'Estoque',       section: 'menu' },
  // Gestão — visão gerencial
  { to: '/dashboard',    icon: LayoutDashboard, label: 'Dashboard',     section: 'gestao' },
  { to: '/entregas',     icon: Truck,           label: 'Entregas',      section: 'gestao' },
  { to: '/financeiro',   icon: DollarSign,      label: 'Financeiro',    section: 'gestao' },
  { to: '/fidelidade',   icon: Gift,            label: 'Fidelidade',    section: 'gestao' },
  { to: '/cupons',       icon: Ticket,          label: 'Cupons',        section: 'gestao' },
  // Extra — configurações e utilitários
  { to: '/configuracoes',icon: Settings,        label: 'Configurações', section: 'extra' },
  { to: '/cliente',      icon: User,            label: 'Visão Cliente', section: 'extra' },
  { to: '/feedback',     icon: Megaphone,       label: 'Feedback',      section: 'extra' },
  { to: '/faq',          icon: HelpCircle,      label: 'Ajuda / FAQ',   section: 'extra' },
];

export default function Sidebar({ isOpen, onToggle, orderCount, isDark, onToggleTheme }) {
  const { profile, restaurant, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const restaurantName = restaurant?.nome || profile?.nome || 'Meu Restaurante';
  const initials = restaurantName.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
  const roleLabel = profile?.role === 'super_admin' ? 'Super Admin' : 'Administrador';

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
          <button className="sidebar-close-btn" onClick={onToggle}>
            <X size={18} />
          </button>
        </div>

        <nav className="sidebar-nav">
          <div className="sidebar-section-title">Operações</div>
          {renderLinks('ops')}

          <div className="sidebar-section-title">Cardápio</div>
          {renderLinks('menu')}

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
            <div className="sidebar-avatar">{initials}</div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">{restaurantName}</div>
              <div className="sidebar-user-role">{roleLabel}</div>
            </div>
          </div>
          <button className="sidebar-logout-btn" onClick={handleLogout}>
            <LogOut size={16} />
            <span>Sair da conta</span>
          </button>
        </div>
      </aside>

      <button className="sidebar-toggle-mobile" onClick={onToggle}>
        {isOpen ? <X size={22} /> : <Menu size={22} />}
      </button>
    </>
  );
}

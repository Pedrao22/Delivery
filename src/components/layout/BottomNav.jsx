import { NavLink } from 'react-router-dom';
import {
  ClipboardList, LayoutDashboard, Monitor,
  MessageSquare, Menu
} from 'lucide-react';
import './BottomNav.css';

const bottomItems = [
  { to: '/',            icon: ClipboardList,   label: 'Pedidos',     end: true },
  { to: '/atendimento', icon: MessageSquare,   label: 'Atendimento'  },
  { to: '/pdv',         icon: Monitor,         label: 'PDV'          },
  { to: '/dashboard',   icon: LayoutDashboard, label: 'Dashboard'    },
];

export default function BottomNav({ onMenuOpen, orderCount }) {
  return (
    <nav className="bottom-nav">
      {bottomItems.map(item => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}
        >
          <span className="bottom-nav-icon-wrap">
            <item.icon size={22} />
            {item.to === '/' && orderCount > 0 && (
              <span className="bottom-nav-badge">{orderCount > 9 ? '9+' : orderCount}</span>
            )}
          </span>
          <span className="bottom-nav-label">{item.label}</span>
        </NavLink>
      ))}

      <button className="bottom-nav-item" onClick={onMenuOpen}>
        <span className="bottom-nav-icon-wrap">
          <Menu size={22} />
        </span>
        <span className="bottom-nav-label">Mais</span>
      </button>
    </nav>
  );
}

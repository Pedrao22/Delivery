import { Bell, Menu } from 'lucide-react';
import './TopBar.css';

export default function TopBar({ title, subtitle, onMenuClick, children }) {
  return (
    <div className="topbar">
      <div className="topbar-left">
        <button className="topbar-menu-btn" onClick={onMenuClick}>
          <Menu size={22} />
        </button>
        <div>
          <h2 className="topbar-title">{title}</h2>
          {subtitle && <p className="topbar-subtitle">{subtitle}</p>}
        </div>
      </div>
      <div className="topbar-right">
        {children}
        <button className="topbar-notification">
          <Bell size={20} />
          <span className="topbar-notification-dot" />
        </button>
      </div>
    </div>
  );
}

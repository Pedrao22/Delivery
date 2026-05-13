import { useState, useRef, useEffect } from 'react';
import { Bell, Menu, ShoppingBag, Package, Megaphone, X, CheckCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useOrdersContext } from '../../context/OrdersContext';
import './TopBar.css';

export default function TopBar({ title, subtitle, onMenuClick, children }) {
  const { notifications, dismissNotification, clearAllNotifications } = useOrdersContext();
  const [bellOpen, setBellOpen] = useState(false);
  const bellRef = useRef(null);
  const navigate = useNavigate();
  const count = notifications.length;

  useEffect(() => {
    const handler = (e) => {
      if (bellRef.current && !bellRef.current.contains(e.target)) {
        setBellOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

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
        <div className="topbar-bell-wrapper" ref={bellRef}>
          <button
            className={`topbar-notification ${count > 0 ? 'has-notifications' : ''}`}
            onClick={() => setBellOpen(o => !o)}
          >
            <Bell size={20} />
            {count > 0 && (
              <span className="topbar-notification-badge">{count > 9 ? '9+' : count}</span>
            )}
          </button>

          {bellOpen && (
            <div className="topbar-notif-dropdown">
              <div className="topbar-notif-header">
                <span>Notificações{count > 0 ? ` (${count})` : ''}</span>
                {count > 0 && (
                  <button className="topbar-notif-clear" onClick={() => { clearAllNotifications(); setBellOpen(false); }}>
                    <CheckCheck size={13} /> Limpar
                  </button>
                )}
              </div>
              {count === 0 ? (
                <div className="topbar-notif-empty">Tudo em dia por aqui</div>
              ) : (
                <div className="topbar-notif-list">
                  {notifications.map(n => (
                    <div key={n.id} className={`topbar-notif-item topbar-notif-${n.type}`}>
                      <div className="topbar-notif-icon">
                        {n.type === 'order' ? <ShoppingBag size={15} /> : n.type === 'feedback' ? <Megaphone size={15} /> : <Package size={15} />}
                      </div>
                      <div className="topbar-notif-body">
                        <div className="topbar-notif-title">{n.title}</div>

                        {n.type === 'feedback' ? (
                          <>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, margin: '4px 0' }}>
                              <span style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', fontWeight: 600 }}>Resolvido?</span>
                              <span style={{
                                fontSize: '0.72rem', fontWeight: 800, padding: '2px 8px', borderRadius: 20,
                                background: n.resolved ? 'rgba(0,184,148,0.15)' : 'rgba(229,57,53,0.12)',
                                color: n.resolved ? 'var(--success, #00B894)' : 'var(--danger, #E53935)',
                              }}>
                                {n.resolved ? 'Sim' : 'Não'}
                              </span>
                            </div>
                            {!n.resolved && (
                              <button
                                onClick={() => { dismissNotification(n.id); setBellOpen(false); navigate('/feedback'); }}
                                style={{
                                  display: 'inline-flex', alignItems: 'center', gap: 4,
                                  marginTop: 4, padding: '3px 8px', borderRadius: 6,
                                  border: '1px solid var(--border-light, #E9ECEF)',
                                  background: 'transparent', cursor: 'pointer',
                                  fontSize: '0.7rem', fontWeight: 700,
                                  color: 'var(--accent, #FFC107)',
                                }}
                              >
                                Enviar novamente →
                              </button>
                            )}
                          </>
                        ) : (
                          <div className="topbar-notif-msg">{n.message}</div>
                        )}

                        <div className="topbar-notif-time">
                          {n.timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                      <button className="topbar-notif-dismiss" onClick={() => dismissNotification(n.id)}>
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

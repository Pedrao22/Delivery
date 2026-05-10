import { useState } from 'react';
import { Plus, X, Trash2, Navigation } from 'lucide-react';
import { useOrdersContext } from '../../context/OrdersContext';
import { apiFetch } from '../../lib/supabase';
import './DeliveryPage.css';

const STATUS_CONFIG = {
  available: { label: 'Disponível',  bg: '#ECFDF5', color: '#065F46', dot: '#10B981' },
  delivering: { label: 'Em rota',    bg: '#EFF6FF', color: '#1E40AF', dot: '#3B82F6' },
  offline:    { label: 'Offline',    bg: '#F9FAFB', color: '#6B7280', dot: '#D1D5DB' },
};

function DriverModal({ isOpen, onClose, onSave }) {
  const [formData, setFormData] = useState({ name: '', phone: '', vehicle: 'Moto', photo: '🏍️' });
  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ ...formData, status: 'available', rating: 5.0, deliveries: 0 });
    setFormData({ name: '', phone: '', vehicle: 'Moto', photo: '🏍️' });
    onClose();
  };

  return (
    <div className="driver-modal-overlay">
      <div className="driver-modal">
        <div className="driver-modal-header">
          <h3>Novo Entregador</h3>
          <button className="driver-modal-close" onClick={onClose}><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="driver-form">
          <div className="form-group">
            <label>Nome Completo</label>
            <input type="text" required value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
              placeholder="Ex: João Silva" />
          </div>
          <div className="form-group">
            <label>Telefone / WhatsApp</label>
            <input type="text" required value={formData.phone}
              onChange={e => setFormData({...formData, phone: e.target.value})}
              placeholder="(11) 99999-9999" />
          </div>
          <div className="form-group">
            <label>Veículo</label>
            <select value={formData.vehicle} onChange={e => {
              const icon = e.target.value === 'Moto' ? '🏍️' : e.target.value === 'Bicicleta' ? '🚲' : '🚗';
              setFormData({...formData, vehicle: e.target.value, photo: icon});
            }}>
              <option value="Moto">🏍️ Moto</option>
              <option value="Bicicleta">🚲 Bicicleta</option>
              <option value="Carro">🚗 Carro</option>
            </select>
          </div>
          <div className="driver-modal-footer">
            <button type="button" className="btn-modal-cancel" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn-modal-save">Cadastrar</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AssignModal({ isOpen, onClose, driver, orders, onAssign }) {
  if (!isOpen) return null;
  const readyOrders = (orders || []).filter(o => o.status === 'ready' && o.tipo !== 'local');

  return (
    <div className="driver-modal-overlay">
      <div className="driver-modal">
        <div className="driver-modal-header">
          <h3>Atribuir pedido — {driver?.name}</h3>
          <button className="driver-modal-close" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="assign-list">
          {readyOrders.length === 0 ? (
            <div className="assign-empty">
              <span>📦</span>
              <p>Nenhum pedido pronto para entrega</p>
            </div>
          ) : readyOrders.map(order => (
            <div key={order.id} className="assign-order-row"
              onClick={() => { onAssign(driver.id, order); onClose(); }}>
              <div className="assign-order-info">
                <strong>#{(order.id || '').slice(-4).toUpperCase()}</strong>
                <span>{order.cliente_nome || order.customer?.name}</span>
                <span className="assign-address">
                  {order.customer?.address || order.endereco || '—'}
                </span>
              </div>
              <span className="assign-value">
                R$ {(order.total || 0).toFixed(2).replace('.', ',')}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function DeliveryPage() {
  const { drivers, addDriver, removeDriver, orders, restaurantSettings } = useOrdersContext();
  const primaryColor = restaurantSettings?.primaryColor || '#FFC400';

  const [isAddOpen, setIsAddOpen]       = useState(false);
  const [assignTarget, setAssignTarget] = useState(null);
  const [localOverrides, setLocalOverrides] = useState({});

  const displayDrivers = drivers.map(d => ({ ...d, ...(localOverrides[d.id] || {}) }));

  const available  = displayDrivers.filter(d => d.status === 'available').length;
  const delivering = displayDrivers.filter(d => d.status === 'delivering').length;
  const offline    = displayDrivers.filter(d => d.status === 'offline').length;

  const patchDriver = (id, patch) => {
    setLocalOverrides(prev => ({ ...prev, [id]: { ...(prev[id] || {}), ...patch } }));
    apiFetch(`/drivers/${id}`, { method: 'PATCH', body: JSON.stringify(patch) }).catch(() => {});
  };

  const handleAssign = (driverId, order) => {
    const label = `#${(order.id || '').slice(-4).toUpperCase()} — ${order.cliente_nome || order.customer?.name || ''}`;
    patchDriver(driverId, { status: 'delivering', currentOrder: label });
  };

  const handleFinish = (driverId) => {
    patchDriver(driverId, { status: 'available', currentOrder: null });
  };

  return (
    <div className="delivery-page">

      {/* ── Stats bar ── */}
      <div className="delivery-stats-row">
        <div className="delivery-stat-chip chip-green">
          <span className="chip-dot" /> <strong>{available}</strong> Disponíveis
        </div>
        <div className="delivery-stat-chip chip-blue">
          <span className="chip-dot" /> <strong>{delivering}</strong> Em rota
        </div>
        <div className="delivery-stat-chip chip-gray">
          <span className="chip-dot" /> <strong>{offline}</strong> Offline
        </div>
        <button
          className="btn-add-driver"
          style={{ borderColor: primaryColor, color: primaryColor }}
          onClick={() => setIsAddOpen(true)}
        >
          <Plus size={15} /> Adicionar Entregador
        </button>
      </div>

      {/* ── Empty state ── */}
      {displayDrivers.length === 0 && (
        <div className="delivery-empty">
          <div className="delivery-empty-icon">🛵</div>
          <h3>Nenhum entregador cadastrado</h3>
          <p>Cadastre entregadores para atribuir pedidos e acompanhar rotas</p>
          <button
            className="btn-add-driver-empty"
            style={{ background: primaryColor }}
            onClick={() => setIsAddOpen(true)}
          >
            <Plus size={16} /> Cadastrar primeiro entregador
          </button>
        </div>
      )}

      {/* ── Driver grid ── */}
      {displayDrivers.length > 0 && (
        <div className="delivery-grid">
          {displayDrivers.map((driver, i) => {
            const sc = STATUS_CONFIG[driver.status] || STATUS_CONFIG.offline;
            const vehicleEmoji = driver.vehicle === 'Moto' ? '🏍️'
              : driver.vehicle === 'Bicicleta' ? '🚲' : '🚗';

            return (
              <div key={driver.id} className="driver-card" style={{ animationDelay: `${i * 60}ms` }}>

                {/* Card top */}
                <div className="driver-card-top">
                  <div className="driver-avatar-wrap">
                    <div className="driver-avatar-circle" style={{ borderColor: sc.dot }}>
                      {driver.photo || vehicleEmoji}
                    </div>
                    <span className="driver-status-dot" style={{ background: sc.dot }} />
                  </div>
                  <div className="driver-main-info">
                    <h4 className="driver-name">{driver.name}</h4>
                    <span className="driver-meta">{driver.vehicle || 'Moto'} • {driver.phone}</span>
                  </div>
                  <button
                    className="driver-remove-btn"
                    onClick={() => { if (window.confirm(`Remover ${driver.name}?`)) removeDriver(driver.id); }}
                    title="Remover"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                {/* Stats */}
                <div className="driver-stats-row">
                  <div className="driver-stat-box">
                    <strong>{driver.deliveries ?? 0}</strong>
                    <span>Entregas</span>
                  </div>
                  <div className="driver-stat-box">
                    <strong>⭐ {Number(driver.rating ?? 5).toFixed(1)}</strong>
                    <span>Avaliação</span>
                  </div>
                  <div className="driver-stat-box">
                    <strong>{vehicleEmoji}</strong>
                    <span>Veículo</span>
                  </div>
                </div>

                {/* Status bar */}
                <div className="driver-status-bar" style={{ background: sc.bg, color: sc.color }}>
                  <span className="driver-status-label">
                    <span className="dsb-dot" style={{ background: sc.dot }} />
                    {sc.label}
                    {driver.currentOrder && (
                      <span className="driver-current-order"> · {driver.currentOrder}</span>
                    )}
                  </span>
                  <div className="driver-action-btns">
                    {driver.status === 'available' && (
                      <button
                        className="btn-assign"
                        style={{ background: primaryColor }}
                        onClick={() => setAssignTarget(driver)}
                      >
                        Atribuir
                      </button>
                    )}
                    {driver.status === 'delivering' && (
                      <button className="btn-finish" onClick={() => handleFinish(driver.id)}>
                        Finalizar
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <DriverModal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} onSave={addDriver} />
      <AssignModal
        isOpen={!!assignTarget}
        onClose={() => setAssignTarget(null)}
        driver={assignTarget}
        orders={orders}
        onAssign={handleAssign}
      />
    </div>
  );
}

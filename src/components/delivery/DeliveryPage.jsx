import { useState } from 'react';
import { Plus, X, Trash2, Navigation, MapPin, MessageCircle, Check } from 'lucide-react';
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
    // Map to backend field names (PT)
    onSave({ nome: formData.name, telefone: formData.phone, veiculo: formData.vehicle, foto: formData.photo });
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

function buildMapsUrl(origin, destination) {
  const base = 'https://www.google.com/maps/dir/?api=1';
  const params = new URLSearchParams({
    destination: destination || '',
    ...(origin ? { origin } : {}),
    travelmode: 'driving',
  });
  return `${base}&${params.toString()}`;
}

function AssignModal({ isOpen, onClose, driver, orders, onAssign, restaurantAddress }) {
  const [assigned, setAssigned] = useState(null);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  if (!isOpen) return null;
  const readyOrders = (orders || []).filter(o => o.status === 'ready' && o.type !== 'local');
  const driverName  = driver?.nome || driver?.name || 'Entregador';
  const driverPhone = driver?.telefone || driver?.phone || '';

  const handleAssign = (order) => {
    onAssign(driver.id, order);
    setSending(false);
    setSent(false);
    setAssigned(order);
  };

  const handleClose = () => { setAssigned(null); setSending(false); setSent(false); onClose(); };

  if (assigned) {
    const address     = assigned.customer?.address || assigned.endereco || '';
    const clientName  = assigned.cliente_nome || assigned.customer?.name || 'Cliente';
    const code        = `#${(assigned.id || '').slice(-4).toUpperCase()}`;
    const mapsUrl     = buildMapsUrl(restaurantAddress, address);
    const chatMessage = `🛵 *Nova entrega, ${driverName}!*\n\n📦 Pedido: ${code}\n👤 Cliente: ${clientName}\n📍 Endereço: ${address}\n\n🗺️ Rota: ${mapsUrl}`;

    const handleSendToDriver = async () => {
      if (!driverPhone || sending || sent) return;
      setSending(true);
      try {
        await apiFetch('/chatwoot/send-to-phone', {
          method: 'POST',
          body: JSON.stringify({ phone: driverPhone, name: driverName, message: chatMessage }),
        });
        setSent(true);
      } catch {
        // silent
      } finally {
        setSending(false);
      }
    };

    return (
      <div className="driver-modal-overlay">
        <div className="driver-modal">
          <div className="driver-modal-header">
            <h3>Pedido atribuído!</h3>
            <button className="driver-modal-close" onClick={handleClose}><X size={18} /></button>
          </div>
          <div className="assign-confirmed">
            <div className="assign-confirmed-icon"><Check size={28} /></div>
            <div className="assign-confirmed-info">
              <strong>{code} · {clientName}</strong>
              <span className="assign-address">{address || '—'}</span>
            </div>
            <div className="assign-location-btns">
              <a
                className="assign-map-btn"
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <MapPin size={15} /> Abrir Rota
              </a>
              {driverPhone && (
                <button
                  className="assign-wa-btn"
                  onClick={handleSendToDriver}
                  disabled={sending || sent}
                >
                  <MessageCircle size={15} />
                  {sent ? 'Enviado!' : sending ? 'Enviando...' : 'Enviar ao Entregador'}
                </button>
              )}
            </div>
            {!driverPhone && (
              <p className="assign-no-phone">Cadastre o telefone do entregador para enviar mensagem</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="driver-modal-overlay">
      <div className="driver-modal">
        <div className="driver-modal-header">
          <h3>Atribuir pedido — {driverName}</h3>
          <button className="driver-modal-close" onClick={handleClose}><X size={18} /></button>
        </div>
        <div className="assign-list">
          {readyOrders.length === 0 ? (
            <div className="assign-empty">
              <span>📦</span>
              <p>Nenhum pedido pronto para entrega</p>
            </div>
          ) : readyOrders.map(order => {
            const addr = order.customer?.address || order.endereco || '';
            return (
              <div key={order.id} className="assign-order-row" onClick={() => handleAssign(order)}>
                <div className="assign-order-info">
                  <strong>#{(order.id || '').slice(-4).toUpperCase()}</strong>
                  <span>{order.cliente_nome || order.customer?.name}</span>
                  <span className="assign-address">{addr || '—'}</span>
                </div>
                <div className="assign-row-right">
                  <span className="assign-value">
                    R$ {(order.total || 0).toFixed(2).replace('.', ',')}
                  </span>
                  {addr && (
                    <a
                      className="assign-mini-map"
                      href={buildMapsUrl(restaurantAddress, addr)}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={e => e.stopPropagation()}
                      title="Ver no Maps"
                    >
                      <MapPin size={13} />
                    </a>
                  )}
                </div>
              </div>
            );
          })}
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

  // Normalize DB field names (PT) to frontend names (EN) and map status values
  const normalizeDriver = (d) => ({
    ...d,
    name:       d.nome       || d.name      || '',
    phone:      d.telefone   || d.phone     || '',
    vehicle:    d.veiculo    || d.vehicle   || 'Moto',
    photo:      d.foto_emoji || d.foto      || d.photo || '',
    deliveries: d.total_entregas ?? d.entregas ?? d.deliveries ?? 0,
    // DB enum is 'available'|'delivering'|'offline'; guard for legacy rows
    status:     d.status === 'disponivel' ? 'available'
              : d.status === 'em_rota'    ? 'delivering'
              : d.status || 'available',
  });

  const displayDrivers = drivers.map(d => ({ ...normalizeDriver(d), ...(localOverrides[d.id] || {}) }));

  const available  = displayDrivers.filter(d => d.status === 'available').length;
  const delivering = displayDrivers.filter(d => d.status === 'delivering').length;
  const offline    = displayDrivers.filter(d => d.status === 'offline').length;

  // localPatch → local UI; apiPatch → backend (uses same EN enum values)
  const patchDriver = (id, localPatch, apiPatch) => {
    setLocalOverrides(prev => ({ ...prev, [id]: { ...(prev[id] || {}), ...localPatch } }));
    if (apiPatch) {
      apiFetch(`/drivers/${id}`, { method: 'PATCH', body: JSON.stringify(apiPatch) }).catch(() => {});
    }
  };

  const handleAssign = (driverId, order) => {
    const label = `#${(order.id || '').slice(-4).toUpperCase()} — ${order.cliente_nome || order.customer?.name || ''}`;
    patchDriver(driverId, { status: 'delivering', currentOrder: label }, { status: 'delivering' });
  };

  const handleFinish = (driverId) => {
    patchDriver(driverId, { status: 'available', currentOrder: null }, { status: 'available' });
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
                    onClick={() => { if (window.confirm(`Remover ${driver.nome || driver.name}?`)) removeDriver(driver.id); }}
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
        onClose={() => { setAssignTarget(null); }}
        driver={assignTarget}
        orders={orders}
        onAssign={handleAssign}
        restaurantAddress={restaurantSettings?.endereco || restaurantSettings?.address || ''}
      />
    </div>
  );
}

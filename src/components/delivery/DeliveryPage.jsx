import { useState } from 'react';
import { MapPin, Star, Package, Navigation, Plus, X, Trash2 } from 'lucide-react';
import { useOrdersContext } from '../../context/OrdersContext';
import Badge from '../shared/Badge';
import Button from '../shared/Button';
import './DeliveryPage.css';

const statusLabels = {
  available: 'Disponível',
  delivering: 'Em rota',
  offline: 'Offline',
};

function DriverModal({ isOpen, onClose, onSave }) {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    vehicle: 'Moto',
    photo: '🏍️'
  });

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...formData,
      status: 'available',
      rating: 5.0,
      deliveries: 0,
    });
    setFormData({ name: '', phone: '', vehicle: 'Moto', photo: '🏍️' });
    onClose();
  };

  return (
    <div className="driver-modal-overlay">
      <div className="driver-modal animate-scaleIn">
        <div className="driver-modal-header">
          <h3>Novo Entregador</h3>
          <button onClick={onClose}><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="driver-form">
          <div className="form-group">
            <label>Nome Completo</label>
            <input 
              type="text" 
              required 
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
              placeholder="Ex: João Silva"
            />
          </div>
          <div className="form-group">
            <label>Telefone / WhatsApp</label>
            <input 
              type="text" 
              required 
              value={formData.phone}
              onChange={e => setFormData({...formData, phone: e.target.value})}
              placeholder="(11) 99999-9999"
            />
          </div>
          <div className="form-group">
            <label>Veículo</label>
            <select 
              value={formData.vehicle}
              onChange={e => {
                const icon = e.target.value === 'Moto' ? '🏍️' : e.target.value === 'Bicicleta' ? '🚲' : '🚗';
                setFormData({...formData, vehicle: e.target.value, photo: icon});
              }}
            >
              <option value="Moto">Moto</option>
              <option value="Bicicleta">Bicicleta</option>
              <option value="Carro">Carro</option>
            </select>
          </div>
          <div className="driver-modal-footer">
            <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
            <Button type="submit">Cadastrar Entregador</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function DeliveryPage() {
  const { drivers, addDriver, removeDriver } = useOrdersContext();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const available = drivers.filter(d => d.status === 'available').length;
  const delivering = drivers.filter(d => d.status === 'delivering').length;

  return (
    <div className="delivery-page">
      <div className="delivery-header-row">
        <p style={{ fontSize: 'var(--font-sm)', color: 'var(--text-tertiary)' }}>
          {available} disponíveis • {delivering} em rota
        </p>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Button
            variant="outline"
            size="sm"
            icon={<Plus size={15} />}
            onClick={() => setIsModalOpen(true)}
          >
            Adicionar Entregador
          </Button>
          <Button size="sm" icon={<Navigation size={15} />}>Enviar Localização</Button>
        </div>
      </div>

      <div className="delivery-grid">
        {drivers.map((driver, i) => (
          <div key={driver.id} className="driver-card" style={{ animationDelay: `${i * 60}ms` }}>
            <div className="driver-card-header">
              <div className="driver-avatar">{driver.photo}</div>
              <div className="driver-info">
                <h4>{driver.name}</h4>
                <p>{driver.vehicle} • {driver.phone}</p>
              </div>
            </div>

            <div className="driver-stats">
              <div className="driver-stat">
                <div className="driver-stat-value">{driver.deliveries}</div>
                <div className="driver-stat-label">Entregas</div>
              </div>
              <div className="driver-stat">
                <div className="driver-stat-value">⭐ {driver.rating}</div>
                <div className="driver-stat-label">Avaliação</div>
              </div>
              <div className="driver-stat">
                <div className="driver-stat-value">{driver.vehicle === 'Moto' ? '🏍️' : driver.vehicle === 'Bicicleta' ? '🚲' : '🚗'}</div>
                <div className="driver-stat-label">Veículo</div>
              </div>
            </div>

            <div className={`driver-status ${driver.status}`}>
              <span style={{ fontWeight: 600 }}>
                {statusLabels[driver.status]}
                {driver.currentOrder && ` — ${driver.currentOrder}`}
              </span>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                {driver.status === 'available' && (
                  <Button size="xs" variant="success">Atribuir Pedido</Button>
                )}
                {driver.status === 'delivering' && (
                  <Badge variant="info" dot>Em rota</Badge>
                )}
                <button
                  onClick={() => { if (window.confirm(`Remover ${driver.name}?`)) removeDriver(driver.id); }}
                  style={{ color: 'var(--danger)', padding: '4px', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center' }}
                  title="Remover entregador"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <DriverModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={addDriver} 
      />
    </div>
  );
}

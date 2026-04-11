import { MapPin, Star, Package, Navigation } from 'lucide-react';
import { drivers } from '../../data/drivers';
import Badge from '../shared/Badge';
import Button from '../shared/Button';
import './DeliveryPage.css';

const statusLabels = {
  available: 'Disponível',
  delivering: 'Em rota',
  offline: 'Offline',
};

export default function DeliveryPage() {
  const available = drivers.filter(d => d.status === 'available').length;
  const delivering = drivers.filter(d => d.status === 'delivering').length;

  return (
    <div className="delivery-page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: 'var(--font-xl)', fontWeight: 'var(--fw-bold)' }}>Gestão de Entregas</h2>
          <p style={{ fontSize: 'var(--font-sm)', color: 'var(--text-tertiary)' }}>
            {available} disponíveis • {delivering} em rota
          </p>
        </div>
        <Button icon={<Navigation size={16} />}>Enviar Localização</Button>
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
              {driver.status === 'available' && (
                <Button size="xs" variant="success">Atribuir Pedido</Button>
              )}
              {driver.status === 'delivering' && (
                <Badge variant="info" dot>Em rota</Badge>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

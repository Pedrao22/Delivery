import React, { useState } from 'react';
import { 
  Users, Calendar, Clock, MapPin, 
  CheckCircle2, AlertCircle, Bookmark, Coffee
} from 'lucide-react';
import { useOrdersContext } from '../context/OrdersContext';
import Button from '../components/shared/Button';
import Badge from '../components/shared/Badge';
import './TablesPage.css';

export default function TablesPage() {
  const { tables, updateTable, orders } = useOrdersContext();
  const [selectedTable, setSelectedTable] = useState(null);

  const stats = {
    free: (tables || []).filter(t => t.status === 'free').length,
    occupied: (tables || []).filter(t => t.status === 'occupied').length,
    reserved: (tables || []).filter(t => t.status === 'reserved').length,
    dirty: (tables || []).filter(t => t.status === 'maintenance' || t.status === 'dirty').length,
  };

  const activeTable = selectedTable ? tables.find(t => t.id === selectedTable) : null;
  const currentOrder = activeTable?.pedido_atual_id ? orders.find(o => o.id === activeTable.pedido_atual_id) : null;

  const handleStatusChange = async (newStatus) => {
    if (selectedTable) {
      // Map 'dirty' (UI) to 'maintenance' (DB Enum) if needed
      const dbStatus = newStatus === 'dirty' ? 'maintenance' : newStatus;
      await updateTable(selectedTable, { status: dbStatus });
    }
  };

  return (
    <div className="tables-page">
      <div className="tables-stats-row text-primary">
        <div className="table-stat-card free">
          <div className="table-stat-icon"><CheckCircle2 size={20} /></div>
          <div className="table-stat-info">
            <span className="table-stat-label">Livres</span>
            <span className="table-stat-value">{stats.free}</span>
          </div>
        </div>
        <div className="table-stat-card occupied">
          <div className="table-stat-icon"><Users size={20} /></div>
          <div className="table-stat-info">
            <span className="table-stat-label">Ocupadas</span>
            <span className="table-stat-value">{stats.occupied}</span>
          </div>
        </div>
        <div className="table-stat-card reserved">
          <div className="table-stat-icon"><Calendar size={20} /></div>
          <div className="table-stat-info">
            <span className="table-stat-label">Reservas</span>
            <span className="table-stat-value">{stats.reserved}</span>
          </div>
        </div>
        <div className="table-stat-card dirty">
          <div className="table-stat-icon"><AlertCircle size={20} /></div>
          <div className="table-stat-info">
            <span className="table-stat-label">Para Limpar</span>
            <span className="table-stat-value">{stats.dirty}</span>
          </div>
        </div>
      </div>

      <div className="tables-main-layout">
        {/* Cinema-Style Grid */}
        <div className="tables-grid-container">
          <div className="tables-grid-header">
            <h3>Mapa do Salão</h3>
            <div className="tables-legend">
              <span className="legend-item"><span className="dot free"></span> Livre</span>
              <span className="legend-item"><span className="dot occupied"></span> Ocupada</span>
              <span className="legend-item"><span className="dot reserved"></span> Reservada</span>
              <span className="legend-item"><span className="dot maintenance"></span> Limpeza</span>
            </div>
          </div>
          
          <div className="cinema-grid">
            {(tables || []).map(table => (
              <div 
                key={table.id} 
                className={`table-node ${table.status} ${selectedTable === table.id ? 'active' : ''}`}
                onClick={() => setSelectedTable(table.id)}
              >
                <div className="table-node-number">{table.numero}</div>
                {table.status === 'occupied' && <div className="table-node-indicator"><Users size={12} /></div>}
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar Details */}
        <div className="table-details-sidebar">
          {activeTable ? (
            <div className="table-detail-card">
              <div className={`table-detail-header ${activeTable.status}`}>
                <div className="table-detail-id">Mesa {activeTable.numero}</div>
                <Badge variant={
                  activeTable.status === 'free' ? 'success' : 
                  activeTable.status === 'occupied' ? 'danger' : 
                  activeTable.status === 'reserved' ? 'warning' : 'info'
                }>
                  {(activeTable.status === 'maintenance' ? 'Limpando' : activeTable.status).toUpperCase()}
                </Badge>
              </div>

              <div className="table-detail-body">
                {currentOrder ? (
                  <div className="table-order-info">
                    <div className="detail-section-title">Pedido Atual</div>
                    <div className="order-id-highlight">{currentOrder.codigo}</div>
                    <div className="order-customer-main">{currentOrder.cliente_nome}</div>
                    <div className="order-items-summary">
                      {(currentOrder.items || []).length} itens • R$ {parseFloat(currentOrder.total).toFixed(2).replace('.', ',')}
                    </div>
                  </div>
                ) : (
                  <div className="table-empty-state">
                    <Coffee size={48} className="empty-icon" />
                    <p>Esta mesa está {activeTable.status === 'free' ? 'disponível' : activeTable.status}.</p>
                  </div>
                )}

                <div className="detail-section-title">Alterar Status</div>
                <div className="status-action-grid">
                  <button onClick={() => handleStatusChange('free')} className="status-btn free">Livre</button>
                  <button onClick={() => handleStatusChange('occupied')} className="status-btn occupied">Ocupar</button>
                  <button onClick={() => handleStatusChange('reserved')} className="status-btn reserved">Reservar</button>
                  <button onClick={() => handleStatusChange('dirty')} className="status-btn dirty">Limpar</button>
                </div>
              </div>
            </div>
          ) : (
            <div className="table-selection-prompt">
              <MapPin size={40} />
              <p>Selecione uma mesa para gerenciar.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

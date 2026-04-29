import React, { useState, useEffect } from 'react';
import {
  Users, Calendar, CheckCircle2, AlertCircle, Coffee, MapPin, Move, Lock
} from 'lucide-react';
import { useOrdersContext } from '../context/OrdersContext';
import Badge from '../components/shared/Badge';
import './TablesPage.css';

const COLS = 8;
const ROWS = 6;

function getDefaultPositions(tables, saved) {
  const result = { ...(saved || {}) };
  const occupied = new Set(Object.values(result).map(p => `${p.col},${p.row}`));
  for (const table of tables) {
    if (!result[table.id]) {
      let placed = false;
      for (let row = 0; row < ROWS && !placed; row++) {
        for (let col = 0; col < COLS && !placed; col++) {
          if (!occupied.has(`${col},${row}`)) {
            result[table.id] = { col, row };
            occupied.add(`${col},${row}`);
            placed = true;
          }
        }
      }
    }
  }
  return result;
}

export default function TablesPage() {
  const { tables, updateTable, orders, restaurantSettings } = useOrdersContext();
  const [selectedTable, setSelectedTable] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [positions, setPositions] = useState({});
  const [dragging, setDragging] = useState(null);
  const [dragOver, setDragOver] = useState(null);
  const [loaded, setLoaded] = useState(false);

  const storageKey = `mesa_layout_${restaurantSettings?.id || 'default'}`;

  useEffect(() => {
    if (!loaded && (tables || []).length > 0) {
      const raw = localStorage.getItem(storageKey);
      const saved = raw ? JSON.parse(raw) : null;
      setPositions(getDefaultPositions(tables, saved));
      setLoaded(true);
    }
  }, [tables, storageKey, loaded]);

  const savePositions = (newPos) => {
    localStorage.setItem(storageKey, JSON.stringify(newPos));
    setPositions(newPos);
  };

  const stats = {
    free: (tables || []).filter(t => t.status === 'free').length,
    occupied: (tables || []).filter(t => t.status === 'occupied').length,
    reserved: (tables || []).filter(t => t.status === 'reserved').length,
    dirty: (tables || []).filter(t => t.status === 'maintenance' || t.status === 'dirty').length,
  };

  const activeTable = selectedTable ? (tables || []).find(t => t.id === selectedTable) : null;
  const currentOrder = activeTable?.pedido_atual_id
    ? orders.find(o => o.id === activeTable.pedido_atual_id)
    : null;

  const handleStatusChange = async (newStatus) => {
    if (!selectedTable) return;
    const dbStatus = newStatus === 'dirty' ? 'maintenance' : newStatus;
    await updateTable(selectedTable, { status: dbStatus });
  };

  // Build cell → table map
  const gridMap = {};
  (tables || []).forEach(t => {
    const p = positions[t.id];
    if (p) gridMap[`${p.col},${p.row}`] = t;
  });

  const handleDragStart = (e, tableId) => {
    setDragging(tableId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, col, row) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOver(`${col},${row}`);
  };

  const handleDrop = (e, col, row) => {
    e.preventDefault();
    if (dragging === null) return;

    const newPos = { ...positions };
    const displaced = (tables || []).find(t => {
      const p = positions[t.id];
      return p && p.col === col && p.row === row && t.id !== dragging;
    });
    if (displaced) {
      newPos[displaced.id] = { ...positions[dragging] };
    }
    newPos[dragging] = { col, row };
    savePositions(newPos);
    setDragging(null);
    setDragOver(null);
  };

  const handleDragEnd = () => {
    setDragging(null);
    setDragOver(null);
  };

  const cells = [];
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      cells.push({ col, row });
    }
  }

  const statusLabel = {
    free: 'LIVRE',
    occupied: 'OCUPADA',
    reserved: 'RESERVADA',
    maintenance: 'LIMPEZA',
  };

  return (
    <div className="tables-page">
      {/* Stats Row */}
      <div className="tables-stats-row">
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
        {/* Floor Plan */}
        <div className="tables-grid-container">
          <div className="tables-grid-header">
            <div>
              <h3>Mapa do Salão</h3>
              {editMode && <span className="edit-hint">Arraste as mesas para posicioná-las no salão</span>}
            </div>
            <div className="tables-header-right">
              <div className="tables-legend">
                <span className="legend-item"><span className="dot free"></span> Livre</span>
                <span className="legend-item"><span className="dot occupied"></span> Ocupada</span>
                <span className="legend-item"><span className="dot reserved"></span> Reservada</span>
                <span className="legend-item"><span className="dot maintenance"></span> Limpeza</span>
              </div>
              <button
                className={`edit-layout-btn ${editMode ? 'active' : ''}`}
                onClick={() => { setEditMode(!editMode); setSelectedTable(null); }}
              >
                {editMode ? <><Lock size={13} /> Salvar Layout</> : <><Move size={13} /> Editar Layout</>}
              </button>
            </div>
          </div>

          <div className="floor-plan-grid">
            {cells.map(({ col, row }) => {
              const table = gridMap[`${col},${row}`];
              const isOver = dragOver === `${col},${row}`;
              const isDraggingThis = table && dragging === table.id;
              return (
                <div
                  key={`${col},${row}`}
                  className={`floor-cell ${(col + row) % 2 === 0 ? 'chess-a' : 'chess-b'} ${isOver ? 'drop-target' : ''}`}
                  onDragOver={editMode ? (e) => handleDragOver(e, col, row) : undefined}
                  onDrop={editMode ? (e) => handleDrop(e, col, row) : undefined}
                  onDragLeave={() => setDragOver(null)}
                >
                  {table && (
                    <div
                      className={`table-node ${table.status} ${selectedTable === table.id ? 'active' : ''} ${isDraggingThis ? 'dragging' : ''} ${editMode ? 'can-drag' : ''}`}
                      draggable={editMode}
                      onDragStart={editMode ? (e) => handleDragStart(e, table.id) : undefined}
                      onDragEnd={handleDragEnd}
                      onClick={() => !editMode && setSelectedTable(table.id === selectedTable ? null : table.id)}
                    >
                      <div className="table-node-number">{table.numero}</div>
                      {table.status === 'occupied' && (
                        <div className="table-node-indicator"><Users size={10} /></div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Sidebar Details */}
        <div className="table-details-sidebar">
          {activeTable ? (
            <div className="table-detail-card">
              <div className={`table-detail-header ${activeTable.status === 'maintenance' ? 'dirty' : activeTable.status}`}>
                <div className="table-detail-id">Mesa {activeTable.numero}</div>
                <Badge variant={
                  activeTable.status === 'free' ? 'success' :
                  activeTable.status === 'occupied' ? 'danger' :
                  activeTable.status === 'reserved' ? 'warning' : 'info'
                }>
                  {statusLabel[activeTable.status] || activeTable.status.toUpperCase()}
                </Badge>
              </div>

              <div className="table-detail-body">
                {currentOrder ? (
                  <div className="table-order-info">
                    <div className="detail-section-title">Pedido Atual</div>
                    <div className="order-id-highlight">{currentOrder.codigo}</div>
                    <div className="order-customer-main">{currentOrder.cliente_nome}</div>
                    <div className="order-items-summary">
                      {(currentOrder.itens || []).length} itens • R$ {parseFloat(currentOrder.total).toFixed(2).replace('.', ',')}
                    </div>
                  </div>
                ) : (
                  <div className="table-empty-state">
                    <Coffee size={48} className="empty-icon" />
                    <p>Mesa {activeTable.status === 'free' ? 'disponível' : 'sem pedido ativo'}.</p>
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
              <p>{editMode ? 'Arraste as mesas para montar o layout do seu salão.' : 'Selecione uma mesa para gerenciar.'}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

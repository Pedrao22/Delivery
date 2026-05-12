import React, { useState, useEffect, useRef } from 'react';
import {
  Users, Calendar, CheckCircle2, AlertCircle, Coffee, MapPin, Plus, Trash2
} from 'lucide-react';
import { useOrdersContext } from '../context/OrdersContext';
import Badge from '../components/shared/Badge';
import './TablesPage.css';

const COLS = 8;
const ROWS = 6;

function buildDefaultPositions(tables, saved) {
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
  const { tables, addTable, updateTable, deleteTable, orders, restaurantSettings } = useOrdersContext();
  const [selectedTable, setSelectedTable] = useState(null);
  const [positions, setPositions] = useState({});
  const [dragging, setDragging] = useState(null);
  const [dragOver, setDragOver] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const dragStartPos = useRef(null);

  const storageKey = `mesa_layout_${restaurantSettings?.id || 'default'}`;

  useEffect(() => {
    if ((tables || []).length === 0) return;
    if (!loaded) {
      try {
        const raw = localStorage.getItem(storageKey);
        const saved = raw ? JSON.parse(raw) : null;
        setPositions(buildDefaultPositions(tables, saved));
      } catch {
        setPositions(buildDefaultPositions(tables, null));
      }
      setLoaded(true);
    } else {
      // Assign positions to any tables added after initial load
      setPositions(prev => {
        const hasNew = (tables || []).some(t => !prev[t.id]);
        if (!hasNew) return prev;
        const next = buildDefaultPositions(tables, prev);
        try { localStorage.setItem(storageKey, JSON.stringify(next)); } catch {}
        return next;
      });
    }
  }, [tables, storageKey, loaded]);

  const savePositions = (newPos) => {
    try { localStorage.setItem(storageKey, JSON.stringify(newPos)); } catch {}
    setPositions(newPos);
  };

  const stats = {
    free:     (tables || []).filter(t => t.status === 'free').length,
    occupied: (tables || []).filter(t => t.status === 'occupied').length,
    reserved: (tables || []).filter(t => t.status === 'reserved').length,
    dirty:    (tables || []).filter(t => t.status === 'maintenance' || t.status === 'dirty').length,
  };

  const activeTable = selectedTable ? (tables || []).find(t => t.id === selectedTable) : null;
  const currentOrder = activeTable?.pedido_atual_id
    ? orders.find(o => o.id === activeTable.pedido_atual_id)
    : null;

  const handleStatusChange = async (newStatus) => {
    if (!selectedTable) return;
    await updateTable(selectedTable, { status: newStatus === 'dirty' ? 'maintenance' : newStatus });
  };

  const handleAddTable = async () => {
    const nums = (tables || []).map(t => parseInt(t.numero, 10)).filter(n => !isNaN(n));
    const next = nums.length > 0 ? Math.max(...nums) + 1 : 1;
    const numero = String(next).padStart(2, '0');
    try {
      await addTable({ numero, capacidade: 4 });
    } catch (e) {
      alert('Erro ao adicionar mesa:\n' + (e?.message || JSON.stringify(e)));
    }
  };

  const handleDeleteTable = async () => {
    if (!selectedTable) return;
    if (!window.confirm('Remover esta mesa?')) return;
    const newPos = { ...positions };
    delete newPos[selectedTable];
    savePositions(newPos);
    setSelectedTable(null);
    await deleteTable(selectedTable);
  };

  // Grid map: "col,row" → table
  const gridMap = {};
  (tables || []).forEach(t => {
    const p = positions[t.id];
    if (p) gridMap[`${p.col},${p.row}`] = t;
  });

  const handleDragStart = (e, tableId) => {
    setDragging(tableId);
    dragStartPos.current = tableId;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', tableId);
  };

  const handleDragOver = (e, col, row) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    setDragOver(`${col},${row}`);
  };

  const handleDrop = (e, col, row) => {
    e.preventDefault();
    const tid = e.dataTransfer.getData('text/plain') || dragging;
    if (!tid) return;

    const newPos = { ...positions };
    // Swap if a table is already at the target cell
    const displaced = (tables || []).find(t => {
      const p = positions[t.id];
      return p && p.col === col && p.row === row && t.id !== tid;
    });
    if (displaced) {
      newPos[displaced.id] = { ...positions[tid] };
    }
    newPos[tid] = { col, row };
    savePositions(newPos);
    setDragging(null);
    setDragOver(null);
    dragStartPos.current = null;
  };

  const handleDragEnd = () => {
    setDragging(null);
    setDragOver(null);
    dragStartPos.current = null;
  };

  const handleTableClick = (tableId) => {
    // Only treat as click if no drag happened
    if (dragStartPos.current !== null) return;
    setSelectedTable(prev => prev === tableId ? null : tableId);
  };

  const cells = [];
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      cells.push({ col, row });
    }
  }

  const statusLabel = { free: 'LIVRE', occupied: 'OCUPADA', reserved: 'RESERVADA', maintenance: 'LIMPEZA' };
  const badgeVariant = { free: 'success', occupied: 'danger', reserved: 'warning', maintenance: 'info' };

  return (
    <div className="tables-page">
      {/* Stats */}
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
              <span className="drag-hint">Arraste as mesas para reorganizar o salão</span>
            </div>
            <div className="tables-header-right">
              <div className="tables-legend">
                <span className="legend-item"><span className="dot free"></span> Livre</span>
                <span className="legend-item"><span className="dot occupied"></span> Ocupada</span>
                <span className="legend-item"><span className="dot reserved"></span> Reservada</span>
                <span className="legend-item"><span className="dot maintenance"></span> Limpeza</span>
              </div>
              <button className="add-table-btn" onClick={handleAddTable}>
                <Plus size={14} /> Adicionar Mesa
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
                  className={`floor-cell ${(col + row) % 2 === 0 ? 'chess-a' : 'chess-b'}${isOver ? ' drop-target' : ''}`}
                  onDragOver={(e) => handleDragOver(e, col, row)}
                  onDrop={(e) => handleDrop(e, col, row)}
                  onDragLeave={(e) => {
                    if (!e.currentTarget.contains(e.relatedTarget)) {
                      setDragOver(null);
                    }
                  }}
                >
                  {table && (
                    <div
                      className={`table-node ${table.status}${selectedTable === table.id ? ' active' : ''}${isDraggingThis ? ' dragging' : ''}`}
                      draggable
                      onDragStart={(e) => handleDragStart(e, table.id)}
                      onDragEnd={handleDragEnd}
                      onClick={() => handleTableClick(table.id)}
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

        {/* Sidebar */}
        <div className="table-details-sidebar">
          {activeTable ? (
            <div className="table-detail-card">
              <div className={`table-detail-header ${activeTable.status === 'maintenance' ? 'dirty' : activeTable.status}`}>
                <div className="table-detail-id">Mesa {activeTable.numero}</div>
                <Badge variant={badgeVariant[activeTable.status] || 'info'}>
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
                  <button onClick={() => handleStatusChange('free')}     className="status-btn free">Livre</button>
                  <button onClick={() => handleStatusChange('occupied')} className="status-btn occupied">Ocupar</button>
                  <button onClick={() => handleStatusChange('reserved')} className="status-btn reserved">Reservar</button>
                  <button onClick={() => handleStatusChange('dirty')}    className="status-btn dirty">Limpar</button>
                </div>
                <button className="remove-table-btn" onClick={handleDeleteTable}>
                  <Trash2 size={14} /> Remover Mesa
                </button>
              </div>
            </div>
          ) : (
            <div className="table-selection-prompt">
              <MapPin size={40} />
              <p>Clique em uma mesa para ver detalhes ou arraste para reposicioná-la.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

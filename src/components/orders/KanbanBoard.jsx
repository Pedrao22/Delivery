import { useState, useEffect, useRef } from 'react';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragOverlay } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CheckCheck, ArrowUpRight, Clock, Edit2, X, ToggleLeft, ToggleRight } from 'lucide-react';
import OrderCard from './OrderCard';
import OrderModal from './OrderModal';
import EmptyState from '../shared/EmptyState';
import './KanbanBoard.css';

const columns = [
  { id: 'analyzing', title: 'Em Análise', dot: 'analyzing', emptyIcon: '📋', emptyText: 'Nenhum pedido novo', emptyDesc: 'Novos pedidos aparecerão aqui' },
  { id: 'production', title: 'Em Produção', dot: 'production', emptyIcon: '👨‍🍳', emptyText: 'Nenhum pedido em produção', emptyDesc: 'Aceite pedidos para iniciar' },
  { id: 'ready', title: 'Prontos para Entrega', dot: 'ready', emptyIcon: '✅', emptyText: 'Nenhum pedido pronto', emptyDesc: 'Pedidos finalizados aqui' },
];

export default function KanbanBoard({ orders, onMoveOrder, onFinalizeReady, onFinalizeOrder }) {
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [activeId, setActiveId] = useState(null);
  const boardRef = useRef(null);
  const colRefs = useRef([]);
  const [activeCol, setActiveCol] = useState(0);

  useEffect(() => {
    const board = boardRef.current;
    if (!board) return;
    const handleScroll = () => {
      const idx = Math.round(board.scrollLeft / board.offsetWidth);
      setActiveCol(Math.max(0, Math.min(columns.length - 1, idx)));
    };
    board.addEventListener('scroll', handleScroll, { passive: true });
    return () => board.removeEventListener('scroll', handleScroll);
  }, []);


  // Auto-accept & time settings (persisted locally)
  const [autoAccept, setAutoAccept] = useState(() => localStorage.getItem('autoAccept') === 'true');
  const [times, setTimes] = useState(() => {
    try { return JSON.parse(localStorage.getItem('orderTimes')) || { balcao: '45 a 60 min', delivery: '45 a 60 min' }; }
    catch { return { balcao: '45 a 60 min', delivery: '45 a 60 min' }; }
  });
  const [showTimeEdit, setShowTimeEdit] = useState(false);
  const [timeDraft, setTimeDraft] = useState(times);

  const toggleAutoAccept = () => {
    setAutoAccept(prev => {
      const next = !prev;
      localStorage.setItem('autoAccept', String(next));
      return next;
    });
  };

  const saveTime = () => {
    setTimes(timeDraft);
    localStorage.setItem('orderTimes', JSON.stringify(timeDraft));
    setShowTimeEdit(false);
  };

  // Auto-move analyzing orders to production when toggle is ON
  useEffect(() => {
    if (!autoAccept) return;
    const analyzing = orders.filter(o => o.status === 'analyzing');
    analyzing.forEach(o => onMoveOrder(o.id, 'production'));
  }, [autoAccept, orders]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const getColumnOrders = (status) => orders.filter(o => o.status === status);

  const handleDragStart = (event) => setActiveId(event.active.id);

  const handleDragEnd = (event) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;
    const orderId = active.id;
    const order = orders.find(o => o.id === orderId);
    if (!order) return;
    const overOrder = orders.find(o => o.id === over.id);
    if (overOrder && overOrder.status !== order.status) {
      onMoveOrder(orderId, overOrder.status);
    }
  };

  const activeOrder = activeId ? orders.find(o => o.id === activeId) : null;

  // Stats
  const totalRevenue = orders.reduce((s, o) => s + o.total, 0);
  const deliveryCount = orders.filter(o => o.type === 'delivery').length;
  const pickupCount = orders.filter(o => o.type === 'pickup').length;
  const localCount = orders.filter(o => o.type === 'local').length;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="kanban-board" ref={boardRef}>
        {columns.map((col, colIndex) => {
          const colOrders = getColumnOrders(col.id);
          return (
            <div key={col.id} className={`kanban-column col-${col.id}`} ref={el => colRefs.current[colIndex] = el}>
              <div className="kanban-column-header">
                <div className="kanban-column-title-row">
                  <div className="kanban-column-title">
                    <div className={`kanban-column-dot ${col.dot}`} />
                    <span className="kanban-column-name">{col.title}</span>
                  </div>
                  <span className="kanban-column-count">{colOrders.length}</span>
                </div>
              </div>

              <div className="kanban-column-body">
                {/* Auto-accept panel — only in "Em Análise" column */}
                {col.id === 'analyzing' && (
                  <div className="kanban-time-panel">
                    <div className="kanban-time-row">
                      <div className="kanban-time-info">
                        <Clock size={13} />
                        <span>Balcão: <strong>{times.balcao}</strong></span>
                        <span className="kanban-time-sep">·</span>
                        <span>Delivery: <strong>{times.delivery}</strong></span>
                      </div>
                      <button className="kanban-edit-time-btn" onClick={() => { setTimeDraft(times); setShowTimeEdit(true); }}>
                        <Edit2 size={12} /> Editar
                      </button>
                    </div>
                    <button className={`kanban-auto-accept-toggle ${autoAccept ? 'on' : ''}`} onClick={toggleAutoAccept}>
                      {autoAccept ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
                      <span>Aceitar os pedidos automaticamente</span>
                    </button>
                    {autoAccept && (
                      <div className="kanban-auto-accept-msg">
                        <span className="kanban-auto-accept-arrow">↳</span>
                        Todos os pedidos são aceitos automaticamente
                      </div>
                    )}
                  </div>
                )}

                <SortableContext items={colOrders.map(o => o.id)} strategy={verticalListSortingStrategy}>
                  {colOrders.length === 0 ? (
                    <EmptyState icon={col.emptyIcon} title={col.emptyText} description={col.emptyDesc} />
                  ) : (
                    colOrders.map((order, i) => (
                      <OrderCard
                        key={order.id}
                        order={order}
                        onClick={setSelectedOrder}
                        onFinalize={onFinalizeOrder}
                        style={{ animationDelay: `${i * 50}ms` }}
                      />
                    ))
                  )}
                </SortableContext>
              </div>

              {col.id === 'ready' && colOrders.length > 0 && (
                <div className="kanban-column-footer">
                  <button className="kanban-finalize-btn" onClick={onFinalizeReady}>
                    <CheckCheck size={18} />
                    Finalizar Todos ({colOrders.length})
                  </button>
                </div>
              )}
            </div>
          );
        })}

        {/* Stats Console (Now inside the board) */}
        <div className="orders-stats-sidebar">
          <div className="orders-stats-sidebar-title">Resumo do Dia</div>
          
          <div className="orders-stat-card">
            <div className="orders-stat-icon" style={{ background: 'var(--accent-lighter)', color: 'var(--accent)' }}>
              📦
            </div>
            <div className="orders-stat-info">
              <div className="orders-stat-label">Total de Pedidos</div>
              <div className="orders-stat-value">{orders.length}</div>
            </div>
          </div>
          
          <div className="orders-stat-card">
            <div className="orders-stat-icon" style={{ background: 'var(--success-light)', color: 'var(--success)' }}>
              💰
            </div>
            <div className="orders-stat-info">
              <div className="orders-stat-label">Faturamento</div>
              <div className="orders-stat-value">R$ {totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</div>
              <div className="orders-stat-change"><ArrowUpRight size={10} /> +12% hoje</div>
            </div>
          </div>
          
          <div className="orders-stats-divider">Breakdown</div>

          <div className="orders-stat-card mini">
            <div className="orders-stat-icon small" style={{ background: '#EBF5FF', color: '#2E86DE' }}>
              🛵
            </div>
            <div className="orders-stat-info">
              <div className="orders-stat-label">Delivery</div>
              <div className="orders-stat-value">{deliveryCount}</div>
            </div>
          </div>
          
          <div className="orders-stat-card mini">
            <div className="orders-stat-icon small" style={{ background: '#FFF3E0', color: '#E67E22' }}>
              🏪
            </div>
            <div className="orders-stat-info">
              <div className="orders-stat-label">Retirada</div>
              <div className="orders-stat-value">{pickupCount}</div>
            </div>
          </div>
          
          <div className="orders-stat-card mini">
            <div className="orders-stat-icon small" style={{ background: '#E8F5E9', color: '#27AE60' }}>
              🍽️
            </div>
            <div className="orders-stat-info">
              <div className="orders-stat-label">Local</div>
              <div className="orders-stat-value">{localCount}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Dots indicadores — visíveis só no mobile */}
      <div className="kanban-dots">
        {columns.map((col, i) => (
          <span key={col.id} className={`kanban-dot col-dot-${col.id} ${activeCol === i ? 'active' : ''}`} />
        ))}
      </div>

      <DragOverlay>
        {activeOrder && <OrderCard order={activeOrder} onClick={() => {}} />}
      </DragOverlay>

      {/* Time Edit Modal */}
      {showTimeEdit && (
        <div className="kanban-modal-overlay" onClick={() => setShowTimeEdit(false)}>
          <div className="kanban-modal" onClick={e => e.stopPropagation()}>
            <div className="kanban-modal-header">
              <h3>Editar Tempos de Espera</h3>
              <button onClick={() => setShowTimeEdit(false)}><X size={18} /></button>
            </div>
            <div className="kanban-modal-body">
              <div className="kanban-modal-field">
                <label>Balcão / Retirada</label>
                <input value={timeDraft.balcao} onChange={e => setTimeDraft(d => ({ ...d, balcao: e.target.value }))} placeholder="Ex: 45 a 60 min" />
              </div>
              <div className="kanban-modal-field">
                <label>Delivery</label>
                <input value={timeDraft.delivery} onChange={e => setTimeDraft(d => ({ ...d, delivery: e.target.value }))} placeholder="Ex: 45 a 60 min" />
              </div>
            </div>
            <div className="kanban-modal-footer">
              <button className="kanban-modal-cancel" onClick={() => setShowTimeEdit(false)}>Cancelar</button>
              <button className="kanban-modal-save" onClick={saveTime}>Salvar</button>
            </div>
          </div>
        </div>
      )}

      <OrderModal
        order={selectedOrder}
        isOpen={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
        onMoveOrder={onMoveOrder}
      />
    </DndContext>
  );
}

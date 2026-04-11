import { useState } from 'react';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragOverlay } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CheckCheck, DollarSign, ArrowUpRight } from 'lucide-react';
import OrderCard from './OrderCard';
import OrderModal from './OrderModal';
import EmptyState from '../shared/EmptyState';
import './KanbanBoard.css';

const columns = [
  { id: 'analyzing', title: 'Em Análise', dot: 'analyzing', emptyIcon: '📋', emptyText: 'Nenhum pedido novo', emptyDesc: 'Novos pedidos aparecerão aqui' },
  { id: 'production', title: 'Em Produção', dot: 'production', emptyIcon: '👨‍🍳', emptyText: 'Nenhum pedido em produção', emptyDesc: 'Aceite pedidos para iniciar' },
  { id: 'ready', title: 'Prontos para Entrega', dot: 'ready', emptyIcon: '✅', emptyText: 'Nenhum pedido pronto', emptyDesc: 'Pedidos finalizados aqui' },
];

export default function KanbanBoard({ orders, onMoveOrder, onFinalizeReady }) {
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [activeId, setActiveId] = useState(null);

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
      <div className="kanban-board">
        {columns.map(col => {
          const colOrders = getColumnOrders(col.id);
          const colRevenue = colOrders.reduce((s, o) => s + o.total, 0);
          return (
            <div key={col.id} className="kanban-column">
              <div className="kanban-column-header">
                <div className="kanban-column-title-row">
                  <div className="kanban-column-title">
                    <div className={`kanban-column-dot ${col.dot}`} />
                    <span className="kanban-column-name">{col.title}</span>
                  </div>
                  <span className="kanban-column-count">{colOrders.length}</span>
                </div>
                <div className="kanban-column-stats">
                  <div className="kanban-column-stat">
                    💰 <strong>R$ {colRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</strong>
                  </div>
                  {colOrders.length > 0 && (
                    <div className="kanban-column-stat">
                      🎫 <strong>Ticket: R$ {Math.round(colRevenue / colOrders.length)}</strong>
                    </div>
                  )}
                </div>
              </div>

              <div className="kanban-column-body">
                <SortableContext items={colOrders.map(o => o.id)} strategy={verticalListSortingStrategy}>
                  {colOrders.length === 0 ? (
                    <EmptyState icon={col.emptyIcon} title={col.emptyText} description={col.emptyDesc} />
                  ) : (
                    colOrders.map((order, i) => (
                      <OrderCard
                        key={order.id}
                        order={order}
                        onClick={setSelectedOrder}
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

      <DragOverlay>
        {activeOrder && <OrderCard order={activeOrder} onClick={() => {}} />}
      </DragOverlay>

      <OrderModal
        order={selectedOrder}
        isOpen={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
        onMoveOrder={onMoveOrder}
      />
    </DndContext>
  );
}

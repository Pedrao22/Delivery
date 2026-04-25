import React, { useState } from 'react';
import { 
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  defaultDropAnimationSideEffects
} from '@dnd-kit/core';
import { 
  arrayMove, 
  SortableContext, 
  sortableKeyboardCoordinates, 
  verticalListSortingStrategy 
} from '@dnd-kit/sortable';
import { 
  Clock, 
  Utensils, 
  CheckCircle2, 
  AlertCircle, 
  ChefHat, 
  Truck, 
  User, 
  Timer,
  ChevronRight,
  MoreVertical
} from 'lucide-react';
import { useOrdersContext } from '../context/OrdersContext';

// --- Sub-componente: Card do Pedido na Esteira ---
const OrderCard = ({ order, isOverlay = false }) => {
  const getWaitTime = (createdAt) => {
    const diff = Math.floor((new Date() - new Date(createdAt)) / 60000);
    return diff;
  };

  const minutes = getWaitTime(order.criado_em);
  const isUrgent = minutes > 20;

  return (
    <div className={`
      relative p-4 rounded-xl border transition-all cursor-grab active:cursor-grabbing
      ${isOverlay ? 'opacity-90 shadow-2xl scale-105 rotate-2 bg-purple-900/40 border-purple-500/50' : 'bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/[0.07]'}
      ${isUrgent && order.status !== 'ready' ? 'border-rose-500/40 shadow-[0_0_15px_rgba(244,63,94,0.1)]' : ''}
    `}>
      {isUrgent && order.status !== 'ready' && (
        <div className="absolute -top-2 -right-2 w-4 h-4 rounded-full bg-rose-500 animate-pulse border-2 border-[#09090b]" />
      )}
      
      <div className="flex justify-between items-start mb-3">
        <span className="text-[10px] font-black text-purple-400 tracking-widest uppercase">
          #{order.codigo}
        </span>
        <div className="flex items-center gap-1 text-[10px] text-slate-500 font-medium italic">
          <Timer size={10} />
          {minutes}min
        </div>
      </div>

      <div className="space-y-1 mb-4">
        <h4 className="text-sm font-bold text-slate-200">{order.cliente_nome}</h4>
        <p className="text-[10px] text-slate-500 line-clamp-1">{order.cliente_endereco || 'Retirada no Local'}</p>
      </div>

      <div className="space-y-2 py-3 border-y border-white/5">
        {order.itens?.slice(0, 2).map((item, idx) => (
          <div key={idx} className="flex justify-between text-xs">
            <span className="text-slate-400 font-medium">
              <span className="text-purple-400 mr-2 font-bold">{item.quantity}x</span> 
              {item.nome}
            </span>
          </div>
        ))}
        {order.itens?.length > 2 && (
          <p className="text-[10px] text-purple-400/60 font-medium">+{order.itens.length - 2} itens adicionais</p>
        )}
      </div>

      <div className="mt-3 flex justify-between items-center pt-1">
        <div className="flex items-center gap-1">
          <span className="text-[10px] font-bold text-slate-500 uppercase px-2 py-0.5 rounded bg-white/5">
            {order.tipo}
          </span>
        </div>
        <span className="text-sm font-black text-white">R$ {parseFloat(order.total).toFixed(2)}</span>
      </div>
    </div>
  );
};

// --- Coluna do Kanban ---
const PipelineColumn = ({ title, icon: Icon, orders, status, colorClass }) => {
  return (
    <div className="flex flex-col h-full min-w-[320px] bg-white/[0.02] rounded-2xl border border-white/5">
      <div className={`p-4 border-b border-white/5 flex items-center justify-between sticky top-0 bg-[#09090b]/80 backdrop-blur-md rounded-t-2xl z-10`}>
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg bg-white/5 ${colorClass}`}>
            <Icon size={18} />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-300 uppercase tracking-widest">{title}</h3>
            <p className="text-[10px] text-slate-500 uppercase">{orders.length} pedidos em fila</p>
          </div>
        </div>
        <button className="text-slate-600 hover:text-white transition-colors">
          <MoreVertical size={18} />
        </button>
      </div>

      <div className="flex-1 p-3 space-y-3 overflow-y-auto no-scrollbar">
        {orders.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center opacity-20 py-12">
            <Icon size={48} className="mb-4" />
            <p className="text-xs uppercase font-bold tracking-widest">Coluna Vazia</p>
          </div>
        ) : (
          orders.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))
        )}
      </div>
    </div>
  );
};

const OperationalPipeline = () => {
  const { orders, moveOrder, loadingOrders, refreshOrders } = useOrdersContext();
  const [activeOrder, setActiveOrder] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const columns = [
    { id: 'analyzing', title: 'Backlog', icon: Clock, colorClass: 'text-amber-400' },
    { id: 'production', title: 'Em Preparação', icon: ChefHat, colorClass: 'text-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.2)]' },
    { id: 'ready', title: 'Pronto para Entrega', icon: Truck, colorClass: 'text-emerald-400' }
  ];

  const handleDragStart = ({ active }) => {
    setActiveOrder(orders.find(o => o.id === active.id));
  };

  const handleDragEnd = async ({ active, over }) => {
    setActiveOrder(null);
    if (!over) return;

    const orderId = active.id;
    const overId = over.id;

    // Check if dragged into a column area
    if (overId !== active.id && columns.some(c => c.id === overId)) {
      await moveOrder(orderId, overId);
    }
  };

  return (
    <div className="h-full flex flex-col space-y-6 animate-fade-in overflow-hidden">
      {/* Header Operational */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
            <Utensils className="text-purple-500" />
            Esteira de Produção
          </h2>
          <p className="text-sm text-slate-500 font-medium">Controle de fluxo operacional em tempo real.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex -space-x-2">
            {[1,2,3].map(i => (
              <div key={i} className="w-8 h-8 rounded-full border-2 border-[#09090b] bg-slate-800 flex items-center justify-center">
                <User size={14} className="text-slate-400" />
              </div>
            ))}
            <div className="w-8 h-8 rounded-full border-2 border-[#09090b] bg-purple-500/20 flex items-center justify-center text-[10px] font-bold text-purple-400">
              +4
            </div>
          </div>
          <button 
            onClick={refreshOrders}
            className="p-3 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-purple-500/10 transition-all"
          >
            <RefreshCw size={20} className={loadingOrders ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Grid Kanban de Alta performance */}
      <div className="flex-1 flex gap-6 overflow-x-auto pb-4 no-scrollbar">
        {columns.map(col => (
          <PipelineColumn 
            key={col.id}
            id={col.id}
            title={col.title}
            icon={col.icon}
            status={col.id}
            colorClass={col.colorClass}
            orders={orders.filter(o => o.status === col.id)}
          />
        ))}
      </div>
      
      {/* Footer / Stats da Esteira */}
      <div className="flex items-center gap-6 px-2 text-[10px] font-black text-slate-600 uppercase tracking-widest">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-amber-400" /> {orders.filter(o => o.status === 'analyzing').length} pendentes
        </div>
        <div className="flex items-center gap-2 text-purple-400">
          <div className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" /> {orders.filter(o => o.status === 'production').length} em produção
        </div>
        <div className="flex items-center gap-2 text-emerald-400">
          <div className="w-2 h-2 rounded-full bg-emerald-400" /> {orders.filter(o => o.status === 'ready').length} entregáveis
        </div>
      </div>
    </div>
  );
};

// Auxiliar para Icone de Refresh
const RefreshCw = ({ size, className }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
    <path d="M21 3v5h-5"/>
    <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
    <path d="M3 21v-5h5"/>
  </svg>
);

export default OperationalPipeline;

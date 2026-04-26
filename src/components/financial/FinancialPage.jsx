import { useState, useMemo } from 'react';
import { ArrowUpRight, ArrowDownRight, DollarSign, ShoppingBag, CreditCard, Wallet, Smartphone, History } from 'lucide-react';
import { useOrdersContext } from '../../context/OrdersContext';
import FilterTabs from '../shared/FilterTabs';
import './FinancialPage.css';

const periodTabs = [
  { value: '1', label: 'Hoje' },
  { value: '7', label: '7 dias' },
  { value: '30', label: '30 dias' },
];

export default function FinancialPage() {
  const { orders, getStatsForPeriod } = useOrdersContext();
  const [period, setPeriod] = useState('7');

  const stats = useMemo(() => getStatsForPeriod(period), [getStatsForPeriod, period, orders]);

  const recentTransactions = useMemo(() => {
    return orders
      .filter(o => o.status === 'ready' || o.status === 'production' || o.status === 'analyzing')
      .slice(0, 10)
      .map(o => ({
        id: o.id,
        customer: o.customer.name,
        method: o.payment,
        value: o.total,
        time: new Date(o.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }));
  }, [orders]);

  const methods = useMemo(() => {
    const total = stats.revenue || 1;
    return [
      { icon: <Wallet size={18} />, label: 'Dinheiro', value: stats.payments.cash, percent: Math.round((stats.payments.cash/total)*100), color: '#27ae60' },
      { icon: <CreditCard size={18} />, label: 'Cartão', value: stats.payments.card, percent: Math.round((stats.payments.card/total)*100), color: '#2980b9' },
      { icon: <Smartphone size={18} />, label: 'Pix', value: stats.payments.pix, percent: Math.round((stats.payments.pix/total)*100), color: '#f39c12' },
    ];
  }, [stats]);

  return (
    <div className="financial-page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-5)', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: 'var(--font-2xl)', fontWeight: 'var(--fw-bold)' }}>Financeiro</h2>
          <p style={{ fontSize: 'var(--font-sm)', color: 'var(--text-tertiary)' }}>Gestão de receitas e fluxo de caixa real</p>
        </div>
        <FilterTabs tabs={periodTabs} active={period} onChange={setPeriod} />
      </div>

      {/* Hero Card */}
      <div className="financial-total-card animate-fadeInUp">
        <div className="financial-total-left">
          <div className="financial-total-label">Faturamento no Período</div>
          <div className="financial-total-value">
            R$ {stats.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <div className={`financial-total-change ${stats.growth >= 0 ? 'positive' : 'negative'}`}>
            {stats.growth >= 0 ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
            {Math.abs(stats.growth).toFixed(1)}% vs período anterior
          </div>
        </div>
        <div className="financial-total-right">
          <div className="financial-total-mini">
            <div className="financial-total-mini-value">{stats.ordersCount}</div>
            <div className="financial-total-mini-label">Pedidos</div>
          </div>
          <div className="financial-total-mini">
            <div className="financial-total-mini-value">R$ {Math.round(stats.ticket)}</div>
            <div className="financial-total-mini-label">Ticket Médio</div>
          </div>
        </div>
      </div>

      {/* Methods */}
      <div className="financial-breakdown">
        {methods.map((method, i) => (
          <div key={method.label} className="financial-method-card" style={{ animationDelay: `${i * 60}ms` }}>
            <div className="financial-method-icon" style={{ background: `${method.color}15`, color: method.color }}>
              {method.icon}
            </div>
            <div style={{ flex: 1 }}>
              <div className="financial-method-label">{method.label}</div>
              <div className="financial-method-value">
                R$ {method.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
              <div className="financial-method-percent">{method.percent}% do faturamento</div>
              <div className="financial-method-bar">
                <div className="financial-method-bar-fill" style={{ width: `${method.percent}%`, background: method.color }} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Transactions */}
      {recentTransactions.length > 0 ? (
        <div className="financial-transactions animate-fadeInUp" style={{ animationDelay: '300ms' }}>
          <div className="financial-transactions-header">
            <h3><History size={18} /> Transações Recentes</h3>
            <span className="financial-transactions-count">{recentTransactions.length} registros</span>
          </div>
          {recentTransactions.map((tx, i) => {
            const initials = tx.customer.split(' ').map(n => n[0]).join('').slice(0, 2);
            return (
              <div key={tx.id} className="financial-transaction-row" style={{ animationDelay: `${i * 40}ms` }}>
                <div className="financial-tx-left">
                  <div className="financial-tx-avatar">{initials}</div>
                  <div className="financial-tx-info">
                    <span className="financial-tx-customer">{tx.customer}</span>
                    <span className="financial-tx-id">{tx.id}</span>
                  </div>
                </div>
                <div className="financial-tx-right">
                  <span className="financial-tx-method">{tx.method}</span>
                  <span className="financial-tx-amount">R$ {tx.value.toFixed(2).replace('.', ',')}</span>
                  <span className="financial-tx-time">{tx.time}</span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="financial-empty">
          <DollarSign size={48} style={{ opacity: 0.1, marginBottom: 16 }} />
          <p>Nenhuma transação registrada para este período.</p>
        </div>
      )}
    </div>
  );
}

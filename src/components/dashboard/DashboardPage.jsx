import { useState, useMemo } from 'react';
import { 
  DollarSign, ShoppingBag, TrendingUp, Clock, 
  ArrowUpRight, ArrowDownRight, Star, Flame, Users, Zap,
  BarChart3, PieChart, Info, CreditCard
} from 'lucide-react';
import { useOrdersContext } from '../../context/OrdersContext';
import FilterTabs from '../shared/FilterTabs';
import './DashboardPage.css';

const periodTabs = [
  { value: '1', label: 'Hoje' },
  { value: '7', label: '7 dias' },
  { value: '30', label: '30 dias' },
];

export default function DashboardPage() {
  const { orders, getStatsForPeriod } = useOrdersContext();
  const [period, setPeriod] = useState('7');

  const stats = useMemo(() => getStatsForPeriod(period), [getStatsForPeriod, period, orders]);

  // Derived stats from real orders
  const topProducts = useMemo(() => {
    const counts = {};
    orders.forEach(order => {
      order.items.forEach(item => {
        counts[item.name] = (counts[item.name] || 0) + item.qty;
      });
    });
    return Object.entries(counts)
      .map(([name, count]) => ({ name, orders: count, revenue: count * 35 })) // Estimated price for demo
      .sort((a, b) => b.orders - a.orders)
      .slice(0, 5);
  }, [orders]);

  const typeDistribution = useMemo(() => {
    const counts = { delivery: 0, local: 0, pickup: 0 };
    orders.forEach(o => counts[o.type]++);
    const total = orders.length || 1;
    return [
      { label: 'Delivery', value: Math.round((counts.delivery / total) * 100), color: 'var(--info)', icon: '🛵' },
      { label: 'Retirada', value: Math.round((counts.pickup / total) * 100), color: 'var(--warning)', icon: '🏪' },
      { label: 'Local', value: Math.round((counts.local / total) * 100), color: 'var(--success)', icon: '🍽️' },
    ];
  }, [orders]);

  if (orders.length === 0) {
    return (
      <div className="dashboard-page empty">
        <div className="dashboard-empty-state">
          <BarChart3 size={64} style={{ opacity: 0.1, marginBottom: 20 }} />
          <h3>Nenhum dado disponível</h3>
          <p>Você ainda não possui pedidos registrados para gerar estatísticas.</p>
          <p style={{ fontSize: 'var(--font-xs)', marginTop: 8 }}>Vá para o Caixa (PDV) e crie seu primeiro pedido!</p>
        </div>
      </div>
    );
  }

  const maxValue = Math.max(...stats.dailyData.map(d => d.value)) || 1;

  return (
    <div className="dashboard-page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-5)', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: 'var(--font-2xl)', fontWeight: 'var(--fw-bold)', color: 'var(--text-primary)' }}>
            Meu Desempenho
          </h2>
          <p style={{ fontSize: 'var(--font-sm)', color: 'var(--text-tertiary)' }}>
            Acompanhe os resultados baseados em {orders.length} pedidos reais
          </p>
        </div>
        <FilterTabs tabs={periodTabs} active={period} onChange={setPeriod} />
      </div>

      {/* Hero KPI */}
      <div className="dashboard-hero-kpi animate-fadeInUp">
        <div className="dashboard-hero-left">
          <div className="dashboard-hero-label">Faturamento no Período</div>
          <div className="dashboard-hero-value">R$ {stats.revenue.toLocaleString('pt-BR')}</div>
          <div className={`dashboard-hero-change ${stats.growth >= 0 ? 'positive' : 'negative'}`}>
            {stats.growth >= 0 ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
            {Math.abs(stats.growth).toFixed(1)}% em relação ao período anterior
          </div>
        </div>
        <div className="dashboard-hero-right">
          <div className="dashboard-hero-mini">
            <div className="dashboard-hero-mini-value">{stats.ordersCount}</div>
            <div className="dashboard-hero-mini-label">Pedidos</div>
          </div>
          <div className="dashboard-hero-mini-divider" />
          <div className="dashboard-hero-mini">
            <div className="dashboard-hero-mini-value">R$ {stats.ticket.toFixed(0)}</div>
            <div className="dashboard-hero-mini-label">Ticket Médio</div>
          </div>
        </div>
      </div>

      {/* Secondary KPIs */}
      <div className="dashboard-kpis">
        <div className="kpi-card" style={{ animationDelay: '0ms' }}>
          <div className="kpi-icon" style={{ background: 'var(--accent-lighter)', color: 'var(--accent)' }}>
            <ShoppingBag size={22} />
          </div>
          <div className="kpi-content">
            <div className="kpi-label">Volume de Pedidos</div>
            <div className="kpi-value">{stats.ordersCount}</div>
          </div>
        </div>
        <div className="kpi-card" style={{ animationDelay: '60ms' }}>
          <div className="kpi-icon" style={{ background: 'var(--success-light)', color: 'var(--success-dark)' }}>
            <TrendingUp size={22} />
          </div>
          <div className="kpi-content">
            <div className="kpi-label">Ticket Médio Real</div>
            <div className="kpi-value">R$ {stats.ticket.toFixed(2).replace('.', ',')}</div>
          </div>
        </div>
        <div className="kpi-card" style={{ animationDelay: '120ms' }}>
          <div className="kpi-icon" style={{ background: 'var(--info-light)', color: 'var(--info-dark)' }}>
            <CreditCard size={22} />
          </div>
          <div className="kpi-content">
            <div className="kpi-label">Maior Canal</div>
            <div className="kpi-value">{typeDistribution.reduce((a, b) => a.value > b.value ? a : b).label}</div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="dashboard-charts">
        <div className="dashboard-chart-card" style={{ animationDelay: '200ms' }}>
          <div className="dashboard-chart-header">
            <div className="dashboard-chart-title">Faturamento por Dia</div>
          </div>
          <div className="bar-chart">
            {stats.dailyData.map((item, i) => (
              <div key={i} className="bar-chart-item">
                <div className="bar-chart-value">
                  {item.value >= 1000 ? `${(item.value / 1000).toFixed(1)}k` : item.value}
                </div>
                <div
                  className="bar-chart-bar"
                  style={{ height: `${(item.value / maxValue) * 100}%` }}
                />
                <div className="bar-chart-label">{item.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="dashboard-chart-card" style={{ animationDelay: '260ms' }}>
          <div className="dashboard-chart-title">Pagamentos (Mix)</div>
          <div className="donut-chart">
            <div
              className="donut-visual"
              style={{
                background: `conic-gradient(
                  #27ae60 0% ${(stats.payments.pix / (stats.revenue || 1)) * 100}%,
                  #2980b9 ${(stats.payments.pix / (stats.revenue || 1)) * 100}% ${((stats.payments.pix + stats.payments.card) / (stats.revenue || 1)) * 100}%,
                  #f39c12 ${((stats.payments.pix + stats.payments.card) / (stats.revenue || 1)) * 100}% 100%
                )`,
              }}
            >
              <div className="donut-center">
                <div className="donut-center-valueSmall">R$</div>
                <div className="donut-center-value">{Math.round(stats.revenue)}</div>
              </div>
            </div>
            <div className="donut-legend">
              <div className="donut-legend-item">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div className="donut-legend-color" style={{ background: '#27ae60' }} />
                  <span className="donut-legend-label">Pix</span>
                </div>
                <span className="donut-legend-value">R$ {Math.round(stats.payments.pix)}</span>
              </div>
              <div className="donut-legend-item">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div className="donut-legend-color" style={{ background: '#2980b9' }} />
                  <span className="donut-legend-label">Cartão</span>
                </div>
                <span className="donut-legend-value">R$ {Math.round(stats.payments.card)}</span>
              </div>
              <div className="donut-legend-item">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div className="donut-legend-color" style={{ background: '#f39c12' }} />
                  <span className="donut-legend-label">Dinheiro</span>
                </div>
                <span className="donut-legend-value">R$ {Math.round(stats.payments.cash)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mais Vendidos */}
      <div className="dashboard-charts solo">
        <div className="dashboard-chart-card" style={{ animationDelay: '360ms' }}>
          <div className="dashboard-chart-header">
            <div className="dashboard-chart-title">🔥 Itens com Mais Saída</div>
          </div>
          <div className="top-products-list">
            {topProducts.length > 0 ? topProducts.map((prod, i) => (
              <div key={i} className="top-product-row">
                <div className="top-product-rank">#{i + 1}</div>
                <div className="top-product-info">
                  <div className="top-product-name">{prod.name}</div>
                  <div className="top-product-stats">{prod.orders} und vendidas</div>
                </div>
                <div className="top-product-trend">
                  <TrendingUp size={12} /> Alta
                </div>
              </div>
            )) : (
              <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-tertiary)' }}>
                Dados de venda pendentes...
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

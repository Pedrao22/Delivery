import { useState } from 'react';
import { DollarSign, ShoppingBag, TrendingUp, Clock, ArrowUpRight, ArrowDownRight, Star, Flame, Users, Zap } from 'lucide-react';
import FilterTabs from '../shared/FilterTabs';
import './DashboardPage.css';

const periodTabs = [
  { value: '7', label: '7 dias' },
  { value: '15', label: '15 dias' },
  { value: '30', label: '30 dias' },
];

const chartData = {
  '7': [
    { label: 'Seg', value: 1820 },
    { label: 'Ter', value: 2540 },
    { label: 'Qua', value: 1950 },
    { label: 'Qui', value: 2850 },
    { label: 'Sex', value: 3420 },
    { label: 'Sáb', value: 4100 },
    { label: 'Dom', value: 3680 },
  ],
  '15': [
    { label: 'S1', value: 8200 },
    { label: 'S2', value: 9400 },
    { label: 'S3', value: 7800 },
    { label: 'S4', value: 10200 },
  ],
  '30': [
    { label: 'Sem 1', value: 15400 },
    { label: 'Sem 2', value: 18200 },
    { label: 'Sem 3', value: 16800 },
    { label: 'Sem 4', value: 21500 },
  ],
};

const kpis = {
  '7': { revenue: 20360, orders: 187, ticket: 108.88, pending: 12, avgTime: 18, satisfaction: 4.8, returning: 72 },
  '15': { revenue: 38600, orders: 342, ticket: 112.87, pending: 18, avgTime: 17, satisfaction: 4.7, returning: 68 },
  '30': { revenue: 71900, orders: 658, ticket: 109.27, pending: 25, avgTime: 19, satisfaction: 4.8, returning: 74 },
};

const topProducts = [
  { name: 'Smash Burger Clássico', orders: 87, revenue: 2862, trend: '+15%' },
  { name: 'Pepperoni Premium', orders: 64, revenue: 3129, trend: '+22%' },
  { name: 'Burger BBQ Supremo', orders: 52, revenue: 2022, trend: '+8%' },
  { name: 'Batata Frita Crocante', orders: 48, revenue: 811, trend: '+5%' },
  { name: 'Brownie com Sorvete', orders: 41, revenue: 938, trend: '+12%' },
];

const typeDistribution = [
  { label: 'Delivery', value: 52, color: 'var(--info)', icon: '🛵' },
  { label: 'Retirada', value: 28, color: 'var(--warning)', icon: '🏪' },
  { label: 'Local', value: 20, color: 'var(--success)', icon: '🍽️' },
];

const hourlyData = [
  { hour: '10h', value: 4 }, { hour: '11h', value: 12 },
  { hour: '12h', value: 28 }, { hour: '13h', value: 22 },
  { hour: '14h', value: 8 }, { hour: '15h', value: 5 },
  { hour: '16h', value: 3 }, { hour: '17h', value: 6 },
  { hour: '18h', value: 18 }, { hour: '19h', value: 32 },
  { hour: '20h', value: 38 }, { hour: '21h', value: 25 },
  { hour: '22h', value: 14 }, { hour: '23h', value: 6 },
];

export default function DashboardPage() {
  const [period, setPeriod] = useState('7');
  const data = chartData[period];
  const kpi = kpis[period];
  const maxValue = Math.max(...data.map(d => d.value));
  const maxHourly = Math.max(...hourlyData.map(d => d.value));

  return (
    <div className="dashboard-page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-5)', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: 'var(--font-2xl)', fontWeight: 'var(--fw-bold)', color: 'var(--text-primary)' }}>
            Meu Desempenho
          </h2>
          <p style={{ fontSize: 'var(--font-sm)', color: 'var(--text-tertiary)' }}>
            Acompanhe os resultados do seu negócio em tempo real
          </p>
        </div>
        <FilterTabs tabs={periodTabs} active={period} onChange={setPeriod} />
      </div>

      {/* Hero KPI */}
      <div className="dashboard-hero-kpi animate-fadeInUp">
        <div className="dashboard-hero-left">
          <div className="dashboard-hero-label">Faturamento Total</div>
          <div className="dashboard-hero-value">R$ {kpi.revenue.toLocaleString('pt-BR')}</div>
          <div className="dashboard-hero-change">
            <ArrowUpRight size={16} /> +12.5% em relação ao período anterior
          </div>
        </div>
        <div className="dashboard-hero-right">
          <div className="dashboard-hero-mini">
            <div className="dashboard-hero-mini-value">{kpi.orders}</div>
            <div className="dashboard-hero-mini-label">Pedidos</div>
          </div>
          <div className="dashboard-hero-mini-divider" />
          <div className="dashboard-hero-mini">
            <div className="dashboard-hero-mini-value">R$ {kpi.ticket.toFixed(0)}</div>
            <div className="dashboard-hero-mini-label">Ticket Médio</div>
          </div>
          <div className="dashboard-hero-mini-divider" />
          <div className="dashboard-hero-mini">
            <div className="dashboard-hero-mini-value">{kpi.avgTime}min</div>
            <div className="dashboard-hero-mini-label">Tempo Médio</div>
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
            <div className="kpi-label">Total de Pedidos</div>
            <div className="kpi-value">{kpi.orders}</div>
            <div className="kpi-change positive"><ArrowUpRight size={12} /> +8.3%</div>
          </div>
        </div>
        <div className="kpi-card" style={{ animationDelay: '60ms' }}>
          <div className="kpi-icon" style={{ background: 'var(--success-light)', color: 'var(--success-dark)' }}>
            <TrendingUp size={22} />
          </div>
          <div className="kpi-content">
            <div className="kpi-label">Ticket Médio</div>
            <div className="kpi-value">R$ {kpi.ticket.toFixed(2).replace('.', ',')}</div>
            <div className="kpi-change negative"><ArrowDownRight size={12} /> -2.1%</div>
          </div>
        </div>
        <div className="kpi-card" style={{ animationDelay: '120ms' }}>
          <div className="kpi-icon" style={{ background: 'var(--warning-light)', color: 'var(--warning-dark)' }}>
            <Star size={22} />
          </div>
          <div className="kpi-content">
            <div className="kpi-label">Satisfação</div>
            <div className="kpi-value">⭐ {kpi.satisfaction}</div>
            <div className="kpi-change positive"><ArrowUpRight size={12} /> +0.2</div>
          </div>
        </div>
        <div className="kpi-card" style={{ animationDelay: '180ms' }}>
          <div className="kpi-icon" style={{ background: 'var(--info-light)', color: 'var(--info-dark)' }}>
            <Users size={22} />
          </div>
          <div className="kpi-content">
            <div className="kpi-label">Clientes Recorrentes</div>
            <div className="kpi-value">{kpi.returning}%</div>
            <div className="kpi-change positive"><ArrowUpRight size={12} /> +5%</div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="dashboard-charts">
        <div className="dashboard-chart-card" style={{ animationDelay: '200ms' }}>
          <div className="dashboard-chart-header">
            <div className="dashboard-chart-title">Faturamento por Período</div>
            <div style={{ fontSize: 'var(--font-xs)', color: 'var(--success)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
              <ArrowUpRight size={12} /> +12.5%
            </div>
          </div>
          <div className="bar-chart">
            {data.map((item, i) => (
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
          <div className="dashboard-chart-title">Pedidos por Tipo</div>
          <div className="donut-chart">
            <div
              className="donut-visual"
              style={{
                background: `conic-gradient(
                  var(--info) 0% 52%,
                  var(--warning) 52% 80%,
                  var(--success) 80% 100%
                )`,
              }}
            >
              <div className="donut-center">
                <div className="donut-center-value">{kpi.orders}</div>
                <div className="donut-center-label">pedidos</div>
              </div>
            </div>
            <div className="donut-legend">
              {typeDistribution.map(item => (
                <div key={item.label} className="donut-legend-item">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div className="donut-legend-color" style={{ background: item.color }} />
                    <span>{item.icon}</span>
                    <span className="donut-legend-label">{item.label}</span>
                  </div>
                  <span className="donut-legend-value">{item.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Second Charts Row: Hourly + Top Products */}
      <div className="dashboard-charts">
        <div className="dashboard-chart-card" style={{ animationDelay: '300ms' }}>
          <div className="dashboard-chart-header">
            <div className="dashboard-chart-title">Horário de Pico</div>
            <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-tertiary)' }}>
              Pedidos por hora
            </div>
          </div>
          <div className="bar-chart hourly">
            {hourlyData.map((item, i) => (
              <div key={i} className="bar-chart-item">
                <div
                  className="bar-chart-bar"
                  style={{
                    height: `${(item.value / maxHourly) * 100}%`,
                    background: item.value >= maxHourly * 0.8 ? 'var(--danger)' : item.value >= maxHourly * 0.5 ? 'var(--warning)' : 'var(--accent-gradient)',
                  }}
                />
                <div className="bar-chart-label">{item.hour}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="dashboard-chart-card" style={{ animationDelay: '360ms' }}>
          <div className="dashboard-chart-header">
            <div className="dashboard-chart-title">🔥 Mais Vendidos</div>
          </div>
          <div className="top-products-list">
            {topProducts.map((prod, i) => (
              <div key={i} className="top-product-row">
                <div className="top-product-rank">#{i + 1}</div>
                <div className="top-product-info">
                  <div className="top-product-name">{prod.name}</div>
                  <div className="top-product-stats">{prod.orders} pedidos • R$ {prod.revenue.toLocaleString('pt-BR')}</div>
                </div>
                <div className="top-product-trend">
                  <ArrowUpRight size={12} /> {prod.trend}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quality */}
      <div className="dashboard-quality" style={{ animationDelay: '400ms' }}>
        <div className="dashboard-chart-header">
          <div className="dashboard-chart-title">📋 Qualidade do Cardápio</div>
          <span style={{ fontSize: 'var(--font-sm)', fontWeight: 600, color: 'var(--success)', background: 'var(--success-light)', padding: '4px 12px', borderRadius: 'var(--radius-full)' }}>87% Otimizado</span>
        </div>
        <div className="quality-grid">
          <div className="quality-item">
            <div className="quality-value" style={{ color: 'var(--success)' }}>87%</div>
            <div className="quality-label">Otimização Geral</div>
            <div className="quality-bar"><div className="quality-bar-fill" style={{ width: '87%', background: 'var(--success)' }} /></div>
          </div>
          <div className="quality-item">
            <div className="quality-value" style={{ color: 'var(--accent)' }}>94%</div>
            <div className="quality-label">Fotos Cadastradas</div>
            <div className="quality-bar"><div className="quality-bar-fill" style={{ width: '94%', background: 'var(--accent)' }} /></div>
          </div>
          <div className="quality-item">
            <div className="quality-value" style={{ color: 'var(--info-dark)' }}>78%</div>
            <div className="quality-label">Descrições Completas</div>
            <div className="quality-bar"><div className="quality-bar-fill" style={{ width: '78%', background: 'var(--info)' }} /></div>
          </div>
          <div className="quality-item">
            <div className="quality-value" style={{ color: 'var(--warning-dark)' }}>65%</div>
            <div className="quality-label">Variações Cadastradas</div>
            <div className="quality-bar"><div className="quality-bar-fill" style={{ width: '65%', background: 'var(--warning)' }} /></div>
          </div>
        </div>
      </div>
    </div>
  );
}

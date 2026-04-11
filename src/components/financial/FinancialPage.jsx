import { useState } from 'react';
import { ArrowUpRight } from 'lucide-react';
import FilterTabs from '../shared/FilterTabs';
import './FinancialPage.css';

const periodTabs = [
  { value: 'today', label: 'Hoje' },
  { value: '7', label: '7 dias' },
  { value: '30', label: '30 dias' },
];

const financialData = {
  today: {
    total: 3842.50,
    orders: 34,
    ticket: 113,
    methods: [
      { icon: '💵', label: 'Dinheiro', value: 680.00, percent: 17.7, bg: 'var(--success-light)', barColor: 'var(--success)' },
      { icon: '💳', label: 'Cartão', value: 1420.30, percent: 37.0, bg: 'var(--info-light)', barColor: 'var(--info)' },
      { icon: '💠', label: 'Pix Online', value: 1342.20, percent: 34.9, bg: 'var(--accent-lighter)', barColor: 'var(--accent)' },
      { icon: '💠', label: 'Pix Balcão', value: 400.00, percent: 10.4, bg: 'var(--warning-light)', barColor: 'var(--warning)' },
    ],
    transactions: [
      { id: 'PED-001', customer: 'Lucas Oliveira', method: 'Pix Online', value: 144.50, time: '11:42' },
      { id: 'PED-004', customer: 'Mariana Costa', method: 'Pix Balcão', value: 136.70, time: '11:28' },
      { id: 'PED-005', customer: 'Fernando Almeida', method: 'Cartão', value: 122.60, time: '11:15' },
      { id: 'PED-007', customer: 'Gabriel Martins', method: 'Cartão', value: 135.70, time: '10:52' },
      { id: 'PED-009', customer: 'Pedro Henrique', method: 'Pix Online', value: 127.70, time: '10:30' },
      { id: 'PED-011', customer: 'Thiago Nascimento', method: 'Dinheiro', value: 129.60, time: '10:15' },
      { id: 'PED-012', customer: 'Larissa Ferreira', method: 'Pix Balcão', value: 85.70, time: '10:02' },
    ]
  },
  '7': {
    total: 20360.00,
    orders: 187,
    ticket: 109,
    methods: [
      { icon: '💵', label: 'Dinheiro', value: 3650.00, percent: 17.9, bg: 'var(--success-light)', barColor: 'var(--success)' },
      { icon: '💳', label: 'Cartão', value: 7530.00, percent: 37.0, bg: 'var(--info-light)', barColor: 'var(--info)' },
      { icon: '💠', label: 'Pix Online', value: 7120.00, percent: 35.0, bg: 'var(--accent-lighter)', barColor: 'var(--accent)' },
      { icon: '💠', label: 'Pix Balcão', value: 2060.00, percent: 10.1, bg: 'var(--warning-light)', barColor: 'var(--warning)' },
    ],
    transactions: []
  },
  '30': {
    total: 71900.00,
    orders: 658,
    ticket: 109,
    methods: [
      { icon: '💵', label: 'Dinheiro', value: 12850.00, percent: 17.9, bg: 'var(--success-light)', barColor: 'var(--success)' },
      { icon: '💳', label: 'Cartão', value: 26600.00, percent: 37.0, bg: 'var(--info-light)', barColor: 'var(--info)' },
      { icon: '💠', label: 'Pix Online', value: 25200.00, percent: 35.0, bg: 'var(--accent-lighter)', barColor: 'var(--accent)' },
      { icon: '💠', label: 'Pix Balcão', value: 7250.00, percent: 10.1, bg: 'var(--warning-light)', barColor: 'var(--warning)' },
    ],
    transactions: []
  },
};

export default function FinancialPage() {
  const [period, setPeriod] = useState('today');
  const data = financialData[period];

  return (
    <div className="financial-page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-5)', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: 'var(--font-2xl)', fontWeight: 'var(--fw-bold)' }}>Financeiro</h2>
          <p style={{ fontSize: 'var(--font-sm)', color: 'var(--text-tertiary)' }}>Visão geral das receitas</p>
        </div>
        <FilterTabs tabs={periodTabs} active={period} onChange={setPeriod} />
      </div>

      {/* Hero Card */}
      <div className="financial-total-card">
        <div className="financial-total-left">
          <div className="financial-total-label">Faturamento Total</div>
          <div className="financial-total-value">
            R$ {data.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <div className="financial-total-change">
            <ArrowUpRight size={14} /> +12.5% em relação ao período anterior
          </div>
        </div>
        <div className="financial-total-right">
          <div className="financial-total-mini">
            <div className="financial-total-mini-value">{data.orders}</div>
            <div className="financial-total-mini-label">Pedidos</div>
          </div>
          <div className="financial-total-mini">
            <div className="financial-total-mini-value">R$ {data.ticket}</div>
            <div className="financial-total-mini-label">Ticket Médio</div>
          </div>
        </div>
      </div>

      {/* Methods */}
      <div className="financial-breakdown">
        {data.methods.map((method, i) => (
          <div key={method.label} className="financial-method-card" style={{ animationDelay: `${i * 60}ms` }}>
            <div className="financial-method-icon" style={{ background: method.bg }}>
              {method.icon}
            </div>
            <div style={{ flex: 1 }}>
              <div className="financial-method-label">{method.label}</div>
              <div className="financial-method-value">
                R$ {method.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
              <div className="financial-method-percent">{method.percent}% do total</div>
              <div className="financial-method-bar">
                <div className="financial-method-bar-fill" style={{ width: `${method.percent}%`, background: method.barColor }} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Transactions */}
      {data.transactions.length > 0 && (
        <div className="financial-transactions">
          <div className="financial-transactions-header">
            <h3>Transações Recentes</h3>
            <span className="financial-transactions-count">{data.transactions.length} transações</span>
          </div>
          {data.transactions.map((tx, i) => {
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
      )}
    </div>
  );
}

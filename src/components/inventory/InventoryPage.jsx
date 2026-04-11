import { useState } from 'react';
import { AlertTriangle, CheckCircle, XCircle, TrendingUp } from 'lucide-react';
import { inventoryItems } from '../../data/inventory';
import SearchInput from '../shared/SearchInput';
import './InventoryPage.css';

export default function InventoryPage() {
  const [items, setItems] = useState(inventoryItems);
  const [search, setSearch] = useState('');

  const today = new Date();
  const getAlertStatus = (item) => {
    if (item.qty <= item.minQty * 0.5) return 'low';
    if (item.expiry) {
      const exp = new Date(item.expiry);
      const diffDays = Math.ceil((exp - today) / (1000 * 60 * 60 * 24));
      if (diffDays <= 2) return 'expiring';
    }
    if (item.qty <= item.minQty) return 'low';
    return 'ok';
  };

  const updateQty = (id, delta) => {
    setItems(prev => prev.map(i =>
      i.id === id ? { ...i, qty: Math.max(0, i.qty + delta) } : i
    ));
  };

  const filtered = items.filter(i =>
    i.name.toLowerCase().includes(search.toLowerCase()) ||
    i.category.toLowerCase().includes(search.toLowerCase())
  );

  const lowStock = items.filter(i => i.qty <= i.minQty).length;
  const expiringSoon = items.filter(i => {
    if (!i.expiry) return false;
    const diffDays = Math.ceil((new Date(i.expiry) - today) / (1000 * 60 * 60 * 24));
    return diffDays <= 3;
  }).length;

  return (
    <div className="inventory-page">
      <div className="inventory-header">
        <div>
          <h2 style={{ fontSize: 'var(--font-xl)', fontWeight: 'var(--fw-bold)' }}>Gestão de Estoque</h2>
          <p style={{ fontSize: 'var(--font-sm)', color: 'var(--text-tertiary)' }}>Controle de produtos e insumos</p>
        </div>
        <SearchInput value={search} onChange={setSearch} placeholder="Buscar item..." />
      </div>

      <div className="inventory-stats">
        <div className="inventory-stat" style={{ animationDelay: '0ms' }}>
          <div className="inventory-stat-value" style={{ color: 'var(--text-primary)' }}>{items.length}</div>
          <div className="inventory-stat-label">Total de Itens</div>
        </div>
        <div className="inventory-stat" style={{ animationDelay: '60ms' }}>
          <div className="inventory-stat-value" style={{ color: 'var(--warning-dark)' }}>{lowStock}</div>
          <div className="inventory-stat-label">Estoque Baixo</div>
        </div>
        <div className="inventory-stat" style={{ animationDelay: '120ms' }}>
          <div className="inventory-stat-value" style={{ color: 'var(--danger)' }}>{expiringSoon}</div>
          <div className="inventory-stat-label">Vencimento Próximo</div>
        </div>
        <div className="inventory-stat" style={{ animationDelay: '180ms' }}>
          <div className="inventory-stat-value" style={{ color: 'var(--success)' }}>{items.length - lowStock}</div>
          <div className="inventory-stat-label">Estoque OK</div>
        </div>
      </div>

      <div className="inventory-table">
        <div className="inventory-table-header">
          <span>Produto</span>
          <span>Categoria</span>
          <span>Quantidade</span>
          <span>Validade</span>
          <span>Fornecedor</span>
          <span>Status</span>
        </div>
        {filtered.map((item, i) => {
          const alert = getAlertStatus(item);
          return (
            <div key={item.id} className="inventory-row" style={{ animationDelay: `${i * 30}ms` }}>
              <div className="inventory-row-name">{item.name}</div>
              <div className="inventory-row-category">{item.category}</div>
              <div className="inventory-qty-control">
                <button className="inventory-qty-btn" onClick={() => updateQty(item.id, -1)}>−</button>
                <span className="inventory-qty-value">{item.qty}</span>
                <button className="inventory-qty-btn" onClick={() => updateQty(item.id, 1)}>+</button>
                <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-tertiary)' }}>{item.unit}</span>
              </div>
              <div style={{ fontSize: 'var(--font-sm)', color: 'var(--text-secondary)' }}>
                {item.expiry ? new Date(item.expiry).toLocaleDateString('pt-BR') : '—'}
              </div>
              <div style={{ fontSize: 'var(--font-sm)', color: 'var(--text-secondary)' }}>{item.supplier}</div>
              <div>
                <span className={`inventory-alert ${alert}`}>
                  {alert === 'ok' && <><CheckCircle size={12} /> OK</>}
                  {alert === 'low' && <><AlertTriangle size={12} /> Baixo</>}
                  {alert === 'expiring' && <><XCircle size={12} /> Vencendo</>}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

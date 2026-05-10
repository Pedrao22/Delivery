import React, { useState } from 'react';
import { Ticket, Plus, Trash2, Check, X, Pencil, Tag, DollarSign, Percent, TrendingUp } from 'lucide-react';
import { useOrdersContext } from '../context/OrdersContext';
import './CouponsPage.css';

const TYPE_CONFIG = {
  percentage: { label: 'Porcentagem', icon: '％', color: '#6366F1' },
  fixed:      { label: 'Valor Fixo',  icon: '💵', color: '#10B981' },
};

function CouponCard({ coupon, onDelete, onUpdate }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(coupon);
  const tc = TYPE_CONFIG[coupon.type] || TYPE_CONFIG.percentage;

  const handleSave = async () => {
    await onUpdate(coupon.id, draft);
    setEditing(false);
  };

  const handleCancel = () => { setDraft(coupon); setEditing(false); };

  const valueDisplay = coupon.type === 'percentage'
    ? `${coupon.value}%`
    : `R$ ${Number(coupon.value || 0).toFixed(2).replace('.', ',')}`;

  return (
    <div className={`cp-coupon-card ${editing ? 'editing' : ''}`}>
      <div className="cp-coupon-badge" style={{ background: `${tc.color}15`, color: tc.color }}>
        <span className="cp-coupon-icon">{tc.icon}</span>
        {editing
          ? <input className="cp-input cp-input-code" value={draft.code}
              onChange={e => setDraft(d => ({ ...d, code: e.target.value.toUpperCase() }))}
              placeholder="CÓDIGO" />
          : <span className="cp-coupon-code">{coupon.code}</span>
        }
      </div>

      <div className="cp-coupon-body">
        {editing ? (
          <div className="cp-coupon-edit-fields">
            <div className="cp-coupon-type-row">
              {Object.entries(TYPE_CONFIG).map(([k, v]) => (
                <button key={k} className={`cp-type-btn ${draft.type === k ? 'active' : ''}`}
                  style={draft.type === k ? { borderColor: v.color, color: v.color, background: `${v.color}12` } : {}}
                  onClick={() => setDraft(d => ({ ...d, type: k }))}>
                  {v.icon} {v.label}
                </button>
              ))}
            </div>
            <div className="cp-edit-row">
              <div className="cp-edit-field">
                <span className="cp-edit-label">Valor</span>
                <input className="cp-input" type="number" min={0}
                  placeholder={draft.type === 'percentage' ? 'Ex: 10' : 'Ex: 15.00'}
                  value={draft.value}
                  onChange={e => setDraft(d => ({ ...d, value: parseFloat(e.target.value) || 0 }))} />
              </div>
              <div className="cp-edit-field">
                <span className="cp-edit-label">Pedido Mín. (R$)</span>
                <input className="cp-input" type="number" min={0} placeholder="0.00"
                  value={draft.minOrder || ''}
                  onChange={e => setDraft(d => ({ ...d, minOrder: parseFloat(e.target.value) || 0 }))} />
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="cp-coupon-label" style={{ color: tc.color }}>
              {tc.label} · <strong>{valueDisplay}</strong>
            </div>
            <div className="cp-coupon-meta">
              Pedido mín.: {coupon.minOrder > 0 ? `R$ ${Number(coupon.minOrder).toFixed(2).replace('.', ',')}` : 'Sem mínimo'}
            </div>
          </>
        )}
      </div>

      <div className="cp-coupon-actions">
        {editing ? (
          <>
            <button className="cp-icon-btn cp-icon-save" onClick={handleSave} title="Salvar"><Check size={15} /></button>
            <button className="cp-icon-btn cp-icon-cancel" onClick={handleCancel} title="Cancelar"><X size={15} /></button>
          </>
        ) : (
          <>
            <button className="cp-icon-btn" onClick={() => setEditing(true)} title="Editar"><Pencil size={14} /></button>
            <button className="cp-icon-btn cp-icon-del" onClick={() => onDelete(coupon.id)} title="Remover"><Trash2 size={14} /></button>
          </>
        )}
      </div>
    </div>
  );
}

function NewCouponForm({ onSave, onCancel }) {
  const [draft, setDraft] = useState({ code: '', type: 'percentage', value: '', minOrder: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    if (!draft.code.trim()) { setError('Digite um código'); return; }
    setSaving(true);
    try {
      await onSave(draft);
    } catch (e) {
      setError(e.message || 'Erro ao criar cupom');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="cp-coupon-card editing">
      <div className="cp-coupon-badge" style={{ background: '#6366F115', color: '#6366F1' }}>
        <span className="cp-coupon-icon">％</span>
        <input className="cp-input cp-input-code" value={draft.code}
          onChange={e => { setError(''); setDraft(d => ({ ...d, code: e.target.value.toUpperCase() })); }}
          placeholder="CÓDIGO" autoFocus />
      </div>

      <div className="cp-coupon-body">
        <div className="cp-coupon-edit-fields">
          {error && <div className="cp-error">{error}</div>}
          <div className="cp-coupon-type-row">
            {Object.entries(TYPE_CONFIG).map(([k, v]) => (
              <button key={k} className={`cp-type-btn ${draft.type === k ? 'active' : ''}`}
                style={draft.type === k ? { borderColor: v.color, color: v.color, background: `${v.color}12` } : {}}
                onClick={() => setDraft(d => ({ ...d, type: k }))}>
                {v.icon} {v.label}
              </button>
            ))}
          </div>
          <div className="cp-edit-row">
            <div className="cp-edit-field">
              <span className="cp-edit-label">Valor</span>
              <input className="cp-input" type="number" min={0}
                placeholder={draft.type === 'percentage' ? 'Ex: 10' : 'Ex: 15.00'}
                value={draft.value}
                onChange={e => setDraft(d => ({ ...d, value: e.target.value }))} />
            </div>
            <div className="cp-edit-field">
              <span className="cp-edit-label">Pedido Mín. (R$)</span>
              <input className="cp-input" type="number" min={0} placeholder="0.00"
                value={draft.minOrder}
                onChange={e => setDraft(d => ({ ...d, minOrder: e.target.value }))} />
            </div>
          </div>
        </div>
      </div>

      <div className="cp-coupon-actions">
        <button className="cp-icon-btn cp-icon-save" onClick={handleSave} disabled={saving} title="Salvar">
          <Check size={15} />
        </button>
        <button className="cp-icon-btn cp-icon-cancel" onClick={onCancel} title="Cancelar"><X size={15} /></button>
      </div>
    </div>
  );
}

export default function CouponsPage() {
  const { coupons, addCoupon, updateCoupon, deleteCoupon, restaurantSettings } = useOrdersContext();
  const primaryColor = restaurantSettings?.primaryColor || '#6366F1';
  const [showNew, setShowNew] = useState(false);

  const handleAdd = async (data) => {
    await addCoupon(data);
    setShowNew(false);
  };

  return (
    <div className="cp-page">

      {/* Stats */}
      <div className="cp-stats">
        {[
          { icon: <Ticket size={18} />,     value: coupons.length, label: 'Cupons Criados', color: primaryColor },
          { icon: <TrendingUp size={18} />, value: coupons.length, label: 'Cupons Ativos',  color: '#10B981' },
          { icon: <Percent size={18} />,    value: '—',            label: 'Usos Este Mês',  color: '#F59E0B' },
        ].map((s, i) => (
          <div key={i} className="cp-stat-card">
            <div className="cp-stat-icon" style={{ background: `${s.color}15`, color: s.color }}>{s.icon}</div>
            <div>
              <div className="cp-stat-value">{s.value}</div>
              <div className="cp-stat-label">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Card principal */}
      <div className="cp-card">
        <div className="cp-card-header">
          <div className="cp-card-title"><Ticket size={18} /> Cupons de Desconto</div>
          {!showNew && (
            <button className="cp-add-btn" onClick={() => setShowNew(true)}>
              <Plus size={15} /> Adicionar
            </button>
          )}
        </div>

        <div className="cp-coupons-list">
          {showNew && <NewCouponForm onSave={handleAdd} onCancel={() => setShowNew(false)} />}

          {coupons.length === 0 && !showNew ? (
            <div className="cp-empty">
              <span>🎟️</span>
              <p>Nenhum cupom cadastrado</p>
            </div>
          ) : (
            coupons.map(c => (
              <CouponCard key={c.id} coupon={c} onDelete={deleteCoupon} onUpdate={updateCoupon} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

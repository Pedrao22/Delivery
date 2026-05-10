import React, { useState, useEffect } from 'react';
import { Gift, Star, TrendingUp, Trash2, Plus, ToggleLeft, ToggleRight, Pencil, Check, X, Award, Zap } from 'lucide-react';
import { useOrdersContext } from '../context/OrdersContext';
import { apiFetch } from '../lib/supabase';
import './LoyaltyPage.css';

const TYPE_CONFIG = {
  discount: { label: 'Desconto %',   icon: '🏷️', color: '#6366F1' },
  cash:     { label: 'Desconto R$',  icon: '💵', color: '#10B981' },
  shipping: { label: 'Frete grátis', icon: '🚚', color: '#F59E0B' },
};

function RewardCard({ reward, onRemove, onUpdate }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(reward);
  const tc = TYPE_CONFIG[reward.type] || TYPE_CONFIG.discount;

  const handleSave = async () => {
    await apiFetch(`/loyalty/rewards/${reward.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ pontos: draft.points, label: draft.label, tipo: draft.type, valor: draft.value }),
    }).catch(() => {});
    onUpdate(reward.id, draft);
    setEditing(false);
  };

  const handleCancel = () => { setDraft(reward); setEditing(false); };

  return (
    <div className={`lp-reward-card ${editing ? 'editing' : ''}`}>
      <div className="lp-reward-badge" style={{ background: `${tc.color}18`, color: tc.color }}>
        <span className="lp-reward-emoji">{tc.icon}</span>
        {editing
          ? <input className="lp-input lp-input-pts" type="number" min={1} value={draft.points}
              onChange={e => setDraft(d => ({ ...d, points: +e.target.value }))} />
          : <span className="lp-reward-pts">{reward.points} pts</span>
        }
      </div>

      <div className="lp-reward-body">
        {editing ? (
          <div className="lp-reward-edit-fields">
            <input className="lp-input" placeholder="Nome da recompensa"
              value={draft.label} onChange={e => setDraft(d => ({ ...d, label: e.target.value }))} />
            <div className="lp-reward-type-row">
              {Object.entries(TYPE_CONFIG).map(([k, v]) => (
                <button key={k} className={`lp-type-btn ${draft.type === k ? 'active' : ''}`}
                  style={draft.type === k ? { borderColor: v.color, color: v.color, background: `${v.color}12` } : {}}
                  onClick={() => setDraft(d => ({ ...d, type: k }))}>
                  {v.icon} {v.label}
                </button>
              ))}
            </div>
            {draft.type !== 'shipping' && (
              <input className="lp-input" type="number" min={0}
                placeholder={draft.type === 'discount' ? 'Valor % (ex: 10)' : 'Valor R$ (ex: 15)'}
                value={draft.value} onChange={e => setDraft(d => ({ ...d, value: +e.target.value }))} />
            )}
          </div>
        ) : (
          <>
            <div className="lp-reward-label">{reward.label}</div>
            <div className="lp-reward-meta" style={{ color: tc.color }}>
              {tc.label}{reward.type !== 'shipping' ? ` · ${reward.type === 'discount' ? reward.value + '%' : 'R$ ' + Number(reward.value).toFixed(2)}` : ''}
            </div>
          </>
        )}
      </div>

      <div className="lp-reward-actions">
        {editing ? (
          <>
            <button className="lp-icon-btn lp-icon-save" onClick={handleSave} title="Salvar"><Check size={15} /></button>
            <button className="lp-icon-btn lp-icon-cancel" onClick={handleCancel} title="Cancelar"><X size={15} /></button>
          </>
        ) : (
          <>
            <button className="lp-icon-btn" onClick={() => setEditing(true)} title="Editar"><Pencil size={14} /></button>
            <button className="lp-icon-btn lp-icon-del" onClick={() => onRemove(reward.id)} title="Remover"><Trash2 size={14} /></button>
          </>
        )}
      </div>
    </div>
  );
}

export default function LoyaltyPage() {
  const { loyaltySettings, updateLoyaltyConfig, addLoyaltyReward, removeLoyaltyReward, restaurantSettings } = useOrdersContext();
  const primaryColor = restaurantSettings?.primaryColor || '#6366F1';

  const [config, setConfig]   = useState(loyaltySettings);
  const [saving, setSaving]   = useState(false);
  const [saved, setSaved]     = useState(false);
  const [rewards, setRewards] = useState(loyaltySettings.rewards || []);

  useEffect(() => { setConfig(loyaltySettings); setRewards(loyaltySettings.rewards || []); }, [loyaltySettings]);

  const handleSave = async () => {
    setSaving(true);
    await updateLoyaltyConfig({ pointsPerReal: config.pointsPerReal, active: config.active });
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleAdd = async () => {
    await addLoyaltyReward();
    setRewards(loyaltySettings.rewards || []);
  };

  const handleRemove = (id) => {
    setRewards(prev => prev.filter(r => r.id !== id));
    removeLoyaltyReward(id);
  };

  const handleUpdate = (id, data) => {
    setRewards(prev => prev.map(r => r.id === id ? { ...r, ...data } : r));
  };

  const exampleOrder = 80;
  const examplePoints = Math.floor(exampleOrder * (config.pointsPerReal || 1));

  return (
    <div className="lp-page">

      {/* ── Stats ── */}
      <div className="lp-stats">
        {[
          { icon: <Star size={18} />, value: '—', label: 'Clientes no Programa', color: primaryColor },
          { icon: <TrendingUp size={18} />, value: '—', label: 'Pontos Distribuídos',   color: '#10B981' },
          { icon: <Gift size={18} />,      value: '—', label: 'Prêmios Resgatados',     color: '#F59E0B' },
        ].map((s, i) => (
          <div key={i} className="lp-stat-card">
            <div className="lp-stat-icon" style={{ background: `${s.color}15`, color: s.color }}>{s.icon}</div>
            <div>
              <div className="lp-stat-value">{s.value}</div>
              <div className="lp-stat-label">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="lp-grid">

        {/* ── Config ── */}
        <div className="lp-card">
          <div className="lp-card-header">
            <div className="lp-card-title"><Zap size={18} /> Configurações</div>
          </div>

          {/* Toggle ativo */}
          <div className="lp-toggle-row" onClick={() => setConfig(c => ({ ...c, active: !c.active }))}>
            <div>
              <div className="lp-toggle-label">Programa ativo</div>
              <div className="lp-toggle-desc">Clientes acumulam pontos a cada pedido</div>
            </div>
            <span style={{ color: config.active ? 'var(--success)' : 'var(--text-tertiary)' }}>
              {config.active ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
            </span>
          </div>

          {/* Pontos por real */}
          <div className="lp-field">
            <label className="lp-field-label">Pontos por R$ 1,00 gasto</label>
            <div className="lp-pts-row">
              {[1, 2, 5, 10].map(n => (
                <button key={n}
                  className={`lp-pts-btn ${config.pointsPerReal === n ? 'active' : ''}`}
                  style={config.pointsPerReal === n ? { borderColor: primaryColor, color: primaryColor, background: `${primaryColor}12` } : {}}
                  onClick={() => setConfig(c => ({ ...c, pointsPerReal: n }))}>
                  {n} pt{n > 1 ? 's' : ''}
                </button>
              ))}
              <input className="lp-input lp-input-custom" type="number" min={1}
                placeholder="Outro"
                value={[1,2,5,10].includes(config.pointsPerReal) ? '' : config.pointsPerReal || ''}
                onChange={e => e.target.value && setConfig(c => ({ ...c, pointsPerReal: +e.target.value }))} />
            </div>
          </div>

          {/* Preview */}
          <div className="lp-preview">
            <div className="lp-preview-title"><Award size={14} /> Simulação</div>
            <div className="lp-preview-text">
              Pedido de <strong>R$ {exampleOrder},00</strong> gera
              <span className="lp-preview-pts" style={{ color: primaryColor }}> {examplePoints} pontos</span>
            </div>
          </div>

          <button className="lp-save-btn" style={{ background: primaryColor }} onClick={handleSave} disabled={saving}>
            {saved ? <><Check size={15} /> Salvo!</> : saving ? 'Salvando...' : 'Salvar configurações'}
          </button>
        </div>

        {/* ── Rewards ── */}
        <div className="lp-card">
          <div className="lp-card-header">
            <div className="lp-card-title"><Gift size={18} /> Recompensas</div>
            <button className="lp-add-btn" onClick={handleAdd}>
              <Plus size={15} /> Adicionar
            </button>
          </div>

          {rewards.length === 0 ? (
            <div className="lp-empty">
              <span>🎁</span>
              <p>Nenhuma recompensa cadastrada</p>
            </div>
          ) : (
            <div className="lp-rewards-list">
              {rewards.map(r => (
                <RewardCard key={r.id} reward={r} onRemove={handleRemove} onUpdate={handleUpdate} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

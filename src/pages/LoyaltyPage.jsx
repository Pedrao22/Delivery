import React, { useState, useEffect } from 'react';
import { Gift, Star, TrendingUp, Settings, Trash2, Plus } from 'lucide-react';
import { useOrdersContext } from '../context/OrdersContext';
import Button from '../components/shared/Button';

export default function LoyaltyPage() {
  const { loyaltySettings, updateLoyaltyConfig, addLoyaltyReward, removeLoyaltyReward } = useOrdersContext();
  const [isEditing, setIsEditing] = useState(false);
  const [config, setConfig] = useState(loyaltySettings);

  useEffect(() => { setConfig(loyaltySettings); }, [loyaltySettings]);

  const handleSave = async () => {
    await updateLoyaltyConfig({ pointsPerReal: config.pointsPerReal, active: config.active });
    setIsEditing(false);
  };

  return (
    <div className="page-container" style={{ padding: 'var(--space-6)' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
        {[
          { icon: <Star size={20} />, value: '—', label: 'Clientes Ativos', bg: 'var(--accent-lighter)', color: 'var(--accent-dark)' },
          { icon: <TrendingUp size={20} />, value: '—', label: 'Pontos Distribuídos', bg: 'var(--success-light)', color: 'var(--success-dark)' },
          { icon: <Gift size={20} />, value: '—', label: 'Prêmios Resgatados', bg: 'var(--warning-light)', color: 'var(--warning-dark)' },
        ].map((s, i) => (
          <div key={i} style={{ background: 'var(--surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-light)', padding: '20px', display: 'flex', alignItems: 'center', gap: '16px', boxShadow: 'var(--shadow-xs)' }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: s.bg, color: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{s.icon}</div>
            <div>
              <div style={{ fontSize: '1.5rem', fontWeight: 900, lineHeight: 1.1, color: 'var(--text-primary)' }}>{s.value}</div>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 2 }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'var(--space-6)' }}>
        <div className="card" style={{ padding: 'var(--space-6)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}><Settings size={18} /> Configurações</h3>
            {!isEditing ? <Button size="small" variant="secondary" onClick={() => setIsEditing(true)}>Editar</Button>
              : <Button size="small" onClick={handleSave}>Salvar</Button>}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div className="form-group">
              <label style={{ display: 'block', marginBottom: '8px', fontSize: 'var(--font-sm)', fontWeight: 600 }}>Pontos por R$ 1,00</label>
              <input type="number" value={config.pointsPerReal} disabled={!isEditing} onChange={e => setConfig({ ...config, pointsPerReal: parseInt(e.target.value) })} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)' }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <input type="checkbox" checked={config.active} disabled={!isEditing} onChange={e => setConfig({ ...config, active: e.target.checked })} />
              <label style={{ fontSize: 'var(--font-sm)' }}>Habilitar Programa de Fidelidade</label>
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: 'var(--space-6)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}><Gift size={18} /> Prêmios Disponíveis</h3>
            {isEditing && <Button size="small" variant="secondary" icon={<Plus size={14} />} onClick={addLoyaltyReward}>Adicionar</Button>}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {loyaltySettings.rewards.map(reward => (
              <div key={reward.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'var(--space-3)', background: 'var(--bg-secondary)', borderRadius: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                  <div style={{ width: 40, height: 40, background: 'var(--accent)', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>{reward.points}</div>
                  <div>
                    <div style={{ fontWeight: 600 }}>{reward.label}</div>
                    <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-tertiary)' }}>{reward.type === 'discount' ? `Desconto de R$ ${reward.value}` : reward.type === 'shipping' ? 'Frete grátis' : `R$ ${reward.value} de desconto`}</div>
                  </div>
                </div>
                {isEditing && (
                  <button onClick={() => removeLoyaltyReward(reward.id)} style={{ color: 'var(--danger)', background: 'none', border: 'none', cursor: 'pointer' }}><Trash2 size={16} /></button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

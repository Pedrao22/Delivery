import React, { useState } from 'react';
import { Gift, Star, TrendingUp, Settings, Trash2, Plus, Users } from 'lucide-react';
import { useOrdersContext } from '../context/OrdersContext';
import Button from '../components/shared/Button';
import Badge from '../components/shared/Badge';

export default function LoyaltyPage() {
  const { loyaltySettings, setLoyaltySettings } = useOrdersContext();
  const [isEditing, setIsEditing] = useState(false);
  const [config, setConfig] = useState(loyaltySettings);

  const handleSave = () => {
    setLoyaltySettings(config);
    setIsEditing(false);
  };

  const addReward = () => {
    const newReward = { id: Date.now(), points: 500, label: 'Nova Recompensa', type: 'discount', value: 10 };
    setConfig({ ...config, rewards: [...config.rewards, newReward] });
  };

  const removeReward = (id) => {
    setConfig({ ...config, rewards: config.rewards.filter(r => r.id !== id) });
  };

  return (
    <div className="page-container" style={{ padding: 'var(--space-6)' }}>
      <div className="dashboard-stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--accent-lighter)', color: 'var(--accent)' }}><Star size={20} /></div>
          <div className="stat-value">1.428</div>
          <div className="stat-label">Clientes Ativos</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--success-light)', color: 'var(--success-dark)' }}><TrendingUp size={20} /></div>
          <div className="stat-value">124k</div>
          <div className="stat-label">Pontos Distribuidos</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--warning-light)', color: 'var(--warning-dark)' }}><Gift size={20} /></div>
          <div className="stat-value">84</div>
          <div className="stat-label">Prêmios Resgatados</div>
        </div>
      </div>

      <div className="loyalty-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'var(--space-6)' }}>
        {/* Settings */}
        <div className="card" style={{ padding: 'var(--space-6)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}><Settings size={18} /> Configurações</h3>
            {!isEditing ? (
              <Button size="small" variant="secondary" onClick={() => setIsEditing(true)}>Editar</Button>
            ) : (
              <Button size="small" onClick={handleSave}>Salvar</Button>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div className="form-group">
              <label style={{ display: 'block', marginBottom: '8px', fontSize: 'var(--font-sm)', fontWeight: 600 }}>Pontos por R$ 1,00</label>
              <input 
                type="number" 
                value={config.pointsPerReal} 
                disabled={!isEditing}
                onChange={e => setConfig({...config, pointsPerReal: parseInt(e.target.value)})}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)' }}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <input 
                type="checkbox" 
                checked={config.active} 
                disabled={!isEditing}
                onChange={e => setConfig({...config, active: e.target.checked})}
              />
              <label style={{ fontSize: 'var(--font-sm)' }}>Habilitar Programa de Fidelidade</label>
            </div>
          </div>
        </div>

        {/* Rewards */}
        <div className="card" style={{ padding: 'var(--space-6)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}><Gift size={18} /> Prêmios Disponíveis</h3>
            {isEditing && <Button size="small" variant="secondary" icon={<Plus size={14}/>} onClick={addReward}>Adicionar</Button>}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {config.rewards.map(reward => (
              <div key={reward.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'var(--space-3)', background: 'var(--bg-secondary)', borderRadius: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                  <div style={{ width: 40, height: 40, background: 'var(--accent)', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                    {reward.points}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600 }}>{reward.label}</div>
                    <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-tertiary)' }}>{reward.type === 'discount' ? `Desconto de R$ ${reward.value}` : 'Produto Grátis'}</div>
                  </div>
                </div>
                {isEditing && (
                  <button onClick={() => removeReward(reward.id)} style={{ color: 'var(--danger)', background: 'none', border: 'none', cursor: 'pointer' }}>
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

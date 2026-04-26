import React, { useState } from 'react';
import { Ticket, Plus, Trash2, Edit2, Search } from 'lucide-react';
import { useOrdersContext } from '../context/OrdersContext';
import Button from '../components/shared/Button';
import Badge from '../components/shared/Badge';
import Modal from '../components/shared/Modal';

export default function CouponsPage() {
  const { coupons, setCoupons } = useOrdersContext();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [formData, setFormData] = useState({ code: '', type: 'percentage', value: '', minOrder: '' });

  const handleSave = () => {
    if (editingCoupon) {
      setCoupons(prev => prev.map(c => c.id === editingCoupon.id ? { ...c, ...formData } : c));
    } else {
      setCoupons(prev => [...prev, { ...formData, id: Date.now(), active: true }]);
    }
    setIsModalOpen(false);
    setEditingCoupon(null);
  };

  const deleteCoupon = (id) => {
    setCoupons(prev => prev.filter(c => c.id !== id));
  };

  return (
    <div className="page-container" style={{ padding: 'var(--space-6)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
        <div style={{ flex: 1 }}>
          <h2 style={{ fontSize: 'var(--font-2xl)', fontWeight: 800 }}>Cupons de Desconto</h2>
          <p style={{ color: 'var(--text-tertiary)', marginTop: 2 }}>Crie códigos promocionais para seus clientes</p>
        </div>
        <Button
          size="sm"
          onClick={() => { setFormData({ code: '', type: 'percentage', value: '', minOrder: '' }); setEditingCoupon(null); setIsModalOpen(true); }}
          icon={<Plus size={14} />}
          style={{ flexShrink: 0 }}
        >
          Novo Cupom
        </Button>
      </div>

      <div className="card" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
        <table style={{ minWidth: '600px', width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--bg-secondary)', textAlign: 'left' }}>
              <th style={{ padding: '16px' }}>Código</th>
              <th style={{ padding: '16px' }}>Tipo</th>
              <th style={{ padding: '16px' }}>Valor</th>
              <th style={{ padding: '16px' }}>Pedido Mín.</th>
              <th style={{ padding: '16px' }}>Status</th>
              <th style={{ padding: '16px' }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {coupons.map(coupon => (
              <tr key={coupon.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                <td style={{ padding: '16px', fontWeight: 700, color: 'var(--accent)' }}>{coupon.code}</td>
                <td style={{ padding: '16px', textTransform: 'capitalize' }}>{coupon.type === 'percentage' ? 'Porcentagem' : 'Fixo'}</td>
                <td style={{ padding: '16px' }}>{coupon.type === 'percentage' ? `${coupon.value}%` : `R$ ${coupon.value}`}</td>
                <td style={{ padding: '16px' }}>R$ {coupon.minOrder}</td>
                <td style={{ padding: '16px' }}><Badge variant="local">Ativo</Badge></td>
                <td style={{ padding: '16px' }}>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => { setEditingCoupon(coupon); setFormData(coupon); setIsModalOpen(true); }} style={{ padding: '6px', background: 'var(--bg-secondary)', border: 'none', borderRadius: '4px', cursor: 'pointer' }}><Edit2 size={14} /></button>
                    <button onClick={() => deleteCoupon(coupon.id)} style={{ padding: '6px', background: 'var(--bg-secondary)', border: 'none', borderRadius: '4px', color: 'var(--danger)', cursor: 'pointer' }}><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCoupon ? "Editar Cupom" : "Novo Cupom"}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div className="form-group">
            <label style={{ display: 'block', marginBottom: '8px', fontSize: 'var(--font-sm)', fontWeight: 600 }}>Código do Cupom</label>
            <input 
              type="text" 
              value={formData.code} 
              onChange={e => setFormData({...formData, code: e.target.value.toUpperCase()})}
              placeholder="Ex: QUERO10"
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)' }}
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
            <div className="form-group">
              <label style={{ display: 'block', marginBottom: '8px', fontSize: 'var(--font-sm)', fontWeight: 600 }}>Tipo</label>
              <select 
                value={formData.type} 
                onChange={e => setFormData({...formData, type: e.target.value})}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)' }}
              >
                <option value="percentage">Porcentagem (%)</option>
                <option value="fixed">Valor Fixo (R$)</option>
              </select>
            </div>
            <div className="form-group">
              <label style={{ display: 'block', marginBottom: '8px', fontSize: 'var(--font-sm)', fontWeight: 600 }}>Valor</label>
              <input 
                type="number" 
                value={formData.value} 
                onChange={e => setFormData({...formData, value: parseFloat(e.target.value)})}
                placeholder="0.00"
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)' }}
              />
            </div>
          </div>
          <div className="form-group">
            <label style={{ display: 'block', marginBottom: '8px', fontSize: 'var(--font-sm)', fontWeight: 600 }}>Pedido Mínimo (R$)</label>
            <input 
              type="number" 
              value={formData.minOrder} 
              onChange={e => setFormData({...formData, minOrder: parseFloat(e.target.value)})}
              placeholder="0.00"
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)' }}
            />
          </div>
          <Button fullWidth onClick={handleSave}>Salvar Cupom</Button>
        </div>
      </Modal>
    </div>
  );
}

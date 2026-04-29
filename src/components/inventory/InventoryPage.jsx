import { useState, useMemo } from 'react';
import {
  AlertTriangle, Package, Plus, Calendar, Ghost,
  Settings, Edit3, Trash2, Save, X
} from 'lucide-react';
import { useOrdersContext } from '../../context/OrdersContext';
import SearchInput from '../shared/SearchInput';
import Button from '../shared/Button';
import Modal from '../shared/Modal';
import './InventoryPage.css';

const EMPTY_FORM = { name: '', category: '', unit: 'un', qty: 0, minQty: 0, cost: 0, expiry: '', supplier: '' };

function loadInvCategories() {
  try { return JSON.parse(localStorage.getItem('inv_categories') || '[]'); } catch { return []; }
}
function saveInvCategories(cats) {
  localStorage.setItem('inv_categories', JSON.stringify(cats));
}

export default function InventoryPage() {
  const { inventory, updateInventoryItem, addInventoryItem } = useOrdersContext();
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [activeCatFilter, setActiveCatFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [showCatModal, setShowCatModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  // Inventory-specific category list stored in localStorage
  const [invCategories, setInvCategories] = useState(loadInvCategories);
  const [newCatName, setNewCatName] = useState('');
  const [newCatEmoji, setNewCatEmoji] = useState('📦');
  const [editingCatId, setEditingCatId] = useState(null);
  const [editCatData, setEditCatData] = useState({ nome: '', icone: '' });

  // Merge managed categories with any categories already on items
  const allCategories = useMemo(() => {
    const fromItems = [...new Set(inventory.map(i => i.category).filter(Boolean))];
    const managed = invCategories.map(c => c.nome);
    const extra = fromItems.filter(n => !managed.includes(n));
    return [
      ...invCategories,
      ...extra.map(n => ({ id: n, nome: n, icone: '📦' })),
    ];
  }, [inventory, invCategories]);

  const handleAddCat = () => {
    if (!newCatName.trim()) return;
    if (invCategories.some(c => c.nome.toLowerCase() === newCatName.trim().toLowerCase())) return;
    const updated = [...invCategories, { id: Date.now().toString(), nome: newCatName.trim(), icone: newCatEmoji || '📦' }];
    setInvCategories(updated);
    saveInvCategories(updated);
    setNewCatName('');
    setNewCatEmoji('📦');
  };

  const handleSaveCat = () => {
    if (!editCatData.nome.trim()) return;
    const updated = invCategories.map(c => c.id === editingCatId ? { ...c, ...editCatData } : c);
    setInvCategories(updated);
    saveInvCategories(updated);
    setEditingCatId(null);
  };

  const handleDeleteCat = (id) => {
    const updated = invCategories.filter(c => c.id !== id);
    setInvCategories(updated);
    saveInvCategories(updated);
  };

  const today = new Date();

  const getAlertStatus = (item) => {
    if (item.expiry) {
      const exp = new Date(item.expiry);
      const diffDays = Math.ceil((exp - today) / (1000 * 60 * 60 * 24));
      if (diffDays <= 2) return 'expiring';
    }
    if (item.qty <= item.minQty) return 'low';
    return 'ok';
  };

  const handleUpdateQty = (id, delta) => {
    const item = inventory.find(i => i.id === id);
    if (!item) return;
    updateInventoryItem({ ...item, qty: Math.max(0, item.qty + delta) });
  };

  const filteredItems = useMemo(() => {
    return inventory.filter(i => {
      const matchesSearch = i.name.toLowerCase().includes(search.toLowerCase()) ||
                            i.category.toLowerCase().includes(search.toLowerCase());
      const matchesCat = activeCatFilter === 'all' || i.category === activeCatFilter;
      const alert = getAlertStatus(i);
      if (activeFilter === 'low') return matchesSearch && matchesCat && (alert === 'low' || alert === 'expiring');
      if (activeFilter === 'expiring') return matchesSearch && matchesCat && alert === 'expiring';
      return matchesSearch && matchesCat;
    });
  }, [inventory, search, activeFilter, activeCatFilter]);

  const stats = useMemo(() => {
    const low = inventory.filter(i => i.qty <= i.minQty).length;
    const expiring = inventory.filter(i => {
      if (!i.expiry) return false;
      const diffDays = Math.ceil((new Date(i.expiry) - today) / (1000 * 60 * 60 * 24));
      return diffDays <= 3;
    }).length;
    return { low, expiring };
  }, [inventory]);

  const handleOpenModal = () => {
    setForm(EMPTY_FORM);
    setShowModal(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSaving(true);
    addInventoryItem({
      ...form,
      qty: Number(form.qty),
      minQty: Number(form.minQty),
      cost: Number(form.cost),
      expiry: form.expiry || null,
    });
    setSaving(false);
    setShowModal(false);
  };

  return (
    <div className="inventory-page">
      <div className="inventory-header">
        <div>
          <h2 style={{ fontSize: 'var(--font-xl)', fontWeight: 'var(--fw-bold)' }}>Gestão de Estoque</h2>
          <p style={{ fontSize: 'var(--font-sm)', color: 'var(--text-tertiary)' }}>Gerencie insumos e receba alertas proativos</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <SearchInput value={search} onChange={setSearch} placeholder="Buscar insumo..." />
          <Button icon={<Plus size={16} />} onClick={handleOpenModal}>Novo Item</Button>
        </div>
      </div>

      <div className="inventory-stats">
        <div
          className={`inventory-stat-card ${activeFilter === 'all' ? 'active' : ''}`}
          onClick={() => setActiveFilter('all')}
        >
          <div className="inventory-stat-icon all"><Package size={20} /></div>
          <div className="inventory-stat-info">
            <span className="inventory-stat-label">Total</span>
            <span className="inventory-stat-value">{inventory.length}</span>
          </div>
        </div>
        <div
          className={`inventory-stat-card ${activeFilter === 'low' ? 'active' : ''}`}
          onClick={() => setActiveFilter('low')}
        >
          <div className="inventory-stat-icon low"><AlertTriangle size={20} /></div>
          <div className="inventory-stat-info">
            <span className="inventory-stat-label">Estoque Baixo</span>
            <span className="inventory-stat-value" style={{ color: 'var(--warning-dark)' }}>{stats.low}</span>
          </div>
        </div>
        <div
          className={`inventory-stat-card ${activeFilter === 'expiring' ? 'active' : ''}`}
          onClick={() => setActiveFilter('expiring')}
        >
          <div className="inventory-stat-icon expiring"><Calendar size={20} /></div>
          <div className="inventory-stat-info">
            <span className="inventory-stat-label">Vencendo Logo</span>
            <span className="inventory-stat-value" style={{ color: 'var(--danger)' }}>{stats.expiring}</span>
          </div>
        </div>
      </div>

      {/* Categories bar */}
      <div className="inv-categories-bar">
        <button
          className={`inv-cat-tab ${activeCatFilter === 'all' ? 'active' : ''}`}
          onClick={() => setActiveCatFilter('all')}
        >
          Todos
        </button>
        {allCategories.map(cat => (
          <button
            key={cat.id}
            className={`inv-cat-tab ${activeCatFilter === cat.nome ? 'active' : ''}`}
            onClick={() => setActiveCatFilter(cat.nome)}
          >
            <span>{cat.icone}</span>
            {cat.nome}
          </button>
        ))}
        <button
          className="inv-cat-tab inv-cat-manage"
          onClick={() => setShowCatModal(true)}
          title="Gerenciar categorias de insumos"
        >
          <Settings size={14} />
          Gerenciar
        </button>
      </div>

      <div className="inventory-table-container">
        <div className="inventory-table-header">
          <span>Insumo</span>
          <span>Categoria</span>
          <span>Quantidade Atual</span>
          <span>Validade</span>
          <span>Status</span>
        </div>

        <div className="inventory-rows">
          {filteredItems.length > 0 ? filteredItems.map((item, i) => {
            const alert = getAlertStatus(item);
            return (
              <div key={item.id} className={`inventory-row ${alert}`} style={{ animationDelay: `${i * 30}ms` }}>
                <div className="inventory-row-main">
                  <div className="inventory-item-name">{item.name}</div>
                  <div className="inventory-item-supplier">{item.supplier}</div>
                </div>
                <div className="inventory-row-category">
                  <span className="cat-badge">{item.category}</span>
                </div>
                <div className="inventory-qty-cell">
                  <div className="qty-controls">
                    <button onClick={() => handleUpdateQty(item.id, -1)}>−</button>
                    <span className="qty-number">{item.qty}</span>
                    <button onClick={() => handleUpdateQty(item.id, 1)}>+</button>
                  </div>
                  <span className="qty-unit">{item.unit}</span>
                </div>
                <div className="inventory-expiry-cell">
                  {item.expiry ? (
                    <span className={`expiry-date ${alert === 'expiring' ? 'critical' : ''}`}>
                      {new Date(item.expiry).toLocaleDateString('pt-BR')}
                    </span>
                  ) : <span className="no-expiry">—</span>}
                </div>
                <div className="inventory-status-cell">
                  <span className={`status-pill ${alert}`}>
                    {alert === 'ok' ? 'OK' : alert === 'low' ? 'Crítico' : 'Vencendo'}
                  </span>
                </div>
              </div>
            );
          }) : (
            <div className="inventory-empty-results">
              <Ghost size={48} style={{ opacity: 0.2, marginBottom: 12 }} />
              <p>Nenhum item encontrado nos filtros aplicados.</p>
            </div>
          )}
        </div>
      </div>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Novo Insumo"
        footer={
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <Button variant="secondary" onClick={() => setShowModal(false)}>Cancelar</Button>
            <Button onClick={handleSubmit} disabled={saving}>
              {saving ? 'Salvando...' : 'Adicionar Insumo'}
            </Button>
          </div>
        }
      >
        <form onSubmit={handleSubmit} className="inv-modal-form">
          <div className="inv-form-row">
            <div className="inv-form-group">
              <label>Nome do Insumo *</label>
              <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Ex: Pão Brioche" />
            </div>
            <div className="inv-form-group">
              <label>Categoria *</label>
              <select
                value={form.category}
                onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                required
              >
                <option value="">Selecione...</option>
                {allCategories.map(c => (
                  <option key={c.id} value={c.nome}>{c.icone} {c.nome}</option>
                ))}
              </select>
              {allCategories.length === 0 && (
                <p className="inv-field-hint" style={{ color: 'var(--text-tertiary)', background: 'var(--bg-secondary)' }}>
                  Nenhuma categoria criada ainda.{' '}
                  <button type="button" onClick={() => setShowCatModal(true)} style={{ background: 'none', border: 'none', color: 'var(--accent-dark)', fontWeight: 700, cursor: 'pointer', padding: 0, fontSize: 'inherit' }}>
                    Criar agora →
                  </button>
                </p>
              )}
            </div>
          </div>
          <div className="inv-form-row">
            <div className="inv-form-group">
              <label>Unidade *</label>
              <select value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))}>
                <option value="un">un (unidade)</option>
                <option value="kg">kg</option>
                <option value="L">L (litro)</option>
                <option value="g">g (grama)</option>
                <option value="ml">ml</option>
              </select>
            </div>
            <div className="inv-form-group">
              <label>Fornecedor</label>
              <input value={form.supplier} onChange={e => setForm(f => ({ ...f, supplier: e.target.value }))} placeholder="Ex: Padaria Artesanal" />
            </div>
          </div>
          <div className="inv-form-row">
            <div className="inv-form-group">
              <label>Qtd. Atual *</label>
              <input type="number" min="0" required value={form.qty} onChange={e => setForm(f => ({ ...f, qty: e.target.value }))} />
            </div>
            <div className="inv-form-group">
              <label>Qtd. Mínima *</label>
              <input type="number" min="0" required value={form.minQty} onChange={e => setForm(f => ({ ...f, minQty: e.target.value }))} />
              <p className="inv-field-hint">⚠️ Quando o estoque chegar nesse número, você recebe um alerta automático para repor o item.</p>
            </div>
            <div className="inv-form-group">
              <label>Custo Unit. (R$)</label>
              <input type="number" min="0" step="0.01" value={form.cost} onChange={e => setForm(f => ({ ...f, cost: e.target.value }))} />
            </div>
          </div>
          <div className="inv-form-row">
            <div className="inv-form-group">
              <label>Data de Validade</label>
              <input type="date" value={form.expiry} onChange={e => setForm(f => ({ ...f, expiry: e.target.value }))} />
            </div>
          </div>
        </form>
      </Modal>
      {/* Category Management Modal */}
      <Modal
        isOpen={showCatModal}
        onClose={() => { setShowCatModal(false); setEditingCatId(null); }}
        title="Categorias de Insumos"
      >
        <div className="category-manager">
          <div className="add-cat-form">
            <input
              className="emoji-picker-input"
              value={newCatEmoji}
              onChange={e => setNewCatEmoji(e.target.value)}
              placeholder="📦"
              maxLength={4}
            />
            <input
              className="add-cat-name-input"
              placeholder="Nome da categoria..."
              value={newCatName}
              onChange={e => setNewCatName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAddCat()}
            />
            <Button onClick={handleAddCat} icon={<Plus size={16} />}>Adicionar</Button>
          </div>

          <div className="cat-list">
            {allCategories.length === 0 && (
              <p className="cat-empty-hint">Nenhuma categoria criada ainda.</p>
            )}
            {allCategories.map(c => (
              <div key={c.id} className="cat-list-item">
                {editingCatId === c.id ? (
                  <>
                    <input
                      className="cat-edit-emoji"
                      value={editCatData.icone}
                      onChange={e => setEditCatData({ ...editCatData, icone: e.target.value })}
                      maxLength={4}
                    />
                    <input
                      className="cat-edit-name"
                      value={editCatData.nome}
                      onChange={e => setEditCatData({ ...editCatData, nome: e.target.value })}
                      onKeyDown={e => { if (e.key === 'Enter') handleSaveCat(); if (e.key === 'Escape') setEditingCatId(null); }}
                      autoFocus
                    />
                    <button className="cat-action-btn save" onClick={handleSaveCat}><Save size={14} /></button>
                    <button className="cat-action-btn cancel" onClick={() => setEditingCatId(null)}><X size={14} /></button>
                  </>
                ) : (
                  <>
                    <span className="cat-item-icon">{c.icone || '📦'}</span>
                    <span className="cat-item-name">{c.nome}</span>
                    <div className="cat-item-actions">
                      {invCategories.some(ic => ic.id === c.id) && (
                        <>
                          <button onClick={() => { setEditingCatId(c.id); setEditCatData({ nome: c.nome, icone: c.icone || '📦' }); }}><Edit3 size={13} /></button>
                          <button className="danger" onClick={() => handleDeleteCat(c.id)}><Trash2 size={13} /></button>
                        </>
                      )}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      </Modal>
    </div>
  );
}

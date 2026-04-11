import { useState } from 'react';
import { Plus, Edit3, Trash2, Eye, EyeOff, Star, Save, Image as ImageIcon, LayoutGrid, X } from 'lucide-react';
import { useOrdersContext } from '../context/OrdersContext';
import SearchInput from '../components/shared/SearchInput';
import Button from '../components/shared/Button';
import Badge from '../components/shared/Badge';
import Modal from '../components/shared/Modal';

export default function MenuManagementPage() {
  const { 
    products, categories, 
    updateProduct, addProduct, deleteProduct,
    addCategory, updateCategory, deleteCategory 
  } = useOrdersContext();

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [editingItem, setEditingItem] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);

  const filtered = products.filter(i => {
    const matchSearch = i.name.toLowerCase().includes(search.toLowerCase());
    const matchCategory = categoryFilter === 'all' || i.category === categoryFilter;
    return matchSearch && matchCategory;
  });

  const getStatusInfo = (item) => {
    if (item.available === false) return { label: 'Inativo', variant: 'danger' };
    if (item.stockStatus === 'out') return { label: 'Esgotado', variant: 'warning' };
    return { label: 'Ativo', variant: 'success' };
  };

  const handleEdit = (item) => {
    setEditingItem({ ...item, variations: item.variations || [], complements: item.complements || [] });
    setShowEditModal(true);
  };

  const handleSave = () => {
    if (editingItem) {
      if (editingItem.id) {
        updateProduct(editingItem);
      } else {
        addProduct(editingItem);
      }
      setShowEditModal(false);
      setEditingItem(null);
    }
  };

  const toggleBestseller = (id) => {
    const item = products.find(p => p.id === id);
    if (item) {
      updateProduct({ ...item, bestseller: !item.bestseller });
    }
  };

  const handleSaveCategory = () => {
    if (editingCategory) {
      if (editingCategory.id) {
        updateCategory(editingCategory);
      } else {
        addCategory({ ...editingCategory, id: editingCategory.name.toLowerCase().replace(/\s+/g, '-') });
      }
      setEditingCategory(null);
    }
  };

  return (
    <div style={{ padding: 'var(--space-5)', animation: 'fadeIn 300ms ease' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-5)', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: 'var(--font-xl)', fontWeight: 'var(--fw-bold)' }}>Gestão de Cardápio</h2>
          <p style={{ fontSize: 'var(--font-sm)', color: 'var(--text-tertiary)' }}>{products.length} produtos cadastrados</p>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <SearchInput value={search} onChange={setSearch} placeholder="Buscar produto..." />
          <Button variant="secondary" onClick={() => setShowCategoryModal(true)} icon={<LayoutGrid size={16} />}>Categorias</Button>
          <Button onClick={() => handleEdit({ name: '', description: '', price: 0, category: categories[0]?.id || '', image: '🍔', variations: [], complements: [], available: true })} icon={<Plus size={16} />}>Novo Produto</Button>
        </div>
      </div>

      {/* Category filter */}
      <div className="menu-categories-scroll" style={{ marginBottom: 'var(--space-4)' }}>
        <button
          className={`menu-category-chip ${categoryFilter === 'all' ? 'active' : ''}`}
          onClick={() => setCategoryFilter('all')}
        >
          Todos
        </button>
        {categories.map(cat => (
          <button
            key={cat.id}
            className={`menu-category-chip ${categoryFilter === cat.id ? 'active' : ''}`}
            onClick={() => setCategoryFilter(cat.id)}
          >
            {cat.icon} {cat.name}
          </button>
        ))}
      </div>

      {/* Products Table */}
      <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-light)', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '48px 2fr 1fr 100px 100px 120px',
          padding: 'var(--space-3) var(--space-4)',
          background: 'var(--bg-secondary)',
          fontSize: 'var(--font-xs)',
          fontWeight: 600,
          color: 'var(--text-tertiary)',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}>
          <span></span>
          <span>Produto</span>
          <span>Categoria</span>
          <span>Preço</span>
          <span>Status</span>
          <span>Ações</span>
        </div>

        {filtered.map((item, i) => {
          const status = getStatusInfo(item);
          return (
            <div key={item.id} style={{
              display: 'grid',
              gridTemplateColumns: '48px 2fr 1fr 100px 100px 120px',
              padding: 'var(--space-3) var(--space-4)',
              borderBottom: '1px solid var(--border-light)',
              alignItems: 'center',
              fontSize: 'var(--font-sm)',
              animation: 'fadeInUp 200ms ease both',
              animationDelay: `${i * 20}ms`,
              opacity: (item.available === false || item.stockStatus === 'out') ? 0.6 : 1,
              transition: 'background var(--transition-fast), opacity var(--transition-fast)',
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-secondary)'}
            onMouseLeave={(e) => e.currentTarget.style.background = ''}
            >
              <span style={{ fontSize: '1.5rem' }}>{item.image}</span>
              <div>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  {item.name}
                  {item.bestseller && (
                    <span style={{ color: 'var(--warning)', cursor: 'help' }} title="Mais Vendido">
                      <Star size={12} fill="currentColor" />
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-tertiary)', marginTop: 2 }}>
                  {item.variations?.length > 0 && `${item.variations.length} variações`}
                  {item.variations?.length > 0 && item.complements?.length > 0 && ' • '}
                  {item.complements?.length > 0 && `${item.complements.length} complementos`}
                </div>
              </div>
              <span style={{ color: 'var(--text-secondary)' }}>
                {categories.find(c => c.id === item.category)?.icon} {categories.find(c => c.id === item.category)?.name}
              </span>
              <span style={{ fontWeight: 700, color: 'var(--accent)' }}>
                R$ {item.price.toFixed(2).replace('.', ',')}
              </span>
              <div>
                <Badge variant={status.variant} dot size="xs">
                  {status.label}
                </Badge>
              </div>
              <div style={{ display: 'flex', gap: '4px' }}>
                <button
                  onClick={() => toggleBestseller(item.id)}
                  style={{
                    width: 32, height: 32, borderRadius: 'var(--radius-sm)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: item.bestseller ? 'var(--warning)' : 'var(--text-tertiary)', transition: 'all var(--transition-fast)',
                    border: 'none', background: 'none', cursor: 'pointer',
                  }}
                  title="Destaque (Mais Vendido)"
                >
                  <Star size={16} fill={item.bestseller ? "currentColor" : "none"} />
                </button>
                <button
                  onClick={() => handleEdit(item)}
                  style={{
                    width: 32, height: 32, borderRadius: 'var(--radius-sm)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'var(--text-tertiary)', transition: 'all var(--transition-fast)',
                    border: 'none', background: 'none', cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--accent-lighter)'; e.currentTarget.style.color = 'var(--accent)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = ''; e.currentTarget.style.color = 'var(--text-tertiary)'; }}
                >
                  <Edit3 size={16} />
                </button>
                <button
                  onClick={() => deleteProduct(item.id)}
                  style={{
                    width: 32, height: 32, borderRadius: 'var(--radius-sm)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'var(--text-tertiary)', transition: 'all var(--transition-fast)',
                    border: 'none', background: 'none', cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--danger-lighter)'; e.currentTarget.style.color = 'var(--danger)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = ''; e.currentTarget.style.color = 'var(--text-tertiary)'; }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
        );
        })}
      </div>

      {/* Product Modal Overhaul */}
      <Modal
        isOpen={showEditModal}
        onClose={() => { setShowEditModal(false); setEditingItem(null); }}
        title={editingItem?.id ? `Editar: ${editingItem.name}` : 'Novo Produto'}
        size="large"
        footer={<Button onClick={handleSave} icon={<Save size={16} />}>Salvar Produto</Button>}
      >
        {editingItem && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: 'var(--space-4)', alignItems: 'end' }}>
              <div>
                <label style={{ fontSize: 'var(--font-sm)', fontWeight: 600, display: 'block', marginBottom: 6 }}>Imagem</label>
                <div style={{ 
                  width: 80, height: 80, borderRadius: 'var(--radius-md)', background: 'var(--bg-secondary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', border: '1px solid var(--border)' 
                }}>
                  {editingItem.image}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {['🍔', '🍕', '🥤', '🍟', '🍰', '🥗', '🍗', '🍺', '🍦'].map(emoji => (
                  <button 
                    key={emoji}
                    onClick={() => setEditingItem({ ...editingItem, image: emoji })}
                    style={{ 
                      width: 36, height: 36, borderRadius: 'var(--radius-sm)', border: editingItem.image === emoji ? '2px solid var(--accent)' : '1px solid var(--border)',
                      background: 'var(--surface)', cursor: 'pointer', fontSize: '1.2rem'
                    }}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--space-4)' }}>
              <div>
                <label style={{ fontSize: 'var(--font-sm)', fontWeight: 600, display: 'block', marginBottom: 6 }}>Nome</label>
                <input
                  style={{ width: '100%', padding: '10px 14px', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-md)', outline: 'none' }}
                  value={editingItem.name}
                  onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                />
              </div>
              <div>
                <label style={{ fontSize: 'var(--font-sm)', fontWeight: 600, display: 'block', marginBottom: 6 }}>Categoria</label>
                <select
                  style={{ width: '100%', padding: '10px 14px', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-md)', outline: 'none', background: 'white' }}
                  value={editingItem.category}
                  onChange={(e) => setEditingItem({ ...editingItem, category: e.target.value })}
                >
                  {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-4)' }}>
              <div>
                <label style={{ fontSize: 'var(--font-sm)', fontWeight: 600, display: 'block', marginBottom: 6 }}>Preço (R$)</label>
                <input
                  type="number"
                  style={{ width: '100%', padding: '10px 14px', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-md)', outline: 'none' }}
                  value={editingItem.price}
                  onChange={(e) => setEditingItem({ ...editingItem, price: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div>
                <label style={{ fontSize: 'var(--font-sm)', fontWeight: 600, display: 'block', marginBottom: 6 }}>Status</label>
                <select
                  style={{ width: '100%', padding: '10px 14px', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-md)', outline: 'none', background: 'white' }}
                  value={editingItem.available === false ? 'inactive' : editingItem.stockStatus === 'out' ? 'soldout' : 'active'}
                  onChange={(e) => {
                    const val = e.target.value;
                    setEditingItem({ 
                      ...editingItem, 
                      available: val !== 'inactive', 
                      stockStatus: val === 'soldout' ? 'out' : 'normal' 
                    });
                  }}
                >
                  <option value="active">Ativo</option>
                  <option value="inactive">Inativo</option>
                  <option value="soldout">Esgotado</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: 'var(--font-sm)', fontWeight: 600, display: 'block', marginBottom: 6 }}>Destaque</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 0' }}>
                  <input 
                    type="checkbox" 
                    checked={editingItem.bestseller} 
                    onChange={(e) => setEditingItem({ ...editingItem, bestseller: e.target.checked })} 
                  />
                  <span>Mais Vendido (Bestseller)</span>
                </div>
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <label style={{ fontSize: 'var(--font-sm)', fontWeight: 600 }}>Variações (Sabores/Tamanhos)</label>
                <Button size="xs" variant="secondary" onClick={() => setEditingItem({ ...editingItem, variations: [...(editingItem.variations || []), { id: Date.now(), name: '', price: 0 }] })}>+ Add</Button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {editingItem.variations?.map((v, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <input style={{ flex: 1, padding: '8px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }} value={v.name} onChange={(e) => {
                      const newV = [...editingItem.variations];
                      newV[idx].name = e.target.value;
                      setEditingItem({ ...editingItem, variations: newV });
                    }} placeholder="Ex: Grande" />
                    <input type="number" style={{ width: 80, padding: '8px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }} value={v.price} onChange={(e) => {
                      const newV = [...editingItem.variations];
                      newV[idx].price = parseFloat(e.target.value) || 0;
                      setEditingItem({ ...editingItem, variations: newV });
                    }} />
                    <button onClick={() => setEditingItem({ ...editingItem, variations: editingItem.variations.filter((_, i) => i !== idx) })} style={{ color: 'var(--danger)', border: 'none', background: 'none', cursor: 'pointer' }}><Trash2 size={14} /></button>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <label style={{ fontSize: 'var(--font-sm)', fontWeight: 600 }}>Complementos (Acompanhamentos)</label>
                <Button size="xs" variant="secondary" onClick={() => setEditingItem({ ...editingItem, complements: [...(editingItem.complements || []), { id: Date.now(), name: '', price: 0 }] })}>+ Add</Button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {editingItem.complements?.map((c, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <input style={{ flex: 1, padding: '8px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }} value={c.name} onChange={(e) => {
                      const newC = [...editingItem.complements];
                      newC[idx].name = e.target.value;
                      setEditingItem({ ...editingItem, complements: newC });
                    }} placeholder="Ex: Bacon Extra" />
                    <input type="number" style={{ width: 80, padding: '8px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }} value={c.price} onChange={(e) => {
                      const newC = [...editingItem.complements];
                      newC[idx].price = parseFloat(e.target.value) || 0;
                      setEditingItem({ ...editingItem, complements: newC });
                    }} />
                    <button onClick={() => setEditingItem({ ...editingItem, complements: editingItem.complements.filter((_, i) => i !== idx) })} style={{ color: 'var(--danger)', border: 'none', background: 'none', cursor: 'pointer' }}><Trash2 size={14} /></button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Category Management Modal */}
      <Modal
        isOpen={showCategoryModal}
        onClose={() => setShowCategoryModal(false)}
        title="Gestão de Categorias"
        footer={<Button onClick={() => setShowCategoryModal(false)}>Fechar</Button>}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input 
              style={{ flex: 1, padding: '10px', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-md)' }}
              placeholder="Nova categoria..."
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.target.value.trim()) {
                  addCategory({ id: e.target.value.toLowerCase().replace(/\s+/g, '-'), name: e.target.value, icon: '📦' });
                  e.target.value = '';
                }
              }}
            />
            <Button icon={<Plus size={16} />}>Add</Button>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {categories.map(cat => (
              <div key={cat.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>{cat.icon}</span>
                  <span style={{ fontWeight: 600 }}>{cat.name}</span>
                </div>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button onClick={() => deleteCategory(cat.id)} style={{ color: 'var(--danger)', border: 'none', background: 'none', cursor: 'pointer' }}><Trash2 size={16} /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Modal>
    </div>
  );
}

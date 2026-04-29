import { useState, useMemo } from 'react';
import { 
  Plus, 
  Edit3, 
  Trash2, 
  Star, 
  Save, 
  LayoutGrid, 
  X, 
  ChevronRight, 
  Search, 
  Settings, 
  Layers, 
  CheckCircle2,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { useOrdersContext } from '../context/OrdersContext';
import SearchInput from '../components/shared/SearchInput';
import Button from '../components/shared/Button';
import Badge from '../components/shared/Badge';
import Modal from '../components/shared/Modal';
import './MenuManagementPage.css';

export default function MenuManagementPage() {
  const { 
    products, categories, loadingMenu,
    addProduct, updateProduct, deleteProduct,
    addCategory, updateCategory, deleteCategory 
  } = useOrdersContext();

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [editingItem, setEditingItem] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [activeTab, setActiveTab] = useState('basic'); // basic, variations, combo, complements
  const [isSaving, setIsSaving] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatEmoji, setNewCatEmoji] = useState('📦');
  const [editingCatId, setEditingCatId] = useState(null);
  const [editCatData, setEditCatData] = useState({ nome: '', icone: '' });

  // Memoized Filtered List
  const filtered = useMemo(() => {
    return products.filter(i => {
      const matchSearch = i.nome.toLowerCase().includes(search.toLowerCase());
      const matchCategory = categoryFilter === 'all' || i.categoria_id === categoryFilter;
      return matchSearch && matchCategory;
    });
  }, [products, search, categoryFilter]);

  const handleEdit = (item) => {
    setEditingItem({ 
      ...item, 
      variacoes: item.variacoes || [], 
      complementos: item.complementos || [],
      config: item.config || { is_combo: false, items_combo: [] }
    });
    setActiveTab('basic');
    setShowEditModal(true);
  };

  const handleSaveProduct = async () => {
    if (!editingItem.nome || !editingItem.categoria_id) {
      alert('Preencha o nome e a categoria!');
      return;
    }

    setIsSaving(true);
    try {
      if (editingItem.id) {
        await updateProduct(editingItem.id, editingItem);
      } else {
        await addProduct(editingItem);
      }
      setShowEditModal(false);
      setEditingItem(null);
    } catch (err) {
      alert('Erro ao salvar produto');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteProduct = async (id) => {
    if (window.confirm('Tem certeza que deseja excluir este produto?')) {
      await deleteProduct(id);
    }
  };

  const handleAddCategory = () => {
    if (!newCatName.trim()) return;
    addCategory({ nome: newCatName.trim(), icone: newCatEmoji || '📦' });
    setNewCatName('');
    setNewCatEmoji('📦');
  };

  const handleStartEditCat = (cat) => {
    setEditingCatId(cat.id);
    setEditCatData({ nome: cat.nome, icone: cat.icone || '📦' });
  };

  const handleSaveCat = () => {
    if (!editCatData.nome.trim()) return;
    updateCategory(editingCatId, editCatData);
    setEditingCatId(null);
  };

  return (
    <div className="menu-mgmt-container">
      {/* Header Section */}
      <header className="menu-header">
        <div className="header-info">
          <h1>Gestão de Cardápio</h1>
          <p>{products.length} itens no ecossistema</p>
        </div>
        <div className="header-actions">
          <SearchInput value={search} onChange={setSearch} placeholder="Buscar por nome..." />
          <Button variant="secondary" onClick={() => setShowCategoryModal(true)} icon={<LayoutGrid size={16} />}>Categorias</Button>
          <Button onClick={() => handleEdit({ nome: '', descricao: '', preco: 0, categoria_id: categories[0]?.id || '', imagem_emoji: '🍔', bestseller: false })} icon={<Plus size={16} />}>Novo Item</Button>
        </div>
      </header>

      {/* Categories Bar */}
      <div className="categories-bar">
        <button 
          className={`cat-tab ${categoryFilter === 'all' ? 'active' : ''}`}
          onClick={() => setCategoryFilter('all')}
        >
          Todos
        </button>
        {categories.map(cat => (
          <button 
            key={cat.id} 
            className={`cat-tab ${categoryFilter === cat.id ? 'active' : ''}`}
            onClick={() => setCategoryFilter(cat.id)}
          >
            <span>{cat.icone}</span>
            {cat.nome}
          </button>
        ))}
      </div>

      {/* Main Grid/List */}
      <div className="products-list-container">
        {loadingMenu ? (
          <div className="menu-loading">
            <Loader2 className="animate-spin" />
            <span>Sincronizando cardápio...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <AlertCircle size={48} />
            <h3>Nenhum item encontrado</h3>
            <p>Ajuste os filtros ou crie um novo produto.</p>
          </div>
        ) : (
          <div className="products-grid">
            {filtered.map((item) => (
              <div key={item.id} className={`product-card ${!item.ativo ? 'inactive' : ''}`}>
                <div className="product-card-header">
                  <span className="product-emoji">{item.imagem_emoji}</span>
                  {item.bestseller && <Star size={16} fill="#f59e0b" color="#f59e0b" className="star-icon" />}
                  <div className="card-actions">
                    <button onClick={() => handleEdit(item)}><Edit3 size={16} /></button>
                    <button onClick={() => handleDeleteProduct(item.id)} className="delete"><Trash2 size={16} /></button>
                  </div>
                </div>
                <div className="product-card-body">
                  <h3>{item.nome}</h3>
                  <p className="card-cat">{categories.find(c => c.id === item.categoria_id)?.nome || 'Sem categoria'}</p>
                  <p className="card-desc">{item.descricao || 'Sem descrição'}</p>
                </div>
                <div className="product-card-footer">
                  <span className="card-price">R$ {parseFloat(item.preco).toFixed(2).replace('.', ',')}</span>
                  {item.config?.is_combo && <Badge variant="info">Combo</Badge>}
                  {item.variacoes?.length > 0 && <Badge variant="secondary">{item.variacoes.length} Sabores</Badge>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Product Modal - PRO VERSION */}
      <Modal
        isOpen={showEditModal}
        onClose={() => { if (!isSaving) setShowEditModal(false); }}
        title={editingItem?.id ? `Editar: ${editingItem.nome}` : 'Criar Novo Item'}
        size="large"
        footer={
          <div className="modal-footer-actions">
             <Button variant="secondary" onClick={() => setShowEditModal(false)}>Cancelar</Button>
             <Button onClick={handleSaveProduct} disabled={isSaving} icon={isSaving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}>
               {isSaving ? 'Salvando...' : 'Salvar Alterações'}
             </Button>
          </div>
        }
      >
        {editingItem && (
          <div className="product-pro-editor">
            <div className="editor-tabs">
              <button className={activeTab === 'basic' ? 'active' : ''} onClick={() => setActiveTab('basic')}><Settings size={18} /> Básico</button>
              <button className={activeTab === 'variations' ? 'active' : ''} onClick={() => setActiveTab('variations')}><Layers size={18} /> Sabores/Tamanhos</button>
              <button className={activeTab === 'combo' ? 'active' : ''} onClick={() => setActiveTab('combo')}><LayoutGrid size={18} /> Combo Builder</button>
            </div>

            <div className="editor-content">
              {activeTab === 'basic' && (
                <div className="tab-pane animate-in">
                  <div className="form-row">
                    <div className="form-group flex-1">
                      <label>Nome do Produto *</label>
                      <input value={editingItem.nome} onChange={e => setEditingItem({...editingItem, nome: e.target.value})} placeholder="Ex: Burger Bacon" />
                    </div>
                    <div className="form-group" style={{ width: '120px' }}>
                      <label>Emoji/Ícone</label>
                      <input value={editingItem.imagem_emoji} onChange={e => setEditingItem({...editingItem, imagem_emoji: e.target.value})} placeholder="🍔" style={{ textAlign: 'center', fontSize: '1.5rem' }} />
                    </div>
                  </div>
                  
                  <div className="form-group">
                    <label>Descrição Curta</label>
                    <textarea value={editingItem.descricao} onChange={e => setEditingItem({...editingItem, descricao: e.target.value})} placeholder="Ingredientes e detalhes..." />
                  </div>

                  <div className="form-row">
                    <div className="form-group flex-1">
                      <label>Categoria Principal</label>
                      <select value={editingItem.categoria_id} onChange={e => setEditingItem({...editingItem, categoria_id: e.target.value})}>
                        {categories.map(c => <option key={c.id} value={c.id}>{c.icone} {c.nome}</option>)}
                      </select>
                    </div>
                    <div className="form-group flex-1">
                      <label>Preço Base (R$)</label>
                      <input type="number" value={editingItem.preco} onChange={e => setEditingItem({...editingItem, preco: parseFloat(e.target.value) || 0})} />
                    </div>
                  </div>

                  <div className="form-toggles">
                    <label className="toggle-label">
                      <input type="checkbox" checked={editingItem.bestseller} onChange={e => setEditingItem({...editingItem, bestseller: e.target.checked})} />
                      <span>Destacar como "Mais Vendido"</span>
                    </label>
                    <label className="toggle-label">
                      <input type="checkbox" checked={editingItem.ativo} onChange={e => setEditingItem({...editingItem, ativo: e.target.checked})} />
                      <span>Item Disponível no Cardápio</span>
                    </label>
                  </div>
                </div>
              )}

              {activeTab === 'variations' && (
                <div className="tab-pane animate-in">
                  <div className="pane-header">
                    <h4>Sabores e Tamanhos</h4>
                    <p>Adicione variações de preço para diferentes versões deste item.</p>
                  </div>
                  <div className="variations-dynamic-list">
                    {editingItem.variacoes?.map((v, i) => (
                      <div key={i} className="dynamic-row">
                        <input placeholder="Ex: Média (35cm)" value={v.name} onChange={e => {
                          const news = [...editingItem.variacoes];
                          news[i].name = e.target.value;
                          setEditingItem({...editingItem, variacoes: news});
                        }} />
                        <div className="price-input">
                          <span>R$</span>
                          <input type="number" value={v.price} onChange={e => {
                            const news = [...editingItem.variacoes];
                            news[i].price = parseFloat(e.target.value) || 0;
                            setEditingItem({...editingItem, variacoes: news});
                          }} />
                        </div>
                        <button className="del-btn" onClick={() => setEditingItem({...editingItem, variacoes: editingItem.variacoes.filter((_, idx) => idx !== i)})}><X size={16} /></button>
                      </div>
                    ))}
                    <button className="add-dynamic-btn" onClick={() => setEditingItem({...editingItem, variacoes: [...editingItem.variacoes, { name: '', price: 0 }]})}>
                      <Plus size={16} /> Adicionar Variação/Sabor
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'combo' && (
                <div className="tab-pane animate-in">
                  <div className="pane-header">
                    <div className="flex-j-between">
                      <div>
                        <h4>Configuração de Combo</h4>
                        <p>Selecione quais itens individuais compõem este combo.</p>
                      </div>
                      <label className="toggle-switch">
                         <input type="checkbox" checked={editingItem.config?.is_combo} onChange={e => setEditingItem({...editingItem, config: { ...editingItem.config, is_combo: e.target.checked }})} />
                         <span className="slider"></span>
                      </label>
                    </div>
                  </div>

                  {editingItem.config?.is_combo ? (
                    <div className="combo-builder-area">
                       <label>Itens inclusos neste Combo:</label>
                       <div className="combo-items-selector">
                          {products.filter(p => p.id !== editingItem.id && !p.config?.is_combo).map(p => (
                            <button 
                              key={p.id} 
                              className={`combo-item-chip ${editingItem.config.items_combo?.includes(p.id) ? 'selected' : ''}`}
                              onClick={() => {
                                const current = editingItem.config.items_combo || [];
                                const news = current.includes(p.id) ? current.filter(id => id !== p.id) : [...current, p.id];
                                setEditingItem({...editingItem, config: { ...editingItem.config, items_combo: news }});
                              }}
                            >
                              {p.imagem_emoji} {p.nome}
                              {editingItem.config.items_combo?.includes(p.id) && <CheckCircle2 size={14} />}
                            </button>
                          ))}
                       </div>
                    </div>
                  ) : (
                    <div className="empty-tab-state">
                      <AlertCircle size={32} />
                      <p>Ative a chave acima para transformar este produto em um Combo.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Category Management Modal */}
      <Modal
        isOpen={showCategoryModal}
        onClose={() => { setShowCategoryModal(false); setEditingCatId(null); }}
        title="Gestão de Categorias"
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
              onKeyDown={e => e.key === 'Enter' && handleAddCategory()}
            />
            <Button onClick={handleAddCategory} icon={<Plus size={16} />}>Adicionar</Button>
          </div>

          <div className="cat-list">
            {categories.length === 0 && (
              <p className="cat-empty-hint">Nenhuma categoria criada ainda.</p>
            )}
            {categories.map(c => (
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
                      <button onClick={() => handleStartEditCat(c)}><Edit3 size={13} /></button>
                      <button className="danger" onClick={() => deleteCategory(c.id)}><Trash2 size={13} /></button>
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

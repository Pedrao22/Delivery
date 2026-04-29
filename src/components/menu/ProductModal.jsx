import { useState } from 'react';
import { Star, Clock, ShoppingCart, Minus, Plus, Info } from 'lucide-react';
import Modal from '../shared/Modal';
import Button from '../shared/Button';
import { useOrdersContext } from '../../context/OrdersContext';
import './ProductModal.css';

export default function ProductModal({ product, isOpen, onClose, onAdd }) {
  const { restaurantSettings, categories } = useOrdersContext();
  const primaryColor = restaurantSettings.primaryColor || '#e74c3c';

  const categoryName = categories?.find(c => c.id === product?.categoria_id)?.nome || null;

  const variations = product?.variacoes || [];
  const complements = product?.complementos || [];
  
  const [selectedVariation, setSelectedVariation] = useState(
    variations.length > 0 ? variations[0] : null
  );
  const [selectedComplements, setSelectedComplements] = useState([]);
  const [qty, setQty] = useState(1);
  const [obs, setObs] = useState('');

  const toggleComplement = (complement) => {
    setSelectedComplements(prev =>
      prev.find(c => c.id === complement.id)
        ? prev.filter(c => c.id !== complement.id)
        : [...prev, complement]
    );
  };

  const calcTotal = () => {
    let total = parseFloat(product.preco || 0);
    if (selectedVariation) total += selectedVariation.price;
    total += selectedComplements.reduce((sum, c) => sum + c.price, 0);
    return total * qty;
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={product.nome}
      size="large"
      footer={
        <div className="modal-footer-lux">
          <div className="qty-selector-lux">
            <button onClick={() => setQty(Math.max(1, qty - 1))}><Minus size={18} /></button>
            <span>{qty}</span>
            <button onClick={() => setQty(qty + 1)}><Plus size={18} /></button>
          </div>
          <button
            className="add-to-cart-lux"
            style={{ backgroundColor: primaryColor }}
            onClick={() => onAdd(selectedVariation, selectedComplements, qty, obs)}
          >
            <div className="lux-btn-left">
              <ShoppingCart size={18} />
              <span>Adicionar</span>
            </div>
            <div className="lux-btn-right">
              R$ {calcTotal().toFixed(2).replace('.', ',')}
            </div>
          </button>
        </div>
      }
    >
      <div className="premium-modal-content">
        {/* Hero */}
        <div className="modal-hero">
          <div className="modal-image-bg" style={{ background: `${primaryColor}10` }}>
            <span className="modal-emoji-hero">{product.imagem_emoji}</span>
          </div>
          <div className="modal-info-bar">
            <div className="info-chip">
              <Star size={14} fill="#F59F00" color="#F59F00" />
              <span>{product.rating || '4.8'}</span>
            </div>
            <div className="info-chip">
              <Clock size={14} />
              <span>{product.prepTime || '20-30 min'}</span>
            </div>
            {categoryName && (
              <div className="info-chip category">
                <span>{categoryName}</span>
              </div>
            )}
          </div>
        </div>

        <div className="modal-desc-box">
          <p>{product.descricao}</p>
        </div>

        {/* Variations */}
        {(product.variacoes || []).length > 0 && (
          <div className="modal-section-v2">
            <div className="section-header-v2">
              <h3>Selecione uma opção</h3>
              <span className="required-tag">Obrigatório</span>
            </div>
            <div className="options-list-v2">
              {(product.variacoes || []).map(v => (
                <div
                  key={v.id}
                  className={`option-card-v2 ${selectedVariation?.id === v.id ? 'active' : ''}`}
                  onClick={() => setSelectedVariation(v)}
                  style={selectedVariation?.id === v.id ? { borderColor: primaryColor } : {}}
                >
                  <div className="option-check" style={selectedVariation?.id === v.id ? { backgroundColor: primaryColor } : {}}>
                    {selectedVariation?.id === v.id && <div className="dot" />}
                  </div>
                  <span className="option-name">{v.name}</span>
                  <span className="option-price">
                    {v.price > 0 ? `+ R$ ${v.price.toFixed(2)}` : 'Incluso'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Complements */}
        {(product.complementos || []).length > 0 && (
          <div className="modal-section-v2">
            <div className="section-header-v2">
              <h3>Complementos extras</h3>
              <span className="optional-tag">Opcional</span>
            </div>
            <div className="options-list-v2">
              {(product.complementos || []).map(c => {
                const isSelected = selectedComplements.find(sc => sc.id === c.id);
                return (
                  <div
                    key={c.id}
                    className={`option-card-v2 checkbox ${isSelected ? 'active' : ''}`}
                    onClick={() => toggleComplement(c)}
                    style={isSelected ? { borderColor: primaryColor } : {}}
                  >
                    <div className="option-checkbox" style={isSelected ? { backgroundColor: primaryColor, borderColor: primaryColor } : {}}>
                      {isSelected && <Check size={12} strokeWidth={4} color="white" />}
                    </div>
                    <span className="option-name">{c.name}</span>
                    <span className="option-price">+ R$ {c.price.toFixed(2)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Observations */}
        <div className="modal-section-v2">
          <div className="section-header-v2">
            <h3>Observações</h3>
          </div>
          <textarea
            className="premium-obs-input"
            placeholder="Ex: Tirar cebola, ponto da carne, etc..."
            value={obs}
            onChange={(e) => setObs(e.target.value)}
          />
        </div>
      </div>
    </Modal>
  );
}

function Check({ size, color, strokeWidth }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke={color} 
      strokeWidth={strokeWidth} 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

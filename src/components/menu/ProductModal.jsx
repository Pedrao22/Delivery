import { useState } from 'react';
import { Star, Clock, ShoppingCart } from 'lucide-react';
import Modal from '../shared/Modal';
import Button from '../shared/Button';
import './ProductModal.css';

export default function ProductModal({ product, isOpen, onClose, onAdd }) {
  const [selectedVariation, setSelectedVariation] = useState(
    product.variations.length > 0 ? product.variations[0] : null
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
    let total = product.price;
    if (selectedVariation) total += selectedVariation.price;
    total += selectedComplements.reduce((sum, c) => sum + c.price, 0);
    return total * qty;
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={product.name}
      size="large"
      footer={
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: '16px' }}>
          <div className="product-modal-total" style={{ flex: 1 }}>
            <span className="product-modal-total-label">Total</span>
            <span className="product-modal-total-value">
              R$ {calcTotal().toFixed(2).replace('.', ',')}
            </span>
          </div>
          <Button
            onClick={() => onAdd(selectedVariation, selectedComplements, qty, obs)}
            icon={<ShoppingCart size={16} />}
          >
            Adicionar
          </Button>
        </div>
      }
    >
      {/* Product Image */}
      <div className="product-modal-image">{product.image}</div>

      {/* Meta */}
      <div className="product-modal-meta">
        <div className="product-modal-meta-item">
          <Star size={14} fill="var(--warning)" color="var(--warning)" />
          {product.rating}
        </div>
        <div className="product-modal-meta-item">
          <Clock size={14} />
          {product.prepTime}
        </div>
        <div style={{
          fontSize: 'var(--font-xl)',
          fontWeight: 'var(--fw-bold)',
          color: 'var(--accent)',
          marginLeft: 'auto',
        }}>
          R$ {product.price.toFixed(2).replace('.', ',')}
        </div>
      </div>

      <p className="product-modal-desc">{product.description}</p>

      {/* Variations */}
      {product.variations.length > 0 && (
        <div className="product-modal-section">
          <div className="product-modal-section-title">Escolha a variação</div>
          <div className="product-modal-options">
            {product.variations.map(v => (
              <div
                key={v.id}
                className={`product-modal-option ${selectedVariation?.id === v.id ? 'selected' : ''}`}
                onClick={() => setSelectedVariation(v)}
              >
                <span className="product-modal-option-name">{v.name}</span>
                <span className="product-modal-option-price">
                  {v.price > 0 ? `+ R$ ${v.price.toFixed(2).replace('.', ',')}` : 'Incluso'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Complements */}
      {product.complements.length > 0 && (
        <div className="product-modal-section">
          <div className="product-modal-section-title">Complementos</div>
          <div className="product-modal-options">
            {product.complements.map(c => (
              <div
                key={c.id}
                className={`product-modal-complement ${selectedComplements.find(sc => sc.id === c.id) ? 'selected' : ''}`}
                onClick={() => toggleComplement(c)}
              >
                <span className="product-modal-option-name">{c.name}</span>
                <span className="product-modal-option-price">
                  + R$ {c.price.toFixed(2).replace('.', ',')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quantity */}
      <div className="product-modal-section">
        <div className="product-modal-section-title">Quantidade</div>
        <div className="product-modal-qty">
          <button className="product-modal-qty-btn" onClick={() => setQty(Math.max(1, qty - 1))}>−</button>
          <span className="product-modal-qty-value">{qty}</span>
          <button className="product-modal-qty-btn" onClick={() => setQty(qty + 1)}>+</button>
        </div>
      </div>

      {/* Observations */}
      <div className="product-modal-section">
        <div className="product-modal-section-title">Observações</div>
        <textarea
          className="product-modal-obs-input"
          rows={3}
          placeholder="Alguma observação? (ex: sem cebola, ponto da carne...)"
          value={obs}
          onChange={(e) => setObs(e.target.value)}
        />
      </div>
    </Modal>
  );
}

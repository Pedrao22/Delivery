import React from 'react';
import { Plus, Star } from 'lucide-react';
import { useOrdersContext } from '../../context/OrdersContext';
import './ProductCard.css';

export default function ProductCard({ product, onAdd, compact = false }) {
  const { restaurantSettings } = useOrdersContext();
  const primaryColor = restaurantSettings.primaryColor || '#e74c3c';

  if (compact) {
    return (
      <div className="product-card compact" onClick={onAdd}>
        <div className="product-image-container">
          <span className="product-emoji">{product.imagem_emoji}</span>
        </div>
        <div className="product-info-compact">
          <h3 className="product-name">{product.nome}</h3>
          <span className="product-price">R$ {parseFloat(product.preco || 0).toFixed(2).replace('.', ',')}</span>
        </div>
        <button className="add-btn-round" style={{ backgroundColor: primaryColor }}>
          <Plus size={16} />
        </button>
      </div>
    );
  }

  return (
    <div className="product-card-premium" onClick={onAdd}>
      <div className="card-image-section">
        <span className="card-emoji-large">{product.imagem_emoji}</span>
        {product.bestseller && (
           <div className="bestseller-badge">
             <Star size={10} fill="currentColor" /> Populares
           </div>
        )}
      </div>
      
      <div className="card-content-section">
        <div className="card-main-info">
          <h3 className="card-title">{product.nome}</h3>
          <p className="card-description">{product.descricao}</p>
        </div>
        
        <div className="card-footer-info">
          <span className="card-price-tag" style={{ color: primaryColor }}>
            R$ {parseFloat(product.preco || 0).toFixed(2).replace('.', ',')}
          </span>
          <button className="card-add-btn" style={{ background: `${primaryColor}15`, color: primaryColor }}>
            <Plus size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}

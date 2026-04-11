import { Star, Plus } from 'lucide-react';
import './ProductCard.css';

export default function ProductCard({ product, onClick, delay = 0 }) {
  const isOut = product.stockStatus === 'out';

  return (
    <div
      className={`product-card ${isOut ? 'out-of-stock' : ''}`}
      onClick={isOut ? null : onClick}
      style={{ animationDelay: `${delay}ms`, cursor: isOut ? 'not-allowed' : 'pointer', opacity: isOut ? 0.7 : 1 }}
    >
      <div className="product-card-image">
        {isOut && <span className="product-card-out-badge">ESGOTADO</span>}
        {product.bestseller && !isOut && <span className="product-card-bestseller">⭐ Mais vendido</span>}
        <span>{product.image}</span>
      </div>
      <div className="product-card-body">
        <div className="product-card-name">{product.name}</div>
        <div className="product-card-desc">{product.description}</div>
        <div className="product-card-footer">
          <div>
            <div className="product-card-price">
              <small>R$ </small>{product.price.toFixed(2).replace('.', ',')}
            </div>
            <div className="product-card-rating">
              <Star size={12} fill="var(--warning)" color="var(--warning)" />
              {product.rating}
            </div>
          </div>
        </div>
      </div>
      {!isOut && (
        <button className="product-card-add" onClick={(e) => { e.stopPropagation(); onClick(); }}>
          <Plus size={18} />
        </button>
      )}
    </div>
  );
}

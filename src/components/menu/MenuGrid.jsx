import { useState } from 'react';
import { useOrdersContext } from '../../context/OrdersContext';
import ProductCard from './ProductCard';
import ProductModal from './ProductModal';
import './MenuGrid.css';

export default function MenuGrid({ onAddToCart }) {
  const { products, categories } = useOrdersContext();
  const [activeCategory, setActiveCategory] = useState('all');
  const [selectedProduct, setSelectedProduct] = useState(null);

  const filtered = activeCategory === 'all'
    ? products.filter(p => p.available !== false)
    : products.filter(item => item.category === activeCategory && item.available !== false);

  return (
    <div className="menu-grid-container">
      <div className="menu-categories-scroll">
        <button
          className={`menu-category-chip ${activeCategory === 'all' ? 'active' : ''}`}
          onClick={() => setActiveCategory('all')}
        >
          🍽️ Todos
        </button>
        {categories.map(cat => (
          <button
            key={cat.id}
            className={`menu-category-chip ${activeCategory === cat.id ? 'active' : ''}`}
            onClick={() => setActiveCategory(cat.id)}
          >
            {cat.icon} {cat.name}
          </button>
        ))}
      </div>

      <div className="menu-products-grid">
        {filtered.map((product, i) => (
          <ProductCard
            key={product.id}
            product={product}
            onClick={() => setSelectedProduct(product)}
            delay={i * 40}
          />
        ))}
      </div>

      {selectedProduct && (
        <ProductModal
          product={selectedProduct}
          isOpen={!!selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onAdd={(variation, complements, qty, obs) => {
            onAddToCart(selectedProduct, variation, complements, qty, obs);
            setSelectedProduct(null);
          }}
        />
      )}
    </div>
  );
}

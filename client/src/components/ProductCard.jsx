import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function ProductCard({ product }) {
  const { addToCart } = useCart();
  const { user } = useAuth();
  const toast = useToast();
  const [adding, setAdding] = useState(false);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!user) { toast.info('Please log in to add items to cart'); return; }
    try {
      setAdding(true);
      await addToCart(product.id);
      toast.success(`${product.name} added to cart`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to add to cart');
    } finally {
      setAdding(false);
    }
  };

  return (
    <Link to={`/products/${product.id}`} className="product-card card" style={{ textDecoration: 'none', color: 'inherit' }}>
      <div className="product-img-wrap">
        <img
          src={product.image_url || '/placeholder.png'}
          alt={product.name}
          onError={(e) => { e.target.src = 'https://placehold.co/400x300?text=No+Image'; }}
        />
        {product.stock_quantity === 0 && (
          <div className="out-of-stock-overlay">Out of Stock</div>
        )}
      </div>
      <div className="product-info">
        {product.category && <span className="product-category">{product.category}</span>}
        <h3 className="product-name">{product.name}</h3>
        <div className="product-footer">
          <span className="product-price">£{parseFloat(product.price).toFixed(2)}</span>
          <button
            className="btn btn-primary btn-sm"
            onClick={handleAdd}
            disabled={adding || product.stock_quantity === 0}
          >
            {adding ? '...' : 'Add'}
          </button>
        </div>
      </div>
      <style>{`
        .product-card { display: flex; flex-direction: column; transition: transform 0.2s, box-shadow 0.2s; }
        .product-card:hover { transform: translateY(-4px); box-shadow: 0 8px 24px rgba(0,0,0,0.12); text-decoration: none; }
        .product-img-wrap { position: relative; aspect-ratio: 4/3; overflow: hidden; background: #f0f0f0; }
        .product-img-wrap img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.3s; }
        .product-card:hover .product-img-wrap img { transform: scale(1.05); }
        .out-of-stock-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.5); color: white; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.9rem; letter-spacing: 0.05em; }
        .product-info { padding: 1rem; flex: 1; display: flex; flex-direction: column; gap: 0.4rem; }
        .product-category { font-size: 0.75rem; font-weight: 600; color: var(--accent); text-transform: uppercase; letter-spacing: 0.05em; }
        .product-name { font-size: 1rem; font-weight: 600; line-height: 1.3; }
        .product-footer { display: flex; align-items: center; justify-content: space-between; margin-top: auto; padding-top: 0.5rem; }
        .product-price { font-size: 1.15rem; font-weight: 700; color: var(--primary); }
      `}</style>
    </Link>
  );
}

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import LoadingSpinner from '../components/LoadingSpinner';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { user } = useAuth();
  const toast = useToast();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    api.get(`/products/${id}`)
      .then((r) => setProduct(r.data))
      .catch(() => navigate('/products'))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  const handleAdd = async () => {
    if (!user) { toast.info('Please log in to add items to cart'); return; }
    try {
      setAdding(true);
      await addToCart(product.id, qty);
      toast.success(`${product.name} added to cart`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to add to cart');
    } finally {
      setAdding(false);
    }
  };

  if (loading) return <LoadingSpinner fullPage />;
  if (!product) return null;

  const inStock = product.stock_quantity > 0;

  return (
    <div className="container" style={{ padding: '2rem 1rem' }}>
      <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)} style={{ marginBottom: '1.5rem' }}>← Back</button>

      <div className="product-detail-grid">
        <div className="product-detail-img">
          <img
            src={product.image_url || 'https://placehold.co/600x500?text=No+Image'}
            alt={product.name}
            onError={(e) => { e.target.src = 'https://placehold.co/600x500?text=No+Image'; }}
            style={{ width: '100%', borderRadius: 'var(--radius-lg)' }}
          />
        </div>

        <div className="product-detail-info">
          {product.category && <span className="product-category-tag">{product.category}</span>}
          <h1>{product.name}</h1>
          <div className="product-detail-price">£{parseFloat(product.price).toFixed(2)}</div>

          <div className={`stock-status ${inStock ? 'in' : 'out'}`}>
            {inStock ? `✓ In Stock (${product.stock_quantity} available)` : '✗ Out of Stock'}
          </div>

          {product.description && <p style={{ color: 'var(--text-muted)', lineHeight: 1.7 }}>{product.description}</p>}
          {product.sku && <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>SKU: {product.sku}</p>}

          {inStock && (
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <button className="btn btn-outline btn-sm" onClick={() => setQty((q) => Math.max(1, q - 1))}>−</button>
                <span style={{ fontWeight: 600, minWidth: 24, textAlign: 'center' }}>{qty}</span>
                <button className="btn btn-outline btn-sm" onClick={() => setQty((q) => Math.min(product.stock_quantity, q + 1))}>+</button>
              </div>
              <button className="btn btn-primary" onClick={handleAdd} disabled={adding} style={{ flex: 1 }}>
                {adding ? 'Adding...' : 'Add to Cart'}
              </button>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .product-detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 3rem; align-items: start; }
        .product-detail-info { display: flex; flex-direction: column; gap: 1rem; }
        .product-category-tag { font-size: 0.8rem; font-weight: 700; color: var(--accent); text-transform: uppercase; letter-spacing: 0.06em; }
        .product-detail-info h1 { font-size: 2rem; font-weight: 800; line-height: 1.2; }
        .product-detail-price { font-size: 2rem; font-weight: 800; color: var(--accent); }
        .stock-status { font-size: 0.9rem; font-weight: 600; }
        .stock-status.in { color: var(--success); }
        .stock-status.out { color: var(--danger); }
        @media (max-width: 768px) { .product-detail-grid { grid-template-columns: 1fr; gap: 1.5rem; } }
      `}</style>
    </div>
  );
}

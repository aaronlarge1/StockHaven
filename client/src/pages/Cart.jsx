import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import LoadingSpinner from '../components/LoadingSpinner';

export default function Cart() {
  const { items, loading, updateQuantity, removeItem, cartTotal } = useCart();
  const toast = useToast();
  const navigate = useNavigate();

  const handleRemove = async (id, name) => {
    try {
      await removeItem(id);
      toast.success(`${name} removed`);
    } catch {
      toast.error('Failed to remove item');
    }
  };

  const handleQty = async (id, qty) => {
    try { await updateQuantity(id, qty); }
    catch { toast.error('Failed to update quantity'); }
  };

  if (loading) return <LoadingSpinner fullPage />;

  return (
    <div className="container" style={{ padding: '2rem 1rem' }}>
      <div className="page-header"><h1>Your Cart</h1></div>

      {items.length === 0 ? (
        <div className="empty-state">
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🛒</div>
          <h3>Your cart is empty</h3>
          <p>Start shopping to add items here.</p>
          <Link to="/products" className="btn btn-primary" style={{ marginTop: '1.5rem' }}>Browse Products</Link>
        </div>
      ) : (
        <div className="cart-layout">
          <div className="cart-items">
            {items.map((item) => (
              <div key={item.id} className="cart-item card card-body">
                <img
                  src={item.image_url || 'https://placehold.co/80x80?text=IMG'}
                  alt={item.name}
                  className="cart-item-img"
                  onError={(e) => { e.target.src = 'https://placehold.co/80x80?text=IMG'; }}
                />
                <div className="cart-item-info">
                  <Link to={`/products/${item.product_id}`}><strong>{item.name}</strong></Link>
                  <span className="cart-item-price">£{parseFloat(item.price).toFixed(2)} each</span>
                </div>
                <div className="cart-item-qty">
                  <button className="btn btn-outline btn-sm" onClick={() => handleQty(item.id, item.quantity - 1)} disabled={item.quantity <= 1}>−</button>
                  <span>{item.quantity}</span>
                  <button className="btn btn-outline btn-sm" onClick={() => handleQty(item.id, item.quantity + 1)} disabled={item.quantity >= item.stock_quantity}>+</button>
                </div>
                <div style={{ fontWeight: 700, minWidth: 80, textAlign: 'right' }}>
                  £{(parseFloat(item.price) * item.quantity).toFixed(2)}
                </div>
                <button className="btn btn-ghost btn-sm" onClick={() => handleRemove(item.id, item.name)} title="Remove">✕</button>
              </div>
            ))}
          </div>

          <div className="cart-summary card card-body">
            <h3 style={{ marginBottom: '1rem' }}>Order Summary</h3>
            {items.map((i) => (
              <div key={i.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '0.4rem' }}>
                <span>{i.name} × {i.quantity}</span>
                <span>£{(parseFloat(i.price) * i.quantity).toFixed(2)}</span>
              </div>
            ))}
            <hr className="divider" />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '1.1rem', marginBottom: '1.5rem' }}>
              <span>Total</span><span>£{cartTotal.toFixed(2)}</span>
            </div>
            <button className="btn btn-primary btn-full btn-lg" onClick={() => navigate('/checkout')}>
              Proceed to Checkout
            </button>
          </div>
        </div>
      )}

      <style>{`
        .cart-layout { display: grid; grid-template-columns: 1fr 320px; gap: 2rem; align-items: start; }
        .cart-items { display: flex; flex-direction: column; gap: 1rem; }
        .cart-item { display: flex; align-items: center; gap: 1rem; }
        .cart-item-img { width: 80px; height: 80px; object-fit: cover; border-radius: var(--radius); flex-shrink: 0; }
        .cart-item-info { flex: 1; display: flex; flex-direction: column; gap: 0.25rem; }
        .cart-item-info a { color: var(--text); font-weight: 600; text-decoration: none; }
        .cart-item-price { font-size: 0.85rem; color: var(--text-muted); }
        .cart-item-qty { display: flex; align-items: center; gap: 0.5rem; }
        .cart-item-qty span { min-width: 24px; text-align: center; font-weight: 600; }
        @media (max-width: 768px) { .cart-layout { grid-template-columns: 1fr; } .cart-item { flex-wrap: wrap; } }
      `}</style>
    </div>
  );
}

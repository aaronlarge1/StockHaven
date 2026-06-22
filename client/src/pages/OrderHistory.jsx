import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import LoadingSpinner from '../components/LoadingSpinner';

const STATUS_BADGE = {
  pending: 'badge-warning',
  paid: 'badge-info',
  processing: 'badge-info',
  shipped: 'badge-secondary',
  delivered: 'badge-success',
  cancelled: 'badge-danger',
};

export default function OrderHistory() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    api.get('/orders').then((r) => setOrders(r.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner fullPage />;

  return (
    <div className="container" style={{ padding: '2rem 1rem' }}>
      <div className="page-header"><h1>Order History</h1></div>

      {orders.length === 0 ? (
        <div className="empty-state">
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📦</div>
          <h3>No orders yet</h3>
          <p>Your completed orders will appear here.</p>
          <Link to="/products" className="btn btn-primary" style={{ marginTop: '1.5rem' }}>Start Shopping</Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {orders.map((order) => (
            <div key={order.id} className="card">
              <div
                className="card-body"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', flexWrap: 'wrap', gap: '1rem' }}
                onClick={() => setExpanded(expanded === order.id ? null : order.id)}
              >
                <div>
                  <div style={{ fontWeight: 700 }}>Order #{order.id}</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{new Date(order.created_at).toLocaleDateString('en-GB', { dateStyle: 'long' })}</div>
                </div>
                <span className={`badge ${STATUS_BADGE[order.status] || 'badge-secondary'}`}>{order.status}</span>
                <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>£{parseFloat(order.total_amount).toFixed(2)}</div>
                <span style={{ color: 'var(--text-muted)' }}>{expanded === order.id ? '▲' : '▼'}</span>
              </div>

              {expanded === order.id && (
                <div style={{ borderTop: '1px solid var(--border)', padding: '1rem 1.5rem' }}>
                  {order.items.map((item, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.75rem' }}>
                      <img src={item.image_url || 'https://placehold.co/48x48?text=IMG'} alt={item.name} style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 'var(--radius)' }} onError={(e) => { e.target.src = 'https://placehold.co/48x48?text=IMG'; }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600 }}>{item.name}</div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>× {item.quantity} @ £{parseFloat(item.price).toFixed(2)}</div>
                      </div>
                      <div style={{ fontWeight: 600 }}>£{(parseFloat(item.price) * item.quantity).toFixed(2)}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

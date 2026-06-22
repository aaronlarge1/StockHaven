import React, { useEffect, useState, useCallback } from 'react';
import api from '../../api';
import { useToast } from '../../context/ToastContext';
import LoadingSpinner from '../../components/LoadingSpinner';

const STATUSES = ['pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled'];
const BADGE = { pending: 'badge-warning', paid: 'badge-info', processing: 'badge-info', shipped: 'badge-secondary', delivered: 'badge-success', cancelled: 'badge-danger' };

export default function AdminOrders() {
  const toast = useToast();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [expanded, setExpanded] = useState(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/orders${statusFilter ? `?status=${statusFilter}` : ''}`);
      setOrders(res.data);
    } catch { toast.error('Failed to load orders'); }
    finally { setLoading(false); }
  }, [statusFilter]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const updateStatus = async (orderId, status) => {
    try {
      await api.patch(`/admin/orders/${orderId}/status`, { status });
      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status } : o)));
      toast.success('Status updated');
    } catch { toast.error('Failed to update status'); }
  };

  return (
    <div className="container" style={{ padding: '2rem 1rem' }}>
      <div className="page-header"><h1>Orders</h1></div>

      <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ maxWidth: 200, marginBottom: '1.5rem' }}>
        <option value="">All Statuses</option>
        {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
      </select>

      {loading ? <LoadingSpinner fullPage /> : orders.length === 0 ? (
        <div className="empty-state"><h3>No orders found</h3></div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {orders.map((order) => (
            <div key={order.id} className="card">
              <div className="card-body" style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', cursor: 'pointer' }} onClick={() => setExpanded(expanded === order.id ? null : order.id)}>
                <div style={{ flex: 1, minWidth: 120 }}>
                  <div style={{ fontWeight: 700 }}>Order #{order.id}</div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{new Date(order.created_at).toLocaleDateString('en-GB')}</div>
                </div>
                <div style={{ flex: 1, minWidth: 140 }}>
                  <div style={{ fontWeight: 600 }}>{order.customer_name}</div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{order.customer_email}</div>
                </div>
                <span className={`badge ${BADGE[order.status]}`}>{order.status}</span>
                <div style={{ fontWeight: 700 }}>£{parseFloat(order.total_amount).toFixed(2)}</div>
                <select
                  value={order.status}
                  onChange={(e) => { e.stopPropagation(); updateStatus(order.id, e.target.value); }}
                  onClick={(e) => e.stopPropagation()}
                  style={{ width: 'auto', padding: '0.3rem 0.6rem' }}
                >
                  {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              {expanded === order.id && (
                <div style={{ borderTop: '1px solid var(--border)', padding: '1rem 1.5rem' }}>
                  {order.items.map((item, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', fontSize: '0.9rem' }}>
                      <span>{item.name} × {item.quantity}</span>
                      <span>£{(parseFloat(item.price) * item.quantity).toFixed(2)}</span>
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

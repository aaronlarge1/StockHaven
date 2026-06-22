import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notif, setNotif] = useState({ title: '', body: '' });
  const [sending, setSending] = useState(false);

  useEffect(() => {
    api.get('/admin/stats').then((r) => setStats(r.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  const sendNotif = async (e) => {
    e.preventDefault();
    setSending(true);
    try {
      const res = await api.post('/notifications/send', notif);
      alert(`Sent: ${res.data.sent}, Failed: ${res.data.failed}`);
      setNotif({ title: '', body: '' });
    } catch { alert('Failed to send'); }
    finally { setSending(false); }
  };

  if (loading) return <LoadingSpinner fullPage />;

  const cards = [
    { label: 'Total Revenue', value: `£${stats.totalRevenue.toFixed(2)}`, color: '#27ae60' },
    { label: 'Total Orders', value: stats.totalOrders, color: '#3498db' },
    { label: 'Customers', value: stats.totalCustomers, color: '#9b59b6' },
    { label: 'Low Stock Items', value: stats.lowStockCount, color: stats.lowStockCount > 0 ? '#e74c3c' : '#27ae60' },
  ];

  return (
    <div className="container" style={{ padding: '2rem 1rem' }}>
      <div className="page-header"><h1>Admin Dashboard</h1></div>

      {/* Stats */}
      <div className="grid grid-4" style={{ marginBottom: '2rem' }}>
        {cards.map((c) => (
          <div key={c.label} className="card card-body" style={{ textAlign: 'center', borderTop: `4px solid ${c.color}` }}>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: c.color }}>{c.value}</div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>{c.label}</div>
          </div>
        ))}
      </div>

      {/* Quick links */}
      <div className="grid grid-3" style={{ marginBottom: '2rem' }}>
        {[
          { to: '/admin/products', label: '📦 Manage Products', desc: 'Add, edit, delete products' },
          { to: '/admin/orders', label: '🧾 Manage Orders', desc: 'View and update order statuses' },
          { to: '/admin/inventory', label: '📊 Inventory', desc: 'Quick stock adjustments' },
        ].map((link) => (
          <Link key={link.to} to={link.to} className="card card-body" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.25rem' }}>{link.label}</div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{link.desc}</div>
          </Link>
        ))}
      </div>

      {/* Push notification broadcast */}
      <div className="card card-body">
        <h2 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Broadcast Push Notification</h2>
        <form onSubmit={sendNotif}>
          <div className="form-group">
            <label>Title</label>
            <input value={notif.title} onChange={(e) => setNotif({ ...notif, title: e.target.value })} required placeholder="e.g. New arrivals!" />
          </div>
          <div className="form-group">
            <label>Message</label>
            <textarea value={notif.body} onChange={(e) => setNotif({ ...notif, body: e.target.value })} required rows={3} placeholder="e.g. Check out our latest products..." />
          </div>
          <button className="btn btn-primary" type="submit" disabled={sending}>
            {sending ? 'Sending...' : 'Send to All Subscribers'}
          </button>
        </form>
      </div>
    </div>
  );
}

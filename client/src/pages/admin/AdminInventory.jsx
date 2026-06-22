import React, { useEffect, useState, useCallback } from 'react';
import api from '../../api';
import { useToast } from '../../context/ToastContext';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function AdminInventory() {
  const toast = useToast();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adjustments, setAdjustments] = useState({});
  const [saving, setSaving] = useState({});
  const [search, setSearch] = useState('');

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/products?limit=100&search=${search}`);
      setProducts(res.data.products);
    } catch { toast.error('Failed to load inventory'); }
    finally { setLoading(false); }
  }, [search]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const applyAdjustment = async (id, name) => {
    const adj = parseInt(adjustments[id]);
    if (!adj || isNaN(adj)) { toast.error('Enter a valid adjustment (e.g. +10 or -5)'); return; }
    setSaving((s) => ({ ...s, [id]: true }));
    try {
      const res = await api.patch(`/admin/products/${id}/stock`, { adjustment: adj });
      setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, stock_quantity: res.data.stock_quantity } : p)));
      setAdjustments((a) => ({ ...a, [id]: '' }));
      toast.success(`${name}: stock updated to ${res.data.stock_quantity}`);
    } catch { toast.error('Failed to update stock'); }
    finally { setSaving((s) => ({ ...s, [id]: false })); }
  };

  const lowStock = products.filter((p) => p.stock_quantity < 10);

  return (
    <div className="container" style={{ padding: '2rem 1rem' }}>
      <div className="page-header"><h1>Inventory Management</h1></div>

      {lowStock.length > 0 && (
        <div style={{ background: '#fff3cd', border: '1px solid #ffc107', borderRadius: 'var(--radius)', padding: '1rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '1.2rem' }}>⚠️</span>
          <span><strong>{lowStock.length} product{lowStock.length > 1 ? 's' : ''}</strong> with low stock (under 10 units)</span>
        </div>
      )}

      <input type="search" placeholder="Search products..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ maxWidth: 320, marginBottom: '1.5rem' }} />

      {loading ? <LoadingSpinner fullPage /> : (
        <div className="card table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>SKU</th>
                <th>Current Stock</th>
                <th>Adjustment (+/-)</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id}>
                  <td style={{ fontWeight: 600 }}>{p.name}</td>
                  <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{p.sku || '—'}</td>
                  <td>
                    <span className={`badge ${p.stock_quantity === 0 ? 'badge-danger' : p.stock_quantity < 10 ? 'badge-warning' : 'badge-success'}`}>
                      {p.stock_quantity}
                    </span>
                  </td>
                  <td style={{ width: 120 }}>
                    <input
                      type="number"
                      placeholder="e.g. 50"
                      value={adjustments[p.id] || ''}
                      onChange={(e) => setAdjustments((a) => ({ ...a, [p.id]: e.target.value }))}
                      style={{ width: '100%' }}
                    />
                  </td>
                  <td>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => applyAdjustment(p.id, p.name)}
                      disabled={saving[p.id]}
                    >
                      {saving[p.id] ? '...' : 'Apply'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

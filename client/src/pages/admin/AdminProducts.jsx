import React, { useEffect, useState, useCallback } from 'react';
import api from '../../api';
import { useToast } from '../../context/ToastContext';
import LoadingSpinner from '../../components/LoadingSpinner';

const EMPTY_FORM = { name: '', description: '', price: '', stock_quantity: '', category: '', sku: '', image_url: '' };

export default function AdminProducts() {
  const toast = useToast();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [imageFile, setImageFile] = useState(null);
  const [saving, setSaving] = useState(false);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/products?search=${search}&page=${page}&limit=15`);
      setProducts(res.data.products);
      setTotal(res.data.total);
    } catch { toast.error('Failed to load products'); }
    finally { setLoading(false); }
  }, [search, page]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const openNew = () => { setEditing(null); setForm(EMPTY_FORM); setImageFile(null); setShowForm(true); };
  const openEdit = (p) => { setEditing(p.id); setForm({ name: p.name, description: p.description || '', price: p.price, stock_quantity: p.stock_quantity, category: p.category || '', sku: p.sku || '', image_url: p.image_url || '' }); setImageFile(null); setShowForm(true); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (imageFile) fd.append('image', imageFile);

      if (editing) {
        await api.put(`/admin/products/${editing}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast.success('Product updated');
      } else {
        await api.post('/admin/products', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast.success('Product created');
      }
      setShowForm(false);
      fetchProducts();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed to save'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete "${name}"?`)) return;
    try {
      await api.delete(`/admin/products/${id}`);
      toast.success('Product deleted');
      fetchProducts();
    } catch { toast.error('Failed to delete'); }
  };

  return (
    <div className="container" style={{ padding: '2rem 1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 700 }}>Products</h1>
        <button className="btn btn-primary" onClick={openNew}>+ Add Product</button>
      </div>

      <input type="search" placeholder="Search products..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} style={{ maxWidth: 320, marginBottom: '1.5rem' }} />

      {loading ? <LoadingSpinner fullPage /> : (
        <div className="card table-wrapper">
          <table>
            <thead><tr><th>Image</th><th>Name</th><th>Price</th><th>Stock</th><th>Category</th><th>SKU</th><th>Actions</th></tr></thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id}>
                  <td><img src={p.image_url || 'https://placehold.co/48x48?text=IMG'} alt="" style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 'var(--radius)' }} onError={(e) => { e.target.src = 'https://placehold.co/48x48?text=IMG'; }} /></td>
                  <td style={{ fontWeight: 600 }}>{p.name}</td>
                  <td>£{parseFloat(p.price).toFixed(2)}</td>
                  <td><span className={`badge ${p.stock_quantity < 10 ? 'badge-danger' : p.stock_quantity < 30 ? 'badge-warning' : 'badge-success'}`}>{p.stock_quantity}</span></td>
                  <td>{p.category || '—'}</td>
                  <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{p.sku || '—'}</td>
                  <td style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="btn btn-secondary btn-sm" onClick={() => openEdit(p)}>Edit</button>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(p.id, p.name)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>{total} products total</div>
        </div>
      )}

      {/* Modal Form */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ marginBottom: '1.5rem' }}>{editing ? 'Edit Product' : 'New Product'}</h2>
            <form onSubmit={handleSubmit}>
              {[['name', 'Name', 'text', true], ['price', 'Price (£)', 'number', true], ['stock_quantity', 'Stock', 'number', false], ['category', 'Category', 'text', false], ['sku', 'SKU', 'text', false]].map(([key, label, type, req]) => (
                <div className="form-group" key={key}>
                  <label>{label}</label>
                  <input type={type} value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} required={req} step={type === 'number' && key === 'price' ? '0.01' : undefined} />
                </div>
              ))}
              <div className="form-group">
                <label>Description</label>
                <textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Product Image</label>
                <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files[0])} style={{ border: 'none', padding: 0 }} />
                {form.image_url && !imageFile && <img src={form.image_url} alt="" style={{ width: 80, height: 80, objectFit: 'cover', marginTop: '0.5rem', borderRadius: 'var(--radius)' }} />}
              </div>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 2000; display: flex; align-items: center; justify-content: center; padding: 1rem; }
        .modal { background: white; border-radius: var(--radius-lg); padding: 2rem; width: 100%; max-width: 560px; max-height: 90vh; overflow-y: auto; }
      `}</style>
    </div>
  );
}

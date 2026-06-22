import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function Login() {
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';

  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.email, form.password);
      toast.success('Welcome back!');
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card card card-body">
        <h1>Sign In</h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Welcome back to Stock Haven</p>

        {error && <div className="form-error" style={{ marginBottom: '1rem', padding: '0.75rem', background: '#f8d7da', borderRadius: 'var(--radius)' }}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required autoComplete="email" />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required autoComplete="current-password" />
          </div>
          <button className="btn btn-primary btn-full btn-lg" type="submit" disabled={loading} style={{ marginTop: '0.5rem' }}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '1.5rem', color: 'var(--text-muted)' }}>
          No account? <Link to="/register">Register here</Link>
        </p>
      </div>

      <style>{`
        .auth-page { min-height: calc(100vh - 70px); display: flex; align-items: center; justify-content: center; padding: 2rem 1rem; }
        .auth-card { width: 100%; max-width: 420px; }
        .auth-card h1 { font-size: 1.8rem; font-weight: 800; margin-bottom: 0.25rem; }
      `}</style>
    </div>
  );
}

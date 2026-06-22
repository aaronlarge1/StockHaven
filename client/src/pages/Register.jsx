import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function Register() {
  const { register } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirm) { setError('Passwords do not match'); return; }
    if (form.password.length < 8) { setError('Password must be at least 8 characters'); return; }
    setLoading(true);
    try {
      await register(form.name, form.email, form.password);
      toast.success('Account created! Welcome to Stock Haven.');
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.errors?.[0]?.msg || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const field = (key, label, type = 'text', placeholder = '') => (
    <div className="form-group">
      <label>{label}</label>
      <input type={type} value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} placeholder={placeholder} required />
    </div>
  );

  return (
    <div className="auth-page">
      <div className="auth-card card card-body">
        <h1>Create Account</h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Join Stock Haven today</p>

        {error && <div className="form-error" style={{ marginBottom: '1rem', padding: '0.75rem', background: '#f8d7da', borderRadius: 'var(--radius)' }}>{error}</div>}

        <form onSubmit={handleSubmit}>
          {field('name', 'Full Name', 'text', 'John Smith')}
          {field('email', 'Email', 'email', 'john@example.com')}
          {field('password', 'Password', 'password', 'Min. 8 characters')}
          {field('confirm', 'Confirm Password', 'password', 'Re-enter password')}
          <button className="btn btn-primary btn-full btn-lg" type="submit" disabled={loading} style={{ marginTop: '0.5rem' }}>
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '1.5rem', color: 'var(--text-muted)' }}>
          Already have an account? <Link to="/login">Sign in</Link>
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

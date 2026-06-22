import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { usePushNotifications } from '../hooks/usePushNotifications';
import api from '../api';

export default function Profile() {
  const { user, updateProfile } = useAuth();
  const toast = useToast();
  const { subscribed, subscribe, unsubscribe } = usePushNotifications();
  const [name, setName] = useState(user?.name || '');
  const [saving, setSaving] = useState(false);
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [pwSaving, setPwSaving] = useState(false);

  const handleProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateProfile({ name });
      toast.success('Profile updated');
    } catch { toast.error('Failed to update profile'); }
    finally { setSaving(false); }
  };

  const handlePassword = async (e) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirm) { toast.error('Passwords do not match'); return; }
    setPwSaving(true);
    try {
      await api.put('/auth/change-password', { currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
      toast.success('Password changed');
      setPwForm({ currentPassword: '', newPassword: '', confirm: '' });
    } catch (err) { toast.error(err.response?.data?.error || 'Failed to change password'); }
    finally { setPwSaving(false); }
  };

  return (
    <div className="container" style={{ padding: '2rem 1rem', maxWidth: 600 }}>
      <div className="page-header"><h1>My Profile</h1></div>

      {/* Profile Info */}
      <div className="card card-body" style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Account Details</h2>
        <form onSubmit={handleProfile}>
          <div className="form-group">
            <label>Full Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input value={user?.email} disabled style={{ background: '#f8f9fa', color: 'var(--text-muted)' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className={`badge ${user?.role === 'admin' ? 'badge-danger' : 'badge-info'}`}>
              {user?.role}
            </span>
            <button className="btn btn-primary" type="submit" disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>

      {/* Change Password */}
      <div className="card card-body" style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Change Password</h2>
        <form onSubmit={handlePassword}>
          <div className="form-group">
            <label>Current Password</label>
            <input type="password" value={pwForm.currentPassword} onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })} required />
          </div>
          <div className="form-group">
            <label>New Password</label>
            <input type="password" value={pwForm.newPassword} onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })} required minLength={8} />
          </div>
          <div className="form-group">
            <label>Confirm New Password</label>
            <input type="password" value={pwForm.confirm} onChange={(e) => setPwForm({ ...pwForm, confirm: e.target.value })} required />
          </div>
          <button className="btn btn-secondary" type="submit" disabled={pwSaving}>
            {pwSaving ? 'Changing...' : 'Change Password'}
          </button>
        </form>
      </div>

      {/* Push Notifications */}
      <div className="card card-body">
        <h2 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>Push Notifications</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>
          Get notified about new products, order updates, and special offers.
        </p>
        {subscribed ? (
          <button className="btn btn-outline" onClick={unsubscribe}>Disable Notifications</button>
        ) : (
          <button className="btn btn-primary" onClick={subscribe}>Enable Notifications</button>
        )}
      </div>
    </div>
  );
}

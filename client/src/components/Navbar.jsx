import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth();
  const { cartCount } = useCart();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setMenuOpen(false);
  };

  return (
    <nav className="navbar">
      <div className="nav-inner container">
        <Link to="/" className="nav-brand">Stock Haven</Link>

        <button className="nav-burger" onClick={() => setMenuOpen((o) => !o)} aria-label="Menu">
          <span /><span /><span />
        </button>

        <div className={`nav-links ${menuOpen ? 'open' : ''}`}>
          <NavLink to="/products" onClick={() => setMenuOpen(false)}>Shop</NavLink>
          {isAdmin && <NavLink to="/admin" onClick={() => setMenuOpen(false)}>Admin</NavLink>}
          {user ? (
            <>
              <NavLink to="/orders" onClick={() => setMenuOpen(false)}>Orders</NavLink>
              <NavLink to="/profile" onClick={() => setMenuOpen(false)}>Profile</NavLink>
              <button className="btn btn-ghost btn-sm" onClick={handleLogout}>Logout</button>
            </>
          ) : (
            <>
              <NavLink to="/login" onClick={() => setMenuOpen(false)}>Login</NavLink>
              <NavLink to="/register" onClick={() => setMenuOpen(false)}>Register</NavLink>
            </>
          )}
          {user && (
            <NavLink to="/cart" className="nav-cart" onClick={() => setMenuOpen(false)}>
              🛒 {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
            </NavLink>
          )}
        </div>
      </div>

      <style>{`
        .navbar { position: fixed; top: 0; left: 0; right: 0; z-index: 1000; background: var(--primary); box-shadow: 0 2px 8px rgba(0,0,0,0.2); }
        .nav-inner { display: flex; align-items: center; justify-content: space-between; height: 70px; }
        .nav-brand { color: white; font-size: 1.4rem; font-weight: 800; letter-spacing: -0.5px; text-decoration: none; }
        .nav-brand:hover { text-decoration: none; color: var(--accent); }
        .nav-links { display: flex; align-items: center; gap: 0.25rem; }
        .nav-links a { color: rgba(255,255,255,0.85); padding: 0.5rem 0.75rem; border-radius: var(--radius); font-weight: 500; text-decoration: none; transition: all var(--transition); }
        .nav-links a:hover, .nav-links a.active { color: white; background: rgba(255,255,255,0.12); text-decoration: none; }
        .nav-cart { position: relative; font-size: 1.2rem; }
        .cart-badge { position: absolute; top: -4px; right: -4px; background: var(--accent); color: white; font-size: 0.7rem; font-weight: 700; width: 18px; height: 18px; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
        .nav-burger { display: none; flex-direction: column; gap: 5px; background: none; padding: 6px; }
        .nav-burger span { display: block; width: 24px; height: 2px; background: white; border-radius: 2px; }
        @media (max-width: 768px) {
          .nav-burger { display: flex; }
          .nav-links { display: none; position: absolute; top: 70px; left: 0; right: 0; background: var(--primary); flex-direction: column; padding: 1rem; gap: 0.5rem; align-items: stretch; }
          .nav-links.open { display: flex; }
          .nav-links a { padding: 0.75rem 1rem; }
        }
      `}</style>
    </nav>
  );
}

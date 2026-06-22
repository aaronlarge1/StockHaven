import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import ProductCard from '../components/ProductCard';
import LoadingSpinner from '../components/LoadingSpinner';

export default function Home() {
  const [featured, setFeatured] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/products?limit=8')
      .then((res) => setFeatured(res.data.products))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      {/* Hero */}
      <section className="hero">
        <div className="container hero-inner">
          <div className="hero-text">
            <h1>Welcome to <span>Stock Haven</span></h1>
            <p>Discover premium products with fast delivery and unbeatable prices.</p>
            <Link to="/products" className="btn btn-primary btn-lg">Shop Now</Link>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="container" style={{ padding: '3rem 1rem' }}>
        <h2 style={{ marginBottom: '1.5rem', fontSize: '1.5rem', fontWeight: 700 }}>Featured Products</h2>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
            <LoadingSpinner />
          </div>
        ) : (
          <div className="grid grid-4">
            {featured.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
        <div style={{ textAlign: 'center', marginTop: '2.5rem' }}>
          <Link to="/products" className="btn btn-outline">View All Products</Link>
        </div>
      </section>

      {/* Features */}
      <section style={{ background: 'var(--primary)', color: 'white', padding: '3rem 1rem' }}>
        <div className="container grid grid-3" style={{ textAlign: 'center', gap: '2rem' }}>
          {[
            { icon: '🚀', title: 'Fast Delivery', desc: 'Same-day dispatch on orders before 2pm' },
            { icon: '🔒', title: 'Secure Payments', desc: 'Powered by Stripe — your data is safe' },
            { icon: '🔄', title: 'Easy Returns', desc: '30-day hassle-free return policy' },
          ].map((f) => (
            <div key={f.title}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>{f.icon}</div>
              <h3 style={{ marginBottom: '0.4rem' }}>{f.title}</h3>
              <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.9rem' }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <style>{`
        .hero { background: linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 100%); min-height: 480px; display: flex; align-items: center; }
        .hero-inner { padding: 4rem 1rem; }
        .hero-text h1 { font-size: 3rem; font-weight: 800; color: white; line-height: 1.15; margin-bottom: 1rem; }
        .hero-text h1 span { color: var(--accent); }
        .hero-text p { font-size: 1.15rem; color: rgba(255,255,255,0.8); margin-bottom: 2rem; max-width: 520px; }
        @media (max-width: 600px) { .hero-text h1 { font-size: 2rem; } }
      `}</style>
    </div>
  );
}

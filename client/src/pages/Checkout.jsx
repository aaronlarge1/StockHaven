import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import api from '../api';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import LoadingSpinner from '../components/LoadingSpinner';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

function CheckoutForm({ clientSecret, shipping, onSuccess }) {
  const stripe = useStripe();
  const elements = useElements();
  const toast = useToast();
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setProcessing(true);

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: window.location.origin + '/orders' },
      redirect: 'if_required',
    });

    if (error) {
      toast.error(error.message);
      setProcessing(false);
      return;
    }

    if (paymentIntent?.status === 'succeeded') {
      try {
        const res = await api.post('/orders/confirm', {
          payment_intent_id: paymentIntent.id,
          shipping_address: shipping,
        });
        onSuccess(res.data.orderId);
      } catch (err) {
        toast.error('Payment succeeded but order confirmation failed. Please contact support.');
      }
    }
    setProcessing(false);
  };

  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement />
      <button
        type="submit"
        className="btn btn-primary btn-full btn-lg"
        style={{ marginTop: '1.5rem' }}
        disabled={!stripe || processing}
      >
        {processing ? 'Processing...' : `Pay £${(clientSecret ? '' : '')}`}
      </button>
    </form>
  );
}

export default function Checkout() {
  const navigate = useNavigate();
  const { items, cartTotal, clearCart } = useCart();
  const toast = useToast();
  const [clientSecret, setClientSecret] = useState('');
  const [amount, setAmount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [shipping, setShipping] = useState({ name: '', address: '', city: '', postcode: '', country: 'GB' });

  useEffect(() => {
    if (items.length === 0) { navigate('/cart'); return; }
    api.post('/orders/create-payment-intent')
      .then((r) => { setClientSecret(r.data.clientSecret); setAmount(r.data.amount); })
      .catch((err) => { toast.error(err.response?.data?.error || 'Failed to initialise payment'); navigate('/cart'); })
      .finally(() => setLoading(false));
  }, []);

  const handleSuccess = async (orderId) => {
    await clearCart();
    toast.success('Order placed successfully!');
    navigate(`/orders`);
  };

  if (loading) return <LoadingSpinner fullPage />;
  if (!clientSecret) return null;

  return (
    <div className="container" style={{ padding: '2rem 1rem', maxWidth: 900 }}>
      <div className="page-header"><h1>Checkout</h1></div>

      <div className="checkout-grid">
        {/* Shipping */}
        <div>
          <h2 style={{ marginBottom: '1rem', fontSize: '1.2rem' }}>Shipping Details</h2>
          <div className="card card-body" style={{ marginBottom: '1.5rem' }}>
            {[
              { label: 'Full Name', key: 'name', placeholder: 'John Smith' },
              { label: 'Address', key: 'address', placeholder: '123 High Street' },
              { label: 'City', key: 'city', placeholder: 'London' },
              { label: 'Postcode', key: 'postcode', placeholder: 'SW1A 1AA' },
            ].map(({ label, key, placeholder }) => (
              <div className="form-group" key={key}>
                <label>{label}</label>
                <input
                  value={shipping[key]}
                  onChange={(e) => setShipping((s) => ({ ...s, [key]: e.target.value }))}
                  placeholder={placeholder}
                />
              </div>
            ))}
          </div>

          <h2 style={{ marginBottom: '1rem', fontSize: '1.2rem' }}>Payment</h2>
          <div className="card card-body">
            <Elements stripe={stripePromise} options={{ clientSecret }}>
              <CheckoutForm clientSecret={clientSecret} shipping={shipping} onSuccess={handleSuccess} />
            </Elements>
          </div>
        </div>

        {/* Summary */}
        <div className="card card-body" style={{ alignSelf: 'start' }}>
          <h3 style={{ marginBottom: '1rem' }}>Order Summary</h3>
          {items.map((i) => (
            <div key={i.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.6rem', fontSize: '0.9rem' }}>
              <span>{i.name} × {i.quantity}</span>
              <strong>£{(parseFloat(i.price) * i.quantity).toFixed(2)}</strong>
            </div>
          ))}
          <hr className="divider" />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '1.1rem' }}>
            <span>Total</span><span>£{cartTotal.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <style>{`
        .checkout-grid { display: grid; grid-template-columns: 1fr 320px; gap: 2rem; align-items: start; }
        @media (max-width: 768px) { .checkout-grid { grid-template-columns: 1fr; } }
      `}</style>
    </div>
  );
}

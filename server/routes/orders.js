const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const db = require('../db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// POST /api/orders/create-payment-intent
router.post('/create-payment-intent', authenticate, async (req, res) => {
  try {
    const cartResult = await db.query(
      `SELECT ci.quantity, p.price, p.stock_quantity, p.name
       FROM cart_items ci JOIN products p ON p.id = ci.product_id WHERE ci.user_id = $1`,
      [req.user.id]
    );

    if (cartResult.rows.length === 0) {
      return res.status(400).json({ error: 'Cart is empty' });
    }

    for (const item of cartResult.rows) {
      if (item.quantity > item.stock_quantity) {
        return res.status(400).json({ error: `Insufficient stock for ${item.name}` });
      }
    }

    const total = cartResult.rows.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const amountInCents = Math.round(total * 100);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: 'gbp',
      metadata: { user_id: req.user.id },
    });

    res.json({ clientSecret: paymentIntent.client_secret, amount: amountInCents });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create payment intent' });
  }
});

// POST /api/orders/confirm
router.post('/confirm', authenticate, async (req, res) => {
  const { payment_intent_id, shipping_address } = req.body;
  if (!payment_intent_id) return res.status(400).json({ error: 'payment_intent_id required' });

  const client = await db.pool.connect();
  try {
    const intent = await stripe.paymentIntents.retrieve(payment_intent_id);
    if (intent.status !== 'succeeded') {
      return res.status(400).json({ error: 'Payment not completed' });
    }

    const cartResult = await client.query(
      `SELECT ci.quantity, p.id AS product_id, p.price, p.stock_quantity, p.name
       FROM cart_items ci JOIN products p ON p.id = ci.product_id WHERE ci.user_id = $1`,
      [req.user.id]
    );

    if (cartResult.rows.length === 0) {
      return res.status(400).json({ error: 'Cart is empty' });
    }

    await client.query('BEGIN');

    const total = cartResult.rows.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const orderResult = await client.query(
      `INSERT INTO orders (user_id, status, total_amount, stripe_payment_intent_id, shipping_address)
       VALUES ($1, 'paid', $2, $3, $4) RETURNING id`,
      [req.user.id, total, payment_intent_id, JSON.stringify(shipping_address || {})]
    );
    const orderId = orderResult.rows[0].id;

    for (const item of cartResult.rows) {
      await client.query(
        'INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase) VALUES ($1, $2, $3, $4)',
        [orderId, item.product_id, item.quantity, item.price]
      );
      await client.query(
        'UPDATE products SET stock_quantity = stock_quantity - $1 WHERE id = $2',
        [item.quantity, item.product_id]
      );
    }

    await client.query('DELETE FROM cart_items WHERE user_id = $1', [req.user.id]);
    await client.query('COMMIT');

    res.status(201).json({ orderId, message: 'Order placed successfully' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Failed to confirm order' });
  } finally {
    client.release();
  }
});

// Stripe webhook
router.post('/webhook', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'payment_intent.payment_failed') {
    const intent = event.data.object;
    console.log('Payment failed:', intent.id);
  }

  res.json({ received: true });
});

// GET /api/orders — user's orders
router.get('/', authenticate, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT o.id, o.status, o.total_amount, o.created_at,
              json_agg(json_build_object('product_id', oi.product_id, 'name', p.name, 'quantity', oi.quantity, 'price', oi.price_at_purchase, 'image_url', p.image_url)) AS items
       FROM orders o
       JOIN order_items oi ON oi.order_id = o.id
       JOIN products p ON p.id = oi.product_id
       WHERE o.user_id = $1
       GROUP BY o.id ORDER BY o.created_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// GET /api/orders/:id
router.get('/:id', authenticate, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT o.id, o.status, o.total_amount, o.shipping_address, o.created_at,
              json_agg(json_build_object('product_id', oi.product_id, 'name', p.name, 'quantity', oi.quantity, 'price', oi.price_at_purchase, 'image_url', p.image_url)) AS items
       FROM orders o
       JOIN order_items oi ON oi.order_id = o.id
       JOIN products p ON p.id = oi.product_id
       WHERE o.id = $1 AND o.user_id = $2
       GROUP BY o.id`,
      [req.params.id, req.user.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Order not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

module.exports = router;

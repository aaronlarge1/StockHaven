const express = require('express');
const path = require('path');
const fs = require('fs');
const db = require('../db');
const { authenticate } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/admin');
const { upload } = require('../middleware/upload');

const router = express.Router();
router.use(authenticate, requireAdmin);

// ─── Products ────────────────────────────────────────────────────────────────

// GET /api/admin/products
router.get('/products', async (req, res) => {
  const { page = 1, limit = 20, search = '' } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);
  try {
    const params = search ? [`%${search}%`, parseInt(limit), offset] : [parseInt(limit), offset];
    const where = search ? 'WHERE name ILIKE $1 OR sku ILIKE $1' : '';
    const limitParam = search ? '$2' : '$1';
    const offsetParam = search ? '$3' : '$2';

    const countResult = await db.query(`SELECT COUNT(*) FROM products ${where}`, search ? [`%${search}%`] : []);
    const result = await db.query(
      `SELECT * FROM products ${where} ORDER BY created_at DESC LIMIT ${limitParam} OFFSET ${offsetParam}`,
      params
    );
    res.json({
      products: result.rows,
      total: parseInt(countResult.rows[0].count),
      page: parseInt(page),
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// POST /api/admin/products
router.post('/products', upload.single('image'), async (req, res) => {
  const { name, description, price, stock_quantity, category, sku } = req.body;
  if (!name || !price) return res.status(400).json({ error: 'name and price are required' });

  const image_url = req.file
    ? `/uploads/${req.file.filename}`
    : req.body.image_url || null;

  try {
    const result = await db.query(
      `INSERT INTO products (name, description, price, stock_quantity, image_url, category, sku)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [name, description, parseFloat(price), parseInt(stock_quantity) || 0, image_url, category, sku || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (req.file) fs.unlinkSync(req.file.path);
    if (err.code === '23505') return res.status(409).json({ error: 'SKU already exists' });
    res.status(500).json({ error: 'Failed to create product' });
  }
});

// PUT /api/admin/products/:id
router.put('/products/:id', upload.single('image'), async (req, res) => {
  const { name, description, price, stock_quantity, category, sku } = req.body;
  try {
    const existing = await db.query('SELECT image_url FROM products WHERE id = $1', [req.params.id]);
    if (!existing.rows[0]) return res.status(404).json({ error: 'Product not found' });

    let image_url = existing.rows[0].image_url;
    if (req.file) {
      if (image_url && image_url.startsWith('/uploads/')) {
        const oldPath = path.join(__dirname, '..', image_url);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      image_url = `/uploads/${req.file.filename}`;
    }

    const result = await db.query(
      `UPDATE products SET name=$1, description=$2, price=$3, stock_quantity=$4, image_url=$5, category=$6, sku=$7, updated_at=NOW()
       WHERE id=$8 RETURNING *`,
      [name, description, parseFloat(price), parseInt(stock_quantity), image_url, category, sku || null, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    if (req.file) fs.unlinkSync(req.file.path);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

// PATCH /api/admin/products/:id/stock — quick stock adjustment
router.patch('/products/:id/stock', async (req, res) => {
  const { adjustment } = req.body;
  if (adjustment === undefined) return res.status(400).json({ error: 'adjustment required' });

  try {
    const result = await db.query(
      `UPDATE products SET stock_quantity = GREATEST(0, stock_quantity + $1), updated_at=NOW()
       WHERE id = $2 RETURNING id, name, stock_quantity`,
      [parseInt(adjustment), req.params.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Product not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update stock' });
  }
});

// DELETE /api/admin/products/:id
router.delete('/products/:id', async (req, res) => {
  try {
    const result = await db.query('DELETE FROM products WHERE id = $1 RETURNING image_url', [req.params.id]);
    if (!result.rows[0]) return res.status(404).json({ error: 'Product not found' });

    const { image_url } = result.rows[0];
    if (image_url && image_url.startsWith('/uploads/')) {
      const filePath = path.join(__dirname, '..', image_url);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }
    res.json({ message: 'Product deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

// ─── Orders ──────────────────────────────────────────────────────────────────

// GET /api/admin/orders
router.get('/orders', async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);
  try {
    const params = [];
    let where = '';
    if (status) { params.push(status); where = `WHERE o.status = $${params.length}`; }
    params.push(parseInt(limit)); params.push(offset);

    const result = await db.query(
      `SELECT o.id, o.status, o.total_amount, o.created_at, u.name AS customer_name, u.email AS customer_email,
              json_agg(json_build_object('name', p.name, 'quantity', oi.quantity, 'price', oi.price_at_purchase)) AS items
       FROM orders o
       JOIN users u ON u.id = o.user_id
       JOIN order_items oi ON oi.order_id = o.id
       JOIN products p ON p.id = oi.product_id
       ${where}
       GROUP BY o.id, u.name, u.email
       ORDER BY o.created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// PATCH /api/admin/orders/:id/status
router.patch('/orders/:id/status', async (req, res) => {
  const { status } = req.body;
  const VALID = ['pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled'];
  if (!VALID.includes(status)) return res.status(400).json({ error: 'Invalid status' });

  try {
    const result = await db.query(
      'UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [status, req.params.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Order not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update order' });
  }
});

// ─── Dashboard stats ──────────────────────────────────────────────────────────

// GET /api/admin/stats
router.get('/stats', async (req, res) => {
  try {
    const [revenue, orders, customers, lowStock] = await Promise.all([
      db.query("SELECT COALESCE(SUM(total_amount), 0) AS total FROM orders WHERE status != 'cancelled'"),
      db.query('SELECT COUNT(*) AS total FROM orders'),
      db.query('SELECT COUNT(*) AS total FROM users WHERE role = \'customer\''),
      db.query('SELECT COUNT(*) AS total FROM products WHERE stock_quantity < 10'),
    ]);
    res.json({
      totalRevenue: parseFloat(revenue.rows[0].total),
      totalOrders: parseInt(orders.rows[0].total),
      totalCustomers: parseInt(customers.rows[0].total),
      lowStockCount: parseInt(lowStock.rows[0].total),
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// GET /api/admin/users
router.get('/users', async (req, res) => {
  try {
    const result = await db.query(
      'SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

module.exports = router;

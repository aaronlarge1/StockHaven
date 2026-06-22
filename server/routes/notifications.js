const express = require('express');
const webpush = require('web-push');
const db = require('../db');
const { authenticate } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/admin');

const router = express.Router();

if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    process.env.VAPID_EMAIL || 'mailto:admin@stockhaven.com',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

// GET /api/notifications/vapid-public-key
router.get('/vapid-public-key', (req, res) => {
  res.json({ publicKey: process.env.VAPID_PUBLIC_KEY || null });
});

// POST /api/notifications/subscribe
router.post('/subscribe', authenticate, async (req, res) => {
  const { endpoint, keys } = req.body;
  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    return res.status(400).json({ error: 'Invalid subscription object' });
  }

  try {
    await db.query(
      `INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id, endpoint) DO UPDATE SET p256dh = $3, auth = $4`,
      [req.user.id, endpoint, keys.p256dh, keys.auth]
    );
    res.status(201).json({ message: 'Subscribed to push notifications' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save subscription' });
  }
});

// DELETE /api/notifications/unsubscribe
router.delete('/unsubscribe', authenticate, async (req, res) => {
  try {
    await db.query('DELETE FROM push_subscriptions WHERE user_id = $1', [req.user.id]);
    res.json({ message: 'Unsubscribed' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to remove subscription' });
  }
});

// POST /api/notifications/send — admin only, broadcast push notification
router.post('/send', authenticate, requireAdmin, async (req, res) => {
  const { title, body, url = '/' } = req.body;
  if (!title || !body) return res.status(400).json({ error: 'title and body required' });

  try {
    const subs = await db.query('SELECT endpoint, p256dh, auth, user_id FROM push_subscriptions');
    const payload = JSON.stringify({ title, body, url });
    const results = { sent: 0, failed: 0 };

    await Promise.all(
      subs.rows.map(async (sub) => {
        try {
          await webpush.sendNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
            payload
          );
          results.sent++;
        } catch (err) {
          results.failed++;
          if (err.statusCode === 410) {
            await db.query('DELETE FROM push_subscriptions WHERE endpoint = $1', [sub.endpoint]);
          }
        }
      })
    );

    res.json(results);
  } catch (err) {
    res.status(500).json({ error: 'Failed to send notifications' });
  }
});

module.exports = router;

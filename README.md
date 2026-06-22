# Stock Haven

A full-stack Progressive Web App e-commerce store built with React (Vite) + Node/Express + PostgreSQL (Render), featuring Stripe payments, push notifications, and a complete admin panel.

## Features

- **Customer**: Register/login (JWT), browse products, search & filter, cart, Stripe checkout, order history, push notification opt-in
- **Admin**: Product CRUD with image upload, order management, inventory quick-adjust, broadcast push notifications, dashboard stats
- **PWA**: Installable, offline cache, service worker, Web App Manifest
- **Security**: Helmet, rate limiting, bcrypt passwords, input validation

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React 18, Vite, React Router 6, Stripe.js |
| Backend | Node.js, Express 4, pg (PostgreSQL) |
| Auth | JWT (jsonwebtoken) + bcryptjs |
| Payments | Stripe |
| Push | web-push (VAPID) |
| Uploads | Multer (disk) |
| DB | PostgreSQL (Render) |

## Setup

### 1. Clone & Install

```bash
# Server
cd server && npm install

# Client
cd ../client && npm install
```

### 2. Configure environment variables

**Server** — copy `server/.env.example` to `server/.env` and fill in:
- `DATABASE_URL` — your Render PostgreSQL connection string
- `JWT_SECRET` — a random secret (min 32 chars)
- `STRIPE_SECRET_KEY` — from Stripe dashboard
- `STRIPE_WEBHOOK_SECRET` — from Stripe webhook settings
- `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` — generate with: `npx web-push generate-vapid-keys`
- `CLIENT_URL` — your frontend URL

**Client** — copy `client/.env.example` to `client/.env`:
- `VITE_STRIPE_PUBLISHABLE_KEY` — your Stripe publishable key

### 3. Initialise the database

```bash
cd server
node scripts/initDb.js
```

### 4. Create an admin user

After registering a user, run this SQL on your PostgreSQL database:
```sql
UPDATE users SET role = 'admin' WHERE email = 'your@email.com';
```

### 5. Run locally

```bash
# Terminal 1 — API server
cd server && npm run dev

# Terminal 2 — React client
cd client && npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

## Deployment (Render)

1. Push this repo to GitHub
2. Create a **Web Service** for `server/` — build command: `npm install`, start command: `npm start`
3. Create a **Static Site** for `client/` — build command: `npm install && npm run build`, publish dir: `dist`
4. Create a **PostgreSQL** database on Render and copy the connection string to the server's environment variables
5. Run `node scripts/initDb.js` once via Render Shell to create tables

## PWA Icons

Place 192×192 and 512×512 PNG icons at `client/public/icons/icon-192.png` and `client/public/icons/icon-512.png`.

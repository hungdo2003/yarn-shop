# 🧶 YarnShop — Handmade Wool & Yarn E-Commerce

A full-stack web application for selling yarn, knitting accessories, and handmade wool products with custom order support.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite + Tailwind CSS + React Router v6 |
| Backend | Node.js + Express.js |
| Database | MySQL + Sequelize ORM |
| Auth | JWT + bcryptjs |
| File Upload | Multer |
| Charts | Recharts |

## Project Structure

```
yarn-shop/
├── backend/
│   └── src/
│       ├── config/      — DB connection + sync script
│       ├── models/      — Sequelize models + associations
│       ├── controllers/ — Business logic
│       ├── routes/      — Express routers
│       ├── middleware/  — Auth, role, upload
│       ├── utils/       — Helpers (slugify, paginate, generateCode)
│       └── app.js
├── frontend/
│   └── src/
│       ├── components/  — Navbar, Footer, ProductCard, etc.
│       ├── pages/       — All page components by role
│       ├── context/     — AuthContext, CartContext
│       ├── hooks/       — useFetch
│       ├── services/    — Axios API client
│       └── utils/       — Formatters
├── PROMPT.md            — AI prompt to regenerate this project
└── README.md
```

## Quick Start

### 1. Database Setup (MySQL)
```sql
CREATE DATABASE yarn_shop CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 2. Backend
```bash
cd backend
cp .env.example .env
# Edit .env with your DB credentials and a JWT secret
npm install
node src/config/syncDb.js    # Sync all tables
npm run dev                  # Starts on :5000
```

### 3. Seed roles
```sql
USE yarn_shop;
INSERT INTO Roles (name, description, createdAt, updatedAt) VALUES
  ('admin', 'System Administrator', NOW(), NOW()),
  ('customer', 'Regular Customer', NOW(), NOW()),
  ('staff', 'Sales Staff', NOW(), NOW()),
  ('manager', 'Store Manager', NOW(), NOW());
```

### 4. Frontend
```bash
cd frontend
npm install
npm run dev                  # Starts on :5173
```

Open http://localhost:5173

## Features

### Customer
- Browse and search products with filters (type, price, color, rating)
- Shopping cart with quantity management
- Checkout with COD / bank transfer / e-wallet payment
- Voucher/discount code at checkout
- Order tracking with status updates
- Product reviews (star rating + photos) for completed orders
- **Custom knit/crochet orders** — upload reference images, choose yarn color & size

### Staff
- Confirm and update order status
- Manage custom orders (review request → provide quote → track production)

### Manager
- Full product CRUD with image uploads
- Inventory management (stock import, adjustment, transaction history)
- Voucher/promo management (percentage, fixed, free shipping, flash sale)
- Revenue reports with charts (daily/monthly/yearly)
- Best-selling products and loyal customers analytics

### Admin
- User account management with role assignment
- All manager capabilities

## API Overview

Base URL: `http://localhost:5000/api`

| Group | Prefix |
|-------|--------|
| Auth | `/auth` |
| Users | `/users` |
| Categories | `/categories` |
| Products | `/products` |
| Cart | `/cart` |
| Orders | `/orders` |
| Reviews | `/reviews` |
| Vouchers | `/vouchers` |
| Custom Orders | `/custom-orders` |
| Inventory | `/inventory` |
| Reports | `/reports` |

See `PROMPT.md` for detailed endpoint documentation.

## Default Credentials (after seeding)

Register via `/register` — first user gets `customer` role by default.

To create an admin: insert directly into DB or update a user's `roleId` to 1.

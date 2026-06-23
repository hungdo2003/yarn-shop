# YarnShop — Full-Stack Web App Prompt

Use this prompt to regenerate or extend this project with an AI assistant.

---

## Project Overview

Build a full-stack e-commerce web application for selling yarn, knitting/crochet accessories, and handmade wool products.

**Tech Stack:**
- **Backend:** Node.js + Express + Sequelize ORM + MySQL
- **Frontend:** React 18 + Vite + Tailwind CSS + React Router v6 + Axios
- **Auth:** JWT (jsonwebtoken + bcryptjs)
- **File Upload:** Multer

---

## Business Domain

The system supports selling:
1. **Raw yarn** — Milk Cotton, 4-Ply Cotton, Acrylic, Velvet, etc.
2. **Knitting/crochet accessories** — needles, hooks, animal eyes, cotton stuffing
3. **Finished handmade products** — teddy bears, handbags, keychains, scarves, flowers
4. **Custom orders** — customers upload a reference image, choose yarn color/size, staff provides a quote

---

## Roles

| Role     | Permissions |
|----------|-------------|
| Guest    | Browse products, search, view details, register, login |
| Customer | Cart, checkout, orders, reviews, custom orders, profile |
| Staff    | Confirm/update orders, manage custom orders, advise customers |
| Manager  | Manage products/inventory/orders/vouchers, view reports |
| Admin    | All above + user/role management, system settings |

---

## Data Models

### Core Tables

```
User          id, fullName, email, password, phone, address, avatar, roleId, isActive, loyaltyPoints
Role          id, name (guest|customer|staff|manager|admin), description
Category      id, name, slug, type (raw_material|accessory|finished_product), description, image, parentId
Product       id, code, name, slug, categoryId, description, price, salePrice, color, size, weight, stock, sold, averageRating, reviewCount, thumbnailImage, status, isCustomizable
ProductImage  id, productId, imageUrl, sortOrder, isPrimary
Inventory     id, productId, quantity, reservedQuantity, minStockLevel, lastRestockedAt
InventoryTransaction  id, productId, type (import|export|adjustment|sale|return), quantity, quantityBefore, quantityAfter, referenceId, referenceType, note, performedBy
Cart          id, userId
CartItem      id, cartId, productId, quantity, price
Voucher       id, code, type (percentage|fixed|free_shipping|flash_sale), value, minOrderAmount, maxDiscountAmount, usageLimit, usedCount, startDate, endDate, isActive, createdBy
Order         id, orderCode, userId, status (pending|confirmed|preparing|shipping|completed|cancelled), shippingAddress, shippingName, shippingPhone, subtotal, shippingFee, discount, total, voucherId, note, confirmedBy, confirmedAt, cancelledReason
OrderDetail   id, orderId, productId, productName, productImage, quantity, unitPrice, totalPrice
Payment       id, orderId, method (cod|bank_transfer|e_wallet), status (unpaid|paid|refunded), amount, transactionId, paidAt, note
Shipment      id, orderId, trackingCode, carrier, status (pending|picked_up|in_transit|delivered|failed), estimatedDelivery, deliveredAt, note
Review        id, productId, userId, orderId, rating (1-5), comment, images (JSON), isApproved
CustomOrder   id, code, userId, description, yarnColor, size, status (submitted|reviewing|quoted|deposit_paid|in_production|completed|delivered|cancelled), quotedPrice, depositAmount, depositPaidAt, estimatedDays, staffNote, handledBy, completedAt
CustomOrderImage  id, customOrderId, imageUrl, sortOrder
Material      id, name, unit, stock, costPerUnit, description
MaterialUsage id, materialId, referenceId, referenceType (custom_order|production), quantityUsed, usedAt, note
```

---

## API Endpoints

### Auth
```
POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/me              [authenticated]
PUT    /api/auth/change-password [authenticated]
```

### Users (admin/manager)
```
GET    /api/users                [manager, admin]
GET    /api/users/:id            [manager, admin]
PUT    /api/users/profile        [authenticated]
PUT    /api/users/:id            [admin]
DELETE /api/users/:id            [admin]
```

### Categories
```
GET    /api/categories
POST   /api/categories           [manager, admin]
PUT    /api/categories/:id       [manager, admin]
DELETE /api/categories/:id       [manager, admin]
```

### Products
```
GET    /api/products             ?search, type, categoryId, color, minPrice, maxPrice, minRating, sortBy, page, limit
GET    /api/products/featured
GET    /api/products/:slug
POST   /api/products             [manager, admin] multipart/form-data with images[]
PUT    /api/products/:id         [manager, admin]
DELETE /api/products/:id         [manager, admin]
```

### Cart (customer only)
```
GET    /api/cart
POST   /api/cart/items           { productId, quantity }
PUT    /api/cart/items/:id       { quantity }
DELETE /api/cart/items/:id
DELETE /api/cart
```

### Orders
```
POST   /api/orders               [customer] { shippingAddress, shippingName, shippingPhone, paymentMethod, voucherCode, note }
GET    /api/orders/my            [customer]
GET    /api/orders/my/:id        [customer]
POST   /api/orders/my/:id/cancel [customer]
GET    /api/orders               [staff, manager, admin]
PUT    /api/orders/:id/status    [staff, manager, admin] { status, cancelledReason }
```

### Reviews
```
GET    /api/reviews/product/:productId
POST   /api/reviews              [customer] multipart with images[]
```

### Vouchers
```
POST   /api/vouchers/validate    { code, orderAmount }
GET    /api/vouchers             [manager, admin]
POST   /api/vouchers             [manager, admin]
PUT    /api/vouchers/:id         [manager, admin]
DELETE /api/vouchers/:id         [manager, admin]
```

### Custom Orders
```
POST   /api/custom-orders        [customer] multipart with images[]
GET    /api/custom-orders/my     [customer]
POST   /api/custom-orders/my/:id/confirm  [customer]
GET    /api/custom-orders        [staff, manager, admin]
GET    /api/custom-orders/:id
PUT    /api/custom-orders/:id/status  [staff, manager, admin]
```

### Inventory (manager, admin)
```
GET    /api/inventory
POST   /api/inventory/import     { productId, quantity, note }
POST   /api/inventory/adjust     { productId, newQuantity, note }
GET    /api/inventory/transactions
GET    /api/inventory/materials
POST   /api/inventory/materials
PUT    /api/inventory/materials/:id
```

### Reports (manager, admin)
```
GET    /api/reports/summary
GET    /api/reports/revenue      ?period (month|year), year, month
GET    /api/reports/best-selling
GET    /api/reports/loyal-customers
```

---

## Frontend Routes

| Path | Component | Access |
|------|-----------|--------|
| `/` | Home (featured products, categories) | Public |
| `/products` | ProductList (search, filter) | Public |
| `/products/:slug` | ProductDetail + Reviews | Public |
| `/login` | Login | Guest |
| `/register` | Register | Guest |
| `/cart` | Cart | Customer |
| `/checkout` | Checkout | Customer |
| `/orders` | Order history | Customer |
| `/orders/:id` | Order detail + cancel | Customer |
| `/custom-order` | Submit custom order form | Customer |
| `/profile` | Profile + change password | Authenticated |
| `/manager` | Dashboard with charts | Manager, Admin |
| `/manager/products` | Product CRUD | Manager, Admin |
| `/manager/orders` | Order management | Manager, Admin |
| `/manager/inventory` | Stock import/adjust | Manager, Admin |
| `/manager/vouchers` | Voucher CRUD | Manager, Admin |
| `/manager/reports` | Revenue/best-selling charts | Manager, Admin |
| `/staff` | Custom order management | Staff+ |
| `/admin/users` | User management | Admin |

---

## Key Business Rules

1. **Shipping fee:** Free for orders ≥ 500,000 VND, otherwise 30,000 VND
2. **Order flow:** pending → confirmed → preparing → shipping → completed
3. **Custom order flow:** submitted → reviewing → quoted → deposit_paid → in_production → completed → delivered
4. **Reviews:** Only customers with a completed order for that product can review
5. **Inventory:** Auto-deducted on order placement; InventoryTransaction logged for every change
6. **Vouchers:** Support percentage, fixed, free_shipping, flash_sale types with usage limits and date ranges
7. **Roles seeded:** ID 1=admin, 2=customer, 3=staff, 4=manager

---

## Setup Instructions

### Prerequisites
- Node.js 18+
- MySQL 8+

### Backend
```bash
cd backend
cp .env.example .env          # Fill in DB credentials and JWT secret
npm install
node src/config/syncDb.js     # Creates all tables
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Seed initial data (run in MySQL)
```sql
INSERT INTO Roles (name, description, createdAt, updatedAt) VALUES
  ('admin', 'System Administrator', NOW(), NOW()),
  ('customer', 'Regular Customer', NOW(), NOW()),
  ('staff', 'Sales Staff', NOW(), NOW()),
  ('manager', 'Store Manager', NOW(), NOW());

-- Create admin user (password: Admin@123)
INSERT INTO Users (fullName, email, password, roleId, isActive, loyaltyPoints, createdAt, updatedAt) VALUES
  ('Admin User', 'admin@yarnshop.com', '$2a$12$...bcrypt_hash...', 1, true, 0, NOW(), NOW());
```

---

## Extending the Project

### Add payment gateway integration
- Integrate VNPay or MoMo for `bank_transfer` and `e_wallet` payment methods
- Update `Payment.status` to `paid` via webhook callback

### Add email notifications
- Use Nodemailer to send order confirmation emails
- Send quote notifications for custom orders

### Add real-time features
- Use Socket.IO for real-time order status updates
- Live chat between staff and customers for custom orders

### Add image optimization
- Use Sharp to resize/compress uploaded images
- Store images in cloud storage (AWS S3 or Cloudinary)

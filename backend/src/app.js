require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const path = require('path');

const app = express();
const server = http.createServer(app);

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/users', require('./routes/user.routes'));
app.use('/api/products', require('./routes/product.routes'));
app.use('/api/categories', require('./routes/category.routes'));
app.use('/api/cart', require('./routes/cart.routes'));
app.use('/api/orders', require('./routes/order.routes'));
app.use('/api/reviews', require('./routes/review.routes'));
app.use('/api/vouchers', require('./routes/voucher.routes'));
app.use('/api/custom-orders', require('./routes/customOrder.routes'));
app.use('/api/inventory', require('./routes/inventory.routes'));
app.use('/api/reports', require('./routes/report.routes'));
app.use('/api/addresses', require('./routes/address.routes'));
app.use('/api/subscriptions', require('./routes/subscription.routes'));
app.use('/api/contact', require('./routes/contact.routes'));
app.use('/api/returns', require('./routes/return.routes'));
app.use('/api/banners', require('./routes/banner.routes'));
app.use('/api/content', require('./routes/content.routes'));
app.use('/api/logs', require('./routes/log.routes'));
app.use('/api/payment', require('./routes/payment.routes'));
app.use('/api/wallet', require('./routes/wallet.routes'));
app.use('/api/notifications', require('./routes/notification.routes'));
app.use('/api/chat', require('./routes/chat.routes'));
app.use('/api/wishlist', require('./routes/wishlist.routes'));
app.use('/api/loyalty', require('./routes/loyalty.routes'));
app.use('/api/campaigns', require('./routes/campaign.routes'));

app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: err.message || 'Internal server error' });
});

const initSocket = require('./socket');
initSocket(server);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.log(`Port ${PORT} in use — killing old process and retrying...`);
    const { execSync } = require('child_process');
    try {
      if (process.platform === 'win32') {
        execSync(`for /f "tokens=5" %a in ('netstat -ano ^| findstr :${PORT}') do taskkill /F /PID %a`, { shell: 'cmd.exe', stdio: 'ignore' });
      } else {
        execSync(`lsof -ti:${PORT} | xargs kill -9`, { stdio: 'ignore' });
      }
    } catch {}
    setTimeout(() => server.listen(PORT), 1000);
  } else {
    throw err;
  }
});

module.exports = { app, server };

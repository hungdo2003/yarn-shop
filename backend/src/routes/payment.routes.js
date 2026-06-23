const router = require('express').Router();
const ctrl = require('../controllers/payment.controller');
const { authenticate } = require('../middleware/auth.middleware');

// Webhook — no auth (called by PayOS servers)
router.post('/webhook', ctrl.handleWebhook);

// Authenticated routes
router.post('/create-link/:orderId', authenticate, ctrl.createPaymentLink);
router.post('/simulate-pay/:orderId', authenticate, ctrl.simulatePay);
router.get('/status/:orderId', authenticate, ctrl.getPaymentStatus);
router.post('/cancel-link/:orderId', authenticate, ctrl.cancelPaymentLink);

module.exports = router;

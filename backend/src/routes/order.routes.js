const router = require('express').Router();
const { placeOrder, getMyOrders, getOrderDetail, getAllOrders, updateStatus, cancelOrder } = require('../controllers/order.controller');
const { authenticate, optionalAuth } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');

// Guest checkout — no auth required
router.post('/guest', placeOrder);

// Authenticated customer routes
router.post('/', authenticate, authorize('customer'), placeOrder);
router.get('/my', authenticate, getMyOrders);
router.get('/my/:id', authenticate, getOrderDetail);
router.post('/my/:id/cancel', authenticate, authorize('customer'), cancelOrder);

// Staff/Manager/Admin — read access
router.get('/', authenticate, authorize('staff', 'admin'), getAllOrders);
router.get('/:id', authenticate, authorize('staff', 'admin'), getOrderDetail);
router.put('/:id/status', authenticate, authorize('staff', 'admin'), updateStatus);

module.exports = router;

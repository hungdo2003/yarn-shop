const router = require('express').Router();
const { create, getAll, getById, addProducts, removeProduct, restartEvent, closeEarly, getAvailableProducts, getNonEventDiscounts, terminateNonEventDiscount } = require('../controllers/saleEvent.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');

router.get('/', authenticate, authorize('admin'), getAll);
router.post('/', authenticate, authorize('admin'), create);
router.get('/available-products', authenticate, authorize('admin'), getAvailableProducts);
router.get('/non-event-discounts', authenticate, authorize('admin'), getNonEventDiscounts);
router.patch('/non-event-discounts/:productId/terminate', authenticate, authorize('admin'), terminateNonEventDiscount);
router.get('/:id', authenticate, authorize('admin'), getById);
router.post('/:id/products', authenticate, authorize('admin'), addProducts);
router.delete('/:id/products/:productId', authenticate, authorize('admin'), removeProduct);
router.post('/:id/restart', authenticate, authorize('admin'), restartEvent);
router.patch('/:id/close', authenticate, authorize('admin'), closeEarly);

module.exports = router;

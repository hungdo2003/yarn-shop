const router = require('express').Router();
const { create, getAll, getById, addProducts, removeProduct, remove, getAvailableProducts, getNonEventDiscounts, clearNonEventDiscount } = require('../controllers/saleEvent.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');

router.get('/', authenticate, authorize('admin'), getAll);
router.post('/', authenticate, authorize('admin'), create);
router.get('/available-products', authenticate, authorize('admin'), getAvailableProducts);
router.get('/non-event-discounts', authenticate, authorize('admin'), getNonEventDiscounts);
router.delete('/non-event-discounts/:productId', authenticate, authorize('admin'), clearNonEventDiscount);
router.get('/:id', authenticate, authorize('admin'), getById);
router.post('/:id/products', authenticate, authorize('admin'), addProducts);
router.delete('/:id/products/:productId', authenticate, authorize('admin'), removeProduct);
router.delete('/:id', authenticate, authorize('admin'), remove);

module.exports = router;

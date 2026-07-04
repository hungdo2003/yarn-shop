const router = require('express').Router();
const { submit, getMyOrders, getMyOrderById, getAll, getById, updateStatus, payCustomOrder, payRemainingCustomOrder } = require('../controllers/customOrder.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');
const { uploadCustomOrder } = require('../middleware/upload.middleware');

router.use(authenticate);
router.post('/', authorize('customer'), uploadCustomOrder.array('images', 5), submit);
router.get('/my', getMyOrders);
router.get('/my/:id', getMyOrderById);
router.post('/my/:id/pay', authorize('customer'), payCustomOrder);
router.post('/my/:id/pay-remaining', authorize('customer'), payRemainingCustomOrder);
router.get('/', authorize('staff', 'admin'), getAll);
router.get('/:id', getById);
router.put('/:id/status', authorize('staff', 'admin'), updateStatus);

module.exports = router;

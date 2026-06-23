const router = require('express').Router();
const { submit, getMyOrders, getMyOrderById, getAll, getById, updateStatus, payCustomOrder } = require('../controllers/customOrder.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');
const { uploadCustomOrder } = require('../middleware/upload.middleware');

router.use(authenticate);
router.post('/', authorize('customer'), uploadCustomOrder.array('images', 5), submit);
router.get('/my', getMyOrders);
router.get('/my/:id', getMyOrderById);
router.post('/my/:id/pay', authorize('customer'), payCustomOrder);
router.get('/', authorize('staff', 'manager', 'admin'), getAll);
router.get('/:id', getById);
router.put('/:id/status', authorize('staff', 'manager', 'admin'), updateStatus);

module.exports = router;

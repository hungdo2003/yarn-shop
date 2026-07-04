const router = require('express').Router();
const ctrl = require('../controllers/report.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');

router.use(authenticate, authorize('admin'));
router.get('/summary', ctrl.summary);
router.get('/revenue', ctrl.revenueReport);
router.get('/order-stats', ctrl.orderStats);
router.get('/category-breakdown', ctrl.categoryBreakdown);
router.get('/best-selling', ctrl.bestSellingProducts);
router.get('/loyal-customers', ctrl.loyalCustomers);
router.get('/slow-selling', ctrl.slowSellingProducts);
router.get('/profit', ctrl.profitReport);

module.exports = router;

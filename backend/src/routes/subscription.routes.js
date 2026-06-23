const router = require('express').Router();
const ctrl = require('../controllers/subscription.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');

router.post('/subscribe', ctrl.subscribe);
router.post('/unsubscribe', ctrl.unsubscribe);
router.get('/', authenticate, authorize('admin', 'manager'), ctrl.getAll);

module.exports = router;

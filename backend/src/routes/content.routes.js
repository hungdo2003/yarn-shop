const router = require('express').Router();
const ctrl = require('../controllers/content.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');

router.get('/', ctrl.getAll);
router.get('/:key', ctrl.get);
router.put('/:key', authenticate, authorize('admin', 'manager'), ctrl.upsert);

module.exports = router;

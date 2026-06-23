const router = require('express').Router();
const ctrl = require('../controllers/log.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');

router.get('/', authenticate, authorize('admin'), ctrl.getAll);

module.exports = router;

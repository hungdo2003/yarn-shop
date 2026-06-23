const router = require('express').Router();
const ctrl = require('../controllers/notification.controller');
const { authenticate } = require('../middleware/auth.middleware');

router.get('/', authenticate, ctrl.getNotifications);
router.put('/read-all', authenticate, ctrl.markAllRead);
router.put('/:id/read', authenticate, ctrl.markRead);

module.exports = router;

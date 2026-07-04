const router = require('express').Router();
const ctrl = require('../controllers/contact.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');

router.post('/', ctrl.submit);
router.get('/', authenticate, authorize('admin', 'staff'), ctrl.getAll);
router.get('/:id', authenticate, authorize('admin', 'staff'), ctrl.getById);
router.patch('/:id/reply', authenticate, authorize('admin', 'staff'), ctrl.reply);
router.delete('/:id', authenticate, authorize('admin'), ctrl.delete);

module.exports = router;

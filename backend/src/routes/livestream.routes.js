const router = require('express').Router();
const ctrl = require('../controllers/livestream.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');

router.get('/', ctrl.getAll);
router.get('/:id', ctrl.getById);
router.get('/:id/comments', ctrl.getComments);
router.post('/', authenticate, authorize('staff', 'admin'), ctrl.create);
router.put('/:id', authenticate, authorize('staff', 'admin'), ctrl.update);
router.patch('/:id/end', authenticate, authorize('staff', 'admin'), ctrl.end);

module.exports = router;

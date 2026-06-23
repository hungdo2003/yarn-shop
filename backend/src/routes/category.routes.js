const router = require('express').Router();
const { getAll, create, update, remove } = require('../controllers/category.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');

router.get('/', getAll);
router.post('/', authenticate, authorize('manager', 'admin'), create);
router.put('/:id', authenticate, authorize('manager', 'admin'), update);
router.delete('/:id', authenticate, authorize('manager', 'admin'), remove);

module.exports = router;

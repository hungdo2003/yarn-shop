const router = require('express').Router();
const { getAll, getById, remove } = require('../controllers/saleEvent.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

router.get('/', authenticate, authorize('admin'), getAll);
router.get('/:id', authenticate, authorize('admin'), getById);
router.delete('/:id', authenticate, authorize('admin'), remove);

module.exports = router;

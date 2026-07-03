const router = require('express').Router();
const { getAll, getBySlug, create, update, remove, getFeatured, getRelated } = require('../controllers/product.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');
const { uploadProduct } = require('../middleware/upload.middleware');

router.get('/', getAll);
router.get('/featured', getFeatured);
router.get('/:id/related', getRelated);
router.get('/:slug', getBySlug);
router.post('/', authenticate, authorize('manager', 'admin'), uploadProduct.array('images', 10), create);
router.put('/:id', authenticate, authorize('manager', 'admin'), uploadProduct.array('images', 10), update);
router.delete('/:id', authenticate, authorize('manager', 'admin'), remove);

module.exports = router;

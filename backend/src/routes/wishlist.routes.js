const router = require('express').Router();
const { getWishlist, toggleWishlist, checkWishlist, removeFromWishlist } = require('../controllers/wishlist.controller');
const { authenticate } = require('../middleware/auth.middleware');

router.use(authenticate);
router.get('/', getWishlist);
router.post('/toggle', toggleWishlist);
router.get('/check/:productId', checkWishlist);
router.delete('/:productId', removeFromWishlist);

module.exports = router;

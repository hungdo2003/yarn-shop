const router = require('express').Router();
const { canReview, createReview, getProductReviews } = require('../controllers/review.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');
const { uploadReview } = require('../middleware/upload.middleware');

router.get('/can-review/:productId', authenticate, canReview);
router.get('/product/:productId', getProductReviews);
router.post('/', authenticate, authorize('customer'), uploadReview.array('images', 5), createReview);

module.exports = router;

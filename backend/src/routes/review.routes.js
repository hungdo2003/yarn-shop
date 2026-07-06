const router = require('express').Router();
const { canReview, createReview, getProductReviews, adminGetReviews, adminToggleApprove, adminDeleteReview } = require('../controllers/review.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');
const { uploadReview } = require('../middleware/upload.middleware');

router.get('/admin', authenticate, authorize('admin'), adminGetReviews);
router.patch('/admin/:id/approve', authenticate, authorize('admin'), adminToggleApprove);
router.delete('/admin/:id', authenticate, authorize('admin'), adminDeleteReview);

router.get('/can-review/:productId', authenticate, canReview);
router.get('/product/:productId', getProductReviews);
router.post('/', authenticate, authorize('customer'), uploadReview.array('images', 5), createReview);

module.exports = router;

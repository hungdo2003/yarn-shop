const router = require('express').Router();
const { getLoyaltyInfo } = require('../controllers/loyalty.controller');
const { authenticate } = require('../middleware/auth.middleware');

router.use(authenticate);
router.get('/info', getLoyaltyInfo);

module.exports = router;

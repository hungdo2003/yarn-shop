const router = require('express').Router();
const ctrl = require('../controllers/wallet.controller');
const { authenticate } = require('../middleware/auth.middleware');

router.get('/', authenticate, ctrl.getWallet);
router.post('/topup', authenticate, ctrl.createTopup);
router.post('/topup/simulate/:topupId', authenticate, ctrl.simulateTopup);
router.get('/topup/status/:topupId', authenticate, ctrl.getTopupStatus);

module.exports = router;

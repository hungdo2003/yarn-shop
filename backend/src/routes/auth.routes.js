const router = require('express').Router();
const { sendOtp, verifyOtp, login, getMe, changePassword } = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth.middleware');

router.post('/register', sendOtp);
router.post('/verify-otp', verifyOtp);
router.post('/login', login);
router.get('/me', authenticate, getMe);
router.put('/change-password', authenticate, changePassword);

module.exports = router;

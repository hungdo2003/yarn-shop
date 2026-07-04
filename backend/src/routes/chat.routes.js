const router = require('express').Router();
const ctrl = require('../controllers/chat.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');

// AI chatbot — public, no auth required
router.post('/bot', ctrl.botEndpoint);

// Live chat — customer
router.get('/my', authenticate, authorize('customer'), ctrl.getOrCreateConversation);
router.post('/conversations/:id/messages', authenticate, ctrl.sendMessage);

// Live chat — staff
router.get('/conversations', authenticate, authorize('staff', 'admin'), ctrl.listConversations);
router.get('/conversations/:id/messages', authenticate, ctrl.getMessages);

module.exports = router;

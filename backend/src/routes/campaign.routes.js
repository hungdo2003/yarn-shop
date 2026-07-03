const router = require('express').Router();
const ctrl = require('../controllers/campaign.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');

// Public
router.get('/active', ctrl.getActive);
router.get('/:slug([a-z0-9-]+)', ctrl.getBySlug);

// Manager / Admin CRUD
router.use(authenticate, authorize('manager', 'admin'));
router.get('/', ctrl.getAll);
router.get('/:id(\\d+)', ctrl.getCampaignDetail);
router.post('/', ctrl.create);
router.put('/:id', ctrl.update);
router.delete('/:id', ctrl.remove);

module.exports = router;

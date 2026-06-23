const router = require('express').Router();
const ctrl = require('../controllers/address.controller');
const { authenticate } = require('../middleware/auth.middleware');

router.use(authenticate);
router.get('/', ctrl.getAll);
router.post('/', ctrl.create);
router.put('/:id', ctrl.update);
router.patch('/:id/default', ctrl.setDefault);
router.delete('/:id', ctrl.delete);

module.exports = router;

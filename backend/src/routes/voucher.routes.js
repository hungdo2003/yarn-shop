const router = require('express').Router();
const { getAll, validate, create, update, remove } = require('../controllers/voucher.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');

router.get('/public', async (req, res) => {
  const { Voucher } = require('../models');
  const { Op } = require('sequelize');
  const now = new Date();
  const vouchers = await Voucher.findAll({ where: { isActive: true, endDate: { [Op.gte]: now }, startDate: { [Op.lte]: now } }, order: [['createdAt', 'DESC']] });
  res.json(vouchers);
});
router.post('/validate', authenticate, validate);
router.get('/', authenticate, authorize('manager', 'admin'), getAll);
router.post('/', authenticate, authorize('manager', 'admin'), create);
router.put('/:id', authenticate, authorize('manager', 'admin'), update);
router.delete('/:id', authenticate, authorize('manager', 'admin'), remove);

module.exports = router;

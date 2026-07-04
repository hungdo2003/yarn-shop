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

router.get('/flash-sale', async (req, res) => {
  try {
    const { Voucher, Product, ProductImage, Category } = require('../models');
    const { Op } = require('sequelize');
    const now = new Date();

    const flashVouchers = await Voucher.findAll({
      where: { type: 'flash_sale', isActive: true, startDate: { [Op.lte]: now }, endDate: { [Op.gte]: now } },
      order: [['endDate', 'ASC']]
    });

    const saleProducts = await Product.findAll({
      where: { status: 'active', salePrice: { [Op.not]: null, [Op.gt]: 0 }, stock: { [Op.gt]: 0 } },
      include: [{ model: ProductImage, limit: 1 }, { model: Category, attributes: ['name'] }],
      order: [['sold', 'DESC']],
      limit: 20
    });

    const endDate = flashVouchers.length > 0 ? flashVouchers[0].endDate : null;
    res.json({ vouchers: flashVouchers, products: saleProducts, endDate });
  } catch (err) { res.status(500).json({ message: err.message }); }
});
router.post('/validate', authenticate, validate);
router.get('/', authenticate, authorize('admin'), getAll);
router.post('/', authenticate, authorize('admin'), create);
router.put('/:id', authenticate, authorize('admin'), update);
router.delete('/:id', authenticate, authorize('admin'), remove);

module.exports = router;

const router = require('express').Router();
const { getInventory, importStock, adjustStock, getTransactions, getMaterials, createMaterial, updateMaterial, getLowStockCount } = require('../controllers/inventory.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');

router.use(authenticate, authorize('admin'));
router.get('/low-stock-count', getLowStockCount);
router.get('/', getInventory);
router.post('/import', importStock);
router.post('/adjust', adjustStock);
router.get('/transactions', getTransactions);
router.get('/materials', getMaterials);
router.post('/materials', createMaterial);
router.put('/materials/:id', updateMaterial);

module.exports = router;

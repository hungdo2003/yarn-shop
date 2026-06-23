const router = require('express').Router();
const { getCart, addItem, updateItem, removeItem, clearCart } = require('../controllers/cart.controller');
const { authenticate } = require('../middleware/auth.middleware');

router.use(authenticate);
router.get('/', getCart);
router.post('/items', addItem);
router.put('/items/:id', updateItem);
router.delete('/items/:id', removeItem);
router.delete('/', clearCart);

module.exports = router;

const { Cart, CartItem, Product, ProductImage } = require('../models');

const getOrCreateCart = async (userId) => {
  const [cart] = await Cart.findOrCreate({ where: { userId } });
  return cart;
};

const getCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({
      where: { userId: req.user.id },
      include: [{
        model: CartItem,
        include: [{ model: Product, include: [{ model: ProductImage, limit: 1 }] }]
      }]
    });
    if (!cart) return res.json({ items: [], total: 0 });
    const total = cart.CartItems.reduce((s, i) => s + i.quantity * parseFloat(i.price), 0);
    res.json({ ...cart.toJSON(), total });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const addItem = async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;
    const product = await Product.findByPk(productId);
    if (!product || product.status !== 'active') return res.status(404).json({ message: 'Product not found' });
    if (product.stock < quantity) return res.status(400).json({ message: 'Insufficient stock' });
    const cart = await getOrCreateCart(req.user.id);
    const [item, created] = await CartItem.findOrCreate({
      where: { cartId: cart.id, productId },
      defaults: { quantity, price: product.salePrice || product.price }
    });
    if (!created) {
      const newQty = item.quantity + parseInt(quantity);
      if (product.stock < newQty) return res.status(400).json({ message: 'Insufficient stock' });
      await item.update({ quantity: newQty });
    }
    res.json(item);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const updateItem = async (req, res) => {
  try {
    const { quantity } = req.body;
    const item = await CartItem.findByPk(req.params.id);
    if (!item) return res.status(404).json({ message: 'Item not found' });
    const product = await Product.findByPk(item.productId);
    if (product.stock < quantity) return res.status(400).json({ message: 'Insufficient stock' });
    if (quantity <= 0) { await item.destroy(); return res.json({ message: 'Item removed' }); }
    await item.update({ quantity });
    res.json(item);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const removeItem = async (req, res) => {
  try {
    const item = await CartItem.findByPk(req.params.id);
    if (!item) return res.status(404).json({ message: 'Item not found' });
    await item.destroy();
    res.json({ message: 'Item removed' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const clearCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ where: { userId: req.user.id } });
    if (cart) await CartItem.destroy({ where: { cartId: cart.id } });
    res.json({ message: 'Cart cleared' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

module.exports = { getCart, addItem, updateItem, removeItem, clearCart };

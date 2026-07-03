const { Wishlist, Product, ProductImage, Category } = require('../models');

const getWishlist = async (req, res) => {
  try {
    const items = await Wishlist.findAll({
      where: { userId: req.user.id },
      include: [{
        model: Product,
        include: [
          { model: ProductImage, limit: 1 },
          { model: Category, attributes: ['name'] }
        ]
      }],
      order: [['createdAt', 'DESC']]
    });
    res.json(items);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const toggleWishlist = async (req, res) => {
  try {
    const { productId } = req.body;
    const product = await Product.findByPk(productId);
    if (!product) return res.status(404).json({ message: 'Sản phẩm không tồn tại' });

    const existing = await Wishlist.findOne({ where: { userId: req.user.id, productId } });
    if (existing) {
      await existing.destroy();
      return res.json({ wishlisted: false, message: 'Đã xóa khỏi danh sách yêu thích' });
    }
    await Wishlist.create({ userId: req.user.id, productId });
    res.json({ wishlisted: true, message: 'Đã thêm vào danh sách yêu thích' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const checkWishlist = async (req, res) => {
  try {
    const { productId } = req.params;
    const item = await Wishlist.findOne({ where: { userId: req.user.id, productId } });
    res.json({ wishlisted: !!item });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const removeFromWishlist = async (req, res) => {
  try {
    const { productId } = req.params;
    await Wishlist.destroy({ where: { userId: req.user.id, productId } });
    res.json({ wishlisted: false, message: 'Đã xóa khỏi danh sách yêu thích' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

module.exports = { getWishlist, toggleWishlist, checkWishlist, removeFromWishlist };

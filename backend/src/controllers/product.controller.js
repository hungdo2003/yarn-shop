const { Product, ProductImage, Category, Inventory, Review, User } = require('../models');
const { Op } = require('sequelize');
const { paginate, paginateResult, generateCode, slugify } = require('../utils/helpers');
const { fileUrl } = require('../middleware/upload.middleware');

const getAll = async (req, res) => {
  try {
    const { page, limit, offset } = paginate(req.query);
    const { search, categoryId, type, color, minPrice, maxPrice, minRating, status, sortBy, isNew, inStock } = req.query;
    const where = { status: status || 'active' };
    if (search) where.name = { [Op.iLike]: `%${search}%` };
    if (color) where.color = { [Op.iLike]: `%${color}%` };
    if (isNew === 'true') { const d = new Date(); d.setDate(d.getDate() - 30); where.createdAt = { [Op.gte]: d }; }
    if (inStock === 'true') where.stock = { [Op.gt]: 0 };
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price[Op.gte] = parseFloat(minPrice);
      if (maxPrice) where.price[Op.lte] = parseFloat(maxPrice);
    }
    if (minRating) where.averageRating = { [Op.gte]: parseFloat(minRating) };

    const include = [
      { model: Category, where: type ? { type } : undefined },
      { model: ProductImage, limit: 1, order: [['isPrimary', 'DESC']] }
    ];
    if (categoryId) include[0].where = { ...include[0].where, id: categoryId };

    const order = sortBy === 'price_asc' ? [['price', 'ASC']]
      : sortBy === 'price_desc' ? [['price', 'DESC']]
      : sortBy === 'rating' ? [['averageRating', 'DESC']]
      : sortBy === 'sold' ? [['sold', 'DESC']]
      : [['createdAt', 'DESC']];

    const { count, rows } = await Product.findAndCountAll({ where, include, limit, offset, order, distinct: true });
    res.json(paginateResult(count, rows, page, limit));
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const getBySlug = async (req, res) => {
  try {
    const product = await Product.findOne({
      where: { slug: req.params.slug },
      include: [
        Category,
        { model: ProductImage, order: [['sortOrder', 'ASC']] },
        { model: Review, include: [{ model: User, attributes: ['id', 'fullName', 'avatar'] }], limit: 10, order: [['createdAt', 'DESC']] }
      ]
    });
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const create = async (req, res) => {
  try {
    const { name, categoryId, description, price, salePrice, color, size, weight, stock, isCustomizable } = req.body;
    const code = generateCode('PRD');
    const slug = slugify(name) + '-' + Date.now();
    const product = await Product.create({ code, name, slug, categoryId, description, price, salePrice, color, size, weight, stock, isCustomizable });
    await Inventory.create({ productId: product.id, quantity: stock || 0 });
    if (req.files?.length) {
      const images = req.files.map((f, i) => ({
        productId: product.id, imageUrl: fileUrl(f),
        sortOrder: i, isPrimary: i === 0
      }));
      await ProductImage.bulkCreate(images);
      await product.update({ thumbnailImage: images[0].imageUrl });
    }
    res.status(201).json(product);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const update = async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    const { name, ...rest } = req.body;
    const updates = { ...rest };
    if (name) { updates.name = name; updates.slug = slugify(name) + '-' + product.id; }
    if (req.files?.length) {
      const images = req.files.map((f, i) => ({
        productId: product.id, imageUrl: fileUrl(f),
        sortOrder: i, isPrimary: i === 0
      }));
      await ProductImage.bulkCreate(images);
      if (!product.thumbnailImage) updates.thumbnailImage = images[0].imageUrl;
    }
    await product.update(updates);
    res.json(product);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const remove = async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    await product.update({ status: 'inactive' });
    res.json({ message: 'Product deactivated' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const getFeatured = async (req, res) => {
  try {
    const products = await Product.findAll({
      where: { status: 'active' },
      include: [{ model: ProductImage, limit: 1 }],
      order: [['sold', 'DESC']],
      limit: 8
    });
    res.json(products);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

module.exports = { getAll, getBySlug, create, update, remove, getFeatured };

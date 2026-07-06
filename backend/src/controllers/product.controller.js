const { Product, ProductImage, Category, Inventory, Review, User, sequelize } = require('../models');
const { Op } = require('sequelize');
const { paginate, paginateResult, generateCode, slugify } = require('../utils/helpers');
const { fileUrl } = require('../middleware/upload.middleware');
const { log } = require('./log.controller');

const getAll = async (req, res) => {
  try {
    const { page, limit, offset } = paginate(req.query);
    const { search, categoryId, type, color, minPrice, maxPrice, minRating, status, sortBy, isNew, inStock } = req.query;
    const where = {};
    if (!status || status === 'active') where.status = 'active';
    else if (status !== 'all') where.status = status;
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

    const colorVariants = await Product.findAll({
      where: { name: product.name, categoryId: product.categoryId, status: 'active' },
      attributes: ['id', 'slug', 'color', 'stock', 'thumbnailImage'],
      order: [['color', 'ASC']],
    });

    res.json({ ...product.toJSON(), colorVariants });
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
    await log(req.user?.id, req.user?.email, 'CREATE_PRODUCT', 'Product', product.id, { name, categoryId, price }, req);
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
    await log(req.user?.id, req.user?.email, 'UPDATE_PRODUCT', 'Product', product.id, { updatedFields: Object.keys(updates) }, req);
    res.json(product);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const remove = async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    await product.update({ status: 'inactive' });
    await log(req.user?.id, req.user?.email, 'DELETE_PRODUCT', 'Product', product.id, { name: product.name }, req);
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

const getRelated = async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id, { attributes: ['id', 'categoryId'] });
    if (!product) return res.status(404).json({ message: 'Product not found' });

    // Priority 1: same category
    let related = await Product.findAll({
      where: { status: 'active', categoryId: product.categoryId, id: { [Op.ne]: product.id } },
      include: [
        { model: ProductImage, limit: 1 },
        { model: Category, attributes: ['name'] }
      ],
      order: [['sold', 'DESC'], ['averageRating', 'DESC']],
      limit: 8
    });

    // Priority 2: fill with best-sellers if not enough
    if (related.length < 4) {
      const ids = [product.id, ...related.map(p => p.id)];
      const extras = await Product.findAll({
        where: { status: 'active', id: { [Op.notIn]: ids } },
        include: [
          { model: ProductImage, limit: 1 },
          { model: Category, attributes: ['name'] }
        ],
        order: [['sold', 'DESC']],
        limit: 8 - related.length
      });
      related = [...related, ...extras];
    }

    res.json(related);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const bulkDiscount = async (req, res) => {
  try {
    const { productIds, selectAll, categoryId, discountPct, saleStartDate, saleEndDate, removeDiscount } = req.body;

    const where = { status: 'active' };
    if (!selectAll && productIds?.length) where.id = { [Op.in]: productIds };
    if (selectAll && categoryId) where.categoryId = categoryId;

    const products = await Product.findAll({ where, attributes: ['id', 'price'] });
    if (!products.length) return res.status(404).json({ message: 'Không tìm thấy sản phẩm nào' });

    await Promise.all(products.map(p => {
      const upd = removeDiscount
        ? { salePrice: null, saleStartDate: null, saleEndDate: null }
        : {
            ...(discountPct ? { salePrice: Math.round(parseFloat(p.price) * (1 - discountPct / 100)) } : {}),
            saleStartDate: saleStartDate || null,
            saleEndDate: saleEndDate || null,
          };
      return p.update(upd);
    }));

    const action = removeDiscount ? 'Đã xóa giảm giá' : `Đã áp dụng giảm giá ${discountPct}%`;
    await log(req.user?.id, req.user?.email, 'BULK_DISCOUNT', 'Product', null,
      { count: products.length, discountPct, saleStartDate, saleEndDate, removeDiscount }, req);
    res.json({ message: `${action} cho ${products.length} sản phẩm`, updatedCount: products.length });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

module.exports = { getAll, getBySlug, create, update, remove, getFeatured, getRelated, bulkDiscount };

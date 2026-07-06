const { SaleEvent, User, Product, ProductImage, Category } = require('../models');
const { Op } = require('sequelize');
const { paginate, paginateResult } = require('../utils/helpers');
const { log } = require('./log.controller');

const create = async (req, res) => {
  try {
    const { name, discountPct, saleStartDate, saleEndDate } = req.body;
    if (!name?.trim()) return res.status(400).json({ message: 'Vui lòng đặt tên sự kiện' });
    if (!discountPct || discountPct < 1 || discountPct > 99)
      return res.status(400).json({ message: '% giảm giá phải từ 1 đến 99' });

    const event = await SaleEvent.create({
      name: name.trim(),
      discountPct: parseInt(discountPct),
      saleStartDate: saleStartDate || null,
      saleEndDate: saleEndDate || null,
      productCount: 0,
      createdBy: req.user?.id,
    });
    await log(req.user?.id, req.user?.email, 'CREATE_SALE_EVENT', 'SaleEvent', event.id, { name, discountPct }, req);
    res.status(201).json(event);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const getAll = async (req, res) => {
  try {
    const { page, limit, offset } = paginate(req.query);
    const { search } = req.query;
    const where = {};
    if (search) where.name = { [Op.iLike]: `%${search}%` };

    const { count, rows } = await SaleEvent.findAndCountAll({
      where,
      include: [{ model: User, as: 'creator', attributes: ['id', 'fullName', 'email'] }],
      order: [['createdAt', 'DESC']],
      limit,
      offset,
    });
    res.json(paginateResult(count, rows, page, limit));
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const getById = async (req, res) => {
  try {
    const event = await SaleEvent.findByPk(req.params.id, {
      include: [
        { model: User, as: 'creator', attributes: ['id', 'fullName', 'email'] },
        {
          model: Product, as: 'products',
          attributes: ['id', 'name', 'price', 'salePrice', 'saleStartDate', 'saleEndDate', 'status', 'thumbnailImage', 'averageRating', 'reviewCount'],
          include: [{ model: ProductImage, limit: 1, order: [['isPrimary', 'DESC']] }],
        },
      ],
    });
    if (!event) return res.status(404).json({ message: 'Không tìm thấy sự kiện' });
    res.json(event);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const addProducts = async (req, res) => {
  try {
    const event = await SaleEvent.findByPk(req.params.id);
    if (!event) return res.status(404).json({ message: 'Không tìm thấy sự kiện' });

    const { productIds, selectAll, categoryId } = req.body;

    const where = { status: 'active', saleEventId: null };
    if (!selectAll) {
      if (!productIds?.length) return res.status(400).json({ message: 'Chọn ít nhất 1 sản phẩm' });
      where.id = { [Op.in]: productIds };
    }
    if (selectAll && categoryId) where.categoryId = categoryId;

    const products = await Product.findAll({ where, attributes: ['id', 'price', 'saleEventId'] });

    const conflicts = selectAll ? [] :
      productIds.filter(id => !products.find(p => p.id === id));

    if (!products.length) return res.status(400).json({ message: 'Không có sản phẩm nào phù hợp (có thể đã trong sự kiện khác)' });

    await Promise.all(products.map(p => p.update({
      salePrice: Math.round(parseFloat(p.price) * (1 - event.discountPct / 100)),
      saleStartDate: event.saleStartDate || null,
      saleEndDate: event.saleEndDate || null,
      saleEventId: event.id,
    })));

    await event.update({ productCount: await Product.count({ where: { saleEventId: event.id } }) });

    await log(req.user?.id, req.user?.email, 'ADD_PRODUCTS_TO_EVENT', 'SaleEvent', event.id,
      { eventName: event.name, addedCount: products.length }, req);

    res.json({
      message: `Đã thêm ${products.length} sản phẩm vào sự kiện`,
      addedCount: products.length,
      skippedCount: conflicts.length,
    });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const removeProduct = async (req, res) => {
  try {
    const { id, productId } = req.params;
    const product = await Product.findOne({ where: { id: productId, saleEventId: id } });
    if (!product) return res.status(404).json({ message: 'Sản phẩm không thuộc sự kiện này' });

    await product.update({ salePrice: null, saleStartDate: null, saleEndDate: null, saleEventId: null });

    const event = await SaleEvent.findByPk(id);
    await event.update({ productCount: await Product.count({ where: { saleEventId: id } }) });

    res.json({ message: 'Đã xóa sản phẩm khỏi sự kiện' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const remove = async (req, res) => {
  try {
    const event = await SaleEvent.findByPk(req.params.id);
    if (!event) return res.status(404).json({ message: 'Không tìm thấy sự kiện' });

    await Product.update(
      { salePrice: null, saleStartDate: null, saleEndDate: null, saleEventId: null },
      { where: { saleEventId: event.id } }
    );
    await event.destroy();
    res.json({ message: 'Đã xóa sự kiện và hoàn tác giảm giá cho tất cả sản phẩm' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// Products available to add (not in any event)
const getAvailableProducts = async (req, res) => {
  try {
    const { page, limit, offset } = paginate(req.query);
    const { search, categoryId } = req.query;
    const where = { status: 'active', saleEventId: null };
    if (search) where.name = { [Op.iLike]: `%${search}%` };
    if (categoryId) where.categoryId = parseInt(categoryId);

    const { count, rows } = await Product.findAndCountAll({
      where,
      attributes: ['id', 'name', 'price', 'salePrice', 'thumbnailImage', 'averageRating', 'color'],
      include: [
        { model: Category, attributes: ['name'] },
        { model: ProductImage, limit: 1, order: [['isPrimary', 'DESC']] },
      ],
      order: [['name', 'ASC']],
      limit,
      offset,
      distinct: true,
    });
    res.json(paginateResult(count, rows, page, limit));
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// Products with manual discounts (no event)
const getNonEventDiscounts = async (req, res) => {
  try {
    const { page, limit, offset } = paginate(req.query);
    const { search } = req.query;
    const where = { salePrice: { [Op.ne]: null }, saleEventId: null };
    if (search) where.name = { [Op.iLike]: `%${search}%` };

    const { count, rows } = await Product.findAndCountAll({
      where,
      attributes: ['id', 'name', 'price', 'salePrice', 'saleStartDate', 'saleEndDate', 'status', 'thumbnailImage'],
      include: [{ model: ProductImage, limit: 1, order: [['isPrimary', 'DESC']] }],
      order: [['updatedAt', 'DESC']],
      limit, offset, distinct: true,
    });
    res.json(paginateResult(count, rows, page, limit));
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const clearNonEventDiscount = async (req, res) => {
  try {
    const product = await Product.findOne({ where: { id: req.params.productId, saleEventId: null } });
    if (!product) return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
    await product.update({ salePrice: null, saleStartDate: null, saleEndDate: null });
    res.json({ message: 'Đã xóa giảm giá' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

module.exports = { create, getAll, getById, addProducts, removeProduct, remove, getAvailableProducts, getNonEventDiscounts, clearNonEventDiscount };

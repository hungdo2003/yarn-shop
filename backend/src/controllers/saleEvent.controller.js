const { SaleEvent, SaleEventRun, SaleEventRunProduct, User, Product, ProductImage, Category } = require('../models');
const { Op } = require('sequelize');
const { paginate, paginateResult } = require('../utils/helpers');
const { log } = require('./log.controller');

const create = async (req, res) => {
  try {
    const { name, discountPct, saleStartDate, saleEndDate } = req.body;
    if (!name?.trim()) return res.status(400).json({ message: 'Vui lòng đặt tên sự kiện' });
    if (!discountPct || discountPct < 1 || discountPct > 99)
      return res.status(400).json({ message: '% giảm giá phải từ 1 đến 99' });
    if (!saleStartDate || !saleEndDate)
      return res.status(400).json({ message: 'Vui lòng chọn ngày bắt đầu và kết thúc' });

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
    const { status } = req.query;
    const where = {};
    const now = new Date();
    if (status === 'upcoming') where.saleStartDate = { [Op.gt]: now };
    else if (status === 'active') {
      where[Op.and] = [
        { [Op.or]: [{ saleStartDate: null }, { saleStartDate: { [Op.lte]: now } }] },
        { [Op.or]: [{ saleEndDate: null }, { saleEndDate: { [Op.gte]: now } }] },
      ];
    } else if (status === 'ended') {
      where.saleEndDate = { [Op.lt]: now };
    }

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
        {
          model: SaleEventRun, as: 'runs',
          include: [{ model: SaleEventRunProduct, as: 'runProducts', separate: true }],
          separate: true,
          order: [['createdAt', 'DESC']],
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

const restartEvent = async (req, res) => {
  try {
    const event = await SaleEvent.findByPk(req.params.id);
    if (!event) return res.status(404).json({ message: 'Không tìm thấy sự kiện' });

    const now = new Date();
    if (!event.saleEndDate || new Date(event.saleEndDate) > now)
      return res.status(400).json({ message: 'Sự kiện chưa kết thúc' });

    const { saleStartDate, saleEndDate } = req.body;

    // Snapshot current products
    const currentProducts = await Product.findAll({
      where: { saleEventId: event.id },
      attributes: ['id', 'name', 'price', 'salePrice', 'thumbnailImage'],
    });

    // Archive current run to history
    const run = await SaleEventRun.create({
      saleEventId: event.id,
      saleStartDate: event.saleStartDate,
      saleEndDate: event.saleEndDate,
      productCount: currentProducts.length,
      discountPct: event.discountPct,
    });

    if (currentProducts.length) {
      await SaleEventRunProduct.bulkCreate(currentProducts.map(p => ({
        runId: run.id,
        productId: p.id,
        name: p.name,
        price: p.price,
        salePrice: p.salePrice,
        thumbnailImage: p.thumbnailImage,
      })));
    }

    // Update event with new dates
    await event.update({
      saleStartDate: saleStartDate || null,
      saleEndDate: saleEndDate || null,
    });

    // Sync products' dates
    await Product.update(
      { saleStartDate: saleStartDate || null, saleEndDate: saleEndDate || null },
      { where: { saleEventId: event.id } }
    );

    await log(req.user?.id, req.user?.email, 'RESTART_SALE_EVENT', 'SaleEvent', event.id,
      { name: event.name, saleStartDate, saleEndDate }, req);

    res.json({ message: 'Đã khởi động lại sự kiện' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const closeEarly = async (req, res) => {
  try {
    const event = await SaleEvent.findByPk(req.params.id);
    if (!event) return res.status(404).json({ message: 'Không tìm thấy sự kiện' });
    const now = new Date();
    if (event.saleEndDate && new Date(event.saleEndDate) <= now)
      return res.status(400).json({ message: 'Sự kiện đã kết thúc' });
    await event.update({ saleEndDate: now });
    await log(req.user?.id, req.user?.email, 'CLOSE_SALE_EVENT_EARLY', 'SaleEvent', event.id, { name: event.name }, req);
    res.json({ message: 'Đã đóng sự kiện sớm' });
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
    const { search, status } = req.query;
    const now = new Date();
    const where = { salePrice: { [Op.ne]: null }, saleEventId: null };
    if (search) where.name = { [Op.iLike]: `%${search}%` };
    if (status === 'upcoming') {
      where.saleStartDate = { [Op.gt]: now };
      where.terminatedAt = null;
    } else if (status === 'active') {
      where[Op.and] = [
        { [Op.or]: [{ saleStartDate: null }, { saleStartDate: { [Op.lte]: now } }] },
        { saleEndDate: { [Op.gt]: now } },
        { terminatedAt: null },
      ];
    } else if (status === 'ended') {
      where[Op.or] = [
        { saleEndDate: { [Op.lte]: now } },
        { terminatedAt: { [Op.ne]: null } },
      ];
    }

    const { count, rows } = await Product.findAndCountAll({
      where,
      attributes: ['id', 'name', 'price', 'salePrice', 'saleStartDate', 'saleEndDate', 'terminatedAt', 'status', 'thumbnailImage'],
      include: [{ model: ProductImage, limit: 1, order: [['isPrimary', 'DESC']] }],
      order: [['updatedAt', 'DESC']],
      limit, offset, distinct: true,
    });
    res.json(paginateResult(count, rows, page, limit));
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const terminateNonEventDiscount = async (req, res) => {
  try {
    const product = await Product.findOne({
      where: { id: req.params.productId, saleEventId: null, salePrice: { [Op.ne]: null }, terminatedAt: null },
    });
    if (!product) return res.status(404).json({ message: 'Không tìm thấy hoặc đã chấm dứt' });
    const now = new Date();
    if (product.saleEndDate && new Date(product.saleEndDate) <= now)
      return res.status(400).json({ message: 'Giảm giá đã hết hạn tự nhiên' });
    await product.update({ terminatedAt: now });
    res.json({ message: 'Đã chấm dứt giảm giá' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

module.exports = { create, getAll, getById, addProducts, removeProduct, restartEvent, closeEarly, getAvailableProducts, getNonEventDiscounts, terminateNonEventDiscount };

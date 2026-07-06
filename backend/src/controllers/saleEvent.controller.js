const { SaleEvent, User, Product, ProductImage } = require('../models');
const { Op } = require('sequelize');
const { paginate, paginateResult } = require('../utils/helpers');

const getAll = async (req, res) => {
  try {
    const { page, limit, offset } = paginate(req.query);
    const { search, isRemoval } = req.query;
    const where = {};
    if (search) where.name = { [Op.iLike]: `%${search}%` };
    if (isRemoval !== undefined && isRemoval !== '') where.isRemoval = isRemoval === 'true';

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
      include: [{ model: User, as: 'creator', attributes: ['id', 'fullName', 'email'] }],
    });
    if (!event) return res.status(404).json({ message: 'Không tìm thấy sự kiện' });

    let products = [];
    if (!event.selectAll && event.productIds?.length) {
      products = await Product.findAll({
        where: { id: { [Op.in]: event.productIds } },
        attributes: ['id', 'name', 'price', 'salePrice', 'saleStartDate', 'saleEndDate', 'status', 'thumbnailImage'],
        include: [{ model: ProductImage, limit: 1, order: [['isPrimary', 'DESC']] }],
      });
    }

    res.json({ ...event.toJSON(), products });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const remove = async (req, res) => {
  try {
    const event = await SaleEvent.findByPk(req.params.id);
    if (!event) return res.status(404).json({ message: 'Không tìm thấy sự kiện' });
    await event.destroy();
    res.json({ message: 'Đã xóa sự kiện' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

module.exports = { getAll, getById, remove };

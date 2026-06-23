const { Op } = require('sequelize');
const { Review, Product, Order, OrderDetail, User, sequelize } = require('../models');
const { paginate, paginateResult } = require('../utils/helpers');
const { fileUrl } = require('../middleware/upload.middleware');

const canReview = async (req, res) => {
  try {
    if (!req.user) return res.json({ canReview: false });
    const { productId } = req.params;
    const order = await Order.findOne({
      where: { userId: req.user.id, status: { [Op.in]: ['delivered', 'completed'] } },
      include: [{ model: OrderDetail, where: { productId }, required: true }],
      order: [['createdAt', 'DESC']],
    });
    if (!order) return res.json({ canReview: false });
    const exists = await Review.findOne({ where: { productId, userId: req.user.id } });
    if (exists) return res.json({ canReview: false, alreadyReviewed: true, existingReview: exists });
    return res.json({ canReview: true, orderId: order.id });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const createReview = async (req, res) => {
  try {
    const { productId, orderId, rating, comment } = req.body;
    const order = await Order.findOne({
      where: { id: orderId, userId: req.user.id, status: { [Op.in]: ['delivered', 'completed'] } },
      include: [{ model: OrderDetail, where: { productId } }]
    });
    if (!order) return res.status(403).json({ message: 'Chỉ có thể đánh giá sản phẩm đã mua và đã giao' });
    const exists = await Review.findOne({ where: { productId, userId: req.user.id } });
    if (exists) return res.status(409).json({ message: 'Bạn đã đánh giá sản phẩm này rồi' });

    const images = req.files?.map(f => fileUrl(f)) || [];
    const review = await Review.create({
      productId, userId: req.user.id, orderId,
      rating: parseInt(rating), comment, images
    });

    // Update product aggregate rating
    const allReviews = await Review.findAll({ where: { productId } });
    const avg = allReviews.reduce((s, r) => s + r.rating, 0) / allReviews.length;
    await Product.update(
      { averageRating: avg.toFixed(2), reviewCount: allReviews.length },
      { where: { id: productId } }
    );

    // Return with user info
    const full = await Review.findByPk(review.id, {
      include: [{ model: User, attributes: ['id', 'fullName', 'avatar'] }]
    });
    res.status(201).json(full);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const getProductReviews = async (req, res) => {
  try {
    const { productId } = req.params;
    const { page, limit, offset } = paginate(req.query);
    const { rating } = req.query;
    const where = { productId, isApproved: true };
    if (rating) where.rating = parseInt(rating);

    const { count, rows } = await Review.findAndCountAll({
      where,
      include: [{ model: User, attributes: ['id', 'fullName', 'avatar'] }],
      order: [['createdAt', 'DESC']], limit, offset
    });

    // Rating distribution
    const dist = await Review.findAll({
      where: { productId, isApproved: true },
      attributes: ['rating', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
      group: ['rating'],
      raw: true,
    });
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    dist.forEach(d => { distribution[d.rating] = parseInt(d.count); });

    const total = Object.values(distribution).reduce((s, c) => s + c, 0);
    const avg = total > 0 ? dist.reduce((s, d) => s + d.rating * parseInt(d.count), 0) / total : 0;

    res.json({
      ...paginateResult(count, rows, page, limit),
      distribution,
      averageRating: parseFloat(avg.toFixed(1)),
      total,
    });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

module.exports = { canReview, createReview, getProductReviews };

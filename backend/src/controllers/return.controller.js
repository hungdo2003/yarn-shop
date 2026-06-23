const { ReturnRequest, Order, User } = require('../models');
const { Op } = require('sequelize');

const generateCode = () => 'RET' + Date.now().toString().slice(-8);

exports.create = async (req, res) => {
  const { orderId, type, reason, customerNote } = req.body;
  const order = await Order.findOne({ where: { id: orderId, userId: req.user.id } });
  if (!order) return res.status(404).json({ message: 'Order not found' });
  if (!['completed', 'shipping'].includes(order.status))
    return res.status(400).json({ message: 'Only completed or delivered orders can be returned' });
  const existing = await ReturnRequest.findOne({ where: { orderId, status: { [Op.ne]: 'rejected' } } });
  if (existing) return res.status(400).json({ message: 'A return request already exists for this order' });
  const images = req.files?.map(f => '/uploads/returns/' + f.filename) || [];
  const request = await ReturnRequest.create({ code: generateCode(), orderId, userId: req.user.id, type, reason, customerNote, images });
  res.status(201).json(request);
};

exports.getMyRequests = async (req, res) => {
  const { status } = req.query;
  const where = { userId: req.user.id };
  if (status) where.status = status;
  const requests = await ReturnRequest.findAll({
    where, include: [{ model: Order, attributes: ['orderCode', 'total', 'createdAt'] }],
    order: [['createdAt', 'DESC']]
  });
  res.json(requests);
};

exports.getAll = async (req, res) => {
  const { page = 1, limit = 20, status, type, search } = req.query;
  const where = {};
  if (status) where.status = status;
  if (type) where.type = type;
  const { count, rows } = await ReturnRequest.findAndCountAll({
    where,
    include: [
      { model: Order, attributes: ['orderCode', 'total'] },
      { model: User, attributes: ['fullName', 'email', 'phone'] }
    ],
    limit: parseInt(limit), offset: (parseInt(page) - 1) * parseInt(limit),
    order: [['createdAt', 'DESC']]
  });
  res.json({ total: count, page: parseInt(page), data: rows });
};

exports.update = async (req, res) => {
  const request = await ReturnRequest.findByPk(req.params.id);
  if (!request) return res.status(404).json({ message: 'Return request not found' });
  const { status, staffNote } = req.body;
  await request.update({ status, staffNote, handledBy: req.user.id, handledAt: new Date() });
  res.json(request);
};

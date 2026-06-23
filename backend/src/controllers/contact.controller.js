const { ContactMessage } = require('../models');
const { Op } = require('sequelize');

exports.submit = async (req, res) => {
  const { name, email, phone, subject, message } = req.body;
  if (!name || !email || !message) return res.status(400).json({ message: 'Name, email and message are required' });
  const msg = await ContactMessage.create({ name, email, phone, subject, message });
  res.status(201).json({ message: 'Your message has been sent. We will contact you shortly!', id: msg.id });
};

exports.getAll = async (req, res) => {
  const { page = 1, limit = 20, status, search } = req.query;
  const where = {};
  if (status) where.status = status;
  if (search) where[Op.or] = [
    { name: { [Op.iLike]: `%${search}%` } },
    { email: { [Op.iLike]: `%${search}%` } },
    { subject: { [Op.iLike]: `%${search}%` } }
  ];
  const { count, rows } = await ContactMessage.findAndCountAll({
    where, limit: parseInt(limit), offset: (parseInt(page) - 1) * parseInt(limit),
    order: [['createdAt', 'DESC']]
  });
  res.json({ total: count, page: parseInt(page), data: rows });
};

exports.getById = async (req, res) => {
  const msg = await ContactMessage.findByPk(req.params.id);
  if (!msg) return res.status(404).json({ message: 'Message not found' });
  if (msg.status === 'new') await msg.update({ status: 'read' });
  res.json(msg);
};

exports.reply = async (req, res) => {
  const msg = await ContactMessage.findByPk(req.params.id);
  if (!msg) return res.status(404).json({ message: 'Message not found' });
  await msg.update({ status: 'replied', replyNote: req.body.replyNote, repliedAt: new Date(), repliedBy: req.user.id });
  res.json({ message: 'Marked as replied', data: msg });
};

exports.delete = async (req, res) => {
  const msg = await ContactMessage.findByPk(req.params.id);
  if (!msg) return res.status(404).json({ message: 'Message not found' });
  await msg.destroy();
  res.json({ message: 'Deleted' });
};

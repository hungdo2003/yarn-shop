const { EmailSubscription } = require('../models');
const { Op } = require('sequelize');

exports.subscribe = async (req, res) => {
  const { email, name } = req.body;
  if (!email) return res.status(400).json({ message: 'Email is required' });
  const [sub, created] = await EmailSubscription.findOrCreate({
    where: { email: email.toLowerCase() },
    defaults: { name, isActive: true }
  });
  if (!created && !sub.isActive) {
    await sub.update({ isActive: true, name: name || sub.name });
    return res.json({ message: 'You have been re-subscribed successfully!' });
  }
  if (!created) return res.json({ message: 'You are already subscribed.' });
  res.status(201).json({ message: 'Subscribed successfully! Thank you for signing up.' });
};

exports.unsubscribe = async (req, res) => {
  const { email } = req.body;
  const sub = await EmailSubscription.findOne({ where: { email: email.toLowerCase() } });
  if (!sub) return res.status(404).json({ message: 'Email not found' });
  await sub.update({ isActive: false });
  res.json({ message: 'Unsubscribed successfully.' });
};

exports.getAll = async (req, res) => {
  const { page = 1, limit = 20, search, isActive } = req.query;
  const where = {};
  if (search) where.email = { [Op.iLike]: `%${search}%` };
  if (isActive !== undefined) where.isActive = isActive === 'true';
  const { count, rows } = await EmailSubscription.findAndCountAll({
    where, limit: parseInt(limit), offset: (parseInt(page) - 1) * parseInt(limit),
    order: [['subscribedAt', 'DESC']]
  });
  res.json({ total: count, page: parseInt(page), data: rows });
};

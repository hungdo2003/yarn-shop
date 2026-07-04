const { User, Role, Order } = require('../models');
const { Op } = require('sequelize');
const { paginate, paginateResult } = require('../utils/helpers');
const { getTier, NEXT_TIER } = require('../utils/membership');
const { log } = require('./log.controller');

const getAll = async (req, res) => {
  try {
    const { page, limit, offset } = paginate(req.query);
    const { search, roleId, isActive } = req.query;
    const where = {};
    if (search) where[Op.or] = [
      { fullName: { [Op.like]: `%${search}%` } },
      { email: { [Op.like]: `%${search}%` } }
    ];
    if (roleId) where.roleId = roleId;
    if (isActive !== undefined) where.isActive = isActive === 'true';
    const { count, rows } = await User.findAndCountAll({
      where, limit, offset, include: [Role],
      attributes: { exclude: ['password'] },
      order: [['createdAt', 'DESC']]
    });
    res.json(paginateResult(count, rows, page, limit));
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const getById = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      include: [Role], attributes: { exclude: ['password'] }
    });
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const updateProfile = async (req, res) => {
  try {
    const { fullName, phone, address } = req.body;
    const updates = { fullName, phone, address };
    if (req.file) updates.avatar = `/uploads/avatars/${req.file.filename}`;
    await req.user.update(updates);
    const { password: _, ...userData } = req.user.toJSON();
    res.json(userData);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const updateUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    const { fullName, phone, roleId, isActive } = req.body;
    await user.update({ fullName, phone, roleId, isActive });
    await log(req.user?.id, req.user?.email, 'UPDATE_USER', 'User', user.id, { targetEmail: user.email, roleId, isActive }, req);
    res.json(user);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const deleteUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    await user.update({ isActive: false });
    await log(req.user?.id, req.user?.email, 'DEACTIVATE_USER', 'User', user.id, { targetEmail: user.email }, req);
    res.json({ message: 'User deactivated' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const getMembership = async (req, res) => {
  try {
    const DONE = ['delivered', 'completed'];
    const total = await Order.sum('total', {
      where: { userId: req.user.id, status: { [Op.in]: DONE } }
    }) || 0;

    const tier = getTier(total);
    const next = NEXT_TIER[tier.name];
    const progress = next
      ? Math.min(100, Math.round(((total - tier.minSpent) / (next.minSpent - tier.minSpent)) * 100))
      : 100;

    res.json({
      totalSpent: total,
      tier: { name: tier.name, label: tier.label, color: tier.color, emoji: tier.emoji, minSpent: tier.minSpent },
      nextTier: next ? { name: next.name, label: next.label, minSpent: next.minSpent } : null,
      progress,
      remaining: next ? Math.max(0, next.minSpent - total) : 0,
    });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

module.exports = { getAll, getById, updateProfile, updateUser, deleteUser, getMembership };

const { SystemLog, User } = require('../models');
const { Op } = require('sequelize');

exports.getAll = async (req, res) => {
  const { page = 1, limit = 50, action, userId, status, from, to, resource } = req.query;
  const where = {};
  if (action) where.action = { [Op.iLike]: `%${action}%` };
  if (userId) where.userId = userId;
  if (status) where.status = status;
  if (resource) where.resource = { [Op.iLike]: `%${resource}%` };
  if (from || to) {
    where.createdAt = {};
    if (from) where.createdAt[Op.gte] = new Date(from);
    if (to) where.createdAt[Op.lte] = new Date(to);
  }
  const { count, rows } = await SystemLog.findAndCountAll({
    where,
    include: [{ model: User, attributes: ['fullName', 'email'], required: false }],
    limit: parseInt(limit), offset: (parseInt(page) - 1) * parseInt(limit),
    order: [['createdAt', 'DESC']]
  });
  res.json({ total: count, page: parseInt(page), data: rows });
};

exports.log = async (userId, userEmail, action, resource, resourceId, details, req, status = 'success') => {
  try {
    await SystemLog.create({
      userId, userEmail, action, resource, resourceId, details, status,
      ipAddress: req?.ip || req?.connection?.remoteAddress,
      userAgent: req?.headers?.['user-agent']
    });
  } catch {}
};

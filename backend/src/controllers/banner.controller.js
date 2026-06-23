const { Banner, User } = require('../models');
const { Op } = require('sequelize');

exports.getPublic = async (req, res) => {
  const now = new Date();
  const banners = await Banner.findAll({
    where: {
      isActive: true,
      [Op.or]: [{ startDate: null }, { startDate: { [Op.lte]: now } }],
      [Op.or]: [{ endDate: null }, { endDate: { [Op.gte]: now } }]
    },
    order: [['sortOrder', 'ASC'], ['createdAt', 'DESC']]
  });
  res.json(banners);
};

exports.getAll = async (req, res) => {
  const { position, isActive } = req.query;
  const where = {};
  if (position) where.position = position;
  if (isActive !== undefined) where.isActive = isActive === 'true';
  const banners = await Banner.findAll({ where, include: [{ model: User, as: 'creator', attributes: ['fullName'] }], order: [['sortOrder', 'ASC']] });
  res.json(banners);
};

exports.create = async (req, res) => {
  const imageUrl = req.file ? '/uploads/banners/' + req.file.filename : req.body.imageUrl;
  const banner = await Banner.create({ ...req.body, imageUrl, createdBy: req.user.id });
  res.status(201).json(banner);
};

exports.update = async (req, res) => {
  const banner = await Banner.findByPk(req.params.id);
  if (!banner) return res.status(404).json({ message: 'Banner not found' });
  if (req.file) req.body.imageUrl = '/uploads/banners/' + req.file.filename;
  await banner.update(req.body);
  res.json(banner);
};

exports.delete = async (req, res) => {
  const banner = await Banner.findByPk(req.params.id);
  if (!banner) return res.status(404).json({ message: 'Banner not found' });
  await banner.destroy();
  res.json({ message: 'Banner deleted' });
};

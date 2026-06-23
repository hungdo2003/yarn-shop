const { ShippingAddress } = require('../models');

exports.getAll = async (req, res) => {
  const addresses = await ShippingAddress.findAll({ where: { userId: req.user.id }, order: [['isDefault', 'DESC'], ['createdAt', 'DESC']] });
  res.json(addresses);
};

exports.create = async (req, res) => {
  const { fullName, phone, address, province, district, ward, isDefault } = req.body;
  if (isDefault) await ShippingAddress.update({ isDefault: false }, { where: { userId: req.user.id } });
  const newAddr = await ShippingAddress.create({ userId: req.user.id, fullName, phone, address, province, district, ward, isDefault: isDefault || false });
  res.status(201).json(newAddr);
};

exports.update = async (req, res) => {
  const addr = await ShippingAddress.findOne({ where: { id: req.params.id, userId: req.user.id } });
  if (!addr) return res.status(404).json({ message: 'Address not found' });
  if (req.body.isDefault) await ShippingAddress.update({ isDefault: false }, { where: { userId: req.user.id } });
  await addr.update(req.body);
  res.json(addr);
};

exports.setDefault = async (req, res) => {
  const addr = await ShippingAddress.findOne({ where: { id: req.params.id, userId: req.user.id } });
  if (!addr) return res.status(404).json({ message: 'Address not found' });
  await ShippingAddress.update({ isDefault: false }, { where: { userId: req.user.id } });
  await addr.update({ isDefault: true });
  res.json({ message: 'Default address updated' });
};

exports.delete = async (req, res) => {
  const addr = await ShippingAddress.findOne({ where: { id: req.params.id, userId: req.user.id } });
  if (!addr) return res.status(404).json({ message: 'Address not found' });
  await addr.destroy();
  res.json({ message: 'Address deleted' });
};

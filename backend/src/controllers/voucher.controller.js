const { Voucher } = require('../models');
const { paginate, paginateResult } = require('../utils/helpers');
const { Op } = require('sequelize');
const { log } = require('./log.controller');

const getAll = async (req, res) => {
  try {
    const { page, limit, offset } = paginate(req.query);
    const { count, rows } = await Voucher.findAndCountAll({ limit, offset, order: [['createdAt', 'DESC']] });
    res.json(paginateResult(count, rows, page, limit));
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const validate = async (req, res) => {
  try {
    const { code, orderAmount } = req.body;
    const voucher = await Voucher.findOne({ where: { code, isActive: true } });
    if (!voucher) return res.status(404).json({ message: 'Voucher not found' });
    if (new Date() > voucher.endDate) return res.status(400).json({ message: 'Voucher expired' });
    if (new Date() < voucher.startDate) return res.status(400).json({ message: 'Voucher not yet active' });
    if (voucher.usageLimit && voucher.usedCount >= voucher.usageLimit) return res.status(400).json({ message: 'Voucher usage limit reached' });
    if (parseFloat(orderAmount) < parseFloat(voucher.minOrderAmount)) return res.status(400).json({ message: `Minimum order amount is ${voucher.minOrderAmount}` });
    let discount = 0;
    if (voucher.type === 'percentage') discount = Math.min(parseFloat(orderAmount) * voucher.value / 100, voucher.maxDiscountAmount || Infinity);
    else if (voucher.type === 'fixed') discount = Math.min(voucher.value, parseFloat(orderAmount));
    else if (voucher.type === 'free_shipping') discount = 30000;
    res.json({ voucher, discount });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const create = async (req, res) => {
  try {
    const voucher = await Voucher.create({ ...req.body, createdBy: req.user.id });
    await log(req.user?.id, req.user?.email, 'CREATE_VOUCHER', 'Voucher', voucher.id, { code: voucher.code, type: voucher.type, value: voucher.value }, req);
    res.status(201).json(voucher);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const update = async (req, res) => {
  try {
    const v = await Voucher.findByPk(req.params.id);
    if (!v) return res.status(404).json({ message: 'Voucher not found' });
    await v.update(req.body);
    await log(req.user?.id, req.user?.email, 'UPDATE_VOUCHER', 'Voucher', v.id, { code: v.code }, req);
    res.json(v);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const remove = async (req, res) => {
  try {
    const v = await Voucher.findByPk(req.params.id);
    if (!v) return res.status(404).json({ message: 'Voucher not found' });
    await log(req.user?.id, req.user?.email, 'DELETE_VOUCHER', 'Voucher', v.id, { code: v.code }, req);
    await v.destroy();
    res.json({ message: 'Voucher deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

module.exports = { getAll, validate, create, update, remove };

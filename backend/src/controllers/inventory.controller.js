const { sequelize, Product, Inventory, InventoryTransaction, Material, MaterialUsage } = require('../models');
const { paginate, paginateResult } = require('../utils/helpers');
const { Op } = require('sequelize');

const getInventory = async (req, res) => {
  try {
    const { page, limit, offset } = paginate(req.query);
    const { lowStock, search } = req.query;

    const productWhere = {};
    if (search) productWhere.name = { [Op.iLike]: `%${search}%` };

    // Low-stock filter: quantity <= minStockLevel (column comparison via literal)
    const invWhere = lowStock === 'true'
      ? sequelize.where(
          sequelize.col('Inventory.quantity'),
          Op.lte,
          sequelize.col('Inventory.minStockLevel')
        )
      : {};

    const { count, rows } = await Product.findAndCountAll({
      where: productWhere,
      include: [{ model: Inventory, where: invWhere, required: true }],
      limit, offset, order: [['name', 'ASC']],
      distinct: true
    });
    res.json(paginateResult(count, rows, page, limit));
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const importStock = async (req, res) => {
  try {
    const { productId, quantity, note } = req.body;
    const inv = await Inventory.findOne({ where: { productId } });
    if (!inv) return res.status(404).json({ message: 'Inventory record not found' });
    const before = inv.quantity;
    const after = before + parseInt(quantity);
    await inv.update({ quantity: after, lastRestockedAt: new Date() });
    await Product.increment('stock', { by: quantity, where: { id: productId } });
    await InventoryTransaction.create({
      productId, type: 'import', quantity: parseInt(quantity),
      quantityBefore: before, quantityAfter: after,
      note, performedBy: req.user.id
    });
    res.json({ message: `Imported ${quantity} units`, newQuantity: after });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const adjustStock = async (req, res) => {
  try {
    const { productId, newQuantity, note } = req.body;
    const inv = await Inventory.findOne({ where: { productId } });
    if (!inv) return res.status(404).json({ message: 'Inventory not found' });
    const before = inv.quantity;
    const qty = parseInt(newQuantity);
    const diff = qty - before;
    await inv.update({ quantity: qty });
    await Product.update({ stock: qty }, { where: { id: productId } });
    await InventoryTransaction.create({
      productId, type: 'adjustment', quantity: diff,
      quantityBefore: before, quantityAfter: qty,
      note, performedBy: req.user.id
    });
    res.json({ message: 'Stock adjusted', newQuantity: qty });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const getTransactions = async (req, res) => {
  try {
    const { page, limit, offset } = paginate(req.query);
    const { productId, type } = req.query;
    const where = {};
    if (productId) where.productId = productId;
    if (type) where.type = type;
    const { count, rows } = await InventoryTransaction.findAndCountAll({
      where, limit, offset, order: [['createdAt', 'DESC']],
      include: [{ model: Product, attributes: ['id', 'name', 'code'] }]
    });
    res.json(paginateResult(count, rows, page, limit));
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const getMaterials = async (req, res) => {
  try {
    const materials = await Material.findAll({ order: [['name', 'ASC']] });
    res.json(materials);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const createMaterial = async (req, res) => {
  try {
    const mat = await Material.create(req.body);
    res.status(201).json(mat);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const updateMaterial = async (req, res) => {
  try {
    const mat = await Material.findByPk(req.params.id);
    if (!mat) return res.status(404).json({ message: 'Material not found' });
    await mat.update(req.body);
    res.json(mat);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

module.exports = { getInventory, importStock, adjustStock, getTransactions, getMaterials, createMaterial, updateMaterial };

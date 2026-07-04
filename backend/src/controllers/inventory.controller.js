const { sequelize, Product, Inventory, InventoryTransaction, Material, MaterialUsage, User, Role, Notification } = require('../models');
const { paginate, paginateResult } = require('../utils/helpers');
const { Op } = require('sequelize');
const { log } = require('./log.controller');

async function notifyManagersLowStock(productName, currentQty, minLevel) {
  try {
    const managers = await User.findAll({
      include: [{ model: Role, where: { name: { [Op.in]: ['admin'] } } }],
      attributes: ['id'],
    });
    await Notification.bulkCreate(managers.map(m => ({
      userId: m.id,
      type: 'system',
      title: '⚠️ Cảnh báo tồn kho thấp',
      message: `Sản phẩm "${productName}" còn ${currentQty} (ngưỡng tối thiểu: ${minLevel})`,
      data: { productName, currentQty, minLevel },
    })));
  } catch (e) { /* non-fatal */ }
}

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
    const product = await Product.findByPk(productId, { attributes: ['name'] });
    if (after <= inv.minStockLevel) {
      await notifyManagersLowStock(product?.name, after, inv.minStockLevel);
    }
    await log(req.user?.id, req.user?.email, 'IMPORT_STOCK', 'Product', productId, { productName: product?.name, quantity: parseInt(quantity), before, after, note }, req);
    res.json({ message: `Imported ${quantity} units`, newQuantity: after, lowStock: after <= inv.minStockLevel });
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
    const product = await Product.findByPk(productId, { attributes: ['name'] });
    if (qty <= inv.minStockLevel) {
      await notifyManagersLowStock(product?.name, qty, inv.minStockLevel);
    }
    await log(req.user?.id, req.user?.email, 'ADJUST_STOCK', 'Product', productId, { productName: product?.name, before, after: qty, diff, note }, req);
    res.json({ message: 'Stock adjusted', newQuantity: qty, lowStock: qty <= inv.minStockLevel });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const getTransactions = async (req, res) => {
  try {
    const { page, limit, offset } = paginate(req.query);
    const { productId, type, search } = req.query;
    const where = {};
    if (productId) where.productId = productId;
    if (type) where.type = type;
    const productWhere = search ? { name: { [Op.iLike]: `%${search}%` } } : {};
    const { count, rows } = await InventoryTransaction.findAndCountAll({
      where, limit, offset, order: [['createdAt', 'DESC']],
      include: [
        { model: Product, attributes: ['id', 'name', 'code'], where: Object.keys(productWhere).length ? productWhere : undefined, required: !!search },
        { model: User, as: 'performer', attributes: ['id', 'fullName', 'email'], required: false },
      ],
      distinct: true,
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

const getLowStockCount = async (req, res) => {
  try {
    const count = await Product.count({
      include: [{
        model: Inventory,
        where: sequelize.where(
          sequelize.col('Inventory.quantity'),
          Op.lte,
          sequelize.col('Inventory.minStockLevel')
        ),
        required: true,
      }],
      where: { status: 'active' },
    });
    res.json({ count });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

module.exports = { getInventory, importStock, adjustStock, getTransactions, getMaterials, createMaterial, updateMaterial, getLowStockCount };

const { Order, OrderDetail, Product, User, Category, sequelize } = require('../models');
const { Op } = require('sequelize');

const PAID_STATUSES = ['delivered', 'completed', 'shipping', 'preparing', 'confirmed'];
const DONE_STATUSES = ['delivered', 'completed'];

// ── Summary KPIs ─────────────────────────────────────────────────────────────
const summary = async (req, res) => {
  try {
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd   = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    const [
      totalRevenue, thisMonthRevenue, lastMonthRevenue,
      totalOrders, thisMonthOrders, lastMonthOrders,
      totalCustomers, newThisMonth,
      totalProducts, lowStock,
      cancelledOrders,
    ] = await Promise.all([
      Order.sum('total', { where: { status: { [Op.in]: DONE_STATUSES } } }),
      Order.sum('total', { where: { status: { [Op.in]: DONE_STATUSES }, createdAt: { [Op.gte]: thisMonthStart } } }),
      Order.sum('total', { where: { status: { [Op.in]: DONE_STATUSES }, createdAt: { [Op.between]: [lastMonthStart, lastMonthEnd] } } }),
      Order.count(),
      Order.count({ where: { createdAt: { [Op.gte]: thisMonthStart } } }),
      Order.count({ where: { createdAt: { [Op.between]: [lastMonthStart, lastMonthEnd] } } }),
      User.count({ include: [{ association: 'Role', where: { name: 'customer' } }] }).catch(() => User.count({ where: { roleId: 2 } })),
      User.count({ where: { createdAt: { [Op.gte]: thisMonthStart } } }),
      Product.count({ where: { status: 'active' } }),
      Product.count({ where: { status: 'active', stock: { [Op.lte]: 5, [Op.gt]: 0 } } }),
      Order.count({ where: { status: 'cancelled' } }),
    ]);

    const revTrend = lastMonthRevenue > 0
      ? (((thisMonthRevenue || 0) - lastMonthRevenue) / lastMonthRevenue * 100).toFixed(1)
      : null;
    const orderTrend = lastMonthOrders > 0
      ? (((thisMonthOrders || 0) - lastMonthOrders) / lastMonthOrders * 100).toFixed(1)
      : null;

    const doneOrders = await Order.count({ where: { status: { [Op.in]: DONE_STATUSES } } });
    const avgOrder = doneOrders > 0 ? (totalRevenue || 0) / doneOrders : 0;

    res.json({
      totalRevenue: totalRevenue || 0,
      thisMonthRevenue: thisMonthRevenue || 0,
      lastMonthRevenue: lastMonthRevenue || 0,
      revTrend: revTrend ? parseFloat(revTrend) : null,
      totalOrders,
      thisMonthOrders,
      orderTrend: orderTrend ? parseFloat(orderTrend) : null,
      totalCustomers,
      newThisMonth,
      totalProducts,
      lowStock,
      cancelledOrders,
      avgOrder: Math.round(avgOrder),
    });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// ── Revenue by period ─────────────────────────────────────────────────────────
const revenueReport = async (req, res) => {
  try {
    const { period = 'month', year = new Date().getFullYear() } = req.query;
    const formatMap = { day: 'YYYY-MM-DD', month: 'YYYY-MM', year: 'YYYY' };
    const dateFormat = formatMap[period] || 'YYYY-MM';

    const where = {
      status: { [Op.in]: DONE_STATUSES },
      createdAt: {
        [Op.gte]: new Date(`${year}-01-01`),
        [Op.lte]: new Date(`${year}-12-31T23:59:59`),
      },
    };

    const periodExpr = sequelize.fn('TO_CHAR', sequelize.col('"Order"."createdAt"'), dateFormat);
    const data = await Order.findAll({
      where,
      attributes: [
        [periodExpr, 'period'],
        [sequelize.fn('SUM', sequelize.col('total')), 'revenue'],
        [sequelize.fn('COUNT', sequelize.col('"Order"."id"')), 'orderCount'],
        [sequelize.fn('AVG', sequelize.col('total')), 'avgOrder'],
      ],
      group: [sequelize.fn('TO_CHAR', sequelize.col('"Order"."createdAt"'), dateFormat)],
      order: [[sequelize.literal('"period"'), 'ASC']],
      raw: true,
    });

    // Also get prev year for comparison
    const prevYear = parseInt(year) - 1;
    const prevData = await Order.findAll({
      where: {
        status: { [Op.in]: DONE_STATUSES },
        createdAt: {
          [Op.gte]: new Date(`${prevYear}-01-01`),
          [Op.lte]: new Date(`${prevYear}-12-31T23:59:59`),
        },
      },
      attributes: [
        [periodExpr, 'period'],
        [sequelize.fn('SUM', sequelize.col('total')), 'revenue'],
      ],
      group: [sequelize.fn('TO_CHAR', sequelize.col('"Order"."createdAt"'), dateFormat)],
      raw: true,
    });

    // Merge: replace YYYY with current year portion to align
    const prevMap = {};
    prevData.forEach(d => {
      const key = d.period.replace(`${prevYear}`, `${year}`);
      prevMap[key] = d.revenue;
    });
    const merged = data.map(d => ({
      ...d,
      revenue: parseFloat(d.revenue) || 0,
      orderCount: parseInt(d.orderCount) || 0,
      avgOrder: Math.round(parseFloat(d.avgOrder) || 0),
      prevRevenue: parseFloat(prevMap[d.period]) || 0,
    }));

    res.json(merged);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// ── Order status distribution ─────────────────────────────────────────────────
const orderStats = async (req, res) => {
  try {
    const rows = await Order.findAll({
      attributes: [
        'status',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
      ],
      group: ['status'],
      raw: true,
    });

    const labels = {
      pending_payment: 'Chờ thanh toán',
      paid: 'Đã thanh toán',
      confirmed: 'Đã xác nhận',
      preparing: 'Đang chuẩn bị',
      shipping: 'Đang giao',
      delivered: 'Đã giao',
      cancelled: 'Đã hủy',
      completed: 'Hoàn thành',
    };
    const colors = {
      pending_payment: '#f59e0b', paid: '#3b82f6', confirmed: '#6366f1',
      preparing: '#8b5cf6', shipping: '#06b6d4', delivered: '#10b981',
      cancelled: '#ef4444', completed: '#10b981',
    };
    res.json(rows.map(r => ({
      status: r.status,
      label: labels[r.status] || r.status,
      count: parseInt(r.count),
      color: colors[r.status] || '#94a3b8',
    })));
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// ── Category sales breakdown ──────────────────────────────────────────────────
const categoryBreakdown = async (req, res) => {
  try {
    const { year = new Date().getFullYear() } = req.query;
    const rows = await OrderDetail.findAll({
      attributes: [
        [sequelize.fn('SUM', sequelize.col('"OrderDetail"."totalPrice"')), 'revenue'],
        [sequelize.fn('SUM', sequelize.col('"OrderDetail"."quantity"')), 'unitsSold'],
      ],
      include: [
        {
          model: Product,
          attributes: [],
          include: [{ model: Category, attributes: ['id', 'name'] }],
        },
        {
          model: Order,
          attributes: [],
          where: {
            status: { [Op.in]: DONE_STATUSES },
            createdAt: {
              [Op.gte]: new Date(`${year}-01-01`),
              [Op.lte]: new Date(`${year}-12-31T23:59:59`),
            },
          },
        },
      ],
      group: ['"Product->Category"."id"', '"Product->Category"."name"'],
      raw: true,
    });

    const result = rows
      .filter(r => r['Product.Category.name'])
      .map(r => ({
        categoryId: r['Product.Category.id'],
        name: r['Product.Category.name'],
        revenue: parseFloat(r.revenue) || 0,
        unitsSold: parseInt(r.unitsSold) || 0,
      }))
      .sort((a, b) => b.revenue - a.revenue);

    res.json(result);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// ── Best selling products ─────────────────────────────────────────────────────
const bestSellingProducts = async (req, res) => {
  try {
    const { year = new Date().getFullYear(), limit = 10 } = req.query;
    const rows = await OrderDetail.findAll({
      attributes: [
        'productId',
        [sequelize.fn('SUM', sequelize.col('"OrderDetail"."quantity"')), 'unitsSold'],
        [sequelize.fn('SUM', sequelize.col('"OrderDetail"."totalPrice"')), 'revenue'],
      ],
      include: [
        { model: Product, attributes: ['id', 'name', 'thumbnailImage', 'price', 'salePrice'] },
        {
          model: Order,
          attributes: [],
          where: {
            status: { [Op.in]: DONE_STATUSES },
            createdAt: {
              [Op.gte]: new Date(`${year}-01-01`),
              [Op.lte]: new Date(`${year}-12-31T23:59:59`),
            },
          },
        },
      ],
      group: ['"OrderDetail"."productId"', '"Product"."id"'],
      order: [[sequelize.literal('"unitsSold"'), 'DESC']],
      limit: parseInt(limit),
    });

    res.json(rows.map(r => ({
      id: r.productId,
      name: r.Product?.name,
      thumbnailImage: r.Product?.thumbnailImage,
      price: r.Product?.salePrice || r.Product?.price,
      unitsSold: parseInt(r.dataValues.unitsSold) || 0,
      revenue: parseFloat(r.dataValues.revenue) || 0,
    })));
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// ── Loyal customers ───────────────────────────────────────────────────────────
const loyalCustomers = async (req, res) => {
  try {
    const { year = new Date().getFullYear(), limit = 10 } = req.query;
    const rows = await Order.findAll({
      where: {
        status: { [Op.in]: DONE_STATUSES },
        createdAt: {
          [Op.gte]: new Date(`${year}-01-01`),
          [Op.lte]: new Date(`${year}-12-31T23:59:59`),
        },
      },
      attributes: [
        'userId',
        [sequelize.fn('COUNT', sequelize.col('"Order"."id"')), 'totalOrders'],
        [sequelize.fn('SUM', sequelize.col('total')), 'totalSpent'],
      ],
      include: [{ model: User, attributes: ['id', 'fullName', 'email', 'loyaltyPoints'] }],
      group: ['"Order"."userId"', '"User"."id"'],
      order: [[sequelize.literal('"totalSpent"'), 'DESC']],
      limit: parseInt(limit),
    });

    res.json(rows.map(r => ({
      id: r.userId,
      fullName: r.User?.fullName,
      email: r.User?.email,
      loyaltyPoints: r.User?.loyaltyPoints,
      totalOrders: parseInt(r.dataValues.totalOrders) || 0,
      totalSpent: parseFloat(r.dataValues.totalSpent) || 0,
    })));
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// ── Slow-selling products ─────────────────────────────────────────────────────
const slowSellingProducts = async (req, res) => {
  try {
    const { days = 30, limit = 20 } = req.query;
    const since = new Date();
    since.setDate(since.getDate() - parseInt(days));

    const products = await Product.findAll({
      where: { status: 'active' },
      include: [{ model: Category, attributes: ['name'] }],
      attributes: ['id', 'name', 'thumbnailImage', 'price', 'salePrice', 'stock', 'sold', 'createdAt'],
    });

    const soldInPeriod = await OrderDetail.findAll({
      attributes: ['productId', [sequelize.fn('SUM', sequelize.col('"OrderDetail"."quantity"')), 'qty']],
      include: [{
        model: Order,
        attributes: [],
        where: { status: { [Op.in]: DONE_STATUSES }, createdAt: { [Op.gte]: since } },
      }],
      group: ['"OrderDetail"."productId"'],
      raw: true,
    });
    const soldMap = {};
    soldInPeriod.forEach(r => { soldMap[r.productId] = parseInt(r.qty) || 0; });

    const result = products
      .map(p => ({
        id: p.id, name: p.name,
        thumbnailImage: p.thumbnailImage,
        price: p.salePrice || p.price,
        stock: p.stock,
        totalSold: p.sold || 0,
        soldInPeriod: soldMap[p.id] || 0,
        category: p.Category?.name,
        daysOld: Math.floor((Date.now() - new Date(p.createdAt)) / 86400000),
      }))
      .sort((a, b) => a.soldInPeriod - b.soldInPeriod)
      .slice(0, parseInt(limit));

    res.json(result);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// ── Profit report ─────────────────────────────────────────────────────────────
const profitReport = async (req, res) => {
  try {
    const { year = new Date().getFullYear() } = req.query;

    const orders = await Order.findAll({
      where: {
        status: { [Op.in]: DONE_STATUSES },
        createdAt: {
          [Op.gte]: new Date(`${year}-01-01`),
          [Op.lte]: new Date(`${year}-12-31T23:59:59`),
        },
      },
      include: [{
        model: OrderDetail,
        include: [{ model: Product, attributes: ['price'] }],
      }],
      attributes: ['id', 'total', 'discount', 'shippingFee', 'createdAt'],
    });

    const monthlyMap = {};
    for (let m = 1; m <= 12; m++) {
      monthlyMap[String(m).padStart(2, '0')] = { revenue: 0, cogs: 0, shipping: 0, discounts: 0, profit: 0, orders: 0 };
    }

    orders.forEach(order => {
      const month = String(new Date(order.createdAt).getMonth() + 1).padStart(2, '0');
      const m = monthlyMap[month];
      const revenue = parseFloat(order.total) || 0;
      const shipping = parseFloat(order.shippingFee) || 0;
      const discount = parseFloat(order.discount) || 0;
      // Estimate COGS as 60% of product base price
      const cogs = (order.OrderDetails || []).reduce((sum, od) => {
        const basePrice = parseFloat(od.Product?.price || 0);
        return sum + basePrice * 0.6 * od.quantity;
      }, 0);

      m.revenue += revenue;
      m.shipping += shipping;
      m.discounts += discount;
      m.cogs += cogs;
      m.profit += (revenue - cogs);
      m.orders += 1;
    });

    const result = Object.entries(monthlyMap).map(([month, data]) => ({
      period: `${year}-${month}`,
      revenue: Math.round(data.revenue),
      cogs: Math.round(data.cogs),
      discounts: Math.round(data.discounts),
      profit: Math.round(data.profit),
      margin: data.revenue > 0 ? parseFloat(((data.profit / data.revenue) * 100).toFixed(1)) : 0,
      orders: data.orders,
    }));

    const totals = result.reduce((acc, r) => ({
      revenue: acc.revenue + r.revenue,
      cogs: acc.cogs + r.cogs,
      profit: acc.profit + r.profit,
      orders: acc.orders + r.orders,
    }), { revenue: 0, cogs: 0, profit: 0, orders: 0 });

    res.json({ monthly: result, totals: { ...totals, margin: totals.revenue > 0 ? parseFloat(((totals.profit / totals.revenue) * 100).toFixed(1)) : 0 } });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

module.exports = { summary, revenueReport, orderStats, categoryBreakdown, bestSellingProducts, loyalCustomers, slowSellingProducts, profitReport };

const { Campaign, CampaignProduct, CampaignVoucher, Product, ProductImage, Category, Voucher, sequelize } = require('../models');
const { Op } = require('sequelize');

// ── Public ────────────────────────────────────────────────────────────────────

const getActive = async (req, res) => {
  try {
    const now = new Date();
    const campaigns = await Campaign.findAll({
      where: {
        isActive: true,
        startDate: { [Op.lte]: now },
        endDate:   { [Op.gte]: now },
      },
      order: [['startDate', 'DESC']],
    });
    res.json(campaigns);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const getBySlug = async (req, res) => {
  try {
    const now = new Date();
    const campaign = await Campaign.findOne({
      where: { slug: req.params.slug, isActive: true },
    });
    if (!campaign) return res.status(404).json({ message: 'Campaign not found' });

    const [products, vouchers] = await Promise.all([
      Product.findAll({
        include: [
          { model: Campaign, where: { id: campaign.id }, attributes: [], through: { attributes: ['sortOrder'] } },
          { model: ProductImage, limit: 1, order: [['isPrimary', 'DESC']] },
          { model: Category, attributes: ['name'] },
        ],
        where: { status: 'active' },
        order: [[{ model: Campaign, as: 'Campaigns' }, CampaignProduct, 'sortOrder', 'ASC']],
      }),
      Voucher.findAll({
        include: [{ model: Campaign, where: { id: campaign.id }, attributes: [], through: { attributes: [] } }],
        where: { isActive: true, endDate: { [Op.gte]: now } },
      }),
    ]);

    const expired = campaign.endDate < now;
    res.json({ campaign, products, vouchers, expired });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// ── Admin / Manager CRUD ──────────────────────────────────────────────────────

const getAll = async (req, res) => {
  try {
    const campaigns = await Campaign.findAll({ order: [['startDate', 'DESC']] });
    res.json(campaigns);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const create = async (req, res) => {
  try {
    const { name, slug, description, theme, emoji, bannerImage, startDate, endDate, isActive, productIds, voucherIds } = req.body;
    const campaign = await Campaign.create({ name, slug, description, theme, emoji, bannerImage, startDate, endDate, isActive });
    if (productIds?.length) {
      await CampaignProduct.bulkCreate(productIds.map((id, i) => ({ campaignId: campaign.id, productId: id, sortOrder: i })));
    }
    if (voucherIds?.length) {
      await CampaignVoucher.bulkCreate(voucherIds.map(id => ({ campaignId: campaign.id, voucherId: id })));
    }
    res.status(201).json(campaign);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const update = async (req, res) => {
  try {
    const campaign = await Campaign.findByPk(req.params.id);
    if (!campaign) return res.status(404).json({ message: 'Campaign not found' });

    const { name, slug, description, theme, emoji, bannerImage, startDate, endDate, isActive, productIds, voucherIds } = req.body;
    await campaign.update({ name, slug, description, theme, emoji, bannerImage, startDate, endDate, isActive });

    if (productIds !== undefined) {
      await CampaignProduct.destroy({ where: { campaignId: campaign.id } });
      if (productIds.length) {
        await CampaignProduct.bulkCreate(productIds.map((id, i) => ({ campaignId: campaign.id, productId: id, sortOrder: i })));
      }
    }
    if (voucherIds !== undefined) {
      await CampaignVoucher.destroy({ where: { campaignId: campaign.id } });
      if (voucherIds.length) {
        await CampaignVoucher.bulkCreate(voucherIds.map(id => ({ campaignId: campaign.id, voucherId: id })));
      }
    }
    res.json(campaign);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const remove = async (req, res) => {
  try {
    const campaign = await Campaign.findByPk(req.params.id);
    if (!campaign) return res.status(404).json({ message: 'Campaign not found' });
    await CampaignProduct.destroy({ where: { campaignId: campaign.id } });
    await CampaignVoucher.destroy({ where: { campaignId: campaign.id } });
    await campaign.destroy();
    res.json({ message: 'Campaign deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const getCampaignDetail = async (req, res) => {
  try {
    const campaign = await Campaign.findByPk(req.params.id);
    if (!campaign) return res.status(404).json({ message: 'Campaign not found' });
    const [cpRows, cvRows] = await Promise.all([
      CampaignProduct.findAll({ where: { campaignId: campaign.id }, include: [{ model: Product, attributes: ['id', 'name', 'thumbnailImage'] }], order: [['sortOrder', 'ASC']] }),
      CampaignVoucher.findAll({ where: { campaignId: campaign.id }, include: [{ model: Voucher, attributes: ['id', 'code', 'type', 'value'] }] }),
    ]);
    res.json({
      ...campaign.toJSON(),
      products: cpRows.map(r => r.Product),
      vouchers: cvRows.map(r => r.Voucher),
    });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

module.exports = { getActive, getBySlug, getAll, create, update, remove, getCampaignDetail };

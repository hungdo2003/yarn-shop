const { User } = require('../models');
const { LOYALTY, calcMaxRedeemable } = require('../utils/loyalty');

const getLoyaltyInfo = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, { attributes: ['id', 'loyaltyPoints'] });
    const { orderTotal } = req.query;
    const points = user.loyaltyPoints || 0;
    const result = {
      points,
      earnRate: LOYALTY.EARN_RATE,
      redeemRate: LOYALTY.REDEEM_RATE,
      maxRedeemPct: LOYALTY.MAX_REDEEM_PCT,
    };
    if (orderTotal) {
      const total = parseFloat(orderTotal);
      result.maxRedeemable = calcMaxRedeemable(total, points);
      result.maxDiscount = result.maxRedeemable * LOYALTY.REDEEM_RATE;
    }
    res.json(result);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

module.exports = { getLoyaltyInfo };

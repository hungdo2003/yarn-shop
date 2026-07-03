// 1 point earned per EARN_RATE VND spent
// 1 point = REDEEM_RATE VND discount
// Max points usable = MAX_REDEEM_PCT % of order total
const LOYALTY = {
  EARN_RATE: 1000,
  REDEEM_RATE: 100,
  MAX_REDEEM_PCT: 20,
};

const calcPointsEarned = (amountPaid) => Math.floor(amountPaid / LOYALTY.EARN_RATE);

const calcMaxRedeemable = (orderTotal, userPoints) => {
  const maxByPct = Math.floor((orderTotal * LOYALTY.MAX_REDEEM_PCT) / (100 * LOYALTY.REDEEM_RATE));
  return Math.min(userPoints, maxByPct);
};

const calcPointsDiscount = (pointsToRedeem) => pointsToRedeem * LOYALTY.REDEEM_RATE;

module.exports = { LOYALTY, calcPointsEarned, calcMaxRedeemable, calcPointsDiscount };

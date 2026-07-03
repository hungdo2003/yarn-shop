const TIERS = [
  { name: 'VIP',    label: 'VIP',   minSpent: 20_000_000, color: '#7c3aed', emoji: '💎' },
  { name: 'gold',   label: 'Vàng',  minSpent:  5_000_000, color: '#f59e0b', emoji: '🥇' },
  { name: 'silver', label: 'Bạc',   minSpent:  1_000_000, color: '#94a3b8', emoji: '🥈' },
  { name: 'bronze', label: 'Đồng',  minSpent:          0, color: '#b45309', emoji: '🥉' },
];

const NEXT_TIER = {
  bronze: { name: 'silver', label: 'Bạc',  minSpent: 1_000_000 },
  silver: { name: 'gold',   label: 'Vàng', minSpent: 5_000_000 },
  gold:   { name: 'VIP',    label: 'VIP',  minSpent: 20_000_000 },
  VIP:    null,
};

function getTier(totalSpent) {
  return TIERS.find(t => totalSpent >= t.minSpent);
}

module.exports = { TIERS, NEXT_TIER, getTier };

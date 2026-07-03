const TIER_STYLES = {
  bronze: 'bg-amber-100 text-amber-800 border-amber-300',
  silver: 'bg-slate-100 text-slate-700 border-slate-300',
  gold:   'bg-yellow-100 text-yellow-800 border-yellow-400',
  VIP:    'bg-purple-100 text-purple-800 border-purple-400',
};

export default function TierBadge({ tier, size = 'sm' }) {
  if (!tier) return null;
  const style = TIER_STYLES[tier.name] || TIER_STYLES.bronze;
  const px = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm';
  return (
    <span className={`inline-flex items-center gap-1 font-bold rounded-full border ${px} ${style}`}>
      {tier.emoji} {tier.label}
    </span>
  );
}

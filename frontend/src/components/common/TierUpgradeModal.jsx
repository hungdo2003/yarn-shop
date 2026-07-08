import { useEffect, useState } from 'react';
import { useNotifications } from '../../context/NotificationContext';
import { formatCurrency } from '../../utils/formatters';

const TIER_COLOR = {
  bronze: 'from-amber-600 to-yellow-700',
  silver: 'from-slate-400 to-gray-500',
  gold:   'from-yellow-400 to-amber-500',
  VIP:    'from-violet-500 to-purple-700',
};

export default function TierUpgradeModal() {
  const { notifications, markRead } = useNotifications();
  const [pending, setPending] = useState(null);

  useEffect(() => {
    const upgrade = notifications.find(n => n.type === 'tier_upgrade' && !n.isRead);
    if (upgrade && !pending) setPending(upgrade);
  }, [notifications]);

  const close = async () => {
    if (pending) await markRead(pending.id);
    setPending(null);
  };

  if (!pending) return null;

  const { newTierEmoji = '🏆', newTierLabel = 'Mới', newTier, totalSpent } = pending.data || {};
  const gradient = TIER_COLOR[newTier] || 'from-rose-500 to-pink-600';

  return (
    <div className="fixed inset-0 bg-black/70 z-[200] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden">
        {/* Header gradient */}
        <div className={`bg-gradient-to-br ${gradient} px-8 pt-10 pb-8 text-center text-white`}>
          <div className="text-8xl mb-3 drop-shadow-lg">{newTierEmoji}</div>
          <p className="text-white/80 text-sm font-medium uppercase tracking-widest mb-1">Thăng hạng thành viên</p>
          <h2 className="text-3xl font-black">{newTierLabel}</h2>
        </div>

        {/* Body */}
        <div className="px-8 py-6 text-center">
          <p className="text-gray-600 text-sm leading-relaxed mb-2">
            Chúc mừng! Bạn đã đạt hạng <span className="font-bold text-gray-800">{newTierLabel}</span> với tổng chi tiêu
          </p>
          {totalSpent && (
            <p className="text-2xl font-black text-rose-500 mb-4">{formatCurrency(totalSpent)}</p>
          )}
          <p className="text-xs text-gray-400 mb-6">
            Hạng thành viên cao hơn mang lại nhiều ưu đãi độc quyền dành cho bạn.
          </p>
          <button
            onClick={close}
            className="w-full bg-rose-500 text-white py-3 rounded-xl font-bold text-base hover:bg-rose-600 active:scale-95 transition-all shadow-md"
          >
            Tuyệt vời! 🎊
          </button>
        </div>
      </div>
    </div>
  );
}

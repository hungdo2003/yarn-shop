import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiBell } from 'react-icons/fi';
import { useNotifications } from '../../context/NotificationContext';

const TYPE_ICON = {
  order_paid: '💳', order_status: '📦', order_cancelled: '❌',
  wallet_topup: '⬆️', wallet_payment: '💰', wallet_refund: '↩️', system: '🔔',
  tier_upgrade: '🏆',
  custom_order_quoted: '📋', custom_order_production: '🏭',
  custom_order_delivered: '🎁', custom_order_paid: '💳',
};

const TYPE_LINK = {
  order_paid: (data) => `/orders/${data?.orderId}`,
  order_status: (data) => data?.returnId ? '/returns' : `/orders/${data?.orderId}`,
  order_cancelled: (data) => data?.returnId ? '/returns' : `/orders/${data?.orderId}`,
  wallet_topup: () => '/wallet',
  wallet_payment: (data) => data?.orderId ? `/orders/${data.orderId}` : '/wallet',
  wallet_refund: () => '/wallet',
  system: (data) => data?.livestreamId ? `/livestream/${data.livestreamId}` : null,
  tier_upgrade: () => '/profile',
  custom_order_quoted: (data) => `/custom-orders/${data?.customOrderId}`,
  custom_order_production: (data) => `/custom-orders/${data?.customOrderId}`,
  custom_order_delivered: (data) => `/custom-orders/${data?.customOrderId}`,
  custom_order_paid: (data) => `/custom-orders/${data?.customOrderId}`,
};

// Staff version: navigate to staff-side pages
const STAFF_TYPE_LINK = {
  order_paid: () => '/staff/orders',
  custom_order_paid: () => '/staff/custom-orders',
};

export default function NotificationBell({ isStaff = false, light = false, openRight = false }) {
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();

  const fmtTime = (d) => {
    const diff = (Date.now() - new Date(d)) / 1000;
    if (diff < 60) return 'Vừa xong';
    if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
    return new Date(d).toLocaleDateString('vi-VN');
  };

  // Close on outside click
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleClick = async (n) => {
    if (!n.isRead) await markRead(n.id);
    const linkFn = isStaff ? (STAFF_TYPE_LINK[n.type] || TYPE_LINK[n.type]) : TYPE_LINK[n.type];
    const link = linkFn ? linkFn(n.data) : null;
    if (link) navigate(link);
    setOpen(false);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className={`relative p-2 rounded-lg transition ${light ? 'text-white/70 hover:text-white hover:bg-white/10' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'}`}
      >
        <FiBell size={18} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-0.5 leading-none">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className={`absolute ${openRight ? 'left-0' : 'right-0'} mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden`}>
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <span className="font-bold text-gray-800 text-sm">Thông báo</span>
            {unreadCount > 0 && (
              <button onClick={markAllRead} className="text-xs text-blue-500 hover:underline">Đọc tất cả</button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="py-10 text-center">
                <p className="text-3xl mb-2">🔔</p>
                <p className="text-gray-400 text-sm">Chưa có thông báo</p>
              </div>
            ) : (
              notifications.map(n => (
                <button
                  key={n.id}
                  onClick={() => handleClick(n)}
                  className={`w-full flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition text-left border-b border-gray-50 last:border-0 ${!n.isRead ? 'bg-blue-50/50' : ''}`}
                >
                  <span className="text-lg shrink-0 mt-0.5">{TYPE_ICON[n.type] || '🔔'}</span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm leading-snug ${!n.isRead ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`}>
                      {n.title}
                    </p>
                    {n.message && <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.message}</p>}
                    <p className="text-[11px] text-gray-300 mt-1">{fmtTime(n.createdAt)}</p>
                  </div>
                  {!n.isRead && <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0 mt-1.5" />}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

import { useEffect } from 'react';
import { FiAlertTriangle, FiInfo, FiX } from 'react-icons/fi';

const ConfirmModal = ({
  title,
  message,
  confirmLabel,
  cancelLabel,
  variant = 'danger',
  onConfirm,
  onCancel,
  loading = false,
}) => {
  const resolvedConfirmLabel = confirmLabel ?? 'Xác nhận';
  const resolvedCancelLabel = cancelLabel ?? 'Hủy';

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onCancel(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onCancel]);

  const icon = variant === 'danger'
    ? <FiAlertTriangle size={22} className="text-red-500" />
    : variant === 'warning'
      ? <FiAlertTriangle size={22} className="text-orange-500" />
      : <FiInfo size={22} className="text-blue-500" />;

  const confirmCls = variant === 'danger'
    ? 'bg-red-500 hover:bg-red-600 text-white'
    : variant === 'warning'
      ? 'bg-orange-500 hover:bg-orange-600 text-white'
      : 'bg-rose-500 hover:bg-rose-600 text-white';

  const iconBg = variant === 'danger' ? 'bg-red-50' : variant === 'warning' ? 'bg-orange-50' : 'bg-blue-50';

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onCancel} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-start gap-4 px-6 pt-6 pb-4">
          <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center shrink-0`}>
            {icon}
          </div>
          <div className="flex-1 min-w-0 pt-0.5">
            <h3 className="font-bold text-gray-800 text-base leading-snug">{title}</h3>
            {message && (
              <p className="text-sm text-gray-500 mt-1.5 leading-relaxed whitespace-pre-line">{message}</p>
            )}
          </div>
          <button
            onClick={onCancel}
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 shrink-0 transition-colors"
          >
            <FiX size={14} />
          </button>
        </div>

        {/* Actions */}
        <div className="flex gap-2.5 px-6 pb-5">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 transition-all disabled:opacity-50"
          >
            {resolvedCancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-95 disabled:opacity-60 ${confirmCls}`}
          >
            {loading ? 'Đang xử lý...' : resolvedConfirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;

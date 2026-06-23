import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import useFetch from '../hooks/useFetch';
import api from '../services/api';
import { formatCurrency, formatDate, CUSTOM_STATUS_LABEL, CUSTOM_STATUS_COLOR } from '../utils/formatters';
import Spinner from '../components/common/Spinner';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { FiChevronLeft, FiAlertCircle, FiCheckCircle } from 'react-icons/fi';

const STEPS = [
  { key: 'submitted',    label: 'Đã gửi',     icon: '📝' },
  { key: 'reviewing',   label: 'Đang xét',   icon: '🔍' },
  { key: 'quoted',      label: 'Báo giá',    icon: '💰' },
  { key: 'deposit_paid',label: 'Đã TT',      icon: '💳' },
  { key: 'in_production',label: 'Sản xuất',  icon: '🧶' },
  { key: 'completed',   label: 'Xong',       icon: '✅' },
  { key: 'delivered',   label: 'Đã giao',    icon: '🏠' },
];

export default function CustomOrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: order, loading, refetch } = useFetch(`/custom-orders/my/${id}`);
  const [paying, setPaying] = useState(false);

  const handlePay = async () => {
    const payAmount = parseFloat(order.depositAmount || order.quotedPrice || 0);
    const balance = parseFloat(user?.walletBalance || 0);
    if (balance < payAmount) {
      toast.error(`Số dư ví không đủ. Cần thêm ${formatCurrency(payAmount - balance)}`);
      return;
    }
    setPaying(true);
    try {
      await api.post(`/custom-orders/my/${order.id}/pay`);
      toast.success('Thanh toán thành công!');
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Thanh toán thất bại');
    } finally { setPaying(false); }
  };

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;
  if (!order) return <div className="text-center py-20 text-gray-500">Không tìm thấy đơn hàng</div>;

  const curIdx = STEPS.findIndex(s => s.key === order.status);
  const isCancelled = order.status === 'cancelled';
  const canPay = order.status === 'quoted' && parseFloat(order.quotedPrice || 0) > 0;
  const payAmount = parseFloat(order.depositAmount || order.quotedPrice || 0);
  const walletBalance = parseFloat(user?.walletBalance || 0);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <button onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-rose-500 text-sm hover:underline mb-6">
        <FiChevronLeft size={16} /> Đơn hàng của tôi
      </button>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Đơn #{order.code}</h1>
          <p className="text-gray-400 text-sm mt-0.5">{formatDate(order.createdAt)}</p>
        </div>
        <span className={`text-sm px-3 py-1 rounded-full font-semibold ${CUSTOM_STATUS_COLOR[order.status] || 'bg-gray-100 text-gray-600'}`}>
          {CUSTOM_STATUS_LABEL[order.status]}
        </span>
      </div>

      {/* Cancelled banner */}
      {isCancelled && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-5 flex items-center gap-3">
          <span className="text-2xl">❌</span>
          <p className="font-semibold text-red-700">Đơn hàng đã bị hủy</p>
        </div>
      )}

      {/* Progress stepper */}
      {!isCancelled && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-4 overflow-x-auto">
          <h3 className="font-semibold text-gray-700 mb-4 text-sm">Tiến trình đơn hàng</h3>
          <div className="flex items-start min-w-[500px]">
            {STEPS.map((step, i) => (
              <div key={step.key} className="flex items-center flex-1 min-w-0">
                <div className="flex flex-col items-center shrink-0">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-base font-bold transition-all
                    ${i < curIdx ? 'bg-rose-500 text-white' : i === curIdx ? 'bg-rose-500 text-white ring-4 ring-rose-100' : 'bg-gray-100 text-gray-400'}`}>
                    {i < curIdx ? '✓' : step.icon}
                  </div>
                  <p className={`text-[10px] mt-1.5 text-center leading-tight max-w-[52px] ${i <= curIdx ? 'text-rose-500 font-semibold' : 'text-gray-400'}`}>
                    {step.label}
                  </p>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`h-0.5 flex-1 mx-1 mt-[-18px] transition-all ${i < curIdx ? 'bg-rose-400' : 'bg-gray-200'}`} />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Request details */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-4 space-y-3 text-sm">
        <h3 className="font-semibold text-gray-800 mb-1">Chi tiết yêu cầu</h3>
        <p className="text-gray-600 leading-relaxed">{order.description}</p>
        {order.yarnColor && (
          <div className="flex gap-2"><span className="text-gray-400 w-28 shrink-0">Màu len</span><span className="font-medium text-gray-800">{order.yarnColor}</span></div>
        )}
        {order.size && (
          <div className="flex gap-2"><span className="text-gray-400 w-28 shrink-0">Kích thước</span><span className="font-medium text-gray-800">{order.size}</span></div>
        )}
        {order.CustomOrderImages?.length > 0 && (
          <div>
            <p className="text-gray-400 mb-2">Hình ảnh đính kèm</p>
            <div className="flex gap-2 flex-wrap">
              {order.CustomOrderImages.map((img, i) => (
                <img key={i} src={img.imageUrl} alt="" className="w-20 h-20 object-cover rounded-xl border border-gray-100" />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Quote & payment */}
      {order.quotedPrice && (
        <div className={`rounded-2xl border p-5 mb-4 ${canPay ? 'bg-amber-50 border-amber-200' : 'bg-purple-50 border-purple-100'}`}>
          <h3 className={`font-semibold mb-3 ${canPay ? 'text-amber-700' : 'text-purple-700'}`}>
            {canPay ? '⏳ Chờ thanh toán' : '✅ Đã thanh toán'}
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Giá báo</span>
              <span className="text-xl font-bold text-purple-700">{formatCurrency(order.quotedPrice)}</span>
            </div>
            {order.depositAmount && parseFloat(order.depositAmount) !== parseFloat(order.quotedPrice) && (
              <div className="flex justify-between">
                <span className="text-gray-500">Thanh toán ngay</span>
                <span className="font-semibold text-amber-700">{formatCurrency(order.depositAmount)}</span>
              </div>
            )}
            {order.estimatedDays && (
              <div className="flex justify-between">
                <span className="text-gray-500">Thời gian dự kiến</span>
                <span className="text-gray-700">{order.estimatedDays} ngày</span>
              </div>
            )}
            {order.depositPaidAt && (
              <div className="flex justify-between">
                <span className="text-gray-500">Ngày thanh toán</span>
                <span className="text-gray-700">{formatDate(order.depositPaidAt)}</span>
              </div>
            )}
          </div>

          {canPay && (
            <div className="mt-4 space-y-2">
              <div className={`flex items-center justify-between text-xs px-3 py-2 rounded-lg ${walletBalance >= payAmount ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
                <span>Số dư ví</span>
                <span className="font-bold">{formatCurrency(walletBalance)}</span>
              </div>
              {walletBalance < payAmount && (
                <p className="text-xs text-red-500 flex items-center gap-1">
                  <FiAlertCircle size={12} />
                  Số dư không đủ. Cần thêm {formatCurrency(payAmount - walletBalance)}.{' '}
                  <Link to="/wallet" className="underline font-medium">Nạp ví</Link>
                </p>
              )}
              <button onClick={handlePay} disabled={paying || walletBalance < payAmount}
                className="w-full py-3 bg-rose-500 text-white rounded-xl font-bold text-sm hover:bg-rose-600 transition disabled:opacity-50 flex items-center justify-center gap-2">
                {paying
                  ? <><div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" />Đang xử lý...</>
                  : <>💳 Thanh toán {formatCurrency(payAmount)} bằng ví</>}
              </button>
            </div>
          )}

          {!canPay && order.depositPaidAt && (
            <div className="flex items-center gap-2 text-emerald-600 text-sm font-medium mt-3">
              <FiCheckCircle size={16} /> Đã thanh toán — đang chờ sản xuất
            </div>
          )}
        </div>
      )}

      {/* Staff note */}
      {order.staffNote && (
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 mb-4">
          <h3 className="font-semibold text-blue-700 mb-1 text-sm">Ghi chú từ nhân viên</h3>
          <p className="text-gray-700 text-sm">{order.staffNote}</p>
        </div>
      )}
    </div>
  );
}

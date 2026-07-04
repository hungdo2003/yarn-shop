import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import useFetch from '../hooks/useFetch';
import api from '../services/api';
import { formatCurrency, formatDate, formatDateTime, CUSTOM_STATUS_LABEL, CUSTOM_STATUS_COLOR } from '../utils/formatters';
import Spinner from '../components/common/Spinner';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { FiCreditCard, FiFileText, FiImage } from 'react-icons/fi';

const STEPS = [
  { key: 'submitted',      label: 'Đã gửi',    icon: '📝' },
  { key: 'reviewing',      label: 'Đang xét',  icon: '🔍' },
  { key: 'quoted',         label: 'Báo giá',   icon: '💰' },
  { key: 'deposit_paid',   label: 'Đã cọc',    icon: '💳' },
  { key: 'in_production',  label: 'Sản xuất',  icon: '🧶' },
  { key: 'completed',      label: 'Xong',      icon: '✅' },
  { key: 'delivered',      label: 'Đã giao',   icon: '🏠' },
  { key: 'remaining_paid', label: 'Hoàn tất',  icon: '🎉' },
];

export default function CustomOrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: order, loading, refetch } = useFetch(`/custom-orders/my/${id}`);
  const [paying, setPaying] = useState(false);

  const handlePay = async () => {
    setPaying(true);
    try {
      await api.post(`/custom-orders/my/${order.id}/pay`);
      toast.success('Thanh toán thành công!');
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Thanh toán thất bại');
    } finally { setPaying(false); }
  };

  const handlePayRemaining = async () => {
    setPaying(true);
    try {
      await api.post(`/custom-orders/my/${order.id}/pay-remaining`);
      toast.success('Thanh toán phần còn lại thành công!');
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Thanh toán thất bại');
    } finally { setPaying(false); }
  };

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;
  if (!order) return <div className="text-center py-20 text-gray-500">Không tìm thấy đơn hàng</div>;

  const curIdx = STEPS.findIndex(s => s.key === order.status);
  const isCancelled = order.status === 'cancelled';
  const isQuoted = order.status === 'quoted' && parseFloat(order.quotedPrice || 0) > 0;
  const payAmount = parseFloat(order.depositAmount || order.quotedPrice || 0);
  const walletBalance = parseFloat(user?.walletBalance || 0);

  const remainingAmount = order.depositAmount && order.quotedPrice
    ? Math.max(0, parseFloat(order.quotedPrice) - parseFloat(order.depositAmount))
    : 0;
  const needsRemainingPayment = order.status === 'delivered' && remainingAmount > 0;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <button onClick={() => navigate(-1)} className="text-rose-500 text-sm hover:underline">
        ← Đơn hàng của tôi
      </button>

      {/* Header */}
      <div className="flex items-start justify-between mt-4 mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Đơn #{order.code}</h1>
          <p className="text-gray-400 text-sm mt-0.5">{formatDate(order.createdAt)}</p>
        </div>
        <span className={`text-sm px-3 py-1 rounded-full font-semibold ${CUSTOM_STATUS_COLOR[order.status] || 'bg-gray-100 text-gray-600'}`}>
          {CUSTOM_STATUS_LABEL[order.status]}
        </span>
      </div>

      {/* Quoted — big CTA (mirrors pending_payment in OrderDetail) */}
      {isQuoted && (
        <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-5 mb-5 text-center">
          <div className="text-4xl mb-2">💳</div>
          <h3 className="font-bold text-amber-700 text-lg mb-1">Chờ thanh toán</h3>
          <p className="text-amber-600 text-sm mb-1">
            Đơn của bạn đã được báo giá. Vui lòng thanh toán để bắt đầu sản xuất.
          </p>
          <p className="text-xs text-amber-500 mb-4">
            Số dư ví: <span className={`font-bold ${walletBalance >= payAmount ? 'text-emerald-600' : 'text-red-500'}`}>{formatCurrency(walletBalance)}</span>
            {walletBalance < payAmount && <> — cần thêm <span className="font-bold">{formatCurrency(payAmount - walletBalance)}</span>. <Link to="/wallet" className="underline">Nạp ví</Link></>}
          </p>
          <button onClick={handlePay} disabled={paying || walletBalance < payAmount}
            className="bg-amber-500 text-white px-8 py-3 rounded-xl font-bold hover:bg-amber-600 transition disabled:opacity-60">
            {paying ? 'Đang xử lý...' : `Thanh toán ${formatCurrency(payAmount)} bằng ví`}
          </button>
        </div>
      )}

      {/* Delivered — remaining payment CTA */}
      {needsRemainingPayment && (
        <div className="bg-teal-50 border-2 border-teal-200 rounded-2xl p-5 mb-5 text-center">
          <div className="text-4xl mb-2">💰</div>
          <h3 className="font-bold text-teal-700 text-lg mb-1">Thanh toán phần còn lại</h3>
          <p className="text-teal-600 text-sm mb-1">
            Đơn hàng đã được giao. Vui lòng thanh toán phần còn lại để hoàn tất đơn.
          </p>
          <p className="text-xs text-teal-500 mb-4">
            Số dư ví: <span className={`font-bold ${walletBalance >= remainingAmount ? 'text-emerald-600' : 'text-red-500'}`}>{formatCurrency(walletBalance)}</span>
            {walletBalance < remainingAmount && <> — cần thêm <span className="font-bold">{formatCurrency(remainingAmount - walletBalance)}</span>. <Link to="/wallet" className="underline">Nạp ví</Link></>}
          </p>
          <button onClick={handlePayRemaining} disabled={paying || walletBalance < remainingAmount}
            className="bg-teal-500 text-white px-8 py-3 rounded-xl font-bold hover:bg-teal-600 transition disabled:opacity-60">
            {paying ? 'Đang xử lý...' : `Thanh toán ${formatCurrency(remainingAmount)} bằng ví`}
          </button>
        </div>
      )}

      {/* Progress tracker */}
      {!isCancelled && !isQuoted && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-5 overflow-x-auto">
          <h3 className="font-semibold text-gray-700 mb-4 text-sm">Tiến trình đơn hàng</h3>
          <div className="flex items-start min-w-[480px]">
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

      {/* Cancelled banner */}
      {isCancelled && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-5 flex items-center gap-3">
          <span className="text-2xl">❌</span>
          <p className="font-semibold text-red-700">Đơn hàng đã bị hủy</p>
        </div>
      )}

      {/* Request details */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-4">
        <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2"><FiFileText size={16} /> Chi tiết yêu cầu</h3>
        <p className="text-sm text-gray-600 leading-relaxed mb-3">{order.description}</p>
        {(order.yarnColor || order.size) && (
          <div className="space-y-2 text-sm border-t border-gray-50 pt-3">
            {order.yarnColor && (
              <div className="flex gap-2"><span className="text-gray-400 w-32 shrink-0">Màu len</span><span className="font-medium text-gray-800">{order.yarnColor}</span></div>
            )}
            {order.size && (
              <div className="flex gap-2"><span className="text-gray-400 w-32 shrink-0">Kích thước</span><span className="font-medium text-gray-800">{order.size}</span></div>
            )}
          </div>
        )}
      </div>

      {/* Attached images */}
      {order.CustomOrderImages?.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-4">
          <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2"><FiImage size={16} /> Hình ảnh đính kèm</h3>
          <div className="flex gap-2 flex-wrap">
            {order.CustomOrderImages.map((img, i) => (
              <img key={i} src={img.imageUrl} alt="" className="w-20 h-20 object-cover rounded-xl border border-gray-100" />
            ))}
          </div>
        </div>
      )}

      {/* Payment status */}
      {order.quotedPrice && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-4">
          <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2"><FiCreditCard size={16} /> Thanh toán</h3>
          <p className="text-sm font-medium text-gray-700">Ví YarnShop</p>
          {!order.depositPaidAt ? (
            <span className="text-xs px-2 py-1 rounded-full font-medium mt-1 inline-block bg-orange-50 text-orange-600">Chưa thanh toán</span>
          ) : (
            <div className="space-y-2 mt-1">
              <div>
                <span className="text-xs px-2 py-1 rounded-full font-medium inline-block bg-blue-50 text-blue-600">Đã đặt cọc</span>
                <p className="text-xs text-gray-400 mt-1">Lúc {formatDateTime(order.depositPaidAt)}</p>
              </div>
              {order.remainingPaidAt && (
                <div>
                  <span className="text-xs px-2 py-1 rounded-full font-medium inline-block bg-teal-50 text-teal-600">Đã thanh toán đủ</span>
                  <p className="text-xs text-gray-400 mt-1">Lúc {formatDateTime(order.remainingPaidAt)}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Quote summary (mirrors Order summary) */}
      {order.quotedPrice && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-4">
          <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2"><FiCreditCard size={16} /> Tóm tắt báo giá</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-gray-500">
              <span>Giá báo</span>
              <span>{formatCurrency(order.quotedPrice)}</span>
            </div>
            {order.depositAmount && parseFloat(order.depositAmount) !== parseFloat(order.quotedPrice) && (
              <>
                <div className="flex justify-between text-gray-500">
                  <span>Đặt cọc</span>
                  <span>{formatCurrency(order.depositAmount)}</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>Còn lại</span>
                  <span>{formatCurrency(parseFloat(order.quotedPrice) - parseFloat(order.depositAmount))}</span>
                </div>
              </>
            )}
            {order.estimatedDays && (
              <div className="flex justify-between text-gray-500">
                <span>Thời gian dự kiến</span>
                <span>{order.estimatedDays} ngày</span>
              </div>
            )}
            {order.depositPaidAt && (
              <div className="flex justify-between text-gray-500">
                <span>Ngày thanh toán</span>
                <span>{formatDate(order.depositPaidAt)}</span>
              </div>
            )}
            <hr className="border-gray-100" />
            <div className="flex justify-between font-bold text-base">
              <span>Tổng cộng</span>
              <span className="text-rose-500">{formatCurrency(order.quotedPrice)}</span>
            </div>
          </div>
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

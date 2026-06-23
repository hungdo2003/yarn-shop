import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import useFetch from '../hooks/useFetch';
import { formatCurrency, formatDate, formatDateTime, ORDER_STATUS_LABEL, ORDER_STATUS_COLOR, PAYMENT_STATUS_COLOR, ORDER_STEPS, getStepIndex } from '../utils/formatters';
import Spinner from '../components/common/Spinner';
import api from '../services/api';
import toast from 'react-hot-toast';
import { FiTruck, FiCreditCard, FiMapPin, FiPackage, FiStar } from 'react-icons/fi';

const SHIPPING_METHOD_LABEL = { standard: 'Tiêu chuẩn (2-4 ngày)', express: 'Nhanh (1-2 ngày)', economy: 'Tiết kiệm (4-7 ngày)' };

export default function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: order, loading, refetch } = useFetch(`/orders/my/${id}`);
  const [paying, setPaying] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const handlePay = async () => {
    setPaying(true);
    const tid = toast.loading('Đang tạo liên kết thanh toán...');
    try {
      const res = await api.post(`/payment/create-link/${id}`);
      toast.dismiss(tid);
      toast.success('Đang chuyển đến trang thanh toán...');
      window.location.href = res.data.checkoutUrl;
    } catch (err) {
      toast.dismiss(tid);
      toast.error(err?.response?.data?.message || 'Không thể tạo liên kết thanh toán');
      setPaying(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm('Bạn có chắc muốn hủy đơn hàng này?')) return;
    setCancelling(true);
    try {
      if (order.status === 'pending_payment') {
        await api.post(`/payment/cancel-link/${id}`);
      } else {
        await api.post(`/orders/my/${id}/cancel`);
      }
      toast.success('Đã hủy đơn hàng');
      refetch();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Hủy đơn thất bại');
    } finally {
      setCancelling(false);
    }
  };

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;
  if (!order) return <div className="text-center py-20 text-gray-500">Không tìm thấy đơn hàng</div>;

  const curStep = getStepIndex(order.status);
  const isCancelled = order.status === 'cancelled';
  const isPendingPayment = order.status === 'pending_payment';

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <Link to="/orders" className="text-rose-500 text-sm hover:underline">← Đơn hàng của tôi</Link>

      {/* Header */}
      <div className="flex items-start justify-between mt-4 mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Đơn #{order.orderCode}</h1>
          <p className="text-gray-400 text-sm mt-0.5">{formatDateTime(order.createdAt)}</p>
        </div>
        <span className={`text-sm px-3 py-1 rounded-full font-semibold ${ORDER_STATUS_COLOR[order.status]}`}>
          {ORDER_STATUS_LABEL[order.status]}
        </span>
      </div>

      {/* PENDING PAYMENT — big CTA */}
      {isPendingPayment && (
        <div className="bg-orange-50 border-2 border-orange-200 rounded-2xl p-5 mb-5 text-center">
          <div className="text-4xl mb-2">💳</div>
          <h3 className="font-bold text-orange-700 text-lg mb-1">Chờ thanh toán</h3>
          <p className="text-orange-600 text-sm mb-4">Vui lòng hoàn thành thanh toán để chúng tôi xử lý đơn hàng của bạn</p>
          <div className="flex gap-3 justify-center">
            <button onClick={handlePay} disabled={paying}
              className="bg-orange-500 text-white px-8 py-3 rounded-xl font-bold hover:bg-orange-600 transition disabled:opacity-60">
              {paying ? 'Đang xử lý...' : `Thanh toán ${formatCurrency(order.total)}`}
            </button>
            <button onClick={handleCancel} disabled={cancelling}
              className="border border-gray-300 text-gray-600 px-5 py-3 rounded-xl font-medium hover:bg-gray-50 transition text-sm disabled:opacity-60">
              Hủy đơn
            </button>
          </div>
        </div>
      )}

      {/* Progress tracker — Shopee style */}
      {!isCancelled && !isPendingPayment && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-5">
          <h3 className="font-semibold text-gray-700 mb-4 text-sm">Tiến trình đơn hàng</h3>
          <div className="flex items-start">
            {ORDER_STEPS.map((step, i) => (
              <div key={step.key} className="flex items-center flex-1 min-w-0">
                <div className="flex flex-col items-center shrink-0">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-base font-bold transition-all
                    ${i < curStep ? 'bg-rose-500 text-white' : i === curStep ? 'bg-rose-500 text-white ring-4 ring-rose-100' : 'bg-gray-100 text-gray-400'}`}>
                    {i < curStep ? '✓' : step.icon}
                  </div>
                  <p className={`text-xs mt-1.5 text-center leading-tight max-w-[60px] ${i <= curStep ? 'text-rose-500 font-semibold' : 'text-gray-400'}`}>
                    {step.label}
                  </p>
                </div>
                {i < ORDER_STEPS.length - 1 && (
                  <div className={`h-0.5 flex-1 mx-1 mt-[-18px] transition-all ${i < curStep ? 'bg-rose-400' : 'bg-gray-200'}`} />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {isCancelled && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-5 flex items-center gap-3">
          <span className="text-2xl">❌</span>
          <div>
            <p className="font-semibold text-red-700">Đơn hàng đã bị hủy</p>
            {order.cancelledReason && <p className="text-red-600 text-sm">{order.cancelledReason}</p>}
          </div>
        </div>
      )}

      {/* Items */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-4">
        <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2"><FiPackage size={16} /> Sản phẩm</h3>
        <div className="space-y-3">
          {order.OrderDetails?.map(d => {
            const slug = d.Product?.slug;
            const isDelivered = ['delivered', 'completed'].includes(order.status);
            const productUrl = slug ? `/products/${slug}` : null;
            const reviewUrl = slug ? `/products/${slug}#reviews-section` : null;
            return (
              <div key={d.id} className="flex gap-3 items-center group">
                {productUrl ? (
                  <Link to={productUrl} className="shrink-0 w-14 h-14 rounded-xl overflow-hidden block hover:opacity-90 transition-opacity">
                    {d.productImage
                      ? <img src={d.productImage} alt={d.productName} className="w-full h-full object-cover" />
                      : <div className="w-full h-full bg-rose-50 flex items-center justify-center text-2xl">🧶</div>}
                  </Link>
                ) : (
                  <div className="w-14 h-14 bg-rose-50 rounded-xl flex items-center justify-center text-2xl shrink-0">
                    {d.productImage ? <img src={d.productImage} alt={d.productName} className="w-full h-full object-cover rounded-xl" /> : '🧶'}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  {productUrl ? (
                    <Link to={productUrl} className="font-medium text-sm text-gray-800 hover:text-rose-500 transition-colors line-clamp-2 block">
                      {d.productName}
                    </Link>
                  ) : (
                    <p className="font-medium text-sm text-gray-800 line-clamp-2">{d.productName}</p>
                  )}
                  <p className="text-gray-400 text-xs mt-0.5">{formatCurrency(d.unitPrice)} × {d.quantity}</p>
                </div>
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <p className="font-bold text-gray-800">{formatCurrency(d.totalPrice)}</p>
                  {isDelivered && reviewUrl && (
                    <Link to={reviewUrl}
                      className="flex items-center gap-1 text-[11px] font-semibold text-amber-600 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-2 py-1 rounded-lg transition-colors whitespace-nowrap">
                      <FiStar size={11} className="fill-amber-400 text-amber-400" /> Đánh giá
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Shipping + Payment */}
      <div className="grid sm:grid-cols-2 gap-4 mb-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2"><FiMapPin size={16} /> Địa chỉ giao hàng</h3>
          <p className="font-medium text-sm text-gray-800">{order.shippingName}</p>
          <p className="text-gray-500 text-sm">{order.shippingPhone}</p>
          <p className="text-gray-500 text-sm mt-1">{order.shippingAddress}</p>
          {order.shippingMethod && (
            <div className="mt-2 text-xs text-gray-400 flex items-center gap-1">
              <FiTruck size={11} /> {SHIPPING_METHOD_LABEL[order.shippingMethod]}
            </div>
          )}
          {order.Shipment?.trackingCode && (
            <p className="text-xs mt-2 text-blue-600 font-medium">Mã vận đơn: {order.Shipment.trackingCode}</p>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2"><FiCreditCard size={16} /> Thanh toán</h3>
          <p className="text-sm font-medium text-gray-700">PayOS</p>
          <span className={`text-xs px-2 py-1 rounded-full font-medium mt-1 inline-block ${PAYMENT_STATUS_COLOR[order.Payment?.status]}`}>
            {order.Payment?.status === 'paid' ? 'Đã thanh toán' : order.Payment?.status === 'unpaid' ? 'Chưa thanh toán' : order.Payment?.status}
          </span>
          {order.Payment?.paidAt && (
            <p className="text-xs text-gray-400 mt-1">Lúc {formatDateTime(order.Payment.paidAt)}</p>
          )}
        </div>
      </div>

      {/* Order summary */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-5">
        <h3 className="font-semibold text-gray-800 mb-3">Tóm tắt đơn hàng</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between text-gray-500"><span>Tạm tính</span><span>{formatCurrency(order.subtotal)}</span></div>
          <div className="flex justify-between text-gray-500">
            <span>Phí vận chuyển</span>
            <span>{parseFloat(order.shippingFee) === 0 ? <span className="text-green-600">Miễn phí</span> : formatCurrency(order.shippingFee)}</span>
          </div>
          {parseFloat(order.discount) > 0 && (
            <div className="flex justify-between text-green-600"><span>Giảm giá</span><span>-{formatCurrency(order.discount)}</span></div>
          )}
          <hr className="border-gray-100" />
          <div className="flex justify-between font-bold text-base"><span>Tổng cộng</span><span className="text-rose-500">{formatCurrency(order.total)}</span></div>
        </div>
      </div>

      {/* Cancel for non-cancellable statuses only */}
      {!isCancelled && !isPendingPayment && ['paid', 'confirmed'].includes(order.status) && (
        <button onClick={handleCancel} disabled={cancelling}
          className="w-full border border-red-200 text-red-500 py-3 rounded-xl font-medium hover:bg-red-50 transition text-sm disabled:opacity-60">
          {cancelling ? 'Đang hủy...' : 'Yêu cầu hủy đơn'}
        </button>
      )}
    </div>
  );
}

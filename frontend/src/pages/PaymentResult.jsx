import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import { formatCurrency } from '../utils/formatters';
import Spinner from '../components/common/Spinner';

export default function PaymentResult() {
  const [params] = useSearchParams();
  const orderId = params.get('orderId');
  const cancelled = params.get('cancelled') === 'true';

  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId) { setLoading(false); return; }
    // Poll a few times to let the webhook arrive
    let attempts = 0;
    const check = async () => {
      try {
        const res = await api.get(`/payment/status/${orderId}`);
        setStatus(res.data);
        if (res.data.status === 'paid' || res.data.status === 'cancelled' || attempts >= 6) {
          setLoading(false);
        } else {
          attempts++;
          setTimeout(check, 2000);
        }
      } catch {
        setLoading(false);
      }
    };
    check();
  }, [orderId]);

  if (loading) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
      <Spinner size="lg" />
      <p className="text-gray-500 text-sm">Đang xác nhận thanh toán...</p>
    </div>
  );

  const isPaid = status?.status === 'paid';
  const isCancelled = cancelled || status?.status === 'cancelled';

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md text-center">
        {isPaid ? (
          <>
            <div className="text-6xl xs:text-7xl mb-4 xs:mb-5 animate-bounce">🎉</div>
            <h1 className="text-xl xs:text-2xl font-bold text-green-600 mb-2">Thanh toán thành công!</h1>
            <p className="text-gray-500 mb-3">Đơn hàng <span className="font-semibold text-gray-800">#{status?.orderCode}</span> đã được ghi nhận.</p>
            {status?.total && <p className="text-lg font-bold text-rose-500 mb-6">{formatCurrency(status.total)}</p>}
            <div className="bg-green-50 border border-green-200 rounded-2xl p-4 xs:p-5 mb-6 text-left space-y-2">
              <p className="text-sm text-green-700 font-medium">✅ Thanh toán đã được xác nhận</p>
              <p className="text-sm text-green-700">📋 Đội ngũ bán hàng đang xem xét đơn hàng của bạn</p>
              <p className="text-sm text-green-700">📦 Chúng tôi sẽ chuẩn bị hàng và giao đến bạn sớm nhất</p>
            </div>
            <div className="flex gap-3">
              <Link to="/orders" className="flex-1 min-w-0 bg-rose-500 text-white py-3 rounded-xl font-semibold hover:bg-rose-600 active:scale-95 transition">Xem đơn hàng</Link>
              <Link to="/products" className="flex-1 min-w-0 border border-gray-200 text-gray-600 py-3 rounded-xl font-semibold hover:bg-gray-50 active:scale-95 transition">Tiếp tục mua</Link>
            </div>
          </>
        ) : isCancelled ? (
          <>
            <div className="text-6xl xs:text-7xl mb-4 xs:mb-5">❌</div>
            <h1 className="text-xl xs:text-2xl font-bold text-red-500 mb-2">Thanh toán bị hủy</h1>
            <p className="text-gray-500 text-sm mb-6">Đơn hàng chưa được thanh toán. Bạn có thể thử lại hoặc hủy đơn hàng.</p>
            <div className="flex gap-3">
              <Link to={`/orders/${orderId}`} className="flex-1 min-w-0 bg-rose-500 text-white py-3 rounded-xl font-semibold hover:bg-rose-600 active:scale-95 transition">Xem đơn hàng</Link>
              <Link to="/products" className="flex-1 min-w-0 border border-gray-200 text-gray-600 py-3 rounded-xl font-semibold hover:bg-gray-50 active:scale-95 transition">Về trang chủ</Link>
            </div>
          </>
        ) : (
          <>
            <div className="text-6xl xs:text-7xl mb-4 xs:mb-5">⏳</div>
            <h1 className="text-xl xs:text-2xl font-bold text-orange-500 mb-2">Đang xử lý thanh toán</h1>
            <p className="text-gray-500 text-sm mb-6">Hệ thống đang xác nhận thanh toán của bạn. Vui lòng chờ trong giây lát.</p>
            <Link to={`/orders/${orderId}`} className="bg-rose-500 text-white px-8 py-3 rounded-xl font-semibold hover:bg-rose-600 active:scale-95 transition inline-block">Xem chi tiết đơn hàng</Link>
          </>
        )}
      </div>
    </div>
  );
}

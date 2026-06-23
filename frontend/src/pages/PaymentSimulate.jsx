import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { formatCurrency } from '../utils/formatters';
import toast from 'react-hot-toast';

export default function PaymentSimulate() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const orderId = params.get('orderId');
  const topupId = params.get('topupId');
  const amount = Number(params.get('amount') || 0);
  const orderCode = params.get('orderCode') || '';
  const isTopup = !!topupId;
  const [paying, setPaying] = useState(false);
  const [step, setStep] = useState('confirm');

  const handlePay = async () => {
    setPaying(true);
    setStep('processing');
    await new Promise(r => setTimeout(r, 1800));
    try {
      if (isTopup) {
        await api.post(`/wallet/topup/simulate/${topupId}`);
        setStep('done');
        toast.success('Nạp ví thành công!');
        setTimeout(() => navigate(`/wallet/topup/result?topupId=${topupId}`), 1500);
      } else {
        await api.post(`/payment/simulate-pay/${orderId}`);
        setStep('done');
        toast.success('Thanh toán thành công!');
        setTimeout(() => navigate(`/payment/result?orderId=${orderId}`), 1500);
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Thất bại');
      setStep('confirm');
      setPaying(false);
    }
  };

  const handleCancel = async () => {
    if (isTopup) {
      navigate(`/wallet/topup/result?topupId=${topupId}&cancelled=true`);
    } else {
      try { await api.post(`/payment/cancel-link/${orderId}`); } catch {}
      navigate(`/payment/result?orderId=${orderId}&cancelled=true`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <div className="max-w-sm w-full">

        {/* Header — looks like a payment gateway */}
        <div className="bg-white rounded-t-2xl px-6 py-4 border-b flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            <span className="text-2xl">💳</span>
            <span className="font-bold text-gray-800">PayOS</span>
          </div>
          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">🔒 Bảo mật</span>
        </div>

        <div className="bg-white rounded-b-2xl shadow-xl overflow-hidden">
          {step === 'confirm' && (
            <div className="p-6 space-y-5">
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">{isTopup ? 'Giao dịch' : 'Đơn hàng'}</p>
                <p className="font-bold text-gray-800 text-lg">{isTopup ? `Nạp ví #${topupId}` : `#${orderCode}`}</p>
              </div>

              <div className="bg-blue-50 rounded-xl p-4 text-center">
                <p className="text-xs text-gray-500 mb-1">Số tiền thanh toán</p>
                <p className="text-3xl font-bold text-blue-700">{formatCurrency(amount)}</p>
              </div>

              {/* Fake bank selection */}
              <div>
                <p className="text-xs text-gray-500 mb-2 font-medium">Chọn phương thức</p>
                {[
                  { icon: '🏦', label: 'Chuyển khoản ngân hàng', sub: 'Vietcombank, BIDV, Techcombank...' },
                  { icon: '💳', label: 'Thẻ ATM / Debit', sub: 'Napas' },
                  { icon: '📱', label: 'Ví điện tử', sub: 'MoMo, ZaloPay, VNPay' },
                ].map((m, i) => (
                  <label key={i} className={`flex items-center gap-3 border rounded-xl px-4 py-3 mb-2 cursor-pointer transition ${i === 0 ? 'border-blue-400 bg-blue-50' : 'border-gray-200'}`}>
                    <input type="radio" name="method" defaultChecked={i === 0} className="accent-blue-500" />
                    <span className="text-xl">{m.icon}</span>
                    <div>
                      <p className="text-sm font-medium text-gray-800">{m.label}</p>
                      <p className="text-xs text-gray-400">{m.sub}</p>
                    </div>
                  </label>
                ))}
              </div>

              <button onClick={handlePay} className="w-full bg-blue-600 text-white py-3.5 rounded-xl font-bold hover:bg-blue-700 transition text-sm">
                Xác nhận thanh toán {formatCurrency(amount)}
              </button>
              <button onClick={handleCancel} className="w-full text-gray-400 text-sm hover:text-gray-600 transition py-1">
                Hủy và quay lại
              </button>
            </div>
          )}

          {step === 'processing' && (
            <div className="p-10 text-center">
              <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="font-semibold text-gray-700">Đang xử lý thanh toán...</p>
              <p className="text-gray-400 text-sm mt-1">Vui lòng không đóng trang này</p>
            </div>
          )}

          {step === 'done' && (
            <div className="p-10 text-center">
              <div className="text-5xl mb-3">✅</div>
              <p className="font-bold text-green-600 text-lg">Thanh toán thành công!</p>
              <p className="text-gray-400 text-sm mt-1">Đang chuyển hướng...</p>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">
          Môi trường thử nghiệm — không thu tiền thực
        </p>
      </div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../services/api';

export default function WalletTopupResult() {
  const [params] = useSearchParams();
  const topupId = params.get('topupId');
  const cancelled = params.get('cancelled') === 'true';
  const [status, setStatus] = useState(cancelled ? 'cancelled' : 'polling');
  const [balance, setBalance] = useState(null);
  const [amount, setAmount] = useState(null);

  useEffect(() => {
    if (cancelled || !topupId) { setStatus('cancelled'); return; }
    let tries = 0;
    const poll = setInterval(async () => {
      try {
        const r = await api.get(`/wallet/topup/status/${topupId}`);
        setBalance(r.data.balance);
        setAmount(r.data.amount);
        if (r.data.status === 'completed') { setStatus('success'); clearInterval(poll); }
        else if (r.data.status === 'failed' || r.data.status === 'cancelled') { setStatus('failed'); clearInterval(poll); }
      } catch {}
      if (++tries >= 8) { setStatus('pending'); clearInterval(poll); }
    }, 2000);
    return () => clearInterval(poll);
  }, [topupId, cancelled]);

  const fmt = n => Number(n || 0).toLocaleString('vi-VN') + 'đ';

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-lg p-6 xs:p-8 text-center">
        {status === 'polling' && (
          <>
            <div className="w-14 h-14 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="font-semibold text-gray-700">Đang xác nhận giao dịch...</p>
          </>
        )}
        {status === 'success' && (
          <>
            <div className="text-5xl mb-3">✅</div>
            <h2 className="text-xl font-bold text-green-600 mb-1">Nạp tiền thành công!</h2>
            {amount && <p className="text-gray-500 text-sm mb-1">{`Đã nạp ${fmt(amount)} vào ví`}</p>}
            {balance !== null && <p className="text-gray-500 text-sm">{`Số dư hiện tại: ${fmt(balance)}`}</p>}
          </>
        )}
        {status === 'failed' && (
          <>
            <div className="text-5xl mb-3">❌</div>
            <h2 className="text-xl font-bold text-red-500 mb-1">Nạp tiền thất bại</h2>
            <p className="text-gray-400 text-sm">Giao dịch không được xử lý. Bạn không bị trừ tiền.</p>
          </>
        )}
        {status === 'cancelled' && (
          <>
            <div className="text-5xl mb-3">🚫</div>
            <h2 className="text-xl font-bold text-gray-600 mb-1">Đã hủy nạp tiền</h2>
            <p className="text-gray-400 text-sm">Bạn đã hủy giao dịch. Số dư ví không thay đổi.</p>
          </>
        )}
        {status === 'pending' && (
          <>
            <div className="text-5xl mb-3">⏳</div>
            <h2 className="text-xl font-bold text-yellow-600 mb-1">Đang chờ xác nhận</h2>
            <p className="text-gray-400 text-sm">Giao dịch đang được xử lý. Ví sẽ được cập nhật tự động.</p>
          </>
        )}
        <div className="mt-6 space-y-2">
          <Link to="/wallet" className="block w-full bg-green-500 text-white py-3 rounded-xl font-bold text-sm hover:bg-green-600 active:scale-95 transition">
            Về ví của tôi
          </Link>
          {(status === 'failed' || status === 'cancelled') && (
            <Link to="/wallet" className="block w-full border border-gray-200 text-gray-600 py-3 rounded-xl text-sm hover:bg-gray-50 active:scale-95 transition">
              Thử lại
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import Pagination from '../components/common/Pagination';

const PER_PAGE = 10;

const fmt = n => Number(n || 0).toLocaleString('vi-VN') + 'đ';
const fmtDate = d => new Date(d).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

const TX_TYPE = {
  topup:            { label: 'Nạp tiền',        color: 'text-green-600',  bg: 'bg-green-50',  icon: '⬆️' },
  payment:          { label: 'Thanh toán đơn',  color: 'text-red-500',    bg: 'bg-red-50',    icon: '🛒' },
  refund:           { label: 'Hoàn tiền',        color: 'text-blue-600',   bg: 'bg-blue-50',   icon: '↩️' },
  admin_adjustment: { label: 'Điều chỉnh',       color: 'text-gray-500',   bg: 'bg-gray-50',   icon: '⚙️' },
};

const TOPUP_AMOUNTS = [50000, 100000, 200000, 500000, 1000000, 2000000];

export default function Wallet() {
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('all');
  const [page, setPage] = useState(1);
  const [topupAmount, setTopupAmount] = useState('');
  const [topping, setTopping] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    api.get('/wallet')
      .then(r => { setBalance(r.data.balance); setTransactions(r.data.transactions); })
      .catch(() => toast.error('Không thể tải dữ liệu ví'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleTopup = async () => {
    const amt = Number(topupAmount);
    if (!amt || amt < 10000) return toast.error('Số tiền nạp tối thiểu 10,000đ');
    setTopping(true);
    const tid = toast.loading('Đang tạo liên kết thanh toán...');
    try {
      const r = await api.post('/wallet/topup', { amount: amt });
      toast.dismiss(tid);
      toast.success('Đang chuyển đến trang thanh toán...');
      window.location.href = r.data.checkoutUrl;
    } catch (err) {
      toast.dismiss(tid);
      toast.error(err?.response?.data?.message || 'Không thể tạo liên kết nạp tiền');
      setTopping(false);
    }
  };

  const filtered = tab === 'all' ? transactions : transactions.filter(tx => tx.type === tab);
  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Ví của tôi</h1>

      {/* Balance card */}
      <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-6 text-white shadow-lg">
        <p className="text-green-100 text-sm font-medium mb-1">Số dư khả dụng</p>
        <p className="text-4xl font-bold tracking-tight">{fmt(balance)}</p>
        <p className="text-green-100 text-xs mt-3">Dùng để thanh toán đơn hàng hoặc hoàn tiền khi hủy đơn</p>
      </div>

      {/* Top-up section */}
      <div className="bg-white rounded-2xl shadow p-6">
        <h2 className="font-bold text-gray-800 text-lg mb-4">Nạp tiền vào ví</h2>

        {/* Quick amounts */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {TOPUP_AMOUNTS.map(a => (
            <button
              key={a}
              onClick={() => setTopupAmount(String(a))}
              className={`border rounded-xl py-2 text-sm font-semibold transition ${
                topupAmount === String(a) ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-200 text-gray-600 hover:border-green-300'
              }`}
            >
              {a.toLocaleString('vi-VN')}đ
            </button>
          ))}
        </div>

        {/* Custom amount */}
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <input
              type="number"
              value={topupAmount}
              onChange={e => setTopupAmount(e.target.value)}
              placeholder="Nhập số tiền khác..."
              min={10000}
              className="w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-300 pr-10"
            />
            <span className="absolute right-3 top-3 text-gray-400 text-sm">đ</span>
          </div>
          <button
            onClick={handleTopup}
            disabled={topping || !topupAmount}
            className="px-6 bg-green-500 text-white rounded-xl font-bold text-sm hover:bg-green-600 transition disabled:opacity-50"
          >
            {topping ? '...' : 'Nạp ngay'}
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-2">Thanh toán qua PayOS — Tối thiểu 10,000đ</p>
      </div>

      {/* Transaction history */}
      <div className="bg-white rounded-2xl shadow overflow-hidden">
        <div className="px-5 pt-5 pb-3 border-b">
          <h2 className="font-bold text-gray-800 text-lg mb-3">Lịch sử giao dịch</h2>
          <div className="flex gap-2 flex-wrap">
            {[
              { key: 'all', label: 'Tất cả' },
              { key: 'topup', label: 'Nạp tiền' },
              { key: 'payment', label: 'Thanh toán' },
              { key: 'refund', label: 'Hoàn tiền' },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => { setTab(key); setPage(1); }}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition ${
                  tab === key ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="py-16 text-center text-gray-400">Đang tải...</div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-4xl mb-2">💳</p>
            <p className="text-gray-400 text-sm">Chưa có giao dịch nào</p>
          </div>
        ) : (
          <div className="divide-y">
            {paginated.map(tx => {
              const cfg = TX_TYPE[tx.type] || TX_TYPE.admin_adjustment;
              const isCredit = tx.amount > 0;
              return (
                <div key={tx.id} className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition">
                  <div className={`w-10 h-10 rounded-full ${cfg.bg} flex items-center justify-center text-lg shrink-0`}>
                    {cfg.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800">{cfg.label}</p>
                    {tx.description && <p className="text-xs text-gray-400 truncate">{tx.description}</p>}
                    <p className="text-xs text-gray-300 mt-0.5">{fmtDate(tx.createdAt)}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`font-bold text-sm ${isCredit ? 'text-green-600' : 'text-red-500'}`}>
                      {isCredit ? '+' : ''}{fmt(tx.amount)}
                    </p>
                    <p className="text-xs text-gray-400">Sau: {fmt(tx.balanceAfter)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <div className="px-5 pb-4">
          <Pagination pagination={{ page, totalPages }} onPageChange={setPage} />
        </div>
      </div>
    </div>
  );
}

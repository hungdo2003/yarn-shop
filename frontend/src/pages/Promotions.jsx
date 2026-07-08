import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function Promotions() {
  const [vouchers, setVouchers] = useState([]);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/vouchers/public').then(r => setVouchers(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const subscribe = async (e) => {
    e.preventDefault();
    try {
      const r = await api.post('/subscriptions/subscribe', { email });
      toast.success(r.data.message);
      setEmail('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Đăng ký thất bại');
    }
  };

  const copy = (code) => {
    navigator.clipboard.writeText(code);
    toast.success(`Đã sao chép mã ${code}`);
  };

  const typeLabel = {
    percentage: 'Giảm %',
    fixed: 'Giảm tiền',
    free_shipping: 'Miễn ship',
    flash_sale: '⚡ Flash Sale',
  };
  const typeBg = { percentage: 'bg-rose-100 text-rose-700', fixed: 'bg-amber-100 text-amber-700', free_shipping: 'bg-green-100 text-green-700', flash_sale: 'bg-orange-100 text-orange-700' };

  const flashVouchers = vouchers.filter(v => v.type === 'flash_sale');
  const normalVouchers = vouchers.filter(v => v.type !== 'flash_sale');

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 sm:py-10">
      <h1 className="text-2xl xs:text-3xl font-bold text-rose-600 mb-2">{'Khuyến Mãi & Voucher'}</h1>
      <p className="text-gray-500 mb-8">{'Các ưu đãi hiện có từ Yarn Shop'}</p>

      {/* Flash Sale banner */}
      {flashVouchers.length > 0 && (
        <Link to="/flash-sale" className="block bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-2xl p-5 mb-8 hover:opacity-95 transition">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <p className="font-black text-xl flex items-center gap-2">{'⚡ Flash Sale Đang Diễn Ra!'}</p>
              <p className="text-orange-100 text-sm mt-1">{`${flashVouchers.length} mã giảm giá đặc biệt — Số lượng có hạn`}</p>
            </div>
            <span className="bg-white text-orange-600 font-bold px-4 py-2 rounded-full text-sm hover:bg-orange-50 active:scale-95 whitespace-nowrap shrink-0">{'Xem ngay →'}</span>
          </div>
        </Link>
      )}

      {loading ? <div className="text-center py-16 text-gray-400">{'Đang tải...'}</div> : (
        normalVouchers.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl shadow text-gray-400">{'Hiện chưa có voucher nào'}</div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4 mb-12">
            {normalVouchers.map(v => (
              <div key={v.id} className="bg-white rounded-xl shadow overflow-hidden border border-dashed border-rose-200">
                <div className="bg-rose-50 px-6 py-4 flex items-center justify-between">
                  <div>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${typeBg[v.type]}`}>{typeLabel[v.type]}</span>
                    <h3 className="font-bold text-xl text-gray-800 mt-1">
                      {v.type === 'percentage'
                        ? `Giảm ${v.value}%`
                        : v.type === 'fixed'
                        ? `Giảm ${parseInt(v.value).toLocaleString()}đ`
                        : 'Miễn phí vận chuyển'}
                    </h3>
                  </div>
                  <div className="text-4xl">🎟️</div>
                </div>
                <div className="px-6 py-4">
                  <div className="flex items-center gap-2 mb-3">
                    <code className="bg-gray-100 px-3 py-1 rounded font-mono font-bold text-rose-600 flex-1 text-center">{v.code}</code>
                    <button onClick={() => copy(v.code)} className="bg-rose-500 text-white px-3 py-2 rounded text-sm hover:bg-rose-600 active:scale-95 transition shrink-0">{'Sao chép'}</button>
                  </div>
                  {v.minOrderAmount > 0 && <p className="text-xs text-gray-500">{`Đơn tối thiểu: ${parseInt(v.minOrderAmount).toLocaleString()}đ`}</p>}
                  {v.maxDiscountAmount && v.type === 'percentage' && <p className="text-xs text-gray-500">{`Giảm tối đa: ${parseInt(v.maxDiscountAmount).toLocaleString()}đ`}</p>}
                  <p className="text-xs text-gray-400 mt-2">{`HSD: ${new Date(v.endDate).toLocaleDateString('vi-VN')}`}</p>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      <div className="bg-gradient-to-r from-rose-500 to-pink-500 rounded-2xl p-6 sm:p-8 text-white text-center">
        <h2 className="text-2xl font-bold mb-2">{'Nhận Ưu Đãi Riêng'}</h2>
        <p className="mb-6 opacity-90">{'Đăng ký nhận thông báo để không bỏ lỡ khuyến mãi độc quyền'}</p>
        <form onSubmit={subscribe} className="flex flex-col xs:flex-row gap-3 max-w-md mx-auto">
          <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder={'Nhập email của bạn'} className="flex-1 px-4 py-3 rounded-lg text-base text-gray-800 focus:outline-none focus:ring-2 focus:ring-white" />
          <button type="submit" className="bg-white text-rose-600 px-6 py-3 rounded-lg font-semibold hover:bg-rose-50 active:scale-95 transition whitespace-nowrap">{'Đăng ký'}</button>
        </form>
      </div>
    </div>
  );
}

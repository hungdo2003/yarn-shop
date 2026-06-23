import { useState, useEffect } from 'react';
import api from '../../services/api';

const STATUS_COLOR = {
  pending_payment: 'bg-orange-100 text-orange-700',
  paid: 'bg-blue-100 text-blue-700',
  confirmed: 'bg-indigo-100 text-indigo-700',
  preparing: 'bg-purple-100 text-purple-700',
  shipping: 'bg-cyan-100 text-cyan-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};
const STATUS_LABEL = {
  pending_payment: 'Chờ thanh toán', paid: 'Đã thanh toán', confirmed: 'Đã xác nhận',
  preparing: 'Đang chuẩn bị', shipping: 'Đang giao', delivered: 'Đã giao', cancelled: 'Đã hủy',
};
const SHIP_LABEL = { standard: 'Tiêu chuẩn', express: 'Hỏa tốc', economy: 'Tiết kiệm' };

export default function OrderMonitor() {
  const [orders, setOrders] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState({ status: '', search: '' });
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  const load = () => {
    setLoading(true);
    api.get('/orders', { params: { page, limit: 20, ...filter } })
      .then(r => { setOrders(r.data.items || []); setTotal(r.data.pagination?.total || 0); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [page, filter]);

  const openDetail = async (o) => {
    const r = await api.get(`/orders/${o.id}`);
    setSelected(r.data);
  };

  const totalPages = Math.ceil(total / 20);

  // Stats
  const statuses = ['paid', 'confirmed', 'preparing', 'shipping', 'delivered'];

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Theo Dõi Đơn Hàng</h1>
        <p className="text-sm text-gray-400 mt-0.5">Chế độ xem — nhân viên xử lý các đơn hàng</p>
      </div>

      {/* Quick status pills */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => { setFilter(f => ({ ...f, status: '' })); setPage(1); }}
          className={`px-4 py-1.5 rounded-full text-xs font-semibold transition ${filter.status === '' ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
        >
          Tất cả ({total})
        </button>
        {statuses.map(s => (
          <button
            key={s}
            onClick={() => { setFilter(f => ({ ...f, status: s })); setPage(1); }}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition ${filter.status === s ? 'bg-gray-800 text-white' : `${STATUS_COLOR[s]} hover:opacity-80`}`}
          >
            {STATUS_LABEL[s]}
          </button>
        ))}
        <button
          onClick={() => { setFilter(f => ({ ...f, status: 'cancelled' })); setPage(1); }}
          className={`px-4 py-1.5 rounded-full text-xs font-semibold transition ${filter.status === 'cancelled' ? 'bg-gray-800 text-white' : 'bg-red-100 text-red-600 hover:opacity-80'}`}
        >
          Đã hủy
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl shadow p-4">
        <input
          placeholder="Tìm mã đơn hàng, tên khách, số điện thoại..."
          value={filter.search}
          onChange={e => { setFilter(f => ({ ...f, search: e.target.value })); setPage(1); }}
          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-200"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="px-4 py-3 border-b flex items-center justify-between">
          <span className="text-sm text-gray-500 font-medium">Tổng: <strong>{total}</strong> đơn hàng</span>
          <span className="text-xs text-gray-400">Chỉ xem — không thể thay đổi trạng thái</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                {['Mã ĐH', 'Khách hàng', 'SĐT', 'Vận chuyển', 'Tổng tiền', 'Thanh toán', 'Trạng thái', ''].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading
                ? <tr><td colSpan={8} className="text-center py-12 text-gray-400">Đang tải...</td></tr>
                : orders.length === 0
                  ? <tr><td colSpan={8} className="text-center py-12 text-gray-400">Không có đơn hàng</td></tr>
                  : orders.map(o => (
                    <tr key={o.id} className="border-t hover:bg-gray-50">
                      <td className="px-4 py-3"><code className="text-xs font-mono text-rose-600">{o.orderCode}</code></td>
                      <td className="px-4 py-3 font-medium text-gray-800 max-w-[140px] truncate">{o.shippingName || o.User?.fullName}</td>
                      <td className="px-4 py-3 text-gray-500">{o.shippingPhone}</td>
                      <td className="px-4 py-3 text-xs text-gray-500">{SHIP_LABEL[o.shippingMethod]}</td>
                      <td className="px-4 py-3 font-semibold">{parseFloat(o.total).toLocaleString()}đ</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${o.Payment?.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                          {o.Payment?.status === 'paid' ? 'Đã TT' : 'Chưa TT'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[o.status] || 'bg-gray-100 text-gray-600'}`}>
                          {STATUS_LABEL[o.status] || o.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={() => openDetail(o)} className="text-xs text-blue-600 hover:underline">Xem chi tiết</button>
                      </td>
                    </tr>
                  ))
              }
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 p-4 border-t">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1 border rounded-lg text-sm disabled:opacity-40">‹</button>
            <span className="text-sm text-gray-600">{page} / {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-3 py-1 border rounded-lg text-sm disabled:opacity-40">›</button>
          </div>
        )}
      </div>

      {/* Detail modal — read-only */}
      {selected && (
        <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 pt-10 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 mb-10">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-800">
                Đơn hàng <code className="text-rose-600">{selected.orderCode}</code>
              </h2>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
            </div>

            <div className="grid grid-cols-2 gap-3 bg-gray-50 rounded-xl p-4 text-sm mb-4">
              <div><p className="text-xs text-gray-400">Khách hàng</p><p className="font-medium">{selected.shippingName}</p></div>
              <div><p className="text-xs text-gray-400">Điện thoại</p><p className="font-medium text-rose-600">{selected.shippingPhone}</p></div>
              <div className="col-span-2"><p className="text-xs text-gray-400">Địa chỉ</p><p className="font-medium">{selected.shippingAddress}</p></div>
              <div>
                <p className="text-xs text-gray-400">Trạng thái</p>
                <span className={`inline-block mt-0.5 text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[selected.status] || ''}`}>
                  {STATUS_LABEL[selected.status] || selected.status}
                </span>
              </div>
              <div>
                <p className="text-xs text-gray-400">Thanh toán</p>
                <span className={`inline-block mt-0.5 text-xs px-2 py-0.5 rounded-full font-medium ${selected.Payment?.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                  {selected.Payment?.status === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}
                </span>
              </div>
              <div><p className="text-xs text-gray-400">Phí ship</p><p className="font-medium">{parseFloat(selected.shippingFee || 0).toLocaleString()}đ</p></div>
              <div><p className="text-xs text-gray-400">Tổng tiền</p><p className="font-bold text-rose-600">{parseFloat(selected.total).toLocaleString()}đ</p></div>
            </div>

            <h3 className="text-sm font-semibold mb-2 text-gray-700">Sản phẩm</h3>
            <div className="space-y-2">
              {selected.OrderDetails?.map(d => (
                <div key={d.id} className="flex items-center gap-3 border rounded-xl p-3">
                  <img src={d.productImage} className="w-10 h-10 rounded-lg object-cover bg-gray-100 shrink-0" onError={e => { e.target.src = 'https://placehold.co/40?text=...'; }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{d.productName}</p>
                    <p className="text-xs text-gray-400">SL: {d.quantity} × {parseFloat(d.unitPrice).toLocaleString()}đ</p>
                  </div>
                  <p className="text-sm font-semibold shrink-0">{parseFloat(d.totalPrice).toLocaleString()}đ</p>
                </div>
              ))}
            </div>

            <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-700">
              ℹ️ Chỉ nhân viên mới có thể xử lý đơn hàng này.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

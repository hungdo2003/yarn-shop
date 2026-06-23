import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const statusColor = {
  pending_payment: 'bg-orange-100 text-orange-700', paid: 'bg-blue-100 text-blue-700',
  confirmed: 'bg-indigo-100 text-indigo-700', preparing: 'bg-purple-100 text-purple-700',
  shipping: 'bg-cyan-100 text-cyan-700', delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700', pending: 'bg-yellow-100 text-yellow-700', completed: 'bg-green-100 text-green-700'
};
const statusLabel = {
  pending_payment: 'Chờ thanh toán', paid: 'Đã thanh toán', confirmed: 'Đã xác nhận',
  preparing: 'Đang chuẩn bị', shipping: 'Đang giao', delivered: 'Đã giao',
  cancelled: 'Đã hủy', pending: 'Chờ xác nhận', completed: 'Hoàn thành'
};
// Staff drives: paid → confirmed → preparing → shipping → delivered
const nextStatus = { paid: 'confirmed', confirmed: 'preparing', preparing: 'shipping', shipping: 'delivered', pending: 'confirmed' };
const nextLabel = { paid: '✅ Xác nhận đơn', confirmed: '📦 Chuẩn bị hàng', preparing: '🚚 Bàn giao vận chuyển', shipping: '🏠 Đã giao hàng', pending: '✅ Xác nhận đơn' };
const shipLabel = { standard: 'Tiêu chuẩn', express: 'Hỏa tốc', economy: 'Tiết kiệm' };

export default function StaffOrderManagement() {
  const [orders, setOrders] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState({ status: '', search: '', shippingMethod: '', callConfirmed: '', from: '', to: '' });
  const [selected, setSelected] = useState(null);
  const [callNote, setCallNote] = useState('');
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    api.get('/orders', { params: { page, limit: 20, ...filter } })
      .then(r => { setOrders(r.data.items || []); setTotal(r.data.pagination?.total || 0); })
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, [page, filter]);

  const updateStatus = async (id, status) => {
    await api.put(`/orders/${id}/status`, { status });
    toast.success(`Cập nhật: ${statusLabel[status]}`);
    load();
    if (selected?.id === id) setSelected({ ...selected, status });
  };

  const saveCall = async (id, confirmed) => {
    await api.put(`/orders/${id}/status`, { callConfirmed: confirmed, callNote });
    toast.success(confirmed ? 'Đã xác nhận cuộc gọi' : 'Đã ghi chú cuộc gọi');
    load();
  };

  const openDetail = async (order) => {
    const r = await api.get(`/orders/${order.id}`);
    setSelected(r.data); setCallNote(r.data.callNote || '');
  };

  const totalPages = Math.ceil(total / 20);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Quản Lý Đơn Hàng</h1>

      <div className="bg-white rounded-xl shadow p-4 mb-4">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          <input placeholder="Tìm mã ĐH, tên, SĐT..." value={filter.search} onChange={e => { setFilter({ ...filter, search: e.target.value }); setPage(1); }} className="border rounded-lg px-3 py-2 text-sm col-span-2" />
          <select value={filter.status} onChange={e => { setFilter({ ...filter, status: e.target.value }); setPage(1); }} className="border rounded-lg px-3 py-2 text-sm">
            <option value="">Tất cả trạng thái</option>
            {Object.entries(statusLabel).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <select value={filter.shippingMethod} onChange={e => { setFilter({ ...filter, shippingMethod: e.target.value }); setPage(1); }} className="border rounded-lg px-3 py-2 text-sm">
            <option value="">Tất cả vận chuyển</option>
            <option value="standard">Tiêu chuẩn</option>
            <option value="express">Hỏa tốc</option>
            <option value="economy">Tiết kiệm</option>
          </select>
          <select value={filter.callConfirmed} onChange={e => { setFilter({ ...filter, callConfirmed: e.target.value }); setPage(1); }} className="border rounded-lg px-3 py-2 text-sm">
            <option value="">Tất cả cuộc gọi</option>
            <option value="true">Đã gọi xác nhận</option>
            <option value="false">Chưa gọi</option>
          </select>
          <input type="date" value={filter.from} onChange={e => { setFilter({ ...filter, from: e.target.value }); setPage(1); }} className="border rounded-lg px-3 py-2 text-sm" />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <span className="text-sm text-gray-500">Tổng: {total} đơn hàng</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                {['Mã ĐH', 'Khách hàng', 'SĐT', 'Vận chuyển', 'Tổng tiền', 'Trạng thái', 'Gọi xác nhận', 'Hành động'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs text-gray-500 font-semibold uppercase whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? <tr><td colSpan={8} className="text-center py-12 text-gray-400">Đang tải...</td></tr>
                : orders.length === 0 ? <tr><td colSpan={8} className="text-center py-12 text-gray-400">Không có đơn hàng</td></tr>
                : orders.map(o => (
                  <tr key={o.id} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-3"><code className="text-xs font-mono text-rose-600">{o.orderCode}</code></td>
                    <td className="px-4 py-3 font-medium text-gray-800 max-w-[140px] truncate">{o.shippingName || o.User?.fullName}</td>
                    <td className="px-4 py-3 text-gray-600">{o.shippingPhone}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{shipLabel[o.shippingMethod]}</td>
                    <td className="px-4 py-3 font-medium">{parseFloat(o.total).toLocaleString()}đ</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor[o.status]}`}>{statusLabel[o.status]}</span>
                    </td>
                    <td className="px-4 py-3">
                      {o.callConfirmed
                        ? <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">✓ Đã gọi</span>
                        : <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">Chưa gọi</span>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button onClick={() => openDetail(o)} className="text-xs border px-2 py-1 rounded hover:bg-gray-50">Xem</button>
                        {nextStatus[o.status] && (
                          <button onClick={() => updateStatus(o.id, nextStatus[o.status])} className="text-xs bg-rose-100 text-rose-700 px-2 py-1 rounded hover:bg-rose-200">
                            {nextLabel[o.status]}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
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

      {selected && (
        <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 pt-10 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl p-6 mb-10">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold">Chi tiết đơn hàng <code className="text-rose-600">{selected.orderCode}</code></h2>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-5 bg-gray-50 rounded-lg p-4 text-sm">
              <div><p className="text-gray-400 text-xs">Khách hàng</p><p className="font-medium">{selected.shippingName}</p></div>
              <div><p className="text-gray-400 text-xs">Điện thoại</p><p className="font-medium text-rose-600">{selected.shippingPhone}</p></div>
              <div className="col-span-2"><p className="text-gray-400 text-xs">Địa chỉ</p><p className="font-medium">{selected.shippingAddress}</p></div>
              <div><p className="text-gray-400 text-xs">Vận chuyển</p><p>{shipLabel[selected.shippingMethod]}</p></div>
              <div><p className="text-gray-400 text-xs">Trạng thái</p><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor[selected.status]}`}>{statusLabel[selected.status]}</span></div>
              <div><p className="text-gray-400 text-xs">Phí ship</p><p>{parseFloat(selected.shippingFee).toLocaleString()}đ</p></div>
              <div><p className="text-gray-400 text-xs">Tổng tiền</p><p className="font-bold text-rose-600">{parseFloat(selected.total).toLocaleString()}đ</p></div>
            </div>

            <h3 className="font-semibold mb-2 text-sm">Sản phẩm:</h3>
            <div className="space-y-2 mb-5">
              {selected.OrderDetails?.map(d => (
                <div key={d.id} className="flex items-center gap-3 border rounded-lg p-3">
                  <img src={d.productImage} className="w-10 h-10 rounded object-cover bg-gray-100" onError={e => { e.target.src = 'https://placehold.co/40?text=...'; }} />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{d.productName}</p>
                    <p className="text-xs text-gray-500">SL: {d.quantity} × {parseFloat(d.unitPrice).toLocaleString()}đ</p>
                  </div>
                  <p className="font-semibold text-sm">{parseFloat(d.totalPrice).toLocaleString()}đ</p>
                </div>
              ))}
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-5">
              <h3 className="font-semibold text-sm mb-3 text-amber-800">📞 Xác nhận cuộc gọi</h3>
              <textarea value={callNote} onChange={e => setCallNote(e.target.value)} placeholder="Ghi chú cuộc gọi xác nhận..." rows={2} className="w-full border rounded-lg px-3 py-2 text-sm resize-none mb-3" />
              <div className="flex gap-3">
                <button onClick={() => saveCall(selected.id, true)} className="flex-1 bg-green-500 text-white py-2 rounded-lg text-sm hover:bg-green-600">✓ Đã gọi & xác nhận</button>
                <button onClick={() => saveCall(selected.id, false)} className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg text-sm hover:bg-gray-300">Lưu ghi chú</button>
              </div>
            </div>

            <div className="flex gap-3">
              {nextStatus[selected.status] && (
                <button onClick={() => { updateStatus(selected.id, nextStatus[selected.status]); setSelected(null); }}
                  className="flex-1 bg-rose-500 text-white py-2 rounded-lg font-medium hover:bg-rose-600">
                  {nextLabel[selected.status]}
                </button>
              )}
              {selected.status !== 'cancelled' && selected.status !== 'completed' && (
                <button onClick={() => { updateStatus(selected.id, 'cancelled'); setSelected(null); }}
                  className="border border-red-300 text-red-500 px-4 py-2 rounded-lg hover:bg-red-50 text-sm">
                  Hủy đơn
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

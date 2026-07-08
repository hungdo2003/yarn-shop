import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { formatCurrency } from '../../utils/formatters';
import { FiX } from 'react-icons/fi';

const STATUS = {
  pending_payment: { label: 'Chờ khách TT',     color: 'bg-rose-100 text-rose-700' },
  pending:         { label: 'Chờ xét duyệt',    color: 'bg-yellow-100 text-yellow-700' },
  approved:        { label: 'Đã duyệt',          color: 'bg-blue-100 text-blue-700' },
  goods_received:  { label: 'Đã nhận hàng',      color: 'bg-purple-100 text-purple-700' },
  shipping_new:    { label: 'Đang giao mới',     color: 'bg-indigo-100 text-indigo-700' },
  rejected:        { label: 'Từ chối',           color: 'bg-red-100 text-red-700' },
  completed:       { label: 'Hoàn thành',        color: 'bg-green-100 text-green-700' },
};

// What actions are available per status & type
function getActions(r) {
  const { status, type, priceDiff } = r;
  if (status === 'pending_payment') return [];
  if (status === 'pending') return [
    { key: 'approved', label: 'Chấp nhận ✅', cls: 'bg-green-500 hover:bg-green-600 text-white' },
    { key: 'rejected', label: 'Từ chối ✕',   cls: 'bg-red-500 hover:bg-red-600 text-white' },
  ];
  if (status === 'approved') {
    return [{
      key: 'goods_received',
      label: type === 'return' ? '📦 Đã nhận hàng → Hoàn tiền ngay' : '📦 Đã nhận hàng cũ → Giao hàng mới',
      cls: 'bg-purple-500 hover:bg-purple-600 text-white',
    }];
  }
  if (status === 'shipping_new' && type === 'exchange') return [{
    key: 'completed',
    label: parseFloat(priceDiff || 0) < 0
      ? `✅ Hoàn tất → Hoàn ${formatCurrency(Math.abs(priceDiff))} vào ví`
      : '✅ Hoàn tất đổi hàng',
    cls: 'bg-green-500 hover:bg-green-600 text-white',
  }];
  return [];
}

export default function ComplaintManagement() {
  const [requests, setRequests] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState({ status: '', type: '' });
  const [selected, setSelected] = useState(null);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const load = () => {
    setLoading(true);
    api.get('/returns', { params: { page, limit: 20, ...filter } })
      .then(r => { setRequests(r.data.data || []); setTotal(r.data.total || 0); })
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, [page, filter]);

  const updateStatus = async (id, status) => {
    setUpdating(true);
    try {
      await api.patch(`/returns/${id}`, { status, staffNote: note });
      toast.success(`Cập nhật: ${STATUS[status]?.label || status}`);
      setSelected(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi cập nhật');
    } finally { setUpdating(false); }
  };

  const totalPages = Math.ceil(total / 20);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Khiếu Nại & Đổi Trả</h1>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4 flex flex-wrap gap-3">
        <select value={filter.status} onChange={e => { setFilter({ ...filter, status: e.target.value }); setPage(1); }}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-rose-400">
          <option value="">Tất cả trạng thái</option>
          {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <select value={filter.type} onChange={e => { setFilter({ ...filter, type: e.target.value }); setPage(1); }}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-rose-400">
          <option value="">Tất cả loại</option>
          <option value="return">↩ Trả hàng</option>
          <option value="exchange">🔄 Đổi hàng</option>
        </select>
        <div className="ml-auto text-sm text-gray-400 flex items-center">{total} yêu cầu</div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Mã', 'Khách hàng', 'Đơn hàng', 'Loại', 'Trạng thái', 'Ngày tạo', ''].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs text-gray-500 font-semibold uppercase whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center py-12 text-gray-400">Đang tải...</td></tr>
              ) : requests.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-gray-400">Không có yêu cầu nào</td></tr>
              ) : requests.map(r => {
                const st = STATUS[r.status] || STATUS.pending;
                const actions = getActions(r);
                const hasPending = actions.some(a => !a.disabled);
                return (
                  <tr key={r.id} className={`border-t hover:bg-gray-50 ${hasPending ? 'bg-yellow-50/30' : ''}`}>
                    <td className="px-4 py-3"><code className="text-xs font-mono text-gray-500">{r.code}</code></td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-800">{r.User?.fullName}</p>
                      <p className="text-xs text-gray-400">{r.User?.phone}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-xs font-mono text-rose-600">{r.Order?.orderCode}</p>
                      <p className="text-xs text-gray-400">{formatCurrency(r.Order?.total)}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${r.type === 'return' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>
                        {r.type === 'return' ? '↩ Trả hàng' : '🔄 Đổi hàng'}
                      </span>
                      {r.type === 'exchange' && r.ExchangeProduct && (
                        <p className="text-[10px] text-gray-400 mt-0.5 max-w-[120px] truncate">→ {r.ExchangeProduct.name}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${st.color}`}>{st.label}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                      {new Date(r.createdAt).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => { setSelected(r); setNote(r.staffNote || ''); }}
                        className="text-xs border border-gray-200 px-2.5 py-1 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition">
                        Xem / Xử lý
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 p-4 border-t">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="px-3 py-1 border rounded-lg text-sm disabled:opacity-40 hover:bg-gray-50">‹</button>
            <span className="text-sm text-gray-600 px-2">{page} / {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="px-3 py-1 border rounded-lg text-sm disabled:opacity-40 hover:bg-gray-50">›</button>
          </div>
        )}
      </div>

      {/* Detail modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b sticky top-0 bg-white rounded-t-2xl">
              <h2 className="text-xl font-bold text-gray-800">Chi Tiết Yêu Cầu</h2>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600"><FiX size={20} /></button>
            </div>

            <div className="px-6 py-4 space-y-4">
              {/* Info */}
              <div className="bg-gray-50 rounded-xl p-4 text-sm space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-400">Mã yêu cầu</span>
                  <code className="font-mono text-gray-700">{selected.code}</code>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Khách hàng</span>
                  <span className="font-medium">{selected.User?.fullName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Email</span>
                  <span className="text-gray-600">{selected.User?.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Đơn hàng</span>
                  <span className="font-mono text-rose-600">#{selected.Order?.orderCode} — {formatCurrency(selected.Order?.total)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Loại</span>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${selected.type === 'return' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>
                    {selected.type === 'return' ? '↩ Trả hàng' : '🔄 Đổi hàng'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Trạng thái</span>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS[selected.status]?.color}`}>{STATUS[selected.status]?.label}</span>
                </div>
              </div>

              {/* Reason */}
              <div>
                <p className="text-sm font-medium text-gray-700 mb-1">Lý do</p>
                <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">{selected.reason}</p>
                {selected.customerNote && <p className="text-xs text-gray-400 mt-1">Ghi chú: {selected.customerNote}</p>}
              </div>

              {/* Exchange product */}
              {selected.type === 'exchange' && selected.ExchangeProduct && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Sản phẩm muốn đổi sang</p>
                  <div className="flex items-center gap-3 bg-blue-50 rounded-xl p-3">
                    {selected.ExchangeProduct.thumbnailImage
                      ? <img src={selected.ExchangeProduct.thumbnailImage} alt="" className="w-12 h-12 rounded-lg object-cover shrink-0" />
                      : <span className="text-2xl shrink-0">🧶</span>}
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-800">{selected.ExchangeProduct.name}</p>
                      <p className="text-sm font-bold text-blue-600">
                        {formatCurrency(selected.ExchangeProduct.salePrice || selected.ExchangeProduct.price)}
                        {selected.exchangeProductQty > 1 && ` × ${selected.exchangeProductQty}`}
                      </p>
                    </div>
                  </div>
                  <div className={`mt-2 rounded-xl px-3 py-2.5 text-sm ${
                    parseFloat(selected.priceDiff || 0) > 0 ? 'bg-rose-50 border border-rose-200'
                    : parseFloat(selected.priceDiff || 0) < 0 ? 'bg-green-50 border border-green-100'
                    : 'bg-gray-50 border border-gray-100'}`}>
                    {parseFloat(selected.priceDiff || 0) > 0 && (
                      <>
                        <p className="font-semibold text-rose-600">Khách đã thanh toán thêm: {formatCurrency(selected.priceDiff)}</p>
                        <p className="text-xs mt-0.5 text-rose-400">
                          ✅ Đã trừ ví lúc {new Date(selected.extraPaidAt).toLocaleString('vi-VN')}
                        </p>
                      </>
                    )}
                    {parseFloat(selected.priceDiff || 0) < 0 && (
                      <p className="font-semibold text-green-600">Cần hoàn lại: {formatCurrency(Math.abs(selected.priceDiff))} (khi hoàn tất)</p>
                    )}
                    {parseFloat(selected.priceDiff || 0) === 0 && (
                      <p className="text-gray-500">Giá trị tương đương — không phát sinh thêm</p>
                    )}
                  </div>
                </div>
              )}

              {/* Images */}
              {selected.images?.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Hình ảnh đính kèm</p>
                  <div className="flex gap-2 flex-wrap">
                    {selected.images.map((img, i) => (
                      <a key={i} href={img} target="_blank" rel="noopener noreferrer">
                        <img src={img} className="w-16 h-16 rounded-lg object-cover border hover:opacity-80 transition" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Staff note */}
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">Phản hồi / ghi chú cho khách</label>
                <textarea value={note} onChange={e => setNote(e.target.value)} rows={3}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-rose-400"
                  placeholder="Nhập phản hồi gửi cho khách..." />
              </div>

              {/* Action buttons */}
              {(() => {
                const actions = getActions(selected);
                if (!actions.length) {
                  return <p className="text-sm text-gray-400 text-center py-2">Yêu cầu đã hoàn tất</p>;
                }
                return (
                  <div className="space-y-2">
                    {actions.map(action => (
                      <div key={action.key}>
                        {action.note && <p className="text-xs text-orange-500 mb-1">{action.note}</p>}
                        <button
                          onClick={() => !action.disabled && updateStatus(selected.id, action.key)}
                          disabled={action.disabled || updating}
                          className={`w-full py-2.5 rounded-xl font-semibold text-sm transition active:scale-95 disabled:opacity-50 ${action.cls}`}>
                          {updating ? 'Đang xử lý...' : action.label}
                        </button>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import { useState } from 'react';
import useFetch from '../../hooks/useFetch';
import api from '../../services/api';
import { formatCurrency, formatDate, CUSTOM_STATUS_LABEL, CUSTOM_STATUS_COLOR } from '../../utils/formatters';
import Spinner from '../../components/common/Spinner';
import Pagination from '../../components/common/Pagination';
import toast from 'react-hot-toast';
import { FiEye, FiX, FiAlertCircle, FiCheckCircle, FiClock } from 'react-icons/fi';

// Which statuses staff can transition to from each current status
const NEXT_STATUSES = {
  submitted:     ['reviewing', 'cancelled'],
  reviewing:     ['quoted', 'cancelled'],
  quoted:        ['cancelled'],
  deposit_paid:  ['in_production', 'cancelled'],
  in_production: ['completed', 'cancelled'],
  completed:     ['delivered'],
  delivered:     [],
  cancelled:     [],
};

const STATUS_LABEL_VI = {
  reviewing:     'Bắt đầu xem xét',
  quoted:        'Gửi báo giá cho khách',
  cancelled:     'Hủy đơn',
  in_production: 'Bắt đầu sản xuất',
  completed:     'Hoàn thành sản phẩm',
  delivered:     'Đã giao hàng',
};

const STATUS_COLORS = {
  submitted: 'bg-blue-100 text-blue-700',
  reviewing: 'bg-yellow-100 text-yellow-700',
  quoted: 'bg-purple-100 text-purple-700',
  deposit_paid: 'bg-indigo-100 text-indigo-700',
  in_production: 'bg-orange-100 text-orange-700',
  completed: 'bg-green-100 text-green-700',
  delivered: 'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-red-100 text-red-700',
};

function OrderModal({ order, onClose, onSave }) {
  const nextOptions = NEXT_STATUSES[order.status] || [];
  const [form, setForm] = useState({
    status: nextOptions[0] || order.status,
    quotedPrice: order.quotedPrice || '',
    depositAmount: order.depositAmount || '',
    estimatedDays: order.estimatedDays || '',
    staffNote: order.staffNote || '',
  });
  const [loading, setLoading] = useState(false);
  const isQuoting = form.status === 'quoted';
  const isPaid = order.status === 'deposit_paid';
  const isWaitingPayment = order.status === 'quoted';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isQuoting && !form.quotedPrice) {
      toast.error('Vui lòng nhập giá báo');
      return;
    }
    setLoading(true);
    try {
      await api.put(`/custom-orders/${order.id}/status`, form);
      toast.success('Đã cập nhật đơn hàng');
      onSave();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Cập nhật thất bại');
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <div>
            <h3 className="font-bold text-gray-800">#{order.code}</h3>
            <p className="text-sm text-gray-500">{order.User?.fullName} · {order.User?.phone}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${STATUS_COLORS[order.status]}`}>
              {CUSTOM_STATUS_LABEL[order.status]}
            </span>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1"><FiX size={18} /></button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          {/* Payment status banner */}
          {isWaitingPayment && (
            <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-700">
              <FiClock size={15} className="shrink-0" />
              <span>Đã gửi báo giá — <strong>chờ khách hàng thanh toán</strong> để tiếp tục</span>
            </div>
          )}
          {isPaid && (
            <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-sm text-emerald-700">
              <FiCheckCircle size={15} className="shrink-0" />
              <span>Khách đã thanh toán — có thể <strong>bắt đầu sản xuất</strong></span>
            </div>
          )}

          {/* Customer request */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
            <p className="font-semibold text-gray-700">Yêu cầu của khách</p>
            <p className="text-gray-700 leading-relaxed">{order.description}</p>
            <div className="flex gap-4 flex-wrap text-xs text-gray-500 pt-1">
              {order.yarnColor && <span>🎨 {order.yarnColor}</span>}
              {order.size && <span>📐 {order.size}</span>}
              {order.User?.walletBalance !== undefined && (
                <span>💰 Số dư ví: <strong className={parseFloat(order.User.walletBalance) >= parseFloat(order.quotedPrice || 0) ? 'text-emerald-600' : 'text-red-500'}>
                  {formatCurrency(order.User.walletBalance)}
                </strong></span>
              )}
            </div>
            {order.CustomOrderImages?.length > 0 && (
              <div className="flex gap-2 mt-2 flex-wrap">
                {order.CustomOrderImages.map((img, i) => (
                  <img key={i} src={img.imageUrl} alt="" className="w-16 h-16 rounded-lg object-cover border" />
                ))}
              </div>
            )}
          </div>

          {/* Existing quote summary (if already quoted) */}
          {order.quotedPrice && (
            <div className="bg-purple-50 border border-purple-100 rounded-xl px-4 py-3 text-sm space-y-1">
              <p className="font-semibold text-purple-700">Báo giá hiện tại</p>
              <div className="flex justify-between"><span className="text-gray-600">Giá:</span><span className="font-bold text-purple-700">{formatCurrency(order.quotedPrice)}</span></div>
              {order.depositAmount && <div className="flex justify-between"><span className="text-gray-600">Đặt cọc:</span><span>{formatCurrency(order.depositAmount)}</span></div>}
              {order.estimatedDays && <div className="flex justify-between"><span className="text-gray-600">Dự kiến:</span><span>{order.estimatedDays} ngày</span></div>}
              {order.depositPaidAt && <div className="flex justify-between"><span className="text-gray-600">Ngày TT:</span><span className="text-emerald-600 font-medium">{formatDate(order.depositPaidAt)}</span></div>}
            </div>
          )}

          {nextOptions.length === 0 ? (
            <div className="text-center py-4 text-gray-400 text-sm">
              {order.status === 'delivered' ? 'Đơn hàng đã hoàn tất' : 'Không có thao tác tiếp theo'}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Action selector */}
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-2 block">Thao tác tiếp theo</label>
                <div className="space-y-2">
                  {nextOptions.map(s => (
                    <label key={s} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition ${
                      form.status === s
                        ? s === 'cancelled' ? 'border-red-400 bg-red-50' : 'border-rose-400 bg-rose-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}>
                      <input type="radio" name="status" value={s} checked={form.status === s}
                        onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                        className="accent-rose-500" />
                      <span className={`text-sm font-medium ${form.status === s ? (s === 'cancelled' ? 'text-red-700' : 'text-rose-700') : 'text-gray-700'}`}>
                        {STATUS_LABEL_VI[s] || CUSTOM_STATUS_LABEL[s]}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Quote fields — only show when setting to quoted */}
              {form.status === 'quoted' && (
                <div className="space-y-3 border border-purple-200 bg-purple-50 rounded-xl p-4">
                  <p className="text-sm font-semibold text-purple-700">Thông tin báo giá</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-gray-600 mb-1 block">Giá báo (đ) *</label>
                      <input type="number" min="0" value={form.quotedPrice}
                        onChange={e => setForm(f => ({ ...f, quotedPrice: e.target.value }))}
                        placeholder="VD: 250000" className="input w-full text-base" required />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-600 mb-1 block">Đặt cọc (đ)</label>
                      <input type="number" min="0" value={form.depositAmount}
                        onChange={e => setForm(f => ({ ...f, depositAmount: e.target.value }))}
                        placeholder="Để trống = thanh toán đủ" className="input w-full text-base" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600 mb-1 block">Thời gian dự kiến (ngày)</label>
                    <input type="number" min="1" value={form.estimatedDays}
                      onChange={e => setForm(f => ({ ...f, estimatedDays: e.target.value }))}
                      placeholder="VD: 7" className="input w-full text-base" />
                  </div>
                  <p className="text-xs text-purple-600 flex items-center gap-1">
                    <FiAlertCircle size={11} />
                    Khách hàng sẽ nhận thông báo và thanh toán qua ví
                  </p>
                </div>
              )}

              {/* Staff note */}
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Ghi chú cho khách hàng</label>
                <textarea value={form.staffNote} onChange={e => setForm(f => ({ ...f, staffNote: e.target.value }))}
                  rows={2} placeholder="Thêm ghi chú nếu cần..." className="input w-full text-base resize-none" />
              </div>

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={onClose} className="btn-secondary flex-1 text-sm">Đóng</button>
                <button type="submit" disabled={loading}
                  className={`flex-1 text-sm py-2 rounded-xl font-semibold transition ${
                    form.status === 'cancelled'
                      ? 'bg-red-500 hover:bg-red-600 text-white'
                      : 'btn-primary'
                  } disabled:opacity-50`}>
                  {loading ? 'Đang lưu...' : form.status === 'cancelled' ? 'Xác nhận hủy đơn' : 'Cập nhật'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CustomOrderManagement() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [selected, setSelected] = useState(null);
  const { data, loading, refetch } = useFetch('/custom-orders', { page, limit: 10, status: statusFilter });

  const FILTER_TABS = [
    { value: '', label: 'Tất cả' },
    { value: 'submitted', label: 'Mới gửi' },
    { value: 'reviewing', label: 'Đang xét' },
    { value: 'quoted', label: 'Chờ thanh toán' },
    { value: 'deposit_paid', label: 'Đã thanh toán' },
    { value: 'in_production', label: 'Sản xuất' },
    { value: 'completed', label: 'Hoàn thành' },
    { value: 'delivered', label: 'Đã giao' },
    { value: 'cancelled', label: 'Đã hủy' },
  ];

  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-xl font-bold text-gray-800">Đơn Hàng Thiết Kế</h1>
        <p className="text-sm text-gray-400 mt-0.5">Quản lý các yêu cầu đặt hàng theo thiết kế riêng</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTER_TABS.map(tab => (
          <button key={tab.value} onClick={() => { setStatusFilter(tab.value); setPage(1); }}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition ${
              statusFilter === tab.value ? 'bg-rose-500 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}>
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? <Spinner /> : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b text-xs text-gray-500 uppercase tracking-wide">
                {[
                  ['Mã đơn', ''], ['Khách hàng', ''], ['Mô tả', 'hidden md:table-cell'],
                  ['Giá báo', 'hidden md:table-cell'], ['Trạng thái', ''], ['Ngày tạo', 'hidden md:table-cell'], ['', '']
                ].map(([h, cls]) => (
                  <th key={h} className={`text-left px-4 py-3 font-semibold ${cls}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {data?.items?.length === 0 && (
                <tr><td colSpan={7} className="text-center py-10 text-gray-400">Không có đơn hàng nào</td></tr>
              )}
              {data?.items?.map(order => {
                const isWaiting = order.status === 'quoted';
                const isPaid = order.status === 'deposit_paid';
                return (
                  <tr key={order.id} className={`hover:bg-gray-50 transition ${isWaiting ? 'bg-amber-50/40' : ''}`}>
                    <td className="px-4 py-3 font-mono text-xs font-bold text-rose-500">{order.code}</td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-gray-800">{order.User?.fullName}</p>
                      <p className="text-xs text-gray-400">{order.User?.phone}</p>
                    </td>
                    <td className="px-4 py-3 max-w-[200px] hidden md:table-cell">
                      <p className="line-clamp-2 text-xs text-gray-600">{order.description}</p>
                      {(order.yarnColor || order.size) && (
                        <p className="text-[10px] text-gray-400 mt-0.5">
                          {[order.yarnColor, order.size].filter(Boolean).join(' · ')}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      {order.quotedPrice
                        ? <span className="font-bold text-purple-700">{formatCurrency(order.quotedPrice)}</span>
                        : <span className="text-gray-300 text-xs">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        <span className={`text-xs px-2.5 py-1 rounded-full font-semibold w-fit ${STATUS_COLORS[order.status]}`}>
                          {CUSTOM_STATUS_LABEL[order.status]}
                        </span>
                        {isWaiting && <span className="text-[10px] text-amber-600 flex items-center gap-1"><FiClock size={10} /> Chờ TT</span>}
                        {isPaid && <span className="text-[10px] text-emerald-600 flex items-center gap-1"><FiCheckCircle size={10} /> Đã TT</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs hidden md:table-cell">{formatDate(order.createdAt)}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => setSelected(order)}
                        className="flex items-center gap-1.5 text-xs font-medium text-blue-500 hover:text-blue-700 hover:bg-blue-50 px-2.5 py-1.5 rounded-lg transition">
                        <FiEye size={13} /> Xử lý
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
          <div className="px-4 pb-3">
            <Pagination pagination={data?.pagination} onPageChange={setPage} />
          </div>
        </div>
      )}

      {selected && (
        <OrderModal
          order={selected}
          onClose={() => setSelected(null)}
          onSave={() => { setSelected(null); refetch(); }}
        />
      )}
    </div>
  );
}

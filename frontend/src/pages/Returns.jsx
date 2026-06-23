import { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import Pagination from '../components/common/Pagination';

const PER_PAGE = 10;

const statusColor = { pending: 'bg-yellow-100 text-yellow-700', approved: 'bg-blue-100 text-blue-700', rejected: 'bg-red-100 text-red-700', completed: 'bg-green-100 text-green-700' };
const statusLabel = { pending: 'Chờ xử lý', approved: 'Đã duyệt', rejected: 'Từ chối', completed: 'Hoàn thành' };

export default function Returns() {
  const [returns, setReturns] = useState([]);
  const [orders, setOrders] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ orderId: '', type: 'return', reason: '', customerNote: '' });
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    api.get('/returns/my').then(r => setReturns(r.data)).finally(() => setLoading(false));
    api.get('/orders/my?status=completed&limit=50').then(r => setOrders(r.data.data || []));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, v));
    files.forEach(f => fd.append('images', f));
    try {
      await api.post('/returns', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Yêu cầu đã được gửi!');
      setShowForm(false);
      api.get('/returns/my').then(r => setReturns(r.data));
    } catch (err) { toast.error(err.response?.data?.message || 'Lỗi gửi yêu cầu'); }
  };

  const filtered = filter ? returns.filter(r => r.status === filter) : returns;
  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Đổi Trả & Khiếu Nại</h1>
        <button onClick={() => setShowForm(true)} className="bg-rose-500 text-white px-4 py-2 rounded-lg hover:bg-rose-600 text-sm font-medium">+ Yêu cầu đổi/trả</button>
      </div>

      <div className="flex gap-2 mb-6">
        {['', 'pending', 'approved', 'rejected', 'completed'].map(s => (
          <button key={s} onClick={() => { setFilter(s); setPage(1); }} className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${filter === s ? 'bg-rose-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {s ? statusLabel[s] : 'Tất cả'}
          </button>
        ))}
      </div>

      {loading ? <div className="text-center py-12 text-gray-400">Đang tải...</div> : filtered.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl shadow text-gray-400">
          <p className="text-5xl mb-3">📦</p>
          <p>Không có yêu cầu nào</p>
        </div>
      ) : (
        <div className="space-y-4">
          {paginated.map(r => (
            <div key={r.id} className="bg-white rounded-xl shadow p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <code className="font-mono text-sm text-gray-500">{r.code}</code>
                  <p className="font-semibold text-gray-800 mt-0.5">Đơn hàng: {r.Order?.orderCode}</p>
                </div>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusColor[r.status]}`}>{statusLabel[r.status]}</span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm text-gray-600">
                <div><span className="text-gray-400">Loại:</span> {r.type === 'return' ? 'Trả hàng' : 'Đổi hàng'}</div>
                <div><span className="text-gray-400">Ngày tạo:</span> {new Date(r.createdAt).toLocaleDateString('vi-VN')}</div>
              </div>
              <p className="text-sm text-gray-700 mt-2"><span className="text-gray-400">Lý do:</span> {r.reason}</p>
              {r.staffNote && <p className="text-sm text-blue-700 bg-blue-50 rounded p-2 mt-2"><span className="font-medium">Phản hồi:</span> {r.staffNote}</p>}
            </div>
          ))}
          <Pagination pagination={{ page, totalPages }} onPageChange={setPage} />
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-5">Yêu Cầu Đổi/Trả Hàng</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm text-gray-600 block mb-1">Chọn đơn hàng *</label>
                <select required value={form.orderId} onChange={e => setForm({ ...form, orderId: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm">
                  <option value="">-- Chọn đơn hàng --</option>
                  {orders.map(o => <option key={o.id} value={o.id}>{o.orderCode} – {new Date(o.createdAt).toLocaleDateString('vi-VN')}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm text-gray-600 block mb-1">Loại yêu cầu *</label>
                <div className="flex gap-4">
                  {[{ v: 'return', l: 'Trả hàng' }, { v: 'exchange', l: 'Đổi hàng' }].map(opt => (
                    <label key={opt.v} className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" value={opt.v} checked={form.type === opt.v} onChange={e => setForm({ ...form, type: e.target.value })} className="accent-rose-500" />
                      <span className="text-sm">{opt.l}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm text-gray-600 block mb-1">Lý do *</label>
                <textarea required rows={3} value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} placeholder="Mô tả lý do đổi/trả hàng..." className="w-full border rounded-lg px-3 py-2 text-sm resize-none" />
              </div>
              <div>
                <label className="text-sm text-gray-600 block mb-1">Ghi chú thêm</label>
                <input value={form.customerNote} onChange={e => setForm({ ...form, customerNote: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-sm text-gray-600 block mb-1">Hình ảnh (tối đa 5)</label>
                <input type="file" accept="image/*" multiple onChange={e => setFiles(Array.from(e.target.files).slice(0, 5))} className="w-full text-sm" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 border py-2 rounded-lg text-gray-700 hover:bg-gray-50">Huỷ</button>
                <button type="submit" className="flex-1 bg-rose-500 text-white py-2 rounded-lg hover:bg-rose-600 font-medium">Gửi yêu cầu</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

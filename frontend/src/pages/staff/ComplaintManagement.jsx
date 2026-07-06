import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const statusColor = { pending: 'bg-yellow-100 text-yellow-700', approved: 'bg-blue-100 text-blue-700', rejected: 'bg-red-100 text-red-700', completed: 'bg-green-100 text-green-700' };
const statusLabel = { pending: 'Chờ xử lý', approved: 'Đã duyệt', rejected: 'Từ chối', completed: 'Hoàn thành' };

export default function ComplaintManagement() {
  const [requests, setRequests] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState({ status: '', type: '' });
  const [selected, setSelected] = useState(null);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    api.get('/returns', { params: { page, limit: 20, ...filter } })
      .then(r => { setRequests(r.data.data || []); setTotal(r.data.total || 0); })
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, [page, filter]);

  const updateStatus = async (id, status) => {
    await api.patch(`/returns/${id}`, { status, staffNote: note });
    toast.success(`Cập nhật: ${statusLabel[status]}`);
    setSelected(null); load();
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Khiếu Nại & Đổi Trả</h1>

      <div className="bg-white rounded-xl shadow p-4 mb-4">
        <div className="flex flex-wrap gap-3">
          <select value={filter.status} onChange={e => { setFilter({ ...filter, status: e.target.value }); setPage(1); }} className="border rounded-lg px-3 py-2 text-sm">
            <option value="">Tất cả trạng thái</option>
            {Object.entries(statusLabel).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <select value={filter.type} onChange={e => { setFilter({ ...filter, type: e.target.value }); setPage(1); }} className="border rounded-lg px-3 py-2 text-sm">
            <option value="">Tất cả loại</option>
            <option value="return">Trả hàng</option>
            <option value="exchange">Đổi hàng</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                {[['Mã', ''], ['Khách hàng', ''], ['Đơn hàng', 'hidden md:table-cell'], ['Loại', ''], ['Lý do', 'hidden md:table-cell'], ['Trạng thái', ''], ['Ngày tạo', 'hidden md:table-cell'], ['Hành động', '']].map(([h, cls]) => (
                  <th key={h} className={`text-left px-4 py-3 text-xs text-gray-500 font-semibold uppercase whitespace-nowrap ${cls}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? <tr><td colSpan={8} className="text-center py-12 text-gray-400">Đang tải...</td></tr>
                : requests.length === 0 ? <tr><td colSpan={8} className="text-center py-12 text-gray-400">Không có yêu cầu nào</td></tr>
                : requests.map(r => (
                  <tr key={r.id} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-3"><code className="text-xs font-mono text-gray-500">{r.code}</code></td>
                    <td className="px-4 py-3 font-medium">{r.User?.fullName}</td>
                    <td className="px-4 py-3 text-xs text-rose-600 hidden md:table-cell">{r.Order?.orderCode}</td>
                    <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full ${r.type === 'return' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>{r.type === 'return' ? 'Trả hàng' : 'Đổi hàng'}</span></td>
                    <td className="px-4 py-3 text-xs text-gray-600 max-w-[160px] truncate hidden md:table-cell">{r.reason}</td>
                    <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor[r.status]}`}>{statusLabel[r.status]}</span></td>
                    <td className="px-4 py-3 text-xs text-gray-500 hidden md:table-cell">{new Date(r.createdAt).toLocaleDateString('vi-VN')}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => { setSelected(r); setNote(r.staffNote || ''); }} className="text-xs border px-2 py-1 rounded hover:bg-gray-50">Xử lý</button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
        {Math.ceil(total / 20) > 1 && (
          <div className="flex justify-center gap-2 p-4 border-t">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1 border rounded text-sm disabled:opacity-40">‹</button>
            <span className="text-sm text-gray-600">{page} / {Math.ceil(total / 20)}</span>
            <button onClick={() => setPage(p => Math.min(Math.ceil(total / 20), p + 1))} disabled={page === Math.ceil(total / 20)} className="px-3 py-1 border rounded text-sm disabled:opacity-40">›</button>
          </div>
        )}
      </div>

      {selected && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold">Xử Lý Yêu Cầu</h2>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 mb-4 text-sm space-y-2">
              <p><span className="text-gray-400">Khách hàng:</span> <strong>{selected.User?.fullName}</strong> – {selected.User?.email}</p>
              <p><span className="text-gray-400">Đơn hàng:</span> <code className="text-rose-600">{selected.Order?.orderCode}</code></p>
              <p><span className="text-gray-400">Loại:</span> {selected.type === 'return' ? 'Trả hàng' : 'Đổi hàng'}</p>
              <p><span className="text-gray-400">Lý do:</span> {selected.reason}</p>
              {selected.customerNote && <p><span className="text-gray-400">Ghi chú KH:</span> {selected.customerNote}</p>}
            </div>
            {selected.images?.length > 0 && (
              <div className="flex gap-2 mb-4">
                {selected.images.map((img, i) => <img key={i} src={img} className="w-16 h-16 rounded object-cover" />)}
              </div>
            )}
            <div className="mb-4">
              <label className="text-sm text-gray-600 block mb-1">Phản hồi / ghi chú</label>
              <textarea value={note} onChange={e => setNote(e.target.value)} rows={3} className="w-full border rounded-lg px-3 py-2 text-base resize-none" placeholder="Nhập phản hồi cho khách..." />
            </div>
            {selected.status === 'pending' && (
              <div className="flex gap-3">
                <button onClick={() => updateStatus(selected.id, 'approved')} className="flex-1 bg-green-500 text-white py-2 rounded-lg font-medium hover:bg-green-600">Chấp nhận</button>
                <button onClick={() => updateStatus(selected.id, 'rejected')} className="flex-1 bg-red-500 text-white py-2 rounded-lg font-medium hover:bg-red-600">Từ chối</button>
              </div>
            )}
            {selected.status === 'approved' && (
              <button onClick={() => updateStatus(selected.id, 'completed')} className="w-full bg-blue-500 text-white py-2 rounded-lg font-medium hover:bg-blue-600">Đánh dấu hoàn thành</button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

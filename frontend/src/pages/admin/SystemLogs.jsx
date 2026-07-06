import { useState, useEffect } from 'react';
import api from '../../services/api';
import Pagination from '../../components/common/Pagination';

const statusBg = { success: 'bg-green-100 text-green-700', failure: 'bg-red-100 text-red-700' };

export default function SystemLogs() {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [filter, setFilter] = useState({ action: '', status: '', resource: '', from: '', to: '' });
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    api.get('/logs', { params: { page, limit, ...filter } })
      .then(r => { setLogs(r.data.data); setTotal(r.data.total); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [page, limit, filter]);

  const totalPages = Math.ceil(total / limit);

  const handleLimitChange = (e) => {
    setLimit(Number(e.target.value));
    setPage(1);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Nhật Ký Hệ Thống</h1>

      <div className="bg-white rounded-xl shadow p-4 mb-4">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <input placeholder="Hành động..." value={filter.action} onChange={e => { setFilter({ ...filter, action: e.target.value }); setPage(1); }} className="border rounded-lg px-3 py-2 text-base" />
          <input placeholder="Tài nguyên..." value={filter.resource} onChange={e => { setFilter({ ...filter, resource: e.target.value }); setPage(1); }} className="border rounded-lg px-3 py-2 text-base" />
          <select value={filter.status} onChange={e => { setFilter({ ...filter, status: e.target.value }); setPage(1); }} className="border rounded-lg px-3 py-2 text-base">
            <option value="">Tất cả trạng thái</option>
            <option value="success">Thành công</option>
            <option value="failure">Thất bại</option>
          </select>
          <input type="date" value={filter.from} onChange={e => { setFilter({ ...filter, from: e.target.value }); setPage(1); }} className="border rounded-lg px-3 py-2 text-base" />
          <input type="date" value={filter.to} onChange={e => { setFilter({ ...filter, to: e.target.value }); setPage(1); }} className="border rounded-lg px-3 py-2 text-base" />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b gap-3 flex-wrap">
          <span className="text-sm text-gray-500">
            Tổng: <strong>{total}</strong> bản ghi
            {totalPages > 1 && <span className="ml-1 text-gray-400">· Trang {page}/{totalPages}</span>}
          </span>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span>Hiển thị</span>
            <select value={limit} onChange={handleLimitChange} className="border rounded-lg px-2 py-1 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-300">
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span>dòng</span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                {[
                  ['Thời gian', ''], ['Người dùng', 'hidden md:table-cell'], ['Hành động', ''],
                  ['Tài nguyên', 'hidden md:table-cell'], ['ID', 'hidden md:table-cell'],
                  ['IP', 'hidden md:table-cell'], ['Trạng thái', '']
                ].map(([h, cls]) => (
                  <th key={h} className={`text-left px-4 py-3 text-xs text-gray-500 font-semibold uppercase ${cls}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center py-12 text-gray-400">Đang tải...</td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-gray-400">Không có log nào</td></tr>
              ) : logs.map(log => (
                <tr key={log.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-2 text-xs text-gray-500 whitespace-nowrap">{new Date(log.createdAt).toLocaleString('vi-VN')}</td>
                  <td className="px-4 py-2 text-xs hidden md:table-cell">{log.User?.email || log.userEmail || <span className="text-gray-400">Khách</span>}</td>
                  <td className="px-4 py-2"><code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">{log.action}</code></td>
                  <td className="px-4 py-2 text-xs text-gray-600 hidden md:table-cell">{log.resource || '–'}</td>
                  <td className="px-4 py-2 text-xs text-gray-500 hidden md:table-cell">{log.resourceId || '–'}</td>
                  <td className="px-4 py-2 text-xs text-gray-500 hidden md:table-cell">{log.ipAddress || '–'}</td>
                  <td className="px-4 py-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusBg[log.status]}`}>{log.status === 'success' ? 'OK' : 'Lỗi'}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination
          pagination={{ page, totalPages }}
          onPageChange={(p) => { setPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
        />
      </div>
    </div>
  );
}

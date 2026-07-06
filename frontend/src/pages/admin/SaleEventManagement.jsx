import { useState, useEffect, useCallback } from 'react';
import { FiTag, FiSearch, FiTrash2, FiChevronRight, FiX, FiCalendar, FiPackage, FiUser } from 'react-icons/fi';
import api from '../../services/api';
import toast from 'react-hot-toast';
import Pagination from '../../components/common/Pagination';

const statusBadge = (event) => {
  const now = new Date();
  if (event.isRemoval) return { label: 'Xóa giảm giá', cls: 'bg-gray-100 text-gray-600' };
  if (!event.saleStartDate && !event.saleEndDate) return { label: 'Không thời hạn', cls: 'bg-blue-50 text-blue-700' };
  const start = event.saleStartDate ? new Date(event.saleStartDate) : null;
  const end = event.saleEndDate ? new Date(event.saleEndDate) : null;
  if (end && end < now) return { label: 'Đã kết thúc', cls: 'bg-gray-100 text-gray-500' };
  if (start && start > now) return { label: 'Sắp diễn ra', cls: 'bg-yellow-50 text-yellow-700' };
  return { label: 'Đang chạy', cls: 'bg-green-50 text-green-700' };
};

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('vi-VN') : '—';

/* ── Detail modal ── */
const EventDetailModal = ({ event, onClose, onDeleted }) => {
  const [deleting, setDeleting] = useState(false);
  const badge = statusBadge(event);

  const handleDelete = async () => {
    if (!window.confirm('Xóa sự kiện này? Hành động không ảnh hưởng đến giá sản phẩm hiện tại.')) return;
    setDeleting(true);
    try {
      await api.delete(`/sale-events/${event.id}`);
      toast.success('Đã xóa sự kiện');
      onDeleted();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Xóa thất bại');
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b">
          <div>
            <h3 className="font-bold text-gray-800 text-lg">{event.name}</h3>
            <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full mt-1 ${badge.cls}`}>{badge.label}</span>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500">
            <FiX size={16} />
          </button>
        </div>

        <div className="px-6 py-4 space-y-3 overflow-y-auto flex-1">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-gray-400 text-xs mb-1">Giảm giá</p>
              <p className="font-semibold text-gray-800">{event.isRemoval ? 'Xóa giảm giá' : event.discountPct ? `${event.discountPct}%` : '—'}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-gray-400 text-xs mb-1">Số sản phẩm</p>
              <p className="font-semibold text-gray-800">{event.productCount} {event.selectAll && <span className="text-xs font-normal text-gray-500">(tất cả)</span>}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-gray-400 text-xs mb-1 flex items-center gap-1"><FiCalendar size={11} /> Bắt đầu</p>
              <p className="font-medium text-gray-700">{fmtDate(event.saleStartDate)}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-gray-400 text-xs mb-1 flex items-center gap-1"><FiCalendar size={11} /> Kết thúc</p>
              <p className="font-medium text-gray-700">{fmtDate(event.saleEndDate)}</p>
            </div>
          </div>

          {event.creator && (
            <div className="flex items-center gap-2 text-sm text-gray-600 bg-blue-50 rounded-xl px-4 py-2.5">
              <FiUser size={13} className="text-blue-400" />
              <span>Tạo bởi <strong>{event.creator.fullName}</strong> · {new Date(event.createdAt).toLocaleString('vi-VN')}</span>
            </div>
          )}

          {event.products?.length > 0 && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1"><FiPackage size={13} /> Sản phẩm áp dụng</p>
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {event.products.map(p => (
                  <div key={p.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
                    {p.thumbnailImage && <img src={p.thumbnailImage} alt="" className="w-9 h-9 rounded-lg object-cover" />}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{p.name}</p>
                      <p className="text-xs text-gray-400">
                        {Number(p.price).toLocaleString('vi-VN')}đ
                        {p.salePrice && <span className="text-rose-500 ml-1">→ {Number(p.salePrice).toLocaleString('vi-VN')}đ</span>}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {event.selectAll && (
            <p className="text-sm text-gray-500 italic">Sự kiện được áp dụng cho tất cả sản phẩm đang bán.</p>
          )}
        </div>

        <div className="px-6 pb-5 pt-3 border-t">
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 font-semibold text-sm transition-all disabled:opacity-60"
          >
            <FiTrash2 size={14} /> {deleting ? 'Đang xóa...' : 'Xóa sự kiện'}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ── Main page ── */
const SaleEventManagement = () => {
  const [data, setData] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [filterRemoval, setFilterRemoval] = useState('');
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page: pagination.page, limit: 20, search, isRemoval: filterRemoval };
      const r = await api.get('/sale-events', { params });
      setData(r.data);
      setPagination(p => ({ ...p, totalPages: r.data.pagination?.totalPages ?? 1 }));
    } catch { toast.error('Tải dữ liệu thất bại'); }
    finally { setLoading(false); }
  }, [pagination.page, search, filterRemoval]);

  useEffect(() => { fetch(); }, [fetch]);

  const openDetail = async (ev) => {
    try {
      const r = await api.get(`/sale-events/${ev.id}`);
      setSelected(r.data);
    } catch { toast.error('Không tải được chi tiết'); }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setSearch(searchInput);
    setPagination(p => ({ ...p, page: 1 }));
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center">
          <FiTag className="text-rose-600" size={20} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-800">Sự kiện khuyến mãi</h1>
          <p className="text-sm text-gray-500">Lịch sử các đợt giảm giá đồng loạt</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <form onSubmit={handleSearch} className="flex gap-2 flex-1 min-w-0">
          <div className="relative flex-1">
            <FiSearch size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              placeholder="Tìm theo tên sự kiện..."
              className="input pl-9 text-sm w-full"
            />
          </div>
          <button type="submit" className="btn-primary px-4 text-sm">Tìm</button>
        </form>
        <select
          value={filterRemoval}
          onChange={e => { setFilterRemoval(e.target.value); setPagination(p => ({ ...p, page: 1 })); }}
          className="input text-sm w-44"
        >
          <option value="">Tất cả loại</option>
          <option value="false">Áp giảm giá</option>
          <option value="true">Xóa giảm giá</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
        {loading ? (
          <div className="text-center py-16 text-gray-400">Đang tải...</div>
        ) : !data?.rows?.length ? (
          <div className="text-center py-16 text-gray-400">
            <FiTag size={36} className="mx-auto mb-3 opacity-30" />
            <p>Chưa có sự kiện nào</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Tên sự kiện</th>
                <th className="text-center px-3 py-3 font-semibold text-gray-600">Loại</th>
                <th className="text-center px-3 py-3 font-semibold text-gray-600">Giảm</th>
                <th className="text-center px-3 py-3 font-semibold text-gray-600">SP</th>
                <th className="text-left px-3 py-3 font-semibold text-gray-600">Thời gian</th>
                <th className="text-center px-3 py-3 font-semibold text-gray-600">Trạng thái</th>
                <th className="w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {data.rows.map(ev => {
                const badge = statusBadge(ev);
                return (
                  <tr key={ev.id} onClick={() => openDetail(ev)} className="hover:bg-gray-50 cursor-pointer transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-800">{ev.name}</p>
                      {ev.creator && <p className="text-xs text-gray-400">{ev.creator.fullName}</p>}
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ev.isRemoval ? 'bg-gray-100 text-gray-600' : 'bg-rose-50 text-rose-600'}`}>
                        {ev.isRemoval ? 'Xóa GG' : 'Áp GG'}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-center font-semibold text-rose-600">
                      {ev.isRemoval ? '—' : ev.discountPct ? `${ev.discountPct}%` : '—'}
                    </td>
                    <td className="px-3 py-3 text-center text-gray-700">
                      {ev.productCount}{ev.selectAll && <span className="text-gray-400 text-xs"> (all)</span>}
                    </td>
                    <td className="px-3 py-3 text-gray-600 text-xs">
                      <div>{fmtDate(ev.saleStartDate)} → {fmtDate(ev.saleEndDate)}</div>
                      <div className="text-gray-400">{new Date(ev.createdAt).toLocaleString('vi-VN')}</div>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${badge.cls}`}>{badge.label}</span>
                    </td>
                    <td className="px-2 py-3 text-gray-400">
                      <FiChevronRight size={14} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {data?.pagination && (
        <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
          <span>Tổng: {data.pagination.total} sự kiện</span>
          <Pagination
            pagination={{ page: pagination.page, totalPages: pagination.totalPages }}
            onPageChange={p => setPagination(prev => ({ ...prev, page: p }))}
          />
        </div>
      )}

      {selected && (
        <EventDetailModal
          event={selected}
          onClose={() => setSelected(null)}
          onDeleted={() => { setSelected(null); fetch(); }}
        />
      )}
    </div>
  );
};

export default SaleEventManagement;

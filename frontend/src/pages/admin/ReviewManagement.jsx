import { useState, useEffect } from 'react';
import { FiStar, FiEye, FiEyeOff, FiTrash2, FiSearch } from 'react-icons/fi';
import api from '../../services/api';
import toast from 'react-hot-toast';
import Pagination from '../../components/common/Pagination';

const Stars = ({ rating }) => (
  <div className="flex gap-0.5">
    {[1, 2, 3, 4, 5].map((s) => (
      <FiStar key={s} size={13} className={s <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200 fill-gray-200'} />
    ))}
  </div>
);

export default function ReviewManagement() {
  const [reviews, setReviews] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState({ search: '', rating: '', isApproved: '' });
  const [loading, setLoading] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [toggling, setToggling] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const r = await api.get('/reviews/admin', { params: { page, limit: 20, ...filter } });
      setReviews(r.data.items);
      setPagination(r.data.pagination);
    } catch {
      toast.error('Không thể tải danh sách đánh giá');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [page, filter]);

  const handleFilter = (key, val) => {
    setFilter((f) => ({ ...f, [key]: val }));
    setPage(1);
  };

  const handleToggleApprove = async (review) => {
    setToggling(review.id);
    try {
      const r = await api.patch(`/reviews/admin/${review.id}/approve`);
      toast.success(r.data.message);
      load();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Thao tác thất bại');
    } finally {
      setToggling(null);
    }
  };

  const handleDelete = async (id) => {
    if (confirmDelete !== id) {
      setConfirmDelete(id);
      return;
    }
    setConfirmDelete(null);
    try {
      await api.delete(`/reviews/admin/${id}`);
      toast.success('Đã xóa đánh giá');
      load();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Xóa thất bại');
    }
  };

  return (
    <div className="p-4 md:p-6">
      <h1 className="text-xl md:text-2xl font-bold text-gray-800 mb-6">Quản Lý Đánh Giá</h1>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow p-4 mb-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <FiSearch size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              placeholder="Tìm theo tên sản phẩm..."
              value={filter.search}
              onChange={(e) => handleFilter('search', e.target.value)}
              className="w-full border rounded-lg pl-9 pr-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>
          <select
            value={filter.rating}
            onChange={(e) => handleFilter('rating', e.target.value)}
            className="border rounded-lg px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-indigo-300"
          >
            <option value="">Tất cả số sao</option>
            {[5, 4, 3, 2, 1].map((r) => (
              <option key={r} value={r}>{r} sao</option>
            ))}
          </select>
          <select
            value={filter.isApproved}
            onChange={(e) => handleFilter('isApproved', e.target.value)}
            className="border rounded-lg px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-indigo-300"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="true">Đang hiển thị</option>
            <option value="false">Đã ẩn</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="px-4 py-3 border-b text-sm text-gray-500">
          Tổng: <strong>{pagination?.total ?? 0}</strong> đánh giá
          {pagination?.totalPages > 1 && (
            <span className="ml-1 text-gray-400">· Trang {page}/{pagination.totalPages}</span>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                {[
                  ['Sản phẩm', ''],
                  ['Người dùng', 'hidden md:table-cell'],
                  ['Đánh giá', ''],
                  ['Nhận xét', 'hidden lg:table-cell'],
                  ['Ảnh', 'hidden lg:table-cell'],
                  ['Ngày', 'hidden md:table-cell'],
                  ['Trạng thái', ''],
                  ['Hành động', ''],
                ].map(([h, cls]) => (
                  <th key={h} className={`text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase ${cls}`}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-gray-400">Đang tải...</td>
                </tr>
              ) : reviews.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-gray-400">Không có đánh giá nào</td>
                </tr>
              ) : reviews.map((review) => (
                <tr
                  key={review.id}
                  className={`border-t hover:bg-gray-50 transition-colors ${!review.isApproved ? 'opacity-60' : ''}`}
                  onClick={() => setConfirmDelete(null)}
                >
                  {/* Product */}
                  <td className="px-4 py-3 max-w-[150px]">
                    <p className="font-medium text-gray-800 text-xs line-clamp-2">{review.Product?.name}</p>
                  </td>

                  {/* User */}
                  <td className="px-4 py-3 hidden md:table-cell">
                    <p className="text-xs font-medium text-gray-700">{review.User?.fullName}</p>
                    <p className="text-xs text-gray-400 truncate max-w-[140px]">{review.User?.email}</p>
                  </td>

                  {/* Rating */}
                  <td className="px-4 py-3">
                    <Stars rating={review.rating} />
                    <span className="text-xs text-gray-400">{review.rating}/5</span>
                  </td>

                  {/* Comment */}
                  <td className="px-4 py-3 hidden lg:table-cell max-w-[220px]">
                    {review.comment
                      ? <p className="text-xs text-gray-600 line-clamp-2">{review.comment}</p>
                      : <span className="text-xs text-gray-300 italic">Không có nhận xét</span>
                    }
                  </td>

                  {/* Images */}
                  <td className="px-4 py-3 hidden lg:table-cell">
                    {review.images?.length > 0 ? (
                      <div className="flex gap-1">
                        {review.images.slice(0, 3).map((img, i) => (
                          <a key={i} href={img} target="_blank" rel="noreferrer">
                            <img src={img} alt="" className="w-9 h-9 rounded object-cover border hover:opacity-80 transition" />
                          </a>
                        ))}
                        {review.images.length > 3 && (
                          <div className="w-9 h-9 rounded bg-gray-100 flex items-center justify-center text-xs text-gray-500">
                            +{review.images.length - 3}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-gray-300">–</span>
                    )}
                  </td>

                  {/* Date */}
                  <td className="px-4 py-3 hidden md:table-cell text-xs text-gray-500 whitespace-nowrap">
                    {new Date(review.createdAt).toLocaleDateString('vi-VN')}
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap ${
                      review.isApproved ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {review.isApproved ? 'Hiển thị' : 'Đã ẩn'}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleToggleApprove(review)}
                        disabled={toggling === review.id}
                        title={review.isApproved ? 'Ẩn đánh giá' : 'Hiện đánh giá'}
                        className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all active:scale-95 disabled:opacity-40 ${
                          review.isApproved
                            ? 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                            : 'bg-green-100 text-green-600 hover:bg-green-200'
                        }`}
                      >
                        {review.isApproved ? <FiEyeOff size={14} /> : <FiEye size={14} />}
                      </button>

                      {confirmDelete === review.id ? (
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleDelete(review.id)}
                            className="px-2 py-1 text-xs bg-red-500 text-white rounded-lg hover:bg-red-600 active:scale-95 transition-all whitespace-nowrap"
                          >
                            Xóa?
                          </button>
                          <button
                            onClick={() => setConfirmDelete(null)}
                            className="px-2 py-1 text-xs bg-gray-100 text-gray-500 rounded-lg hover:bg-gray-200 active:scale-95 transition-all"
                          >
                            Hủy
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleDelete(review.id)}
                          title="Xóa đánh giá"
                          className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-100 text-red-500 hover:bg-red-200 transition-all active:scale-95"
                        >
                          <FiTrash2 size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <Pagination
          pagination={pagination}
          onPageChange={(p) => { setPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
        />
      </div>
    </div>
  );
}

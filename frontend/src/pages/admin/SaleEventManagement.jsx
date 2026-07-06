import { useState, useEffect, useCallback } from 'react';
import {
  FiTag, FiSearch, FiTrash2, FiPlus, FiX, FiCalendar,
  FiPackage, FiUser, FiChevronLeft, FiChevronDown, FiChevronUp, FiCheck, FiPercent, FiRefreshCw, FiClock, FiLock
} from 'react-icons/fi';
import api from '../../services/api';
import toast from 'react-hot-toast';
import Pagination from '../../components/common/Pagination';
import ConfirmModal from '../../components/common/ConfirmModal';

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('vi-VN') : '—';

const statusBadge = (event) => {
  const now = new Date();
  const start = event.saleStartDate ? new Date(event.saleStartDate) : null;
  const end = event.saleEndDate ? new Date(event.saleEndDate) : null;
  if (end && end < now) return { label: 'Đã kết thúc', cls: 'bg-gray-100 text-gray-500' };
  if (start && start > now) return { label: 'Sắp diễn ra', cls: 'bg-yellow-50 text-yellow-700' };
  return { label: 'Đang chạy', cls: 'bg-green-50 text-green-700' };
};

/* ── Add products modal ── */
const AddProductsModal = ({ event, onClose, onAdded }) => {
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [selected, setSelected] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [confirmOverride, setConfirmOverride] = useState(null);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api.get('/sale-events/available-products', {
        params: { page: pagination.page, limit: 12, search },
      });
      setProducts(r.data.items ?? []);
      setPagination(p => ({ ...p, totalPages: r.data.pagination?.totalPages ?? 1, total: r.data.pagination?.total ?? 0 }));
    } catch { toast.error('Không tải được danh sách sản phẩm'); }
    finally { setLoading(false); }
  }, [pagination.page, search]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const toggle = (id) => setSelected(prev => {
    const s = new Set(prev);
    s.has(id) ? s.delete(id) : s.add(id);
    return s;
  });

  const toggleAll = () => {
    if (products.every(p => selected.has(p.id))) {
      setSelected(prev => { const s = new Set(prev); products.forEach(p => s.delete(p.id)); return s; });
    } else {
      setSelected(prev => { const s = new Set(prev); products.forEach(p => s.add(p.id)); return s; });
    }
  };

  const handleSubmit = async () => {
    if (!selected.size) return toast.error('Chọn ít nhất 1 sản phẩm');

    const withDiscount = products.filter(p => selected.has(p.id) && p.salePrice);
    if (withDiscount.length > 0) {
      setConfirmOverride(withDiscount);
      return;
    }
    await doSubmit();
  };

  const doSubmit = async () => {
    setConfirmOverride(null);
    setSubmitting(true);
    try {
      const r = await api.post(`/sale-events/${event.id}/products`, { productIds: [...selected] });
      toast.success(r.data.message);
      if (r.data.skippedCount > 0) toast(`Bỏ qua ${r.data.skippedCount} sản phẩm đã trong sự kiện khác`);
      onAdded();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Thêm thất bại');
    } finally { setSubmitting(false); }
  };

  const allSelected = products.length > 0 && products.every(p => selected.has(p.id));

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b">
          <div>
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
              <FiPackage size={15} className="text-rose-500" /> Thêm sản phẩm vào sự kiện
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">Chỉ hiển thị sản phẩm chưa thuộc sự kiện nào</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500">
            <FiX size={16} />
          </button>
        </div>

        <div className="px-6 py-3 border-b flex gap-2">
          <div className="relative flex-1">
            <FiSearch size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { setSearch(searchInput); setPagination(p => ({ ...p, page: 1 })); } }}
              placeholder="Tìm sản phẩm..."
              className="input pl-8 text-sm w-full"
            />
          </div>
          <button
            onClick={() => { setSearch(searchInput); setPagination(p => ({ ...p, page: 1 })); }}
            className="btn-primary px-4 text-sm"
          >Tìm</button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="text-center py-10 text-gray-400 text-sm">Đang tải...</div>
          ) : !products.length ? (
            <div className="text-center py-10 text-gray-400 text-sm">Không có sản phẩm nào khả dụng</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="w-10 px-4 py-3">
                    <div
                      onClick={toggleAll}
                      className={`w-4 h-4 rounded border-2 flex items-center justify-center cursor-pointer transition-colors ${allSelected ? 'bg-rose-500 border-rose-500' : 'border-gray-300 hover:border-rose-400'}`}
                    >
                      {allSelected && <FiCheck size={9} className="text-white" strokeWidth={3} />}
                    </div>
                  </th>
                  <th className="text-left py-3 font-semibold text-gray-600">Sản phẩm</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600">Giá gốc</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600 text-rose-600">Sau KM</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {products.map(p => {
                  const salePrice = Math.round(parseFloat(p.price) * (1 - event.discountPct / 100));
                  const isSelected = selected.has(p.id);
                  return (
                    <tr
                      key={p.id}
                      onClick={() => toggle(p.id)}
                      className={`cursor-pointer transition-colors ${isSelected ? 'bg-rose-50' : 'hover:bg-gray-50'}`}
                    >
                      <td className="px-4 py-2.5">
                        <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${isSelected ? 'bg-rose-500 border-rose-500' : 'border-gray-300'}`}>
                          {isSelected && <FiCheck size={9} className="text-white" strokeWidth={3} />}
                        </div>
                      </td>
                      <td className="py-2.5">
                        <div className="flex items-center gap-3">
                          {p.thumbnailImage && <img src={p.thumbnailImage} alt="" className="w-9 h-9 rounded-lg object-cover" />}
                          <div>
                            <p className="font-medium text-gray-800 text-sm">{p.name}</p>
                            <div className="flex items-center gap-1.5">
                              {p.color && <p className="text-xs text-gray-400">{p.color}</p>}
                              {p.salePrice && (
                                <span className="text-[10px] bg-orange-50 text-orange-500 border border-orange-100 px-1.5 py-0.5 rounded-full font-medium">
                                  Đang GG {Math.round((1 - p.salePrice / p.price) * 100)}% → sẽ bị thay thế
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-right text-gray-500 text-sm">
                        {Number(p.price).toLocaleString('vi-VN')}đ
                      </td>
                      <td className="px-4 py-2.5 text-right font-semibold text-rose-600 text-sm">
                        {salePrice.toLocaleString('vi-VN')}đ
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {pagination.total > 0 && (
          <div className="border-t">
            <div className="px-6 pt-2 text-xs text-gray-400">
              Tổng: {pagination.total} sản phẩm{pagination.totalPages > 1 && ` · Trang ${pagination.page}/${pagination.totalPages}`}
            </div>
            <div className="pb-1">
              <Pagination
                pagination={{ page: pagination.page, totalPages: pagination.totalPages }}
                onPageChange={p => setPagination(prev => ({ ...prev, page: p }))}
              />
            </div>
          </div>
        )}

        <div className="px-6 py-4 border-t flex items-center justify-between">
          <p className="text-sm text-gray-500">Đã chọn <strong className="text-rose-600">{selected.size}</strong> sản phẩm</p>
          <div className="flex gap-3">
            <button onClick={onClose} className="btn-secondary px-5 text-sm">Huỷ</button>
            <button onClick={handleSubmit} disabled={submitting || !selected.size} className="btn-primary px-5 text-sm disabled:opacity-60">
              {submitting ? 'Đang thêm...' : `Thêm ${selected.size > 0 ? selected.size : ''} sản phẩm`}
            </button>
          </div>
        </div>
      </div>

      {confirmOverride && (
        <ConfirmModal
          title="Ghi đè giảm giá lẻ?"
          message={`${confirmOverride.length} sản phẩm đang có giảm giá lẻ. Giảm giá cũ sẽ bị thay thế bởi giá sự kiện.`}
          confirmLabel="Tiếp tục thêm"
          variant="warning"
          onConfirm={doSubmit}
          onCancel={() => setConfirmOverride(null)}
          loading={submitting}
        />
      )}
    </div>
  );
};

/* ── Create event form ── */
const CreateEventModal = ({ onClose, onCreate }) => {
  const [form, setForm] = useState({ name: '', discountPct: '', saleStartDate: '', saleEndDate: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const r = await api.post('/sale-events', {
        name: form.name,
        discountPct: Number(form.discountPct),
        saleStartDate: form.saleStartDate || undefined,
        saleEndDate: form.saleEndDate || undefined,
      });
      toast.success('Đã tạo sự kiện');
      onCreate(r.data);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Tạo thất bại');
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b">
          <h3 className="font-bold text-gray-800 flex items-center gap-2">
            <FiTag size={15} className="text-rose-500" /> Tạo sự kiện khuyến mãi
          </h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500">
            <FiX size={16} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1.5">Tên sự kiện <span className="text-rose-500">*</span></label>
            <input
              type="text" required
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="VD: Sale hè 2025, Flash sale 7/7..."
              className="input text-base"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1.5">% Giảm giá <span className="text-rose-500">*</span></label>
            <div className="relative">
              <input
                type="number" min="1" max="99" required
                value={form.discountPct}
                onChange={e => setForm(f => ({ ...f, discountPct: e.target.value }))}
                placeholder="Ví dụ: 20"
                className="input text-base pr-8"
              />
              <FiPercent size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">Ngày bắt đầu <span className="text-rose-500">*</span></label>
              <input type="date" required value={form.saleStartDate} onChange={e => setForm(f => ({ ...f, saleStartDate: e.target.value }))} className="input text-sm" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">Ngày kết thúc <span className="text-rose-500">*</span></label>
              <input type="date" required value={form.saleEndDate} onChange={e => setForm(f => ({ ...f, saleEndDate: e.target.value }))} className="input text-sm" />
            </div>
          </div>
          {form.discountPct && (
            <div className="bg-rose-50 border border-rose-100 rounded-xl px-4 py-2.5 text-xs text-rose-700 font-medium">
              Sản phẩm trong sự kiện sẽ được giảm <strong>{form.discountPct}%</strong> so với giá gốc
            </div>
          )}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Huỷ</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1 disabled:opacity-60">
              {loading ? 'Đang tạo...' : 'Tạo sự kiện'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const RUN_PAGE_SIZE = 10;
const RUNS_PER_PAGE = 5;
const PRODUCT_PAGE_SIZE = 10;

/* ── Run history (accordion + paginated runs) ── */
const RunHistory = ({ runs }) => {
  const [expanded, setExpanded] = useState(new Set());
  const [runPage, setRunPage] = useState(1);
  const [productPages, setProductPages] = useState({});

  const totalRunPages = Math.ceil(runs.length / RUNS_PER_PAGE);
  const visibleRuns = runs.slice((runPage - 1) * RUNS_PER_PAGE, runPage * RUNS_PER_PAGE);

  const toggle = (id) => setExpanded(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  const getProductPage = (id) => productPages[id] || 1;
  const setProductPage = (id, p) => setProductPages(prev => ({ ...prev, [id]: p }));

  return (
    <div className="bg-white rounded-2xl border shadow-sm overflow-hidden mt-5">
      <div className="flex items-center gap-2 px-5 py-4 border-b">
        <FiClock size={14} className="text-gray-400" />
        <p className="font-semibold text-gray-700 text-sm">Lịch sử chạy</p>
        <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{runs.length} lần</span>
      </div>

      <div className="divide-y divide-gray-100">
        {visibleRuns.map((run, i) => {
          const globalIndex = runs.length - ((runPage - 1) * RUNS_PER_PAGE + i);
          const isOpen = expanded.has(run.id);
          const products = run.runProducts || [];
          const pPage = getProductPage(run.id);
          const totalProductPages = Math.ceil(products.length / RUN_PAGE_SIZE);
          const pageItems = products.slice((pPage - 1) * RUN_PAGE_SIZE, pPage * RUN_PAGE_SIZE);

          return (
            <div key={run.id}>
              {/* Accordion header — always visible */}
              <button
                onClick={() => toggle(run.id)}
                className="w-full flex items-center gap-3 px-5 py-4 hover:bg-gray-50 transition-colors text-left"
              >
                <span className="w-7 h-7 rounded-full bg-rose-50 text-rose-500 text-xs flex items-center justify-center font-bold shrink-0">
                  {globalIndex}
                </span>
                <div className="flex items-center gap-1.5 text-gray-600 text-sm">
                  <FiCalendar size={12} className="text-gray-400" />
                  {fmtDate(run.saleStartDate)} → {fmtDate(run.saleEndDate)}
                </div>
                <span className="text-xs bg-rose-50 text-rose-600 font-bold px-2 py-0.5 rounded-full">-{run.discountPct}%</span>
                <span className="text-xs text-gray-400">{run.productCount} sản phẩm</span>
                <span className="ml-auto text-gray-400">
                  {isOpen ? <FiChevronUp size={14} /> : <FiChevronDown size={14} />}
                </span>
              </button>

              {/* Accordion body */}
              {isOpen && (
                <div className="px-5 pb-5">
                  {!products.length ? (
                    <p className="text-xs text-gray-400 text-center py-4 bg-gray-50 rounded-xl">Không có dữ liệu sản phẩm</p>
                  ) : (
                    <>
                      <div className="rounded-xl border overflow-hidden">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-50 border-b">
                            <tr className="text-xs text-gray-500">
                              <th className="text-left px-4 py-2.5 font-semibold">Sản phẩm</th>
                              <th className="text-right px-4 py-2.5 font-semibold">Giá gốc</th>
                              <th className="text-right px-4 py-2.5 font-semibold text-rose-500">Giá KM</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50">
                            {pageItems.map(p => (
                              <tr key={p.id} className="hover:bg-gray-50/60 transition-colors">
                                <td className="px-4 py-2.5">
                                  <div className="flex items-center gap-2.5">
                                    {p.thumbnailImage && <img src={p.thumbnailImage} alt="" className="w-8 h-8 rounded-lg object-cover shrink-0" />}
                                    <span className="text-gray-700 font-medium">{p.name}</span>
                                  </div>
                                </td>
                                <td className="px-4 py-2.5 text-right text-gray-400 text-xs">{Number(p.price).toLocaleString('vi-VN')}đ</td>
                                <td className="px-4 py-2.5 text-right font-semibold text-rose-600 text-xs">{Number(p.salePrice).toLocaleString('vi-VN')}đ</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      {totalProductPages > 1 && (
                        <Pagination
                          pagination={{ page: pPage, totalPages: totalProductPages }}
                          onPageChange={p => setProductPage(run.id, p)}
                        />
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {totalRunPages > 1 && (
        <div className="border-t px-5 py-3">
          <Pagination
            pagination={{ page: runPage, totalPages: totalRunPages }}
            onPageChange={p => { setRunPage(p); setExpanded(new Set()); }}
          />
        </div>
      )}
    </div>
  );
};

/* ── Restart event modal ── */
const RestartEventModal = ({ event, onClose, onRestarted }) => {
  const [form, setForm] = useState({ saleStartDate: '', saleEndDate: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post(`/sale-events/${event.id}/restart`, {
        saleStartDate: form.saleStartDate || undefined,
        saleEndDate: form.saleEndDate || undefined,
      });
      toast.success('Đã khởi động lại sự kiện');
      onRestarted();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Thất bại');
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b">
          <h3 className="font-bold text-gray-800 flex items-center gap-2">
            <FiRefreshCw size={15} className="text-rose-500" /> Chạy lại sự kiện
          </h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500">
            <FiX size={16} />
          </button>
        </div>

        <div className="px-6 py-4 bg-rose-50 border-b border-rose-100 text-sm text-rose-700">
          <strong>{event.name}</strong> · Giảm <strong>{event.discountPct}%</strong> · {event.products?.length ?? 0} sản phẩm
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <p className="text-sm text-gray-500">Đặt thời gian mới cho lần chạy tiếp theo. Lần chạy cũ sẽ được lưu vào lịch sử.</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">Ngày bắt đầu</label>
              <input
                type="date"
                value={form.saleStartDate}
                onChange={e => setForm(f => ({ ...f, saleStartDate: e.target.value }))}
                className="input text-sm"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">Ngày kết thúc</label>
              <input
                type="date"
                value={form.saleEndDate}
                onChange={e => setForm(f => ({ ...f, saleEndDate: e.target.value }))}
                className="input text-sm"
              />
            </div>
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Huỷ</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-60">
              <FiRefreshCw size={13} className={loading ? 'animate-spin' : ''} />
              {loading ? 'Đang xử lý...' : 'Chạy lại'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ── Event detail view ── */
const EventDetail = ({ eventId, onBack }) => {
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showRestart, setShowRestart] = useState(false);
  const [removing, setRemoving] = useState(null);
  const [closing, setClosing] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const [productPage, setProductPage] = useState(1);

  const fetchEvent = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api.get(`/sale-events/${eventId}`);
      setEvent(r.data);
      setProductPage(1);
    } catch { toast.error('Không tải được sự kiện'); }
    finally { setLoading(false); }
  }, [eventId]);

  useEffect(() => { fetchEvent(); }, [fetchEvent]);

  const handleRemoveProduct = (productId) => {
    setConfirm({
      title: 'Xóa sản phẩm khỏi sự kiện',
      message: 'Giá sản phẩm sẽ được hoàn về giá gốc.',
      confirmLabel: 'Xóa',
      onConfirm: async () => {
        setConfirm(null);
        setRemoving(productId);
        try {
          await api.delete(`/sale-events/${eventId}/products/${productId}`);
          toast.success('Đã xóa sản phẩm khỏi sự kiện');
          fetchEvent();
        } catch (err) {
          toast.error(err?.response?.data?.message || 'Xóa thất bại');
        } finally { setRemoving(null); }
      },
    });
  };

  const handleCloseEarly = () => {
    setConfirm({
      title: `Đóng sớm sự kiện "${event?.name}"?`,
      message: 'Sự kiện sẽ kết thúc ngay lập tức. Sản phẩm vẫn giữ giá khuyến mãi cho đến khi được xóa khỏi sự kiện.',
      confirmLabel: 'Đóng sự kiện',
      variant: 'warning',
      onConfirm: async () => {
        setConfirm(null);
        setClosing(true);
        try {
          await api.patch(`/sale-events/${eventId}/close`);
          toast.success('Đã đóng sự kiện sớm');
          fetchEvent();
        } catch (err) {
          toast.error(err?.response?.data?.message || 'Thất bại');
        } finally { setClosing(false); }
      },
    });
  };

  if (loading) return <div className="text-center py-20 text-gray-400">Đang tải...</div>;
  if (!event) return null;

  const badge = statusBadge(event);

  return (
    <div>
      <button onClick={() => onBack(false)} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-5 transition-colors">
        <FiChevronLeft size={15} /> Danh sách sự kiện
      </button>

      {/* Event header */}
      <div className="bg-white rounded-2xl border shadow-sm p-6 mb-5">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-xl font-bold text-gray-800">{event.name}</h2>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${badge.cls}`}>{badge.label}</span>
            </div>
            {event.creator && (
              <p className="text-xs text-gray-400 flex items-center gap-1">
                <FiUser size={11} /> {event.creator.fullName} · {new Date(event.createdAt).toLocaleString('vi-VN')}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {badge.label === 'Đã kết thúc' ? (
              <button
                onClick={() => setShowRestart(true)}
                className="flex items-center gap-1.5 text-sm text-rose-500 hover:text-rose-700 hover:bg-rose-50 px-3 py-1.5 rounded-lg transition-all"
              >
                <FiRefreshCw size={13} /> Chạy lại
              </button>
            ) : (
              <button
                onClick={handleCloseEarly}
                disabled={closing}
                className="flex items-center gap-1.5 text-sm text-orange-500 hover:text-orange-700 hover:bg-orange-50 px-3 py-1.5 rounded-lg transition-all disabled:opacity-50"
              >
                <FiX size={13} /> {closing ? 'Đang đóng...' : 'Đóng sớm'}
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mt-4">
          <div className="bg-rose-50 rounded-xl p-3 text-center">
            <p className="text-xs text-rose-400 mb-0.5">Giảm giá</p>
            <p className="text-2xl font-bold text-rose-600">{event.discountPct}%</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-3 text-center">
            <p className="text-xs text-gray-400 mb-0.5 flex items-center justify-center gap-1"><FiCalendar size={10} />Bắt đầu</p>
            <p className="font-semibold text-gray-700 text-sm">{fmtDate(event.saleStartDate)}</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-3 text-center">
            <p className="text-xs text-gray-400 mb-0.5 flex items-center justify-center gap-1"><FiCalendar size={10} />Kết thúc</p>
            <p className="font-semibold text-gray-700 text-sm">{fmtDate(event.saleEndDate)}</p>
          </div>
        </div>
      </div>

      {/* Products section */}
      <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <p className="font-semibold text-gray-800 flex items-center gap-2">
            <FiPackage size={15} className="text-gray-400" />
            Sản phẩm trong sự kiện
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{event.products?.length ?? 0}</span>
          </p>
          {badge.label !== 'Đã kết thúc' && (
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1.5 btn-primary text-sm px-4 py-2"
            >
              <FiPlus size={14} /> Thêm sản phẩm
            </button>
          )}
        </div>

        {!event.products?.length ? (
          <div className="text-center py-14 text-gray-400">
            <FiPackage size={36} className="mx-auto mb-3 opacity-30" />
            <p className="font-medium">Chưa có sản phẩm nào</p>
            {badge.label !== 'Đã kết thúc' && <p className="text-sm mt-1">Nhấn "Thêm sản phẩm" để bắt đầu</p>}
          </div>
        ) : (() => {
          const totalProductPages = Math.ceil(event.products.length / PRODUCT_PAGE_SIZE);
          const pageProducts = event.products.slice((productPage - 1) * PRODUCT_PAGE_SIZE, productPage * PRODUCT_PAGE_SIZE);
          return (
            <>
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left px-5 py-3 font-semibold text-gray-600">Sản phẩm</th>
                    <th className="text-right px-4 py-3 font-semibold text-gray-600">Giá gốc</th>
                    <th className="text-right px-4 py-3 font-semibold text-gray-600 text-rose-600">Giá KM</th>
                    <th className="text-center px-4 py-3 font-semibold text-gray-600">Trạng thái</th>
                    <th className="w-12"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {pageProducts.map(p => (
                    <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          {p.thumbnailImage && <img src={p.thumbnailImage} alt="" className="w-10 h-10 rounded-lg object-cover" />}
                          <div>
                            <p className="font-medium text-gray-800">{p.name}</p>
                            <p className="text-xs text-gray-400">{p.averageRating > 0 ? `★ ${p.averageRating}` : 'Chưa có đánh giá'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right text-gray-500">
                        {Number(p.price).toLocaleString('vi-VN')}đ
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-rose-600">
                        {p.salePrice ? Number(p.salePrice).toLocaleString('vi-VN') + 'đ' : '—'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${p.status === 'active' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                          {p.status === 'active' ? 'Đang bán' : 'Dừng bán'}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-center">
                        {badge.label === 'Đã kết thúc' ? (
                          <span className="w-8 h-8 flex items-center justify-center mx-auto text-gray-300" title="Sự kiện đã kết thúc">
                            <FiLock size={13} />
                          </span>
                        ) : (
                          <button
                            onClick={() => handleRemoveProduct(p.id)}
                            disabled={removing === p.id}
                            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 transition-all disabled:opacity-50 mx-auto"
                          >
                            <FiTrash2 size={13} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {totalProductPages > 1 && (
                <div className="border-t px-5 py-3">
                  <Pagination
                    pagination={{ page: productPage, totalPages: totalProductPages }}
                    onPageChange={p => setProductPage(p)}
                  />
                </div>
              )}
            </>
          );
        })()}
      </div>

      {/* Run history */}
      {event.runs?.length > 0 && (
        <RunHistory runs={[...event.runs].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))} />
      )}

      {showRestart && (
        <RestartEventModal
          event={event}
          onClose={() => setShowRestart(false)}
          onRestarted={async () => { setShowRestart(false); await fetchEvent(); setShowAddModal(true); }}
        />
      )}

      {showAddModal && (
        <AddProductsModal
          event={event}
          onClose={() => setShowAddModal(false)}
          onAdded={() => { setShowAddModal(false); fetchEvent(); }}
        />
      )}

      {confirm && (
        <ConfirmModal
          title={confirm.title}
          message={confirm.message}
          confirmLabel={confirm.confirmLabel ?? 'Xác nhận'}
          variant={confirm.variant ?? 'danger'}
          onConfirm={confirm.onConfirm}
          onCancel={() => setConfirm(null)}
        />
      )}
    </div>
  );
};

/* ── Non-event discounts tab ── */
const NonEventDiscounts = () => {
  const [data, setData] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const [terminating, setTerminating] = useState(null);
  const [confirmTerminate, setConfirmTerminate] = useState(null);

  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(search); setPagination(p => ({ ...p, page: 1 })); }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page: pagination.page, limit: 12 };
      if (debouncedSearch) params.search = debouncedSearch;
      if (statusFilter !== 'all') params.status = statusFilter;
      const r = await api.get('/sale-events/non-event-discounts', { params });
      setData(r.data);
      setPagination(p => ({ ...p, totalPages: r.data.pagination?.totalPages ?? 1, total: r.data.pagination?.total ?? 0 }));
    } catch { toast.error('Tải dữ liệu thất bại'); }
    finally { setLoading(false); }
  }, [pagination.page, debouncedSearch, statusFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleTerminate = (product) => {
    setConfirmTerminate({
      product,
      onConfirm: async () => {
        setConfirmTerminate(null);
        setTerminating(product.id);
        try {
          await api.patch(`/sale-events/non-event-discounts/${product.id}/terminate`);
          toast.success('Đã chấm dứt giảm giá');
          fetchData();
        } catch (err) {
          toast.error(err?.response?.data?.message || 'Thất bại');
        } finally { setTerminating(null); }
      },
    });
  };

  const isEnded = (p) => p.terminatedAt || (p.saleEndDate && new Date(p.saleEndDate) <= new Date());

  return (
    <div>
      {/* Status filter + search */}
      <div className="flex items-center gap-2 mb-4">
        {STATUS_FILTERS.map(f => (
          <button
            key={f.key}
            onClick={() => { setStatusFilter(f.key); setPagination(p => ({ ...p, page: 1 })); }}
            className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-all shrink-0 ${
              statusFilter === f.key
                ? 'bg-rose-500 text-white border-rose-500'
                : 'border-gray-200 text-gray-500 hover:border-rose-300 hover:text-rose-600'
            }`}
          >{f.label}</button>
        ))}
        <div className="relative ml-auto w-52">
          <FiSearch size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Tìm sản phẩm..."
            className="input pl-8 text-sm w-full py-1.5"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b">
          <span className="text-sm text-gray-500">
            Tổng: <strong>{pagination.total}</strong> sản phẩm
            {pagination.totalPages > 1 && <span className="ml-1 text-gray-400">· Trang {pagination.page}/{pagination.totalPages}</span>}
          </span>
        </div>
        {loading ? (
          <div className="text-center py-14 text-gray-400">Đang tải...</div>
        ) : !data?.items?.length ? (
          <div className="text-center py-14 text-gray-400">
            <FiTag size={32} className="mx-auto mb-2 opacity-25" />
            <p>Không có sản phẩm nào</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">Sản phẩm</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600">Giá gốc</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600 text-rose-600">Giá KM</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-600">Giảm</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-600">Ngày bắt đầu</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-600">Ngày kết thúc</th>
                  {statusFilter === 'ended' && (
                    <th className="text-center px-4 py-3 font-semibold text-gray-600">Ngày chấm dứt</th>
                  )}
                  {statusFilter !== 'ended' && <th className="w-24 px-2 py-3"></th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {data.items.map(p => {
                  const pct = Math.round((1 - parseFloat(p.salePrice) / parseFloat(p.price)) * 100);
                  const ended = isEnded(p);
                  return (
                    <tr key={p.id} className={`transition-colors ${ended ? 'opacity-60' : 'hover:bg-gray-50'}`}>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          {p.thumbnailImage && <img src={p.thumbnailImage} alt="" className="w-9 h-9 rounded-lg object-cover" />}
                          <div>
                            <p className="font-medium text-gray-800">{p.name}</p>
                            {p.terminatedAt && (
                              <span className="text-[10px] font-semibold text-orange-500 bg-orange-50 border border-orange-100 px-1.5 py-0.5 rounded-full">
                                Kết thúc sớm
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right text-gray-500">{Number(p.price).toLocaleString('vi-VN')}đ</td>
                      <td className="px-4 py-3 text-right font-semibold text-rose-600">{Number(p.salePrice).toLocaleString('vi-VN')}đ</td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-xs bg-rose-50 text-rose-600 font-bold px-2 py-0.5 rounded-full">-{pct}%</span>
                      </td>
                      <td className="px-4 py-3 text-center text-xs text-gray-500">{fmtDate(p.saleStartDate)}</td>
                      <td className="px-4 py-3 text-center text-xs text-gray-500">{fmtDate(p.saleEndDate)}</td>
                      {statusFilter === 'ended' && (
                        <td className="px-4 py-3 text-center text-xs text-orange-500 font-medium">
                          {p.terminatedAt ? fmtDate(p.terminatedAt) : '—'}
                        </td>
                      )}
                      {statusFilter !== 'ended' && (
                        <td className="px-3 py-3 text-center">
                          {!ended && (
                            <button
                              onClick={() => handleTerminate(p)}
                              disabled={terminating === p.id}
                              className="text-xs px-3 py-1.5 rounded-lg text-orange-500 border border-orange-200 hover:bg-orange-50 transition-all disabled:opacity-50 whitespace-nowrap"
                            >
                              {terminating === p.id ? '...' : 'Chấm dứt'}
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Pagination
        pagination={{ page: pagination.page, totalPages: pagination.totalPages }}
        onPageChange={p => setPagination(prev => ({ ...prev, page: p }))}
      />

      {confirmTerminate && (
        <ConfirmModal
          title="Chấm dứt giảm giá?"
          message={`Giảm giá của "${confirmTerminate.product.name}" sẽ kết thúc ngay lập tức.`}
          confirmLabel="Chấm dứt"
          variant="warning"
          onConfirm={confirmTerminate.onConfirm}
          onCancel={() => setConfirmTerminate(null)}
        />
      )}
    </div>
  );
};

/* ── Main page ── */
const STATUS_FILTERS = [
  { key: 'all', label: 'Tất cả' },
  { key: 'upcoming', label: 'Sắp diễn ra' },
  { key: 'active', label: 'Đang chạy' },
  { key: 'ended', label: 'Đã kết thúc' },
];

const SaleEventManagement = () => {
  const [tab, setTab] = useState('events');
  const [data, setData] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(search); setPagination(p => ({ ...p, page: 1 })); }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page: pagination.page, limit: 12 };
      if (statusFilter !== 'all') params.status = statusFilter;
      if (debouncedSearch) params.search = debouncedSearch;
      const r = await api.get('/sale-events', { params });
      setData(r.data);
      setPagination(p => ({ ...p, totalPages: r.data.pagination?.totalPages ?? 1, total: r.data.pagination?.total ?? 0 }));
    } catch { toast.error('Tải dữ liệu thất bại'); }
    finally { setLoading(false); }
  }, [pagination.page, statusFilter, debouncedSearch]);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  if (selectedId) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <EventDetail
          eventId={selectedId}
          onBack={(refresh) => { setSelectedId(null); if (refresh) fetchEvents(); }}
        />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center">
            <FiTag className="text-rose-600" size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-800">Sự kiện khuyến mãi</h1>
            <p className="text-sm text-gray-500">Quản lý các đợt giảm giá theo sự kiện</p>
          </div>
        </div>
        {tab === 'events' && (
          <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2 text-sm px-4 py-2.5">
            <FiPlus size={15} /> Tạo sự kiện
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 border-b">
        {[['events', 'Theo sự kiện'], ['manual', 'Giảm giá lẻ']].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${tab === key ? 'border-rose-500 text-rose-600' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
          >{label}</button>
        ))}
      </div>

      {tab === 'manual' && <NonEventDiscounts />}

      {tab === 'events' && (
      <>
      {/* Status filter + search */}
      <div className="flex items-center gap-2 mb-5">
        {STATUS_FILTERS.map(f => (
          <button
            key={f.key}
            onClick={() => { setStatusFilter(f.key); setPagination(p => ({ ...p, page: 1 })); }}
            className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-all shrink-0 ${
              statusFilter === f.key
                ? 'bg-rose-500 text-white border-rose-500'
                : 'border-gray-200 text-gray-500 hover:border-rose-300 hover:text-rose-600'
            }`}
          >{f.label}</button>
        ))}
        <div className="relative ml-auto w-52">
          <FiSearch size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Tìm sự kiện..."
            className="input pl-8 text-sm w-full py-1.5"
          />
        </div>
        {data?.pagination && (
          <span className="text-sm text-gray-400 shrink-0">{pagination.total} sự kiện</span>
        )}
      </div>

      {/* Event cards */}
      {loading ? (
        <div className="text-center py-20 text-gray-400">Đang tải...</div>
      ) : !data?.items?.length ? (
        <div className="text-center py-20 text-gray-400">
          <FiTag size={40} className="mx-auto mb-3 opacity-25" />
          <p className="font-medium">Chưa có sự kiện nào</p>
          <p className="text-sm mt-1">Nhấn "Tạo sự kiện" để bắt đầu</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.items.map(ev => {
            const badge = statusBadge(ev);
            return (
              <div
                key={ev.id}
                onClick={() => setSelectedId(ev.id)}
                className="bg-white rounded-2xl border shadow-sm p-5 cursor-pointer hover:shadow-md hover:border-rose-200 transition-all group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-gray-800 group-hover:text-rose-600 transition-colors">{ev.name}</h3>
                    {ev.creator && <p className="text-xs text-gray-400 mt-0.5">{ev.creator.fullName}</p>}
                  </div>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${badge.cls}`}>{badge.label}</span>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1.5 bg-rose-50 text-rose-600 font-bold px-3 py-1.5 rounded-lg">
                    <FiPercent size={12} /> {ev.discountPct}%
                  </div>
                  <div className="flex items-center gap-1.5 text-gray-500">
                    <FiPackage size={13} /> {ev.productCount} sản phẩm
                  </div>
                  <div className="flex items-center gap-1.5 text-gray-400 text-xs ml-auto">
                    <FiCalendar size={12} />
                    {fmtDate(ev.saleStartDate)} → {fmtDate(ev.saleEndDate)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Pagination
        pagination={{ page: pagination.page, totalPages: pagination.totalPages }}
        onPageChange={p => setPagination(prev => ({ ...prev, page: p }))}
      />

      {showCreate && (
        <CreateEventModal
          onClose={() => setShowCreate(false)}
          onCreate={(ev) => { setShowCreate(false); setSelectedId(ev.id); fetchEvents(); }}
        />
      )}
      </>
      )}
    </div>
  );
};

export default SaleEventManagement;

import { useState, useRef, useEffect } from 'react';
import useFetch from '../../hooks/useFetch';
import api from '../../services/api';
import { formatCurrency } from '../../utils/formatters';
import Spinner from '../../components/common/Spinner';
import Pagination from '../../components/common/Pagination';
import toast from 'react-hot-toast';
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiStar, FiEye, FiEyeOff, FiX, FiMessageSquare } from 'react-icons/fi';

const fmt = n => n ? Number(n).toLocaleString('vi-VN') + 'đ' : '';

/* ── Star display ── */
const Stars = ({ rating, size = 12 }) => (
  <div className="flex gap-0.5">
    {[1, 2, 3, 4, 5].map(s => (
      <FiStar key={s} size={size} className={s <= Math.round(rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200 fill-gray-200'} />
    ))}
  </div>
);

/* ── Product form modal ── */
const ProductModal = ({ product, categories, onClose, onSave }) => {
  const isEdit = !!product?.id;
  const initDiscount = product?.price && product?.salePrice
    ? Math.round((1 - parseFloat(product.salePrice) / parseFloat(product.price)) * 100)
    : '';
  const [form, setForm] = useState({
    name: product?.name || '',
    categoryId: product?.categoryId || '',
    price: product?.price || '',
    salePrice: product?.salePrice || '',
    color: product?.color || '',
    size: product?.size || '',
    weight: product?.weight || '',
    stock: product?.stock || 0,
    description: product?.description || '',
    status: product?.status || 'active',
    isCustomizable: product?.isCustomizable || false
  });
  const [discountPct, setDiscountPct] = useState(initDiscount);
  const [images, setImages] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  const handlePriceChange = (val) => {
    const newForm = { ...form, price: val };
    if (discountPct && val) newForm.salePrice = Math.round(parseFloat(val) * (1 - discountPct / 100));
    setForm(newForm);
  };

  const handleDiscountChange = (pct) => {
    const p = pct === '' ? '' : Math.min(99, Math.max(0, parseInt(pct) || 0));
    setDiscountPct(p);
    if (p !== '' && form.price) setForm(f => ({ ...f, salePrice: Math.round(parseFloat(form.price) * (1 - p / 100)) }));
  };

  const handleSalePriceChange = (val) => {
    setForm(f => ({ ...f, salePrice: val }));
    if (val && form.price && parseFloat(form.price) > 0) setDiscountPct(Math.round((1 - parseFloat(val) / parseFloat(form.price)) * 100));
    else setDiscountPct('');
  };

  const showPreview = form.price && form.salePrice && parseFloat(form.salePrice) < parseFloat(form.price);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      images.forEach(f => fd.append('images', f));
      if (isEdit) await api.put(`/products/${product.id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      else await api.post('/products', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success(isEdit ? 'Product updated' : 'Product created');
      onSave();
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
        <h3 className="font-bold text-lg mb-4">{isEdit ? 'Edit Product' : 'New Product'}</h3>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="text-sm font-medium">Name *</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required className="input mt-1 text-base" />
            </div>
            <div>
              <label className="text-sm font-medium">Category *</label>
              <select value={form.categoryId} onChange={e => setForm(f => ({ ...f, categoryId: e.target.value }))} required className="input mt-1 text-base">
                <option value="">Select...</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Status</label>
              <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className="input mt-1 text-base">
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Giá gốc (VND) *</label>
              <input type="number" value={form.price} onChange={e => handlePriceChange(e.target.value)} required className="input mt-1 text-base" />
            </div>
            <div>
              <label className="text-sm font-medium">% Giảm giá</label>
              <div className="relative mt-1">
                <input type="number" min="0" max="99" value={discountPct} onChange={e => handleDiscountChange(e.target.value)} placeholder="0" className="input pr-7 text-base" />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">%</span>
              </div>
            </div>
            <div className="sm:col-span-2">
              <label className="text-sm font-medium">Giá khuyến mãi (VND)</label>
              <input type="number" value={form.salePrice} onChange={e => handleSalePriceChange(e.target.value)} className="input mt-1 text-base" placeholder="Để trống nếu không giảm giá" />
            </div>
            {showPreview && (
              <div className="sm:col-span-2 flex items-center gap-3 bg-rose-50 border border-rose-100 rounded-xl px-4 py-3">
                <span className="text-gray-400 line-through text-sm">{fmt(form.price)}</span>
                <span className="text-gray-400">→</span>
                <span className="text-rose-600 font-bold text-base">{fmt(form.salePrice)}</span>
                <span className="ml-auto bg-rose-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">-{discountPct}%</span>
              </div>
            )}
            <div>
              <label className="text-sm font-medium">Color</label>
              <input value={form.color} onChange={e => setForm(f => ({ ...f, color: e.target.value }))} className="input mt-1 text-base" />
            </div>
            <div>
              <label className="text-sm font-medium">Size</label>
              <input value={form.size} onChange={e => setForm(f => ({ ...f, size: e.target.value }))} className="input mt-1 text-base" />
            </div>
            <div>
              <label className="text-sm font-medium">Weight (g)</label>
              <input type="number" value={form.weight} onChange={e => setForm(f => ({ ...f, weight: e.target.value }))} className="input mt-1 text-base" />
            </div>
            <div>
              <label className="text-sm font-medium">Initial Stock</label>
              <input type="number" value={form.stock} onChange={e => setForm(f => ({ ...f, stock: e.target.value }))} className="input mt-1 text-base" />
            </div>
            <div className="sm:col-span-2">
              <label className="text-sm font-medium">Description</label>
              <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} className="input mt-1 text-base" />
            </div>
            <div className="sm:col-span-2">
              <label className="text-sm font-medium">Ảnh sản phẩm</label>
              <div onClick={() => fileInputRef.current?.click()} className="mt-1 border-2 border-dashed border-gray-300 rounded-xl p-4 text-center cursor-pointer hover:border-rose-400 hover:bg-rose-50 transition-colors">
                <p className="text-2xl mb-1">📷</p>
                <p className="text-sm text-gray-500">Click để chọn ảnh từ máy tính</p>
                <p className="text-xs text-gray-400 mt-0.5">JPG, PNG, WEBP — tối đa 5MB/ảnh</p>
              </div>
              <input ref={fileInputRef} type="file" multiple accept="image/*" className="hidden"
                onChange={e => {
                  const files = Array.from(e.target.files);
                  setImages(files);
                  setPreviews(files.map(f => URL.createObjectURL(f)));
                }}
              />
              {previews.length > 0 && (
                <div className="flex gap-2 mt-2 flex-wrap">
                  {previews.map((src, i) => (
                    <div key={i} className="relative">
                      <img src={src} alt="" className="w-16 h-16 object-cover rounded-lg border" />
                      {i === 0 && <span className="absolute -top-1 -left-1 bg-rose-500 text-white text-[9px] px-1 rounded">Chính</span>}
                      <button type="button" onClick={() => { setPreviews(previews.filter((_, j) => j !== i)); setImages(images.filter((_, j) => j !== i)); }} className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full text-xs flex items-center justify-center">×</button>
                    </div>
                  ))}
                </div>
              )}
              {isEdit && product?.ProductImages?.length > 0 && previews.length === 0 && (
                <div className="mt-2">
                  <p className="text-xs text-gray-400 mb-1">Ảnh hiện tại:</p>
                  <div className="flex gap-2 flex-wrap">
                    {product.ProductImages.map((img, i) => <img key={i} src={img.imageUrl} alt="" className="w-14 h-14 object-cover rounded-lg border" />)}
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1">{loading ? 'Saving...' : 'Save'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ── Review panel modal ── */
const ReviewPanel = ({ product, onClose }) => {
  const [reviews, setReviews] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState({ rating: '', isApproved: '' });
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const r = await api.get('/reviews/admin', { params: { productId: product.id, page, limit: 10, ...filter } });
      setReviews(r.data.items);
      setPagination(r.data.pagination);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [page, filter]);

  const handleToggle = async (review) => {
    setToggling(review.id);
    try {
      const r = await api.patch(`/reviews/admin/${review.id}/approve`);
      toast.success(r.data.message);
      load();
    } catch (err) { toast.error(err?.response?.data?.message || 'Thao tác thất bại'); }
    finally { setToggling(null); }
  };

  const handleDelete = async (id) => {
    if (confirmDelete !== id) { setConfirmDelete(id); return; }
    setConfirmDelete(null);
    try {
      await api.delete(`/reviews/admin/${id}`);
      toast.success('Đã xóa đánh giá');
      load();
    } catch (err) { toast.error(err?.response?.data?.message || 'Xóa thất bại'); }
  };

  const avg = product.averageRating ? parseFloat(product.averageRating).toFixed(1) : null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-3 md:p-6" onClick={() => setConfirmDelete(null)}>
      <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <FiMessageSquare size={16} className="text-indigo-500 shrink-0" />
              <h3 className="font-bold text-gray-800 text-base truncate">Đánh giá: {product.name}</h3>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {avg ? (
                <>
                  <Stars rating={parseFloat(avg)} size={14} />
                  <span className="font-semibold text-gray-800 text-sm">{avg}/5</span>
                  <span className="text-gray-400 text-sm">({product.reviewCount || 0} đánh giá)</span>
                </>
              ) : (
                <span className="text-gray-400 text-sm">Chưa có đánh giá</span>
              )}
            </div>
          </div>
          <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500 active:scale-95 transition-all shrink-0">
            <FiX size={18} />
          </button>
        </div>

        {/* Filters */}
        <div className="px-5 py-3 border-b flex flex-wrap gap-2">
          <select value={filter.rating} onChange={e => { setFilter(f => ({ ...f, rating: e.target.value })); setPage(1); }} className="border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300">
            <option value="">Tất cả sao</option>
            {[5, 4, 3, 2, 1].map(r => <option key={r} value={r}>{r} sao</option>)}
          </select>
          <select value={filter.isApproved} onChange={e => { setFilter(f => ({ ...f, isApproved: e.target.value })); setPage(1); }} className="border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300">
            <option value="">Tất cả trạng thái</option>
            <option value="true">Hiển thị</option>
            <option value="false">Đã ẩn</option>
          </select>
          <span className="ml-auto text-sm text-gray-400 self-center">
            {pagination?.total ?? 0} đánh giá
          </span>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-16"><Spinner /></div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <FiMessageSquare size={32} className="mx-auto mb-2 opacity-30" />
              <p>Không có đánh giá nào</p>
            </div>
          ) : (
            <div className="divide-y">
              {reviews.map(review => (
                <div key={review.id} className={`px-5 py-4 hover:bg-gray-50 transition-colors ${!review.isApproved ? 'opacity-60' : ''}`}>
                  <div className="flex items-start justify-between gap-3">
                    {/* Left: user + stars + comment */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs shrink-0">
                          {review.User?.fullName?.[0]?.toUpperCase() || '?'}
                        </div>
                        <span className="font-medium text-gray-800 text-sm">{review.User?.fullName}</span>
                        <span className="text-gray-400 text-xs truncate">{review.User?.email}</span>
                        <span className="text-gray-300 text-xs ml-auto">
                          {new Date(review.createdAt).toLocaleDateString('vi-VN')}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <Stars rating={review.rating} size={13} />
                        <span className="text-xs text-gray-500">{review.rating}/5</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ml-1 ${review.isApproved ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                          {review.isApproved ? 'Hiển thị' : 'Đã ẩn'}
                        </span>
                      </div>
                      {review.comment && <p className="text-sm text-gray-600 mb-2">{review.comment}</p>}
                      {review.images?.length > 0 && (
                        <div className="flex gap-1.5 flex-wrap">
                          {review.images.map((img, i) => (
                            <a key={i} href={img} target="_blank" rel="noreferrer">
                              <img src={img} alt="" className="w-14 h-14 rounded-lg object-cover border hover:opacity-80 transition" />
                            </a>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Right: actions */}
                    <div className="flex gap-1.5 shrink-0" onClick={e => e.stopPropagation()}>
                      <button
                        onClick={() => handleToggle(review)}
                        disabled={toggling === review.id}
                        title={review.isApproved ? 'Ẩn' : 'Hiện'}
                        className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all active:scale-95 disabled:opacity-40 ${review.isApproved ? 'bg-gray-100 text-gray-500 hover:bg-gray-200' : 'bg-green-100 text-green-600 hover:bg-green-200'}`}
                      >
                        {review.isApproved ? <FiEyeOff size={13} /> : <FiEye size={13} />}
                      </button>

                      {confirmDelete === review.id ? (
                        <div className="flex gap-1">
                          <button onClick={() => handleDelete(review.id)} className="px-2 py-1 text-xs bg-red-500 text-white rounded-lg hover:bg-red-600 active:scale-95 transition-all">Xóa?</button>
                          <button onClick={() => setConfirmDelete(null)} className="px-2 py-1 text-xs bg-gray-100 text-gray-500 rounded-lg hover:bg-gray-200 active:scale-95 transition-all">Hủy</button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleDelete(review.id)}
                          title="Xóa"
                          className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-100 text-red-500 hover:bg-red-200 transition-all active:scale-95"
                        >
                          <FiTrash2 size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        <div className="border-t">
          <Pagination pagination={pagination} onPageChange={setPage} />
        </div>
      </div>
    </div>
  );
};

/* ── Main page ── */
const ProductManagement = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null);
  const [viewProduct, setViewProduct] = useState(null);
  const { data, loading, refetch } = useFetch('/products', { page, search, status: '' });
  const { data: cats } = useFetch('/categories');
  const allCategories = (cats || []).flatMap(c => [c, ...(c.children || [])]);

  const handleDelete = async (id) => {
    if (!confirm('Deactivate this product?')) return;
    await api.delete(`/products/${id}`);
    toast.success('Product deactivated');
    refetch();
  };

  return (
    <div className="p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <h1>Product Management</h1>
        <button onClick={() => setModal({})} className="btn-primary flex items-center gap-2 self-start sm:self-auto">
          <FiPlus /> New Product
        </button>
      </div>

      <div className="card mb-4">
        <div className="relative">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input placeholder="Search products..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="input pl-9 text-base" />
        </div>
      </div>

      {loading ? <Spinner /> : (
        <div className="card overflow-hidden p-0">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                {[
                  ['Sản phẩm', ''],
                  ['Danh mục', 'hidden md:table-cell'],
                  ['Giá', ''],
                  ['Tồn kho', 'hidden sm:table-cell'],
                  ['Đánh giá', 'hidden sm:table-cell'],
                  ['Trạng thái', ''],
                  ['', ''],
                ].map(([h, cls]) => (
                  <th key={h} className={`text-left px-4 py-3 font-semibold text-gray-600 ${cls}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {data?.items?.map(p => (
                <tr key={p.id} className="hover:bg-gray-50">
                  {/* Product */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {p.thumbnailImage
                        ? <img src={p.thumbnailImage} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0" />
                        : <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center shrink-0">🧶</div>
                      }
                      <div className="min-w-0">
                        <p className="font-medium line-clamp-1">{p.name}</p>
                        <p className="text-gray-400 text-xs">{p.code}</p>
                      </div>
                    </div>
                  </td>

                  {/* Category */}
                  <td className="px-4 py-3 text-gray-500 hidden md:table-cell">{p.Category?.name}</td>

                  {/* Price */}
                  <td className="px-4 py-3">
                    {p.salePrice && parseFloat(p.salePrice) < parseFloat(p.price) ? (() => {
                      const pct = Math.round((1 - parseFloat(p.salePrice) / parseFloat(p.price)) * 100);
                      return (
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-1.5">
                            <p className="font-medium text-rose-600">{formatCurrency(p.salePrice)}</p>
                            <span className="bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">-{pct}%</span>
                          </div>
                          <p className="text-xs text-gray-400 line-through">{formatCurrency(p.price)}</p>
                        </div>
                      );
                    })() : <p className="font-medium text-gray-800">{formatCurrency(p.price)}</p>}
                  </td>

                  {/* Stock */}
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <span className={`font-medium ${p.stock < 5 ? 'text-red-600' : 'text-gray-900'}`}>{p.stock}</span>
                  </td>

                  {/* Rating */}
                  <td className="px-4 py-3 hidden sm:table-cell">
                    {p.reviewCount > 0 ? (
                      <button
                        onClick={() => setViewProduct(p)}
                        className="group flex flex-col gap-0.5 hover:opacity-80 active:scale-95 transition-all text-left"
                        title="Xem đánh giá"
                      >
                        <Stars rating={parseFloat(p.averageRating || 0)} size={12} />
                        <span className="text-xs text-gray-500 group-hover:text-indigo-600 transition-colors">
                          {parseFloat(p.averageRating || 0).toFixed(1)} ({p.reviewCount})
                        </span>
                      </button>
                    ) : (
                      <span className="text-xs text-gray-300">Chưa có</span>
                    )}
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3">
                    <span className={`badge ${p.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>{p.status}</span>
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button
                        onClick={() => setViewProduct(p)}
                        title="Xem đánh giá"
                        className="w-9 h-9 flex items-center justify-center text-indigo-500 hover:bg-indigo-50 rounded-lg active:scale-95 transition-all"
                      >
                        <FiMessageSquare size={15} />
                      </button>
                      <button
                        onClick={() => setModal(p)}
                        title="Chỉnh sửa"
                        className="w-9 h-9 flex items-center justify-center text-blue-500 hover:bg-blue-50 rounded-lg active:scale-95 transition-all"
                      >
                        <FiEdit2 size={15} />
                      </button>
                      <button
                        onClick={() => handleDelete(p.id)}
                        title="Xóa"
                        className="w-9 h-9 flex items-center justify-center text-red-500 hover:bg-red-50 rounded-lg active:scale-95 transition-all"
                      >
                        <FiTrash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pagination pagination={data?.pagination} onPageChange={setPage} />

      {modal !== null && (
        <ProductModal
          product={modal}
          categories={allCategories}
          onClose={() => setModal(null)}
          onSave={() => { setModal(null); refetch(); }}
        />
      )}

      {viewProduct && (
        <ReviewPanel
          product={viewProduct}
          onClose={() => setViewProduct(null)}
        />
      )}
    </div>
  );
};

export default ProductManagement;

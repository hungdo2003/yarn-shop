import { useState, useRef } from 'react';
import useFetch from '../../hooks/useFetch';
import api from '../../services/api';
import { formatCurrency } from '../../utils/formatters';
import Spinner from '../../components/common/Spinner';
import Pagination from '../../components/common/Pagination';
import toast from 'react-hot-toast';
import { FiPlus, FiEdit2, FiTrash2, FiSearch } from 'react-icons/fi';

const fmt = n => n ? Number(n).toLocaleString('vi-VN') + 'đ' : '';

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
    if (discountPct && val) {
      newForm.salePrice = Math.round(parseFloat(val) * (1 - discountPct / 100));
    }
    setForm(newForm);
  };

  const handleDiscountChange = (pct) => {
    const p = pct === '' ? '' : Math.min(99, Math.max(0, parseInt(pct) || 0));
    setDiscountPct(p);
    if (p !== '' && form.price) {
      setForm(f => ({ ...f, salePrice: Math.round(parseFloat(form.price) * (1 - p / 100)) }));
    }
  };

  const handleSalePriceChange = (val) => {
    setForm(f => ({ ...f, salePrice: val }));
    if (val && form.price && parseFloat(form.price) > 0) {
      setDiscountPct(Math.round((1 - parseFloat(val) / parseFloat(form.price)) * 100));
    } else {
      setDiscountPct('');
    }
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
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required className="input mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium">Category *</label>
              <select value={form.categoryId} onChange={e => setForm(f => ({ ...f, categoryId: e.target.value }))} required className="input mt-1">
                <option value="">Select...</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Status</label>
              <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className="input mt-1">
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Giá gốc (VND) *</label>
              <input type="number" value={form.price} onChange={e => handlePriceChange(e.target.value)} required className="input mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium">% Giảm giá</label>
              <div className="relative mt-1">
                <input
                  type="number" min="0" max="99" value={discountPct}
                  onChange={e => handleDiscountChange(e.target.value)}
                  placeholder="0"
                  className="input pr-7"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">%</span>
              </div>
            </div>
            <div className="sm:col-span-2">
              <label className="text-sm font-medium">Giá khuyến mãi (VND)</label>
              <input type="number" value={form.salePrice} onChange={e => handleSalePriceChange(e.target.value)} className="input mt-1" placeholder="Để trống nếu không giảm giá" />
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
              <input value={form.color} onChange={e => setForm(f => ({ ...f, color: e.target.value }))} className="input mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium">Size</label>
              <input value={form.size} onChange={e => setForm(f => ({ ...f, size: e.target.value }))} className="input mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium">Weight (g)</label>
              <input type="number" value={form.weight} onChange={e => setForm(f => ({ ...f, weight: e.target.value }))} className="input mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium">Initial Stock</label>
              <input type="number" value={form.stock} onChange={e => setForm(f => ({ ...f, stock: e.target.value }))} className="input mt-1" />
            </div>
            <div className="sm:col-span-2">
              <label className="text-sm font-medium">Description</label>
              <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} className="input mt-1" />
            </div>
            <div className="sm:col-span-2">
              <label className="text-sm font-medium">Ảnh sản phẩm</label>
              <div
                onClick={() => fileInputRef.current?.click()}
                className="mt-1 border-2 border-dashed border-gray-300 rounded-xl p-4 text-center cursor-pointer hover:border-rose-400 hover:bg-rose-50 transition-colors"
              >
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
                      <button type="button" onClick={() => {
                        const newPrev = previews.filter((_, j) => j !== i);
                        const newImgs = images.filter((_, j) => j !== i);
                        setPreviews(newPrev);
                        setImages(newImgs);
                      }} className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full text-xs flex items-center justify-center">×</button>
                    </div>
                  ))}
                </div>
              )}
              {isEdit && product?.ProductImages?.length > 0 && previews.length === 0 && (
                <div className="mt-2">
                  <p className="text-xs text-gray-400 mb-1">Ảnh hiện tại:</p>
                  <div className="flex gap-2 flex-wrap">
                    {product.ProductImages.map((img, i) => (
                      <img key={i} src={img.imageUrl} alt="" className="w-14 h-14 object-cover rounded-lg border" />
                    ))}
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

const ProductManagement = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null);
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
      <div className="flex items-center justify-between mb-6">
        <h1>Product Management</h1>
        <button onClick={() => setModal({})} className="btn-primary flex items-center gap-2"><FiPlus /> New Product</button>
      </div>
      <div className="card mb-4">
        <div className="relative">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input placeholder="Search products..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="input pl-9" />
        </div>
      </div>
      {loading ? <Spinner /> : (
        <div className="card overflow-hidden p-0">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>{['Sản phẩm', 'Danh mục', 'Giá', 'Tồn kho', 'Trạng thái', ''].map(h => <th key={h} className="text-left px-4 py-3 font-semibold text-gray-600">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y">
              {data?.items?.map(p => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {p.thumbnailImage ? <img src={p.thumbnailImage} alt="" className="w-10 h-10 rounded-lg object-cover" /> : <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">🧶</div>}
                      <div>
                        <p className="font-medium line-clamp-1">{p.name}</p>
                        <p className="text-gray-400 text-xs">{p.code}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{p.Category?.name}</td>
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
                  <td className="px-4 py-3"><span className={`font-medium ${p.stock < 5 ? 'text-red-600' : 'text-gray-900'}`}>{p.stock}</span></td>
                  <td className="px-4 py-3"><span className={`badge ${p.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>{p.status}</span></td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => setModal(p)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg"><FiEdit2 size={15} /></button>
                      <button onClick={() => handleDelete(p.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"><FiTrash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pagination pagination={data?.pagination} onPageChange={setPage} />
      {modal !== null && <ProductModal product={modal} categories={allCategories} onClose={() => setModal(null)} onSave={() => { setModal(null); refetch(); }} />}
    </div>
  );
};

export default ProductManagement;

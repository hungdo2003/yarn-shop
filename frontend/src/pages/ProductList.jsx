import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../services/api';
import ProductCard from '../components/common/ProductCard';
import Pagination from '../components/common/Pagination';
import Spinner from '../components/common/Spinner';
import { FiFilter, FiX, FiChevronDown, FiChevronUp } from 'react-icons/fi';

const SORT_OPTIONS = [
  { value: '', label: 'Mới nhất' },
  { value: 'sold', label: 'Bán chạy nhất' },
  { value: 'rating', label: 'Đánh giá cao nhất' },
  { value: 'price_asc', label: 'Giá: Thấp đến cao' },
  { value: 'price_desc', label: 'Giá: Cao đến thấp' }
];

const QUICK_FILTERS = [
  { label: 'Tất cả', params: {} },
  { label: '🆕 Mới về', params: { isNew: 'true' } },
  { label: '🔥 Bán chạy', params: { sortBy: 'sold' } },
  { label: '⭐ Đánh giá cao', params: { sortBy: 'rating', minRating: '4' } },
  { label: '🏷️ Len & Sợi', params: { type: 'raw_material' } },
  { label: '🛠️ Phụ kiện', params: { type: 'accessory' } },
  { label: '🧸 Handmade', params: { type: 'finished_product' } },
];

const PRICE_RANGES = [
  { label: 'Tất cả', min: '', max: '' },
  { label: 'Dưới 50.000đ', min: '', max: '50000' },
  { label: '50.000 – 200.000đ', min: '50000', max: '200000' },
  { label: '200.000 – 500.000đ', min: '200000', max: '500000' },
  { label: 'Trên 500.000đ', min: '500000', max: '' },
];

const FilterSection = ({ title, children, defaultOpen = true }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b pb-4 mb-4">
      <button onClick={() => setOpen(!open)} className="flex items-center justify-between w-full font-semibold text-sm text-gray-800 mb-3 py-1 active:scale-95 transition-transform">
        {title} {open ? <FiChevronUp size={14} /> : <FiChevronDown size={14} />}
      </button>
      {open && children}
    </div>
  );
};

const ProductList = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFilter, setShowFilter] = useState(false);

  const filters = {
    search: searchParams.get('search') || '',
    type: searchParams.get('type') || '',
    categoryId: searchParams.get('categoryId') || '',
    color: searchParams.get('color') || '',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    minRating: searchParams.get('minRating') || '',
    sortBy: searchParams.get('sortBy') || '',
    isNew: searchParams.get('isNew') || '',
    inStock: searchParams.get('inStock') || '',
    page: parseInt(searchParams.get('page')) || 1
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== '' && v !== 0));
      const res = await api.get('/products', { params });
      setProducts(res.data);
    } finally { setLoading(false); }
  };

  useEffect(() => {
    api.get('/categories').then(res => {
      const data = Array.isArray(res.data) ? res.data : res.data.data || [];
      setCategories(data);
    });
  }, []);

  useEffect(() => { fetchProducts(); }, [searchParams.toString()]);

  const setFilter = (key, value) => {
    const p = new URLSearchParams(searchParams);
    if (value) p.set(key, value); else p.delete(key);
    p.delete('page');
    setSearchParams(p);
  };

  const applyQuickFilter = (params) => {
    const p = new URLSearchParams();
    if (filters.search) p.set('search', filters.search);
    Object.entries(params).forEach(([k, v]) => p.set(k, v));
    setSearchParams(p);
  };

  const setPriceRange = ({ min, max }) => {
    const p = new URLSearchParams(searchParams);
    if (min) p.set('minPrice', min); else p.delete('minPrice');
    if (max) p.set('maxPrice', max); else p.delete('maxPrice');
    p.delete('page');
    setSearchParams(p);
  };

  const clearFilters = () => {
    const p = new URLSearchParams();
    if (filters.search) p.set('search', filters.search);
    setSearchParams(p);
  };

  const hasActiveFilters = filters.type || filters.categoryId || filters.minPrice || filters.maxPrice || filters.minRating || filters.isNew || filters.inStock || filters.sortBy;

  const FilterPanel = () => (
    <div>
      <FilterSection title="Loại sản phẩm">
        {[['', 'Tất cả'], ['raw_material', 'Len & Sợi'], ['accessory', 'Phụ kiện'], ['finished_product', 'Handmade']].map(([v, l]) => (
          <label key={v} className="flex items-center gap-2 mb-2 cursor-pointer text-sm">
            <input type="radio" name="type" checked={filters.type === v} onChange={() => setFilter('type', v)} className="accent-rose-500" />
            {l}
          </label>
        ))}
      </FilterSection>

      {categories.length > 0 && (
        <FilterSection title="Danh mục">
          <label className="flex items-center gap-2 mb-2 cursor-pointer text-sm">
            <input type="radio" name="catId" checked={!filters.categoryId} onChange={() => setFilter('categoryId', '')} className="accent-rose-500" />
            Tất cả danh mục
          </label>
          {categories.map(c => (
            <label key={c.id} className="flex items-center gap-2 mb-2 cursor-pointer text-sm">
              <input type="radio" name="catId" checked={filters.categoryId === String(c.id)} onChange={() => setFilter('categoryId', c.id)} className="accent-rose-500" />
              {c.name}
            </label>
          ))}
        </FilterSection>
      )}

      <FilterSection title="Khoảng giá">
        {PRICE_RANGES.map((r, i) => (
          <label key={i} className="flex items-center gap-2 mb-2 cursor-pointer text-sm">
            <input type="radio" name="price" checked={filters.minPrice === r.min && filters.maxPrice === r.max} onChange={() => setPriceRange(r)} className="accent-rose-500" />
            {r.label}
          </label>
        ))}
        <div className="flex gap-2 mt-2">
          <input type="number" placeholder="Từ" value={filters.minPrice} onChange={e => setFilter('minPrice', e.target.value)} className="border rounded-lg px-2 py-1.5 text-base w-full" />
          <input type="number" placeholder="Đến" value={filters.maxPrice} onChange={e => setFilter('maxPrice', e.target.value)} className="border rounded-lg px-2 py-1.5 text-base w-full" />
        </div>
      </FilterSection>

      <FilterSection title="Đánh giá" defaultOpen={false}>
        {[['', 'Tất cả'], ['4', '4★ trở lên'], ['3', '3★ trở lên']].map(([v, l]) => (
          <label key={v} className="flex items-center gap-2 mb-2 cursor-pointer text-sm">
            <input type="radio" name="rating" checked={filters.minRating === v} onChange={() => setFilter('minRating', v)} className="accent-rose-500" />
            {l}
          </label>
        ))}
      </FilterSection>

      <FilterSection title="Màu sắc" defaultOpen={false}>
        <input placeholder="Vd: Đỏ, Xanh..." value={filters.color} onChange={e => setFilter('color', e.target.value)} className="border rounded-lg px-2 py-1.5 text-base w-full" />
      </FilterSection>

      <FilterSection title="Tùy chọn khác" defaultOpen={false}>
        <label className="flex items-center gap-2 cursor-pointer text-sm mb-2">
          <input type="checkbox" checked={filters.isNew === 'true'} onChange={e => setFilter('isNew', e.target.checked ? 'true' : '')} className="accent-rose-500" />
          Hàng mới về (30 ngày)
        </label>
        <label className="flex items-center gap-2 cursor-pointer text-sm">
          <input type="checkbox" checked={filters.inStock === 'true'} onChange={e => setFilter('inStock', e.target.checked ? 'true' : '')} className="accent-rose-500" />
          Chỉ hiển thị còn hàng
        </label>
      </FilterSection>

      {hasActiveFilters && (
        <button onClick={clearFilters} className="w-full border border-gray-300 text-gray-600 py-2.5 rounded-lg text-sm hover:bg-gray-50 active:scale-95 transition">Xóa bộ lọc</button>
      )}
    </div>
  );

  const pageTitle = filters.search ? `Kết quả tìm kiếm: "${filters.search}"` :
    filters.isNew === 'true' ? 'Hàng Mới Về' :
    filters.sortBy === 'sold' ? 'Sản Phẩm Bán Chạy' :
    filters.type === 'raw_material' ? 'Len & Sợi' :
    filters.type === 'accessory' ? 'Phụ Kiện' :
    filters.type === 'finished_product' ? 'Sản Phẩm Handmade' :
    'Tất Cả Sản Phẩm';

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 sm:py-8">
      {/* Quick filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-6 no-scrollbar">
        {QUICK_FILTERS.map((qf, i) => {
          const isActive = JSON.stringify(qf.params) === JSON.stringify(Object.fromEntries(
            Object.entries({ type: filters.type, sortBy: filters.sortBy, isNew: filters.isNew, minRating: filters.minRating }).filter(([, v]) => v)
          ));
          return (
            <button key={i} onClick={() => applyQuickFilter(qf.params)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition shrink-0 active:scale-95 ${isActive ? 'bg-rose-500 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-rose-50 hover:border-rose-300'}`}>
              {qf.label}
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-between mb-6 gap-3">
        <div className="min-w-0">
          <h1 className="text-xl xs:text-2xl font-bold text-gray-800 truncate">{pageTitle}</h1>
          {products && <p className="text-sm text-gray-500 mt-1">{products.pagination?.total || 0} sản phẩm</p>}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <select value={filters.sortBy} onChange={e => setFilter('sortBy', e.target.value)} className="border border-gray-300 rounded-lg px-2 xs:px-3 py-1.5 text-base focus:outline-none focus:ring-1 focus:ring-rose-300 max-w-[120px] xs:max-w-none">
            {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <button onClick={() => setShowFilter(!showFilter)} className="md:hidden border border-gray-300 rounded-lg px-3 h-11 text-sm flex items-center gap-1.5 hover:bg-gray-50 active:scale-95 transition shrink-0">
            <FiFilter size={14} /><span>Lọc</span>{hasActiveFilters && <span className="bg-rose-500 text-white rounded-full w-4 h-4 text-xs flex items-center justify-center">!</span>}
          </button>
        </div>
      </div>

      <div className="flex gap-6">
        <aside className="hidden md:block w-60 flex-shrink-0">
          <div className="bg-white rounded-xl shadow p-4 sticky top-20">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-800">Bộ lọc</h3>
              {hasActiveFilters && <button onClick={clearFilters} className="text-xs text-rose-500 hover:underline active:opacity-70">Xóa tất cả</button>}
            </div>
            <FilterPanel />
          </div>
        </aside>

        {showFilter && (
          <div className="fixed inset-0 z-50 bg-black/40 md:hidden" onClick={() => setShowFilter(false)}>
            <div className="absolute right-0 top-0 bottom-0 w-4/5 max-w-xs bg-white p-4 overflow-y-auto" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between mb-4">
                <h3 className="font-semibold">Bộ lọc</h3>
                <button onClick={() => setShowFilter(false)} className="w-11 h-11 flex items-center justify-center rounded-lg hover:bg-gray-100 active:scale-95 transition"><FiX size={20} /></button>
              </div>
              <FilterPanel />
            </div>
          </div>
        )}

        <main className="flex-1 min-w-0">
          {loading ? <div className="flex justify-center py-16"><Spinner /></div> : products?.items?.length ? (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 xs:gap-4">
                {products.items.map(p => <ProductCard key={p.id} product={p} />)}
              </div>
              <Pagination
                pagination={products.pagination}
                onPageChange={p => {
                  const params = new URLSearchParams(searchParams);
                  params.set('page', p);
                  setSearchParams(params);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              />
            </>
          ) : (
            <div className="text-center py-16 bg-white rounded-xl">
              <div className="text-6xl mb-4">🔍</div>
              <p className="text-gray-500 text-lg mb-2">Không tìm thấy sản phẩm nào</p>
              <p className="text-gray-400 text-sm mb-6">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
              <button onClick={clearFilters} className="text-rose-500 font-medium hover:underline">Xóa bộ lọc</button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default ProductList;

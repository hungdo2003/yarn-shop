import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../context/WishlistContext';
import { formatCurrency, formatDate } from '../utils/formatters';
import Spinner from '../components/common/Spinner';
import toast from 'react-hot-toast';
import {
  FiShoppingCart, FiMinus, FiPlus, FiStar, FiHeart,
  FiChevronLeft, FiChevronRight, FiCamera, FiX, FiCheck,
  FiPackage, FiTruck, FiRefreshCw,
} from 'react-icons/fi';

// ── Helpers ──────────────────────────────────────────────────────────────────
const STAR_LABELS = ['', 'Rất tệ', 'Không tốt', 'Bình thường', 'Tốt', 'Tuyệt vời'];
const STAR_COLORS = ['', '#ef4444', '#f97316', '#eab308', '#84cc16', '#22c55e'];

function Stars({ rating, size = 14, className = '' }) {
  return (
    <span className={`inline-flex gap-0.5 ${className}`}>
      {[1,2,3,4,5].map(s => (
        <svg key={s} width={size} height={size} viewBox="0 0 24 24" fill={s <= Math.round(rating) ? '#facc15' : 'none'}
          stroke={s <= Math.round(rating) ? '#facc15' : '#d1d5db'} strokeWidth="1.5">
          <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
        </svg>
      ))}
    </span>
  );
}

function InteractiveStars({ rating, onRate }) {
  const [hovered, setHovered] = useState(0);
  const active = hovered || rating;
  return (
    <div className="flex items-center gap-1">
      {[1,2,3,4,5].map(s => (
        <button key={s} type="button"
          onClick={() => onRate(s)}
          onMouseEnter={() => setHovered(s)}
          onMouseLeave={() => setHovered(0)}
          className="transition-transform hover:scale-125 focus:outline-none"
        >
          <svg width={36} height={36} viewBox="0 0 24 24"
            fill={s <= active ? STAR_COLORS[active] : 'none'}
            stroke={s <= active ? STAR_COLORS[active] : '#d1d5db'}
            strokeWidth="1.5" className="drop-shadow-sm transition-colors duration-150">
            <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
          </svg>
        </button>
      ))}
      {active > 0 && (
        <span className="ml-2 text-sm font-semibold transition-all" style={{ color: STAR_COLORS[active] }}>
          {STAR_LABELS[active]}
        </span>
      )}
    </div>
  );
}

// ── Review Write Form ─────────────────────────────────────────────────────────
function ReviewForm({ productId, orderId, user, onSubmitted }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [previews, setPreviews] = useState([]);
  const [files, setFiles] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef();

  const handleFiles = (e) => {
    const picked = Array.from(e.target.files).slice(0, 5 - files.length);
    setFiles(prev => [...prev, ...picked]);
    setPreviews(prev => [...prev, ...picked.map(f => URL.createObjectURL(f))]);
    e.target.value = '';
  };

  const removeImg = (i) => {
    URL.revokeObjectURL(previews[i]);
    setFiles(f => f.filter((_, idx) => idx !== i));
    setPreviews(p => p.filter((_, idx) => idx !== i));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!comment.trim()) { toast.error('Vui lòng nhập nhận xét của bạn'); return; }
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('productId', productId);
      fd.append('orderId', orderId);
      fd.append('rating', rating);
      fd.append('comment', comment.trim());
      files.forEach(f => fd.append('images', f));
      const r = await api.post('/reviews', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Đánh giá của bạn đã được gửi!');
      onSubmitted(r.data);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Gửi đánh giá thất bại');
    } finally { setSubmitting(false); }
  };

  return (
    <div className="relative bg-gradient-to-br from-rose-50 to-pink-50 border border-rose-100 rounded-2xl p-6 shadow-sm">
      <div className="absolute top-4 right-4 text-2xl">✍️</div>
      <h3 className="font-bold text-gray-800 text-base mb-1">Viết đánh giá của bạn</h3>
      <p className="text-xs text-gray-500 mb-5">Chia sẻ trải nghiệm sau khi nhận hàng</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Star picker */}
        <div>
          <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Chất lượng sản phẩm</p>
          <InteractiveStars rating={rating} onRate={setRating} />
        </div>

        {/* Comment */}
        <div>
          <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Nhận xét</p>
          <textarea
            value={comment}
            onChange={e => setComment(e.target.value)}
            maxLength={1000}
            rows={4}
            placeholder="Sản phẩm có đúng mô tả không? Chất lượng len như thế nào? Bạn sẽ giới thiệu cho bạn bè chứ?"
            className="w-full border border-rose-200 focus:border-rose-400 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-rose-200 bg-white transition-colors leading-relaxed"
          />
          <p className="text-right text-xs text-gray-400 mt-1">{comment.length}/1000</p>
        </div>

        {/* Image upload */}
        <div>
          <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Ảnh sản phẩm thực tế</p>
          <div className="flex flex-wrap gap-2">
            {previews.map((src, i) => (
              <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden border-2 border-rose-200 group">
                <img src={src} alt="" className="w-full h-full object-cover" />
                <button type="button" onClick={() => removeImg(i)}
                  className="absolute inset-0 bg-black/40 text-white hidden group-hover:flex items-center justify-center rounded-xl">
                  <FiX size={16} />
                </button>
              </div>
            ))}
            {previews.length < 5 && (
              <button type="button" onClick={() => fileRef.current.click()}
                className="w-20 h-20 border-2 border-dashed border-rose-300 rounded-xl flex flex-col items-center justify-center text-rose-400 hover:border-rose-500 hover:text-rose-500 hover:bg-rose-50 transition-colors gap-1">
                <FiCamera size={18} />
                <span className="text-[10px] font-medium">Thêm ảnh</span>
              </button>
            )}
            <input ref={fileRef} type="file" multiple accept="image/*" className="hidden" onChange={handleFiles} />
          </div>
          <p className="text-xs text-gray-400 mt-1">Tối đa 5 ảnh (JPG, PNG)</p>
        </div>

        <button type="submit" disabled={submitting}
          className="w-full bg-rose-500 text-white font-bold py-3 rounded-xl hover:bg-rose-600 active:scale-[.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm shadow-rose-200">
          {submitting
            ? <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Đang gửi...</>
            : <><FiCheck size={16} />Gửi đánh giá</>}
        </button>
      </form>
    </div>
  );
}

// ── Rating Summary Bar ────────────────────────────────────────────────────────
function RatingSummary({ avg, total, distribution, activeFilter, onFilter }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm flex gap-6 items-center flex-wrap">
      <div className="text-center shrink-0">
        <p className="text-5xl font-black text-gray-800 leading-none">{avg > 0 ? avg.toFixed(1) : '—'}</p>
        <Stars rating={avg} size={20} className="justify-center mt-2" />
        <p className="text-xs text-gray-400 mt-1.5">{total} đánh giá</p>
      </div>
      <div className="flex-1 min-w-[180px] space-y-1.5">
        {[5, 4, 3, 2, 1].map(star => {
          const count = distribution?.[star] || 0;
          const pct = total > 0 ? (count / total) * 100 : 0;
          const active = activeFilter === star;
          return (
            <button key={star} onClick={() => onFilter(active ? 0 : star)}
              className={`w-full flex items-center gap-2 rounded-lg px-1 py-0.5 transition-colors ${active ? 'bg-yellow-50' : 'hover:bg-gray-50'}`}>
              <span className="text-xs text-gray-500 w-3 shrink-0">{star}</span>
              <svg width={12} height={12} viewBox="0 0 24 24" fill="#facc15" stroke="#facc15" strokeWidth="1.5" className="shrink-0">
                <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
              </svg>
              <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-500 ${active ? 'bg-yellow-500' : 'bg-yellow-400'}`} style={{ width: `${pct}%` }} />
              </div>
              <span className="text-xs text-gray-400 w-6 text-right shrink-0">{count}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Single Review Card ────────────────────────────────────────────────────────
function ReviewCard({ review }) {
  const [imgOpen, setImgOpen] = useState(null);
  const initials = review.User?.fullName?.split(' ').map(w => w[0]).slice(-2).join('').toUpperCase() || '?';
  const gradients = [
    'from-rose-400 to-pink-500', 'from-violet-400 to-purple-500',
    'from-blue-400 to-indigo-500', 'from-emerald-400 to-teal-500',
    'from-amber-400 to-orange-500',
  ];
  const grad = gradients[review.userId % gradients.length];

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${grad} text-white flex items-center justify-center text-sm font-bold shrink-0 shadow-sm`}>
          {review.User?.avatar
            ? <img src={review.User.avatar} alt="" className="w-full h-full rounded-full object-cover" />
            : initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-semibold text-gray-800 text-sm leading-tight">{review.User?.fullName || 'Khách hàng'}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <Stars rating={review.rating} size={12} />
                <span className="text-xs font-semibold" style={{ color: STAR_COLORS[review.rating] }}>
                  {STAR_LABELS[review.rating]}
                </span>
              </div>
            </div>
            <div className="text-right shrink-0">
              <p className="text-[11px] text-gray-400">{formatDate(review.createdAt)}</p>
              <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full mt-0.5">
                <FiCheck size={9} /> Đã mua hàng
              </span>
            </div>
          </div>
          {review.comment && (
            <p className="text-sm text-gray-600 leading-relaxed mt-2.5 whitespace-pre-line">{review.comment}</p>
          )}
          {review.images?.length > 0 && (
            <div className="flex gap-2 mt-3 flex-wrap">
              {review.images.map((src, i) => (
                <button key={i} onClick={() => setImgOpen(i)}
                  className="w-16 h-16 rounded-xl overflow-hidden border border-gray-100 hover:opacity-90 hover:scale-105 transition-transform shadow-sm shrink-0">
                  <img src={src} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Image lightbox */}
      {imgOpen !== null && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setImgOpen(null)}>
          <button className="absolute top-4 right-4 text-white/70 hover:text-white"><FiX size={24} /></button>
          <div className="flex items-center gap-4" onClick={e => e.stopPropagation()}>
            {review.images.length > 1 && (
              <button onClick={() => setImgOpen(i => (i - 1 + review.images.length) % review.images.length)}
                className="text-white/70 hover:text-white"><FiChevronLeft size={32} /></button>
            )}
            <img src={review.images[imgOpen]} alt="" className="max-w-[80vw] max-h-[80vh] rounded-2xl object-contain shadow-2xl" />
            {review.images.length > 1 && (
              <button onClick={() => setImgOpen(i => (i + 1) % review.images.length)}
                className="text-white/70 hover:text-white"><FiChevronRight size={32} /></button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function ProductDetail() {
  const { slug } = useParams();
  const { addItem } = useCart();
  const { user, isRole } = useAuth();
  const { toggle, isWishlisted } = useWishlist();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [addingToCart, setAddingToCart] = useState(false);

  const [reviews, setReviews] = useState([]);
  const [reviewMeta, setReviewMeta] = useState({ distribution: {}, averageRating: 0, total: 0, pagination: null });
  const [reviewPage, setReviewPage] = useState(1);
  const [ratingFilter, setRatingFilter] = useState(0);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [canReview, setCanReview] = useState(false);
  const [reviewOrderId, setReviewOrderId] = useState(null);
  const [alreadyReviewed, setAlreadyReviewed] = useState(false);

  useEffect(() => {
    setLoading(true);
    api.get(`/products/${slug}`)
      .then(res => setProduct(res.data))
      .finally(() => setLoading(false));
  }, [slug]);

  useEffect(() => {
    if (!product) return;
    setReviewsLoading(true);
    const params = { page: reviewPage, limit: 6 };
    if (ratingFilter) params.rating = ratingFilter;
    api.get(`/reviews/product/${product.id}`, { params })
      .then(res => {
        setReviews(res.data.items || []);
        setReviewMeta(prev => ({
          distribution: res.data.distribution || prev.distribution,
          averageRating: res.data.averageRating || prev.averageRating,
          total: res.data.total || 0,
          pagination: res.data.pagination,
        }));
      })
      .catch(() => {})
      .finally(() => setReviewsLoading(false));
  }, [product, reviewPage, ratingFilter]);

  const handleRatingFilter = (star) => {
    setRatingFilter(star);
    setReviewPage(1);
  };

  useEffect(() => {
    if (!user || !isRole('customer') || !product) return;
    api.get(`/reviews/can-review/${product.id}`)
      .then(r => {
        setCanReview(r.data.canReview);
        setReviewOrderId(r.data.orderId || null);
        setAlreadyReviewed(r.data.alreadyReviewed || false);
      })
      .catch(() => {});
  }, [user, product]);

  if (loading) return (
    <div className="flex justify-center items-center min-h-[60vh]"><Spinner size="lg" /></div>
  );
  if (!product) return (
    <div className="text-center py-20 text-gray-400">
      <div className="text-5xl mb-4">🔍</div>
      <p className="font-semibold text-gray-500">Không tìm thấy sản phẩm</p>
    </div>
  );

  const images = product.ProductImages?.length ? product.ProductImages : [];
  const price = product.salePrice || product.price;
  const hasDiscount = product.salePrice && product.salePrice < product.price;
  const discountPct = hasDiscount ? Math.round((1 - product.salePrice / product.price) * 100) : 0;
  const stockLow = product.stock > 0 && product.stock <= 10;

  const wishlisted = product ? isWishlisted(product.id) : false;

  const handleWishlist = async () => {
    if (!user) return toast.error('Vui lòng đăng nhập để lưu yêu thích');
    if (!isRole('customer')) return;
    const res = await toggle(product.id);
    if (res) toast.success(res.message);
  };

  const handleAddToCart = async () => {
    if (!user) { toast.error('Vui lòng đăng nhập để mua hàng', { icon: '🔒' }); return; }
    if (!isRole('customer')) { toast.error('Chỉ khách hàng mới có thể mua hàng'); return; }
    if (product.stock < qty) { toast.error(`Chỉ còn ${product.stock} sản phẩm`); return; }
    setAddingToCart(true);
    const tid = toast.loading('Đang thêm...');
    try {
      await addItem(product.id, qty);
      toast.dismiss(tid);
      toast.success(`Đã thêm ${qty} sản phẩm vào giỏ hàng!`);
    } catch (err) {
      toast.dismiss(tid);
      toast.error(err?.response?.data?.message || 'Thêm vào giỏ thất bại');
    } finally { setAddingToCart(false); }
  };

  const handleReviewSubmitted = (newReview) => {
    setReviews(prev => [newReview, ...prev]);
    setReviewMeta(prev => ({
      ...prev,
      total: prev.total + 1,
      distribution: { ...prev.distribution, [newReview.rating]: (prev.distribution[newReview.rating] || 0) + 1 },
      averageRating: parseFloat(((prev.averageRating * prev.total + newReview.rating) / (prev.total + 1)).toFixed(1)),
    }));
    setCanReview(false);
    setAlreadyReviewed(true);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-10">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-400 flex items-center gap-1.5">
        <Link to="/" className="hover:text-rose-500 transition-colors">Trang chủ</Link>
        <span>/</span>
        <Link to="/products" className="hover:text-rose-500 transition-colors">Sản phẩm</Link>
        {product.Category && <><span>/</span><Link to={`/products?category=${product.Category.id}`} className="hover:text-rose-500 transition-colors">{product.Category.name}</Link></>}
        <span>/</span>
        <span className="text-gray-700 font-medium">{product.name}</span>
      </nav>

      {/* Product section */}
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Gallery */}
        <div className="space-y-3">
          <div className="relative aspect-square rounded-3xl overflow-hidden bg-gray-50 shadow-sm group">
            {images[activeImage]?.imageUrl ? (
              <img src={images[activeImage].imageUrl} alt={product.name}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-9xl">🧶</div>
            )}
            {hasDiscount && (
              <span className="absolute top-4 left-4 bg-rose-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow">
                -{discountPct}%
              </span>
            )}
            {product.stock === 0 && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-3xl">
                <span className="bg-white/90 text-gray-700 font-bold px-5 py-2 rounded-full">Hết hàng</span>
              </div>
            )}
            {images.length > 1 && (
              <>
                <button onClick={() => setActiveImage(i => (i - 1 + images.length) % images.length)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/90 rounded-full flex items-center justify-center shadow hover:bg-white transition opacity-0 group-hover:opacity-100">
                  <FiChevronLeft size={18} />
                </button>
                <button onClick={() => setActiveImage(i => (i + 1) % images.length)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/90 rounded-full flex items-center justify-center shadow hover:bg-white transition opacity-0 group-hover:opacity-100">
                  <FiChevronRight size={18} />
                </button>
              </>
            )}
          </div>
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {images.map((img, i) => (
                <button key={i} onClick={() => setActiveImage(i)}
                  className={`flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 transition-all ${activeImage === i ? 'border-rose-500 shadow-md shadow-rose-100 scale-105' : 'border-transparent hover:border-gray-300'}`}>
                  {img.imageUrl
                    ? <img src={img.imageUrl} alt="" className="w-full h-full object-cover" />
                    : <div className="w-full h-full bg-gray-100 flex items-center justify-center text-xl">🧶</div>}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product info */}
        <div className="space-y-5">
          {product.Category && (
            <Link to={`/products?category=${product.Category.id}`}
              className="inline-block text-xs font-semibold text-rose-600 bg-rose-50 px-3 py-1 rounded-full hover:bg-rose-100 transition-colors">
              {product.Category.name}
            </Link>
          )}
          <h1 className="text-xl lg:text-2xl font-black text-gray-900 leading-tight">{product.name}</h1>

          {/* Rating summary inline */}
          <button className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            onClick={() => document.getElementById('reviews-section')?.scrollIntoView({ behavior: 'smooth' })}>
            <Stars rating={reviewMeta.averageRating} size={16} />
            <span className="text-sm font-bold text-gray-700">{reviewMeta.averageRating > 0 ? reviewMeta.averageRating : '—'}</span>
            <span className="text-sm text-gray-400 underline decoration-dotted">{reviewMeta.total} đánh giá</span>
          </button>

          {/* Price */}
          <div className="flex items-end gap-3">
            <span className="text-3xl font-black text-rose-500">{formatCurrency(price)}</span>
            {hasDiscount && (
              <div className="flex flex-col">
                <span className="text-sm text-gray-400 line-through">{formatCurrency(product.price)}</span>
                <span className="text-xs font-bold text-emerald-600">Tiết kiệm {formatCurrency(product.price - product.salePrice)}</span>
              </div>
            )}
          </div>

          {/* Attributes */}
          <div className="bg-gray-50 rounded-2xl p-4 space-y-2 text-sm">
            {product.color && (
              <div className="flex gap-2"><span className="text-gray-500 w-24 shrink-0">Màu sắc</span><span className="font-medium text-gray-800">{product.color}</span></div>
            )}
            {product.size && (
              <div className="flex gap-2"><span className="text-gray-500 w-24 shrink-0">Kích cỡ</span><span className="font-medium text-gray-800">{product.size}</span></div>
            )}
            {product.weight && (
              <div className="flex gap-2"><span className="text-gray-500 w-24 shrink-0">Khối lượng</span><span className="font-medium text-gray-800">{product.weight}g</span></div>
            )}
            <div className="flex gap-2">
              <span className="text-gray-500 w-24 shrink-0">Tình trạng</span>
              {product.stock > 0
                ? <span className="font-semibold text-emerald-600">Còn hàng{stockLow && ` (chỉ còn ${product.stock}!)`}</span>
                : <span className="font-semibold text-red-500">Hết hàng</span>}
            </div>
          </div>

          {stockLow && product.stock > 0 && (
            <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
              <span>⚡</span> Chỉ còn {product.stock} sản phẩm — Đặt hàng sớm!
            </div>
          )}

          {product.description && (
            <p className="text-gray-600 text-sm leading-relaxed">{product.description}</p>
          )}

          {/* Add to cart */}
          {product.stock > 0 ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 border-2 border-gray-200 rounded-xl overflow-hidden">
                  <button onClick={() => setQty(q => Math.max(1, q - 1))} className="px-3 py-2.5 hover:bg-gray-50 transition-colors">
                    <FiMinus size={15} />
                  </button>
                  <span className="w-10 text-center font-bold text-sm">{qty}</span>
                  <button onClick={() => setQty(q => Math.min(product.stock, q + 1))} className="px-3 py-2.5 hover:bg-gray-50 transition-colors">
                    <FiPlus size={15} />
                  </button>
                </div>
                <button onClick={handleAddToCart} disabled={addingToCart}
                  className="flex-1 bg-rose-500 hover:bg-rose-600 active:scale-[.98] text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm shadow-rose-200 disabled:opacity-60">
                  <FiShoppingCart size={17} />
                  {addingToCart ? 'Đang thêm...' : 'Thêm vào giỏ hàng'}
                </button>
                <button onClick={handleWishlist}
                  className={`p-3 rounded-xl border-2 transition-all ${wishlisted ? 'border-rose-400 bg-rose-50 text-rose-500' : 'border-gray-200 text-gray-400 hover:border-rose-300 hover:text-rose-400'}`}
                  title={wishlisted ? 'Xóa khỏi yêu thích' : 'Thêm vào yêu thích'}
                >
                  <FiHeart size={20} className={wishlisted ? 'fill-rose-500' : ''} />
                </button>
              </div>
              <Link to="/custom-order"
                className="flex items-center justify-center gap-2 border-2 border-rose-200 text-rose-600 font-semibold py-2.5 rounded-xl hover:bg-rose-50 transition-colors text-sm">
                ✨ Đặt hàng theo thiết kế riêng
              </Link>
            </div>
          ) : (
            <button onClick={handleWishlist}
              className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 font-semibold transition-all ${wishlisted ? 'border-rose-400 bg-rose-50 text-rose-500' : 'border-gray-200 text-gray-500 hover:border-rose-300 hover:text-rose-400'}`}>
              <FiHeart size={18} className={wishlisted ? 'fill-rose-500' : ''} />
              {wishlisted ? 'Đã lưu vào yêu thích' : 'Lưu vào yêu thích'}
            </button>
          )}

          {/* Trust badges */}
          <div className="grid grid-cols-3 gap-3 pt-2">
            {[
              { icon: FiTruck, label: 'Giao hàng nhanh', sub: 'Toàn quốc' },
              { icon: FiRefreshCw, label: 'Đổi trả 7 ngày', sub: 'Dễ dàng' },
              { icon: FiPackage, label: 'Hàng chính hãng', sub: '100%' },
            ].map(({ icon: Icon, label, sub }) => (
              <div key={label} className="flex flex-col items-center text-center gap-1 p-3 bg-gray-50 rounded-xl">
                <Icon size={16} className="text-rose-500" />
                <span className="text-xs font-semibold text-gray-700">{label}</span>
                <span className="text-[10px] text-gray-400">{sub}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Reviews Section ── */}
      <div id="reviews-section" className="scroll-mt-8">
        <div className="flex items-center gap-3 mb-6">
          <h2 className="text-2xl font-black text-gray-800">Đánh giá sản phẩm</h2>
          {reviewMeta.total > 0 && (
            <span className="bg-rose-100 text-rose-600 text-sm font-bold px-3 py-1 rounded-full">{reviewMeta.total}</span>
          )}
        </div>

        {reviewMeta.total > 0 && (
          <div className="mb-6 space-y-3">
            <RatingSummary
              avg={reviewMeta.averageRating}
              total={reviewMeta.total}
              distribution={reviewMeta.distribution}
              activeFilter={ratingFilter}
              onFilter={handleRatingFilter}
            />
            <div className="flex items-center gap-2 flex-wrap">
              <button onClick={() => handleRatingFilter(0)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition ${ratingFilter === 0 ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                Tất cả
              </button>
              {[5, 4, 3, 2, 1].map(s => (
                <button key={s} onClick={() => handleRatingFilter(ratingFilter === s ? 0 : s)}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold transition ${ratingFilter === s ? 'bg-yellow-400 text-white' : 'bg-gray-100 text-gray-600 hover:bg-yellow-50 hover:text-yellow-700'}`}>
                  {s} ★
                </button>
              ))}
              {ratingFilter > 0 && (
                <span className="text-xs text-gray-400 ml-1">{reviewMeta.total} kết quả</span>
              )}
            </div>
          </div>
        )}

        {/* Review form */}
        {canReview && (
          <div className="mb-8">
            <ReviewForm
              productId={product.id}
              orderId={reviewOrderId}
              user={user}
              onSubmitted={handleReviewSubmitted}
            />
          </div>
        )}

        {alreadyReviewed && !canReview && (
          <div className="mb-6 flex items-center gap-3 bg-emerald-50 border border-emerald-100 rounded-2xl px-5 py-4">
            <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
              <FiCheck size={18} className="text-emerald-600" />
            </div>
            <div>
              <p className="font-semibold text-emerald-700 text-sm">Bạn đã đánh giá sản phẩm này</p>
              <p className="text-xs text-emerald-600 mt-0.5">Cảm ơn bạn đã chia sẻ trải nghiệm!</p>
            </div>
          </div>
        )}

        {!user && (
          <div className="mb-6 bg-blue-50 border border-blue-100 rounded-2xl px-5 py-4 flex items-center gap-3">
            <span className="text-2xl">💬</span>
            <p className="text-sm text-blue-700">
              <Link to="/login" className="font-bold underline">Đăng nhập</Link> để đánh giá sản phẩm sau khi nhận hàng.
            </p>
          </div>
        )}

        {/* Review list */}
        {reviewsLoading ? (
          <div className="flex justify-center py-12"><Spinner /></div>
        ) : reviews.length > 0 ? (
          <div className="space-y-4">
            {reviews.map(r => <ReviewCard key={r.id} review={r} />)}

            {/* Pagination */}
            {reviewMeta.pagination && reviewMeta.pagination.totalPages > 1 && (
              <div className="flex justify-center gap-2 pt-4">
                {Array.from({ length: reviewMeta.pagination.totalPages }, (_, i) => i + 1).map(p => (
                  <button key={p} onClick={() => setReviewPage(p)}
                    className={`w-9 h-9 rounded-xl text-sm font-bold transition-all ${reviewPage === p ? 'bg-rose-500 text-white shadow-sm' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                    {p}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-16 bg-gray-50 rounded-3xl border border-gray-100">
            <div className="text-6xl mb-4">⭐</div>
            <p className="font-bold text-gray-700 text-lg">Chưa có đánh giá nào</p>
            <p className="text-sm text-gray-400 mt-2 max-w-sm mx-auto leading-relaxed">
              Hãy là người đầu tiên chia sẻ trải nghiệm về sản phẩm này sau khi nhận hàng!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

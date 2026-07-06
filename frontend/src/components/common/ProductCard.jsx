import { Link } from 'react-router-dom';
import { FiShoppingCart, FiStar, FiHeart } from 'react-icons/fi';
import { formatCurrency } from '../../utils/formatters';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useWishlist } from '../../context/WishlistContext';
import { SaleCountdownCompact } from './SaleCountdown';
import toast from 'react-hot-toast';

const Stars = ({ rating, count }) => (
  <div className="flex items-center gap-1">
    {[1, 2, 3, 4, 5].map(s => (
      <FiStar key={s} size={11} className={s <= Math.round(rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200 fill-gray-200'} />
    ))}
    {count > 0
      ? <span className="text-[11px] text-gray-400 ml-0.5">({count})</span>
      : <span className="text-[11px] text-gray-300 ml-0.5">Chưa có đánh giá</span>
    }
  </div>
);

const ProductCard = ({ product }) => {
  const { addItem } = useCart();
  const { user, isRole } = useAuth();
  const { toggle, isWishlisted } = useWishlist();
  const wishlisted = isWishlisted(product.id);

  const handleAddToCart = async (e) => {
    e.preventDefault();
    if (!user) return toast.error('Vui lòng đăng nhập để thêm vào giỏ hàng');
    if (!isRole('customer')) return toast.error('Chỉ khách hàng mới có thể mua hàng');
    try {
      await addItem(product.id);
      toast.success('Đã thêm vào giỏ hàng!');
    } catch {}
  };

  const handleWishlist = async (e) => {
    e.preventDefault();
    if (!user) return toast.error('Vui lòng đăng nhập để lưu yêu thích');
    if (!isRole('customer')) return;
    const res = await toggle(product.id);
    if (res) toast.success(res.message);
  };

  const image = product.thumbnailImage || product.ProductImages?.[0]?.imageUrl;
  const now = new Date();
  const saleActive = product.salePrice && product.salePrice < product.price
    && (!product.saleStartDate || new Date(product.saleStartDate) <= now)
    && (!product.saleEndDate || new Date(product.saleEndDate) > now);
  const price = saleActive ? product.salePrice : product.price;
  const hasDiscount = saleActive;

  return (
    <Link to={`/products/${product.slug}`} className="group card p-0 overflow-hidden hover:shadow-md active:scale-[0.98] transition-all">
      <div className="relative overflow-hidden aspect-square bg-gray-100">
        {image ? (
          <img src={image} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-5xl">🧶</div>
        )}
        {hasDiscount && (
          <span className="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full font-medium">
            -{Math.round((1 - product.salePrice / product.price) * 100)}%
          </span>
        )}
        {product.stock === 0 && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="text-white font-semibold text-sm">Hết hàng</span>
          </div>
        )}
        <button
          onClick={handleWishlist}
          className="absolute top-2 right-2 w-9 h-9 flex items-center justify-center rounded-full bg-white/80 hover:bg-white active:scale-95 shadow-sm transition-all"
          title={wishlisted ? 'Xóa khỏi yêu thích' : 'Thêm vào yêu thích'}
        >
          <FiHeart size={15} className={wishlisted ? 'text-rose-500 fill-rose-500' : 'text-gray-400'} />
        </button>
      </div>
      <div className="p-2.5 xs:p-3">
        <p className="text-xs text-gray-500 mb-1">{product.Category?.name}</p>
        <h3 className="font-medium text-gray-900 line-clamp-2 text-xs xs:text-sm mb-1.5">{product.name}</h3>
        {product.color && <p className="text-xs text-gray-500 mb-1">Màu: {product.color}</p>}
        <div className="mb-2">
          <Stars rating={product.averageRating || 0} count={product.reviewCount || 0} />
        </div>
        <div className="flex items-center justify-between gap-1">
          <div className="min-w-0">
            <span className="font-semibold text-primary text-xs xs:text-sm">{formatCurrency(price)}</span>
            {hasDiscount && <span className="text-xs text-gray-400 line-through ml-1">{formatCurrency(product.price)}</span>}
          </div>
          {product.stock > 0 && (
            <button
              onClick={handleAddToCart}
              className="w-9 h-9 flex items-center justify-center rounded-lg bg-primary/10 text-primary hover:bg-primary hover:text-white active:scale-95 transition-all shrink-0"
            >
              <FiShoppingCart size={15} />
            </button>
          )}
        </div>
      </div>
      {hasDiscount && product.saleEndDate && (
        <SaleCountdownCompact endDate={product.saleEndDate} />
      )}
    </Link>
  );
};

export default ProductCard;

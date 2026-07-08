import { Link } from 'react-router-dom';
import { FiShoppingCart, FiStar, FiClock } from 'react-icons/fi';
import { formatCurrency } from '../../utils/formatters';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useCountdown } from '../../hooks/useCountdown';
import toast from 'react-hot-toast';

const Stars = ({ rating, count }) => {
  return (
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
};

function CardCountdown({ endDate }) {
  const { days, hours, minutes, seconds, expired } = useCountdown(endDate);
  if (expired) return null;
  const pad = v => String(v).padStart(2, '0');
  return (
    <span className="absolute top-2 right-2 inline-flex items-center gap-0.5 text-[10px] font-bold text-white bg-orange-500 shadow px-1.5 py-0.5 rounded-full leading-none">
      <FiClock size={8} className="shrink-0" />
      {days > 0 && <span>{days}d </span>}
      <span className="tabular-nums">{pad(hours)}:{pad(minutes)}:{pad(seconds)}</span>
    </span>
  );
}

const ProductCard = ({ product }) => {
  const { addItem } = useCart();
  const { user, isRole } = useAuth();

  const handleAddToCart = async (e) => {
    e.preventDefault();
    if (!user) return toast.error('Vui lòng đăng nhập để thêm vào giỏ hàng');
    if (!isRole('customer')) return toast.error('Chỉ khách hàng mới có thể mua hàng');
    try {
      await addItem(product.id);
      toast.success('Đã thêm vào giỏ hàng!');
    } catch {}
  };

  const image = product.thumbnailImage || product.ProductImages?.[0]?.imageUrl;
  const now = new Date();
  const saleActive = product.salePrice && product.salePrice < product.price
    && (!product.saleStartDate || new Date(product.saleStartDate) <= now)
    && (!product.saleEndDate || new Date(product.saleEndDate) > now);
  const price = saleActive ? product.salePrice : product.price;

  return (
    <Link to={`/products/${product.slug}`} className="group card p-0 overflow-hidden hover:shadow-md active:scale-[0.98] transition-all flex flex-col">
      <div className="relative overflow-hidden aspect-square bg-gray-100">
        {image ? (
          <img src={image} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-5xl">🧶</div>
        )}
        {saleActive && (
          <span className="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full font-medium">
            -{Math.round((1 - product.salePrice / product.price) * 100)}%
          </span>
        )}
        {saleActive && product.saleEndDate && (
          <CardCountdown endDate={product.saleEndDate} />
        )}
        {product.stock === 0 && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="text-white font-semibold text-sm">Hết hàng</span>
          </div>
        )}
      </div>
      <div className="p-2.5 xs:p-3 flex flex-col flex-1">
        <p className="text-xs text-gray-500 mb-1">{product.Category?.name}</p>
        <h3 className="font-medium text-gray-900 line-clamp-2 text-xs xs:text-sm mb-1.5">{product.name}</h3>
        {product.color && <p className="text-xs text-gray-500 mb-1">{`Màu: ${product.color}`}</p>}
        <div className="mb-2">
          <Stars rating={product.averageRating || 0} count={product.reviewCount || 0} />
        </div>
        <div className="flex items-center justify-between gap-1 mt-auto">
          <div className="min-w-0">
            <span className="font-semibold text-primary text-xs xs:text-sm">{formatCurrency(price)}</span>
            {saleActive && <span className="text-xs text-gray-400 line-through ml-1">{formatCurrency(product.price)}</span>}
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
    </Link>
  );
};

export default ProductCard;

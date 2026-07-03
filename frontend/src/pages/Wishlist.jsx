import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiHeart, FiShoppingCart, FiTrash2 } from 'react-icons/fi';
import api from '../services/api';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { formatCurrency } from '../utils/formatters';
import Spinner from '../components/common/Spinner';
import toast from 'react-hot-toast';

export default function Wishlist() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toggle } = useWishlist();
  const { addItem } = useCart();
  const { isRole } = useAuth();

  const fetchWishlist = async () => {
    try {
      const res = await api.get('/wishlist');
      setItems(res.data);
    } catch {
      toast.error('Không thể tải danh sách yêu thích');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchWishlist(); }, []);

  const handleRemove = async (productId) => {
    const res = await toggle(productId);
    if (res !== null) {
      setItems(prev => prev.filter(i => i.productId !== productId));
      toast.success('Đã xóa khỏi danh sách yêu thích');
    }
  };

  const handleAddToCart = async (e, productId) => {
    e.preventDefault();
    if (!isRole('customer')) return toast.error('Chỉ khách hàng mới có thể mua hàng');
    try {
      await addItem(productId);
      toast.success('Đã thêm vào giỏ hàng!');
    } catch {}
  };

  if (loading) return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <Spinner size="lg" />
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <FiHeart size={24} className="text-rose-500 fill-rose-500" />
        <h1 className="text-2xl font-bold text-gray-900">Danh sách yêu thích</h1>
        {items.length > 0 && (
          <span className="bg-rose-100 text-rose-600 text-sm font-medium px-2.5 py-0.5 rounded-full">
            {items.length} sản phẩm
          </span>
        )}
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="text-6xl mb-4">🧶</div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Chưa có sản phẩm yêu thích</h2>
          <p className="text-gray-500 mb-6">Hãy nhấn vào biểu tượng trái tim trên sản phẩm để lưu lại nhé!</p>
          <Link to="/products" className="btn-primary px-6 py-2.5 rounded-xl text-sm font-medium">
            Khám phá sản phẩm
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {items.map(({ productId, Product: product }) => {
            if (!product) return null;
            const image = product.thumbnailImage || product.ProductImages?.[0]?.imageUrl;
            const price = product.salePrice || product.price;
            const hasDiscount = product.salePrice && product.salePrice < product.price;

            return (
              <div key={productId} className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow group">
                <Link to={`/products/${product.slug}`} className="block">
                  <div className="relative aspect-square bg-gray-100 overflow-hidden">
                    {image ? (
                      <img src={image} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-4xl">🧶</div>
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
                  </div>
                </Link>

                <div className="p-3">
                  <p className="text-xs text-gray-400 mb-1">{product.Category?.name}</p>
                  <Link to={`/products/${product.slug}`}>
                    <h3 className="font-medium text-gray-900 line-clamp-2 text-sm mb-2 hover:text-rose-600 transition-colors">
                      {product.name}
                    </h3>
                  </Link>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-rose-600 text-sm">{formatCurrency(price)}</span>
                      {hasDiscount && (
                        <span className="text-xs text-gray-400 line-through ml-1">{formatCurrency(product.price)}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 mt-2.5">
                    {product.stock > 0 && (
                      <button
                        onClick={(e) => handleAddToCart(e, productId)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-rose-500 text-white text-xs font-medium rounded-lg hover:bg-rose-600 transition-colors"
                      >
                        <FiShoppingCart size={13} />
                        Thêm vào giỏ
                      </button>
                    )}
                    <button
                      onClick={() => handleRemove(productId)}
                      className="p-1.5 border border-gray-200 rounded-lg text-gray-400 hover:text-red-500 hover:border-red-300 transition-colors"
                      title="Xóa khỏi yêu thích"
                    >
                      <FiTrash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

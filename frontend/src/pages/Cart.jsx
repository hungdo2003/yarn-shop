import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { formatCurrency } from '../utils/formatters';
import Spinner from '../components/common/Spinner';
import { FiTrash2, FiMinus, FiPlus, FiShoppingCart } from 'react-icons/fi';
import toast from 'react-hot-toast';

const Cart = () => {
  const { cart, loading, updateItem, removeItem } = useCart();
  const navigate = useNavigate();
  const [updatingId, setUpdatingId] = useState(null);

  if (loading) return <Spinner />;

  const items = cart?.CartItems || [];
  const total = cart?.total || 0;
  const shippingFee = total >= 500000 ? 0 : 30000;

  if (!items.length) return (
    <div className="max-w-3xl mx-auto px-4 py-20 text-center">
      <FiShoppingCart size={60} className="mx-auto text-gray-300 mb-4" />
      <h2 className="text-xl font-bold text-gray-700 mb-2">Giỏ hàng trống</h2>
      <p className="text-gray-500 text-sm mb-6">Bạn chưa thêm sản phẩm nào vào giỏ hàng.</p>
      <Link to="/products" className="bg-rose-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-rose-600 transition">Mua sắm ngay</Link>
    </div>
  );

  const handleUpdate = async (item, newQty) => {
    if (newQty < 1) {
      handleRemove(item);
      return;
    }
    setUpdatingId(item.id);
    try {
      await updateItem(item.id, newQty);
      if (newQty > item.quantity) toast.success('Đã cập nhật số lượng', { duration: 1500 });
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Cập nhật thất bại');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleRemove = async (item) => {
    try {
      await removeItem(item.id);
    } catch {
      toast.error('Xóa sản phẩm thất bại');
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">
        Giỏ Hàng <span className="text-gray-400 font-normal text-lg">({items.length} sản phẩm)</span>
      </h1>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-3">
          {items.map(item => (
            <div key={item.id} className={`bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex gap-4 items-center transition-opacity ${updatingId === item.id ? 'opacity-60' : ''}`}>
              <Link to={`/products/${item.Product?.slug}`} className="shrink-0">
                {item.Product?.thumbnailImage
                  ? <img src={item.Product.thumbnailImage} alt={item.Product?.name} className="w-20 h-20 object-cover rounded-xl" />
                  : <div className="w-20 h-20 bg-rose-50 rounded-xl flex items-center justify-center text-3xl">🧶</div>}
              </Link>
              <div className="flex-1 min-w-0">
                <Link to={`/products/${item.Product?.slug}`} className="font-semibold text-gray-800 hover:text-rose-500 line-clamp-1 transition">
                  {item.Product?.name}
                </Link>
                <p className="text-rose-500 font-bold mt-1">{formatCurrency(item.price)}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button onClick={() => handleUpdate(item, item.quantity - 1)} disabled={!!updatingId} className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50 disabled:opacity-40 transition">
                  <FiMinus size={12} />
                </button>
                <span className="w-8 text-center font-semibold text-sm">{item.quantity}</span>
                <button onClick={() => handleUpdate(item, item.quantity + 1)} disabled={!!updatingId} className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50 disabled:opacity-40 transition">
                  <FiPlus size={12} />
                </button>
              </div>
              <div className="text-right min-w-[90px] shrink-0">
                <p className="font-bold text-gray-800">{formatCurrency(item.quantity * item.price)}</p>
              </div>
              <button onClick={() => handleRemove(item)} className="text-gray-300 hover:text-red-500 p-1 transition shrink-0">
                <FiTrash2 size={16} />
              </button>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 h-fit sticky top-20">
          <h3 className="font-bold text-gray-800 mb-4">Tóm tắt đơn hàng</h3>
          <div className="space-y-2.5 text-sm mb-5">
            <div className="flex justify-between text-gray-600">
              <span>Tạm tính</span><span>{formatCurrency(total)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Phí vận chuyển</span>
              <span>{shippingFee === 0 ? <span className="text-green-600 font-semibold">Miễn phí</span> : formatCurrency(shippingFee)}</span>
            </div>
            {total < 500000 && (
              <p className="text-xs text-gray-400 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                Mua thêm <span className="font-semibold text-amber-600">{formatCurrency(500000 - total)}</span> để được miễn phí vận chuyển
              </p>
            )}
            <hr className="border-gray-100" />
            <div className="flex justify-between font-bold text-base">
              <span>Tổng cộng</span>
              <span className="text-rose-500 text-lg">{formatCurrency(total + shippingFee)}</span>
            </div>
          </div>
          <button onClick={() => navigate('/checkout')} className="w-full bg-rose-500 text-white py-3 rounded-xl font-bold hover:bg-rose-600 transition">
            Tiến hành thanh toán
          </button>
          <Link to="/products" className="block text-center text-sm text-gray-400 mt-3 hover:text-rose-500 transition">
            ← Tiếp tục mua sắm
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Cart;

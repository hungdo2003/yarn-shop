import { useState, useEffect } from 'react';
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
  const [selected, setSelected] = useState(new Set());

  const items = cart?.CartItems || [];

  useEffect(() => {
    setSelected(prev => {
      const next = new Set();
      items.forEach(i => {
        if (prev.size === 0 || prev.has(i.id)) next.add(i.id);
      });
      return next;
    });
  }, [cart]);

  if (loading) return <Spinner />;

  if (!items.length) return (
    <div className="max-w-3xl mx-auto px-4 py-20 text-center">
      <FiShoppingCart size={60} className="mx-auto text-gray-300 mb-4" />
      <h2 className="text-xl font-bold text-gray-700 mb-2">Giỏ hàng trống</h2>
      <p className="text-gray-500 text-sm mb-6">Bạn chưa thêm sản phẩm nào vào giỏ hàng.</p>
      <Link to="/products" className="bg-rose-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-rose-600 active:scale-95 transition inline-block">Mua sắm ngay</Link>
    </div>
  );

  const allSelected = items.length > 0 && items.every(i => selected.has(i.id));
  const selectedItems = items.filter(i => selected.has(i.id));
  const selectedTotal = selectedItems.reduce((s, i) => s + i.quantity * parseFloat(i.price), 0);
  const shippingFee = selectedItems.length > 0 ? (selectedTotal >= 500000 ? 0 : 30000) : 0;

  const toggleAll = () => {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(items.map(i => i.id)));
  };

  const toggleItem = (id) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleUpdate = async (item, newQty) => {
    if (newQty < 1) { handleRemove(item); return; }
    setUpdatingId(item.id);
    try {
      await updateItem(item.id, newQty);
      if (newQty > item.quantity) toast.success('Đã cập nhật số lượng', { duration: 1500 });
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Cập nhật thất bại');
    } finally { setUpdatingId(null); }
  };

  const handleRemove = async (item) => {
    try {
      await removeItem(item.id);
      setSelected(prev => { const next = new Set(prev); next.delete(item.id); return next; });
    } catch { toast.error('Xóa sản phẩm thất bại'); }
  };

  const handleCheckout = () => {
    if (!selectedItems.length) { toast.error('Vui lòng chọn ít nhất một sản phẩm'); return; }
    sessionStorage.setItem('selectedItems', JSON.stringify(
      selectedItems.map(i => ({
        id: i.id, productId: i.productId, quantity: i.quantity,
        price: i.price, Product: i.Product,
      }))
    ));
    navigate('/checkout?mode=selected');
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 xs:py-8 pb-32 md:pb-8">
      <h1 className="text-xl xs:text-2xl font-bold text-gray-800 mb-4 xs:mb-6">
        Giỏ Hàng <span className="text-gray-400 font-normal text-base xs:text-lg">({items.length} sản phẩm)</span>
      </h1>

      <div className="grid md:grid-cols-3 gap-4 xs:gap-6">
        <div className="md:col-span-2 space-y-3">
          {/* Select All row */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 px-4 py-3 flex items-center gap-3">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={toggleAll}
              className="w-4 h-4 accent-rose-500 cursor-pointer"
            />
            <span className="text-sm font-medium text-gray-700 min-w-0 truncate">
              Chọn tất cả ({items.length} sản phẩm)
            </span>
            {selectedItems.length > 0 && !allSelected && (
              <span className="text-xs text-gray-400 ml-auto shrink-0">Đã chọn {selectedItems.length}</span>
            )}
          </div>

          {items.map(item => (
            <div key={item.id} className={`bg-white rounded-2xl shadow-sm border transition-all p-3 xs:p-4 ${
              updatingId === item.id ? 'opacity-60' : ''
            } ${selected.has(item.id) ? 'border-rose-200 bg-rose-50/30' : 'border-gray-100'}`}>
              {/* Top row: checkbox + image + product info + delete */}
              <div className="flex gap-2 xs:gap-3 items-start">
                <input
                  type="checkbox"
                  checked={selected.has(item.id)}
                  onChange={() => toggleItem(item.id)}
                  className="w-4 h-4 accent-rose-500 cursor-pointer shrink-0 mt-1"
                />
                <Link to={`/products/${item.Product?.slug}`} className="shrink-0 active:scale-95 transition">
                  {item.Product?.thumbnailImage
                    ? <img src={item.Product.thumbnailImage} alt={item.Product?.name} className="w-16 h-16 xs:w-20 xs:h-20 object-cover rounded-xl" />
                    : <div className="w-16 h-16 xs:w-20 xs:h-20 bg-rose-50 rounded-xl flex items-center justify-center text-2xl xs:text-3xl">🧶</div>}
                </Link>
                <div className="flex-1 min-w-0">
                  <Link to={`/products/${item.Product?.slug}`} className="font-semibold text-gray-800 hover:text-rose-500 line-clamp-2 xs:line-clamp-1 text-sm xs:text-base transition block">
                    {item.Product?.name}
                  </Link>
                  {item.Product?.color && (
                    <p className="text-xs text-gray-400 mt-0.5">Màu: {item.Product.color}</p>
                  )}
                  <p className="text-rose-500 font-bold text-sm mt-1">{formatCurrency(item.price)}</p>
                </div>
                {/* Delete — 44px touch target */}
                <button
                  onClick={() => handleRemove(item)}
                  className="w-11 h-11 flex items-center justify-center text-gray-300 hover:text-red-500 active:scale-95 transition shrink-0"
                >
                  <FiTrash2 size={16} />
                </button>
              </div>
              {/* Bottom row: quantity controls + subtotal */}
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-1 xs:gap-2">
                  <button
                    onClick={() => handleUpdate(item, item.quantity - 1)}
                    disabled={!!updatingId}
                    className="w-11 h-11 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50 disabled:opacity-40 active:scale-95 transition"
                  >
                    <FiMinus size={12} />
                  </button>
                  <span className="w-8 text-center font-semibold text-sm">{item.quantity}</span>
                  <button
                    onClick={() => handleUpdate(item, item.quantity + 1)}
                    disabled={!!updatingId}
                    className="w-11 h-11 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50 disabled:opacity-40 active:scale-95 transition"
                  >
                    <FiPlus size={12} />
                  </button>
                </div>
                <p className="font-bold text-gray-800 text-sm xs:text-base shrink-0">
                  {formatCurrency(item.quantity * parseFloat(item.price))}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 h-fit md:sticky md:top-20">
          <h3 className="font-bold text-gray-800 mb-1">Tóm tắt đơn hàng</h3>
          <p className="text-xs text-gray-400 mb-4">
            {selectedItems.length > 0 ? `${selectedItems.length} sản phẩm được chọn` : 'Chưa chọn sản phẩm nào'}
          </p>
          <div className="space-y-2.5 text-sm mb-5">
            <div className="flex justify-between text-gray-600">
              <span>Tạm tính</span><span>{formatCurrency(selectedTotal)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Phí vận chuyển</span>
              <span>
                {selectedItems.length === 0 ? '—'
                  : shippingFee === 0
                  ? <span className="text-green-600 font-semibold">Miễn phí</span>
                  : formatCurrency(shippingFee)}
              </span>
            </div>
            {selectedItems.length > 0 && selectedTotal < 500000 && (
              <p className="text-xs text-gray-400 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                Mua thêm <span className="font-semibold text-amber-600">{formatCurrency(500000 - selectedTotal)}</span> để được miễn phí vận chuyển
              </p>
            )}
            <hr className="border-gray-100" />
            <div className="flex justify-between font-bold text-base">
              <span>Tổng cộng</span>
              <span className="text-rose-500 text-lg">{formatCurrency(selectedTotal + shippingFee)}</span>
            </div>
          </div>
          {/* Checkout button — desktop only; mobile uses sticky bottom bar */}
          <button
            onClick={handleCheckout}
            disabled={!selectedItems.length}
            className="hidden md:block w-full bg-rose-500 text-white py-3 rounded-xl font-bold hover:bg-rose-600 active:scale-95 transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {selectedItems.length > 0 ? `Thanh toán (${selectedItems.length})` : 'Chọn sản phẩm để thanh toán'}
          </button>
          <Link to="/products" className="block text-center text-sm text-gray-400 mt-3 hover:text-rose-500 active:scale-95 transition">
            ← Tiếp tục mua sắm
          </Link>
        </div>
      </div>

      {/* Mobile sticky checkout bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-white border-t border-gray-100 shadow-[0_-2px_12px_rgba(0,0,0,0.08)] px-4 pt-3 pb-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-gray-500 min-w-0 truncate">
            {selectedItems.length > 0 ? `Đã chọn ${selectedItems.length} sản phẩm` : 'Chưa chọn sản phẩm nào'}
          </span>
          <span className="font-bold text-rose-500 text-sm shrink-0 ml-2">
            {formatCurrency(selectedTotal + shippingFee)}
          </span>
        </div>
        <button
          onClick={handleCheckout}
          disabled={!selectedItems.length}
          className="w-full bg-rose-500 text-white py-3.5 rounded-xl font-bold text-base hover:bg-rose-600 active:scale-95 transition disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {selectedItems.length > 0 ? `Thanh toán (${selectedItems.length})` : 'Chọn sản phẩm để thanh toán'}
        </button>
      </div>
    </div>
  );
};

export default Cart;

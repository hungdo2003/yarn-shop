import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';

const fmt = (n) => Number(n).toLocaleString('vi-VN') + 'đ';

// All orders now pay via PayOS — no method selection needed

const SHIPPING_METHODS = [
  { value: 'standard', label: 'Tiêu chuẩn', desc: '3–5 ngày', fee: 30000, freeThreshold: 500000 },
  { value: 'express', label: 'Hỏa tốc', desc: '1–2 ngày', fee: 50000, freeThreshold: null },
  { value: 'economy', label: 'Tiết kiệm', desc: '5–7 ngày', fee: 15000, freeThreshold: null },
];

const Checkout = ({ guest }) => {
  const { cart, fetchCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [voucherCode, setVoucherCode] = useState('');
  const [voucher, setVoucher] = useState(null);
  const [discount, setDiscount] = useState(0);
  const [addresses, setAddresses] = useState([]);
  const [shippingMethod, setShippingMethod] = useState('standard');
  const [paymentMethod, setPaymentMethod] = useState('payos');
  const [walletBalance, setWalletBalance] = useState(0);
  const [form, setForm] = useState({
    shippingName: user?.fullName || '',
    shippingPhone: user?.phone || '',
    shippingAddress: '',
    guestEmail: '',
    note: ''
  });

  useEffect(() => {
    if (user && !guest) {
      api.get('/addresses').then(r => {
        setAddresses(r.data);
        const def = r.data.find(a => a.isDefault) || r.data[0];
        if (def) setForm(f => ({ ...f, shippingName: def.fullName, shippingPhone: def.phone, shippingAddress: [def.address, def.ward, def.district, def.province].filter(Boolean).join(', ') }));
      }).catch(() => {});
      api.get('/wallet').then(r => setWalletBalance(r.data.balance)).catch(() => {});
    }
  }, [user]);

  const getCartItems = () => {
    if (guest) {
      const local = JSON.parse(localStorage.getItem('guestCart') || '[]');
      return local;
    }
    return cart?.CartItems || [];
  };

  const cartItems = getCartItems();
  const subtotal = guest
    ? cartItems.reduce((s, i) => s + i.quantity * i.price, 0)
    : (cart?.total || 0);

  const selectedShipping = SHIPPING_METHODS.find(m => m.value === shippingMethod);
  const shippingFee = selectedShipping?.freeThreshold && subtotal >= selectedShipping.freeThreshold ? 0 : (selectedShipping?.fee || 30000);

  const applyVoucher = async () => {
    if (!voucherCode.trim()) return;
    try {
      const res = await api.post('/vouchers/validate', { code: voucherCode.toUpperCase(), orderAmount: subtotal });
      setVoucher(res.data.voucher);
      setDiscount(res.data.discount);
      toast.success('Đã áp dụng mã giảm giá!');
    } catch (err) { toast.error(err.response?.data?.message || 'Mã không hợp lệ'); }
  };

  const discountAmt = voucher?.type === 'free_shipping' ? shippingFee : discount;
  const total = subtotal + shippingFee - discountAmt;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!cartItems.length) return toast.error('Giỏ hàng trống');
    if (!guest && addresses.length === 0) return toast.error('Vui lòng thêm địa chỉ giao hàng trước khi đặt hàng');
    if (!form.shippingAddress.trim()) return toast.error('Vui lòng chọn địa chỉ giao hàng');
    if (!form.shippingName.trim()) return toast.error('Địa chỉ thiếu tên người nhận');
    if (!form.shippingPhone.trim()) return toast.error('Địa chỉ thiếu số điện thoại');

    setLoading(true);
    let orderId = null;
    let paidByWallet = false;

    // Step 1: Create order
    const tid = toast.loading('Đang tạo đơn hàng...');
    try {
      const payload = { ...form, shippingMethod, voucherCode: voucher?.code }; // kept for guest path

      const payload2 = { ...form, shippingMethod, voucherCode: voucher?.code, paymentMethod };
      if (guest) {
        payload2.items = cartItems.map(i => ({ productId: i.productId, quantity: i.quantity }));
        const res = await api.post('/orders/guest', payload2);
        localStorage.removeItem('guestCart');
        orderId = res.data.orderId;
        paidByWallet = false;
      } else {
        const res = await api.post('/orders', payload2);
        await fetchCart();
        orderId = res.data.orderId;
        paidByWallet = res.data.paidByWallet;
      }
      toast.dismiss(tid);
    } catch (err) {
      toast.dismiss(tid);
      toast.error(err?.response?.data?.message || 'Đặt hàng thất bại. Vui lòng thử lại.');
      setLoading(false);
      return;
    }

    // Wallet payment: already done — go straight to order
    if (paidByWallet) {
      toast.success('Đặt hàng & thanh toán ví thành công!');
      navigate(`/orders/${orderId}`);
      return;
    }

    // PayOS: create payment link and redirect
    const tid2 = toast.loading('Đang tạo liên kết thanh toán...');
    try {
      const payRes = await api.post(`/payment/create-link/${orderId}`);
      toast.dismiss(tid2);
      toast.success('Đang chuyển đến trang thanh toán...');
      window.location.href = payRes.data.checkoutUrl;
    } catch (err) {
      toast.dismiss(tid2);
      const msg = err?.response?.data?.message || 'Không thể tạo liên kết thanh toán';
      toast.error(msg, { duration: 5000 });
      navigate(`/orders/${orderId}`);
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-2">Thanh Toán</h1>
      {guest && <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-2 text-sm text-amber-800 mb-6">Bạn đang đặt hàng với tư cách khách. <a href="/login" className="underline font-medium">Đăng nhập</a> để theo dõi đơn hàng dễ hơn.</div>}

      <form onSubmit={handleSubmit}>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-5">
            {/* Address selection — required */}
            <div className="bg-white rounded-xl shadow p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold">Địa Chỉ Giao Hàng</h3>
                <a href="/addresses" target="_blank" rel="noreferrer" className="text-xs text-rose-500 hover:underline">+ Thêm địa chỉ</a>
              </div>
              {!guest && addresses.length === 0 ? (
                <div className="border-2 border-dashed border-rose-300 rounded-xl p-6 text-center">
                  <p className="text-3xl mb-2">📍</p>
                  <p className="text-gray-600 font-medium text-sm mb-1">Bạn chưa có địa chỉ giao hàng</p>
                  <p className="text-gray-400 text-xs mb-3">Vui lòng thêm địa chỉ trước khi đặt hàng</p>
                  <a href="/addresses" className="inline-block bg-rose-500 text-white text-sm px-5 py-2 rounded-xl font-semibold hover:bg-rose-600 transition">
                    Thêm địa chỉ ngay
                  </a>
                </div>
              ) : (
                <div className="space-y-2">
                  {addresses.map(a => {
                    const addrStr = [a.address, a.ward, a.district, a.province].filter(Boolean).join(', ');
                    const isSelected = form.shippingAddress === addrStr;
                    return (
                      <label key={a.id} className={`flex items-start gap-3 border-2 rounded-xl p-3.5 cursor-pointer transition ${isSelected ? 'border-rose-400 bg-rose-50' : 'border-gray-200 hover:border-rose-200'}`}>
                        <input
                          type="radio" name="addr"
                          checked={isSelected}
                          onChange={() => setForm(f => ({ ...f, shippingName: a.fullName, shippingPhone: a.phone, shippingAddress: addrStr }))}
                          className="mt-0.5 accent-rose-500 shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold text-gray-800">{a.fullName}</p>
                            <span className="text-sm text-gray-400">|</span>
                            <p className="text-sm text-gray-600">{a.phone}</p>
                            {a.isDefault && <span className="text-[10px] bg-rose-100 text-rose-600 px-1.5 py-0.5 rounded font-bold">Mặc định</span>}
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5 truncate">{addrStr}</p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}
              {/* Guest: keep manual entry */}
              {guest && (
                <div className="grid sm:grid-cols-2 gap-4 mt-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Họ tên người nhận *</label>
                    <input value={form.shippingName} onChange={e => setForm(f => ({ ...f, shippingName: e.target.value }))} required className="w-full border rounded-lg px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Số điện thoại *</label>
                    <input value={form.shippingPhone} onChange={e => setForm(f => ({ ...f, shippingPhone: e.target.value }))} required className="w-full border rounded-lg px-3 py-2 text-sm" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs text-gray-500 mb-1">Email</label>
                    <input type="email" value={form.guestEmail} onChange={e => setForm(f => ({ ...f, guestEmail: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs text-gray-500 mb-1">Địa chỉ *</label>
                    <textarea value={form.shippingAddress} onChange={e => setForm(f => ({ ...f, shippingAddress: e.target.value }))} required rows={2} className="w-full border rounded-lg px-3 py-2 text-sm resize-none" />
                  </div>
                </div>
              )}
              {/* Note always available */}
              <div className="mt-3">
                <label className="block text-xs text-gray-500 mb-1">Ghi chú đơn hàng</label>
                <input value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} placeholder="Yêu cầu đặc biệt, ghi chú giao hàng..." className="w-full border rounded-lg px-3 py-2 text-sm" />
              </div>
            </div>

            {/* Shipping method */}
            <div className="bg-white rounded-xl shadow p-5">
              <h3 className="font-semibold mb-4">Phương Thức Vận Chuyển</h3>
              <div className="space-y-3">
                {SHIPPING_METHODS.map(m => {
                  const actualFee = m.freeThreshold && subtotal >= m.freeThreshold ? 0 : m.fee;
                  return (
                    <label key={m.value} className={`flex items-center justify-between border-2 rounded-xl p-4 cursor-pointer transition ${shippingMethod === m.value ? 'border-rose-400 bg-rose-50' : 'border-gray-200 hover:border-gray-300'}`}>
                      <div className="flex items-center gap-3">
                        <input type="radio" name="shipping" value={m.value} checked={shippingMethod === m.value} onChange={() => setShippingMethod(m.value)} className="accent-rose-500" />
                        <div>
                          <p className="font-medium text-sm">{m.label}</p>
                          <p className="text-xs text-gray-500">{m.desc}</p>
                          {m.freeThreshold && <p className="text-xs text-green-600">Miễn phí khi đơn từ {fmt(m.freeThreshold)}</p>}
                        </div>
                      </div>
                      <span className={`font-semibold text-sm ${actualFee === 0 ? 'text-green-600' : 'text-gray-800'}`}>{actualFee === 0 ? 'Miễn phí' : fmt(actualFee)}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Payment method */}
            {!guest && (
              <div className="bg-white rounded-xl shadow p-5">
                <h3 className="font-semibold mb-3">Phương Thức Thanh Toán</h3>
                <div className="space-y-3">
                  {/* Wallet */}
                  <label className={`flex items-center gap-3 border-2 rounded-xl p-4 cursor-pointer transition ${paymentMethod === 'wallet' ? 'border-green-400 bg-green-50' : 'border-gray-200 hover:border-gray-300'}`}>
                    <input type="radio" name="payment" value="wallet" checked={paymentMethod === 'wallet'} onChange={() => setPaymentMethod('wallet')} className="accent-green-500" />
                    <span className="text-xl">💰</span>
                    <div className="flex-1">
                      <p className="font-semibold text-sm text-gray-800">Ví YarnShop</p>
                      <p className="text-xs text-gray-500">Số dư: <span className={`font-bold ${walletBalance >= total ? 'text-green-600' : 'text-red-500'}`}>{walletBalance.toLocaleString('vi-VN')}đ</span></p>
                    </div>
                    {walletBalance < total && (
                      <span className="text-xs text-red-500 bg-red-50 px-2 py-0.5 rounded-full">Không đủ</span>
                    )}
                  </label>
                  {/* PayOS */}
                  <label className={`flex items-center gap-3 border-2 rounded-xl p-4 cursor-pointer transition ${paymentMethod === 'payos' ? 'border-blue-400 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
                    <input type="radio" name="payment" value="payos" checked={paymentMethod === 'payos'} onChange={() => setPaymentMethod('payos')} className="accent-blue-500" />
                    <span className="text-xl">💳</span>
                    <div>
                      <p className="font-semibold text-sm text-blue-800">PayOS — Trực tuyến</p>
                      <p className="text-xs text-blue-600">Thẻ ATM, Visa/Mastercard, QR</p>
                    </div>
                  </label>
                </div>
                {paymentMethod === 'wallet' && walletBalance < total && (
                  <p className="text-xs text-red-500 mt-2">Số dư ví không đủ. <a href="/wallet" className="underline font-medium">Nạp thêm tiền</a> hoặc chọn thanh toán PayOS.</p>
                )}
              </div>
            )}
          </div>

          {/* Order summary */}
          <div className="space-y-4">
            <div className="bg-white rounded-xl shadow p-5">
              <h3 className="font-semibold mb-4">Sản phẩm ({cartItems.length})</h3>
              <div className="space-y-3 max-h-56 overflow-y-auto">
                {cartItems.map((item, i) => (
                  <div key={item.id || i} className="flex gap-2">
                    <img src={item.Product?.thumbnailImage || item.thumbnailImage} className="w-10 h-10 rounded object-cover bg-gray-100 shrink-0" onError={e => { e.target.src = 'https://placehold.co/40?text=...'; }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-700 line-clamp-1">{item.Product?.name || item.name}</p>
                      <p className="text-xs text-gray-500">x{item.quantity}</p>
                    </div>
                    <p className="text-xs font-medium shrink-0">{fmt(item.quantity * parseFloat(item.price))}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow p-5">
              <h3 className="font-semibold mb-3">Mã giảm giá</h3>
              <div className="flex gap-2 mb-3">
                <input value={voucherCode} onChange={e => setVoucherCode(e.target.value.toUpperCase())} placeholder="Nhập mã..." className="flex-1 border rounded-lg px-3 py-2 text-sm" />
                <button type="button" onClick={applyVoucher} className="bg-gray-800 text-white px-3 rounded-lg text-sm hover:bg-gray-900">Áp dụng</button>
              </div>
              {voucher && <p className="text-green-600 text-xs">✓ Giảm: -{fmt(discountAmt)}</p>}
            </div>

            <div className="bg-white rounded-xl shadow p-5">
              <div className="space-y-2 text-sm mb-4">
                <div className="flex justify-between text-gray-600"><span>Tạm tính</span><span>{fmt(subtotal)}</span></div>
                <div className="flex justify-between text-gray-600"><span>Phí vận chuyển</span><span className={shippingFee === 0 ? 'text-green-600' : ''}>{shippingFee === 0 ? 'Miễn phí' : fmt(shippingFee)}</span></div>
                {discountAmt > 0 && <div className="flex justify-between text-green-600"><span>Giảm giá</span><span>-{fmt(discountAmt)}</span></div>}
                <hr />
                <div className="flex justify-between font-bold text-base"><span>Tổng cộng</span><span className="text-rose-600">{fmt(total)}</span></div>
              </div>
              <button
                type="submit"
                disabled={loading || !cartItems.length || (!guest && !form.shippingAddress) || (!guest && addresses.length === 0) || (paymentMethod === 'wallet' && walletBalance < total)}
                className="w-full bg-rose-500 text-white py-3.5 rounded-xl font-bold hover:bg-rose-600 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? '⏳ Đang xử lý...' : paymentMethod === 'wallet'
                  ? <><span>💰</span> Đặt hàng & Thanh toán bằng ví</>
                  : <><span>💳</span> Đặt hàng & Thanh toán PayOS</>}
              </button>
              <p className="text-xs text-gray-400 text-center mt-2">
                {paymentMethod === 'wallet' ? 'Tiền sẽ được trừ ngay từ ví của bạn' : 'Bạn sẽ được chuyển đến trang thanh toán PayOS an toàn'}
              </p>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default Checkout;

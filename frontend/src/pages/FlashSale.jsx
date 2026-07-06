import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiZap, FiCopy, FiShoppingCart } from 'react-icons/fi';
import api from '../services/api';
import { useCountdown } from '../hooks/useCountdown';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { formatCurrency } from '../utils/formatters';
import Spinner from '../components/common/Spinner';
import toast from 'react-hot-toast';

/* ── Countdown block ── */
function CountBlock({ value, label }) {
  return (
    <div className="flex flex-col items-center">
      <div className="bg-gray-900 text-white text-2xl sm:text-4xl font-black w-14 sm:w-20 h-14 sm:h-20 rounded-xl flex items-center justify-center tabular-nums shadow-lg">
        {String(value).padStart(2, '0')}
      </div>
      <span className="text-xs text-gray-500 mt-1 font-medium">{label}</span>
    </div>
  );
}

function Countdown({ endDate }) {
  const { days, hours, minutes, seconds, expired } = useCountdown(endDate);
  if (expired) return (
    <div className="text-center py-4 text-gray-500 font-semibold">Flash Sale đã kết thúc</div>
  );
  return (
    <div className="flex items-end gap-2 justify-center">
      {days > 0 && <><CountBlock value={days} label="Ngày" /><span className="text-3xl font-black text-gray-400 mb-4">:</span></>}
      <CountBlock value={hours} label="Giờ" />
      <span className="text-3xl font-black text-gray-400 mb-4">:</span>
      <CountBlock value={minutes} label="Phút" />
      <span className="text-3xl font-black text-gray-400 mb-4">:</span>
      <CountBlock value={seconds} label="Giây" />
    </div>
  );
}

/* ── Voucher card ── */
function VoucherCard({ voucher }) {
  const copy = () => { navigator.clipboard.writeText(voucher.code); toast.success(`Đã sao chép mã ${voucher.code}!`); };
  const remaining = voucher.usageLimit ? voucher.usageLimit - voucher.usedCount : null;
  const pctUsed = voucher.usageLimit ? Math.round((voucher.usedCount / voucher.usageLimit) * 100) : 0;

  return (
    <div className="bg-white rounded-2xl border-2 border-dashed border-orange-300 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      <div className="bg-gradient-to-r from-orange-500 to-red-500 px-5 py-4 text-white">
        <div className="flex items-center gap-2 mb-1">
          <FiZap size={16} className="fill-white" />
          <span className="text-xs font-bold uppercase tracking-wider">Flash Sale</span>
        </div>
        <p className="text-2xl font-black">
          {voucher.type === 'percentage'
            ? `Giảm ${voucher.value}%`
            : voucher.type === 'fixed'
            ? `Giảm ${formatCurrency(voucher.value)}`
            : 'Miễn phí vận chuyển'}
        </p>
        {voucher.maxDiscountAmount && voucher.type === 'percentage' && (
          <p className="text-xs text-orange-100 mt-0.5">Tối đa {formatCurrency(voucher.maxDiscountAmount)}</p>
        )}
      </div>
      <div className="px-5 py-4">
        <div className="flex items-center gap-2 mb-3">
          <code className="flex-1 bg-orange-50 text-orange-700 font-mono font-bold text-center py-2 rounded-lg text-sm border border-orange-200">
            {voucher.code}
          </code>
          <button onClick={copy} className="flex items-center gap-1 bg-orange-500 text-white px-3 h-11 rounded-lg text-sm hover:bg-orange-600 active:scale-95 transition shrink-0">
            <FiCopy size={14} /> Sao chép
          </button>
        </div>
        {voucher.minOrderAmount > 0 && (
          <p className="text-xs text-gray-500 mb-1">Đơn tối thiểu: {formatCurrency(voucher.minOrderAmount)}</p>
        )}
        {remaining !== null && (
          <div className="mt-2">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Đã dùng: {voucher.usedCount}/{voucher.usageLimit}</span>
              <span className={remaining <= 10 ? 'text-red-500 font-bold' : 'text-gray-400'}>
                Còn {remaining} lượt
              </span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-orange-400 to-red-500 rounded-full transition-all"
                style={{ width: `${pctUsed}%` }} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Sale product card ── */
function SaleProductCard({ product }) {
  const { addItem } = useCart();
  const { user, isRole } = useAuth();
  const image = product.thumbnailImage || product.ProductImages?.[0]?.imageUrl;
  const discount = Math.round((1 - product.salePrice / product.price) * 100);

  const handleCart = async (e) => {
    e.preventDefault();
    if (!user) return toast.error('Vui lòng đăng nhập để mua hàng');
    if (!isRole('customer')) return toast.error('Chỉ khách hàng mới có thể mua hàng');
    try { await addItem(product.id); toast.success('Đã thêm vào giỏ hàng!'); } catch {}
  };

  return (
    <Link to={`/products/${product.slug}`} className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow border border-gray-100">
      <div className="relative aspect-square overflow-hidden bg-gray-50">
        {image
          ? <img src={image} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
          : <div className="w-full h-full flex items-center justify-center text-5xl">🧶</div>}
        <span className="absolute top-2 left-2 bg-red-500 text-white text-xs font-black px-2 py-1 rounded-full shadow">
          -{discount}%
        </span>
        {product.stock <= 5 && (
          <span className="absolute bottom-2 left-2 bg-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
            Còn {product.stock} cái
          </span>
        )}
      </div>
      <div className="p-3">
        <p className="text-xs text-gray-400 mb-1">{product.Category?.name}</p>
        <h3 className="text-sm font-semibold text-gray-800 line-clamp-2 mb-2">{product.name}</h3>
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-base font-black text-red-500">{formatCurrency(product.salePrice)}</p>
            <p className="text-xs text-gray-400 line-through">{formatCurrency(product.price)}</p>
          </div>
          {product.stock > 0 && (
            <button onClick={handleCart}
              className="w-11 h-11 flex items-center justify-center bg-red-500 text-white rounded-xl hover:bg-red-600 active:scale-95 transition shrink-0">
              <FiShoppingCart size={16} />
            </button>
          )}
        </div>
      </div>
    </Link>
  );
}

/* ── Main page ── */
export default function FlashSale() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/vouchers/flash-sale')
      .then(r => setData(r.data))
      .catch(() => setData({ vouchers: [], products: [], endDate: null }))
      .finally(() => setLoading(false));
  }, []);

  const hasVouchers = data?.vouchers?.length > 0;
  const hasProducts = data?.products?.length > 0;
  const endDate = data?.endDate;

  if (loading) return (
    <div className="min-h-[60vh] flex items-center justify-center"><Spinner size="lg" /></div>
  );

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Hero banner */}
      <div className="bg-gradient-to-r from-orange-500 via-red-500 to-rose-600 py-10 sm:py-12 px-4 text-white text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 text-[8rem] flex flex-wrap gap-8 items-center justify-center select-none pointer-events-none">
          {['⚡','🔥','💥','⚡','🔥','💥'].map((e,i) => <span key={i}>{e}</span>)}
        </div>
        <div className="relative z-10">
          <div className="flex items-center justify-center gap-2 mb-3">
            <FiZap size={28} className="fill-yellow-300 text-yellow-300" />
            <h1 className="text-4xl sm:text-5xl font-black tracking-tight">FLASH SALE</h1>
            <FiZap size={28} className="fill-yellow-300 text-yellow-300" />
          </div>
          <p className="text-orange-100 text-base sm:text-lg mb-6">Ưu đãi sốc — Số lượng có hạn — Nhanh tay kẻo hết!</p>

          {endDate ? (
            <div>
              <p className="text-orange-200 text-sm mb-3 font-medium uppercase tracking-wider">Kết thúc sau</p>
              <Countdown endDate={endDate} />
            </div>
          ) : (
            <p className="text-orange-200 italic">Sản phẩm đang giảm giá</p>
          )}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 sm:py-8 space-y-10">

        {/* Voucher section */}
        {hasVouchers && (
          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span className="text-orange-500">🎟️</span> Mã giảm giá Flash Sale
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.vouchers.map(v => <VoucherCard key={v.id} voucher={v} />)}
            </div>
          </section>
        )}

        {/* Sale products */}
        {hasProducts ? (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <span className="text-red-500">🔥</span> Sản phẩm giảm giá
                <span className="bg-red-100 text-red-600 text-sm font-bold px-2.5 py-0.5 rounded-full">{data.products.length}</span>
              </h2>
              <Link to="/products" className="text-sm text-rose-500 hover:underline font-medium">Xem tất cả →</Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {data.products.map(p => <SaleProductCard key={p.id} product={p} />)}
            </div>
          </section>
        ) : (
          !hasVouchers && (
            <div className="text-center py-24">
              <div className="text-6xl mb-4">⚡</div>
              <h2 className="text-xl font-bold text-gray-700 mb-2">Chưa có Flash Sale nào</h2>
              <p className="text-gray-500 mb-6">Theo dõi để không bỏ lỡ ưu đãi tiếp theo nhé!</p>
              <Link to="/products" className="inline-block bg-rose-500 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-rose-600 active:scale-95 transition">
                Xem tất cả sản phẩm
              </Link>
            </div>
          )
        )}
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import { useCountdown } from '../hooks/useCountdown';
import ProductCard from '../components/common/ProductCard';
import Spinner from '../components/common/Spinner';
import toast from 'react-hot-toast';

// ── Theme map ─────────────────────────────────────────────────────────────────
const THEMES = {
  tet:       { from: '#c0392b', to: '#f39c12', text: 'text-red-700',    bg: 'from-red-600 to-yellow-500'   },
  noel:      { from: '#27ae60', to: '#e74c3c', text: 'text-green-700',  bg: 'from-green-600 to-red-500'    },
  rose:      { from: '#e11d48', to: '#ec4899', text: 'text-rose-700',   bg: 'from-rose-600 to-pink-500'    },
  violet:    { from: '#7c3aed', to: '#ec4899', text: 'text-violet-700', bg: 'from-violet-600 to-pink-500'  },
  blue:      { from: '#1d4ed8', to: '#06b6d4', text: 'text-blue-700',   bg: 'from-blue-600 to-cyan-500'    },
  amber:     { from: '#d97706', to: '#f59e0b', text: 'text-amber-700',  bg: 'from-amber-500 to-yellow-400' },
  default:   { from: '#e11d48', to: '#ec4899', text: 'text-rose-700',   bg: 'from-rose-600 to-pink-500'    },
};

function getTheme(key) { return THEMES[key] || THEMES.default; }

// ── Countdown block ───────────────────────────────────────────────────────────
function CountBlock({ val, label }) {
  return (
    <div className="flex flex-col items-center">
      <span className="bg-white/20 backdrop-blur text-white font-black text-3xl sm:text-4xl w-16 sm:w-20 h-16 sm:h-20 rounded-2xl flex items-center justify-center shadow">
        {String(val).padStart(2, '0')}
      </span>
      <span className="text-white/80 text-xs mt-1.5 uppercase tracking-wider">{label}</span>
    </div>
  );
}

// ── Voucher card ──────────────────────────────────────────────────────────────
function VoucherCard({ voucher }) {
  const handleCopy = () => {
    navigator.clipboard.writeText(voucher.code);
    toast.success(`Đã sao chép mã ${voucher.code}!`);
  };
  const label = voucher.type === 'percentage' ? `Giảm ${voucher.value}%`
    : voucher.type === 'fixed' ? `Giảm ${Number(voucher.value).toLocaleString('vi-VN')}đ`
    : voucher.type === 'free_shipping' ? 'Miễn phí vận chuyển'
    : `Giảm ${voucher.value}%`;
  return (
    <div className="bg-white rounded-2xl p-4 flex items-center gap-4 shadow-sm border border-dashed border-rose-200">
      <div className="text-3xl">🎟️</div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-gray-800">{label}</p>
        {voucher.minOrderAmount > 0 && (
          <p className="text-xs text-gray-400">Đơn tối thiểu {Number(voucher.minOrderAmount).toLocaleString('vi-VN')}đ</p>
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <code className="bg-rose-50 text-rose-600 font-mono font-bold px-3 py-1.5 rounded-lg text-sm">{voucher.code}</code>
        <button onClick={handleCopy} className="bg-rose-500 text-white px-3 py-1.5 rounded-lg text-sm font-semibold hover:bg-rose-600 transition">Sao chép</button>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function CampaignPage() {
  const { slug } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    setLoading(true);
    api.get(`/campaigns/${slug}`)
      .then(r => setData(r.data))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [slug]);

  const countdown = useCountdown(data?.campaign?.endDate);
  const theme = getTheme(data?.campaign?.theme);

  if (loading) return <div className="min-h-[60vh] flex items-center justify-center"><Spinner size="lg" /></div>;

  if (notFound || !data) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
        <div className="text-6xl mb-4">🔍</div>
        <h1 className="text-2xl font-bold text-gray-700 mb-2">Không tìm thấy sự kiện</h1>
        <p className="text-gray-400 mb-6">Sự kiện có thể đã kết thúc hoặc không tồn tại.</p>
        <Link to="/products" className="bg-rose-500 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-rose-600 transition">Xem tất cả sản phẩm</Link>
      </div>
    );
  }

  const { campaign, products, vouchers } = data;
  const started = new Date(campaign.startDate) <= new Date();

  return (
    <div className="min-h-screen">
      {/* ── Hero Banner ── */}
      <div className={`relative bg-gradient-to-br ${theme.bg} overflow-hidden`}>
        {campaign.bannerImage && (
          <img src={campaign.bannerImage} alt="" className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-30" />
        )}
        <div className="relative max-w-5xl mx-auto px-4 py-16 sm:py-24 text-center">
          <p className="text-6xl mb-4 drop-shadow">{campaign.emoji}</p>
          <h1 className="text-4xl sm:text-5xl font-black text-white drop-shadow-lg mb-4">{campaign.name}</h1>
          {campaign.description && (
            <p className="text-white/80 text-lg max-w-xl mx-auto mb-8">{campaign.description}</p>
          )}

          {/* Countdown */}
          {!countdown.expired ? (
            <div>
              <p className="text-white/70 text-sm uppercase tracking-widest mb-4">
                {started ? 'Kết thúc sau' : 'Bắt đầu sau'}
              </p>
              <div className="flex justify-center gap-3 sm:gap-4">
                {countdown.days > 0 && <CountBlock val={countdown.days} label="Ngày" />}
                <CountBlock val={countdown.hours} label="Giờ" />
                <CountBlock val={countdown.minutes} label="Phút" />
                <CountBlock val={countdown.seconds} label="Giây" />
              </div>
            </div>
          ) : (
            <div className="bg-white/20 text-white rounded-2xl px-8 py-3 inline-block font-bold text-lg">
              Sự kiện đã kết thúc
            </div>
          )}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-10 space-y-12">

        {/* ── Vouchers ── */}
        {vouchers.length > 0 && (
          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              🎟️ Mã giảm giá sự kiện
              <span className="text-sm font-normal text-gray-400">({vouchers.length} mã)</span>
            </h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {vouchers.map(v => <VoucherCard key={v.id} voucher={v} />)}
            </div>
          </section>
        )}

        {/* ── Products ── */}
        {products.length > 0 ? (
          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              🛍️ Sản phẩm trong sự kiện
              <span className="text-sm font-normal text-gray-400">({products.length} sản phẩm)</span>
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {products.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          </section>
        ) : (
          <div className="text-center py-16 text-gray-400">
            <p className="text-4xl mb-3">🧶</p>
            <p>Sản phẩm đang được cập nhật...</p>
          </div>
        )}

        {/* Back link */}
        <div className="text-center">
          <Link to="/products" className="text-rose-500 hover:text-rose-600 font-semibold underline text-sm">
            ← Xem tất cả sản phẩm
          </Link>
        </div>
      </div>
    </div>
  );
}

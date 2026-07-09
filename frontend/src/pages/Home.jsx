import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import ProductCard from '../components/common/ProductCard';
import Spinner from '../components/common/Spinner';
import toast from 'react-hot-toast';
import { useCountdown } from '../hooks/useCountdown';

const Stars = ({ n }) => <span className="text-amber-400">{'★'.repeat(n)}{'☆'.repeat(5 - n)}</span>;

function MiniCountdown({ endDate }) {
  const { days, hours, minutes, seconds, expired } = useCountdown(endDate);
  if (expired) return null;
  const pad = v => String(v).padStart(2, '0');
  return (
    <span className="font-mono font-black text-yellow-300 tabular-nums text-sm xs:text-base sm:text-lg">
      {days > 0 ? `${pad(days)}d ` : ''}{pad(hours)}:{pad(minutes)}:{pad(seconds)}
    </span>
  );
}

export default function Home() {
  const [slide, setSlide] = useState(0);
  const [featured, setFeatured] = useState([]);
  const [newArrivals, setNewArrivals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [flashSale, setFlashSale] = useState(null);
  const [liveStreams, setLiveStreams] = useState([]);
  const navigate = useNavigate();
  const timerRef = useRef(null);

  /* ─────────── Hero slides ─────────── */
  const SLIDES = [
    {
      bg: 'from-rose-400 via-pink-400 to-fuchsia-500',
      tag: '🆕 Bộ sưu tập mới',
      title: 'Len Cotton Mềm Mại\nChất Lượng Cao',
      desc: 'Hơn 50 màu sắc đa dạng, phù hợp cho đan móc thủ công và làm quà tặng',
      cta: { label: 'Khám phá ngay', to: '/products?type=raw_material' },
      cta2: { label: 'Xem khuyến mãi', to: '/promotions' },
      emoji: '🧶', floats: ['🎀', '✨', '🌸'],
    },
    {
      bg: 'from-violet-500 via-purple-500 to-indigo-500',
      tag: '🔥 Bán chạy nhất',
      title: 'Gấu Bông Handmade\nĐộc Đáo & Đáng Yêu',
      desc: 'Mỗi sản phẩm được làm thủ công tỉ mỉ, là món quà ý nghĩa cho mọi dịp',
      cta: { label: 'Mua ngay', to: '/products?type=finished_product' },
      cta2: { label: 'Đặt theo yêu cầu', to: '/custom-order' },
      emoji: '🧸', floats: ['💜', '⭐', '🎁'],
    },
    {
      bg: 'from-amber-400 via-orange-400 to-rose-400',
      tag: '🎟️ Ưu đãi đặc biệt',
      title: 'Phụ Kiện Đan Móc\nĐầy Đủ & Tiện Lợi',
      desc: 'Kim đan, móc, mắt thú, bông nhồi — tất cả trong một cửa hàng',
      cta: { label: 'Mua phụ kiện', to: '/products?type=accessory' },
      cta2: { label: 'Nhận voucher', to: '/promotions' },
      emoji: '🪡', floats: ['🧡', '🌟', '💫'],
    },
  ];

  /* ─────────── Category cards ─────────── */
  const CATS = [
    { icon: '🧶', label: 'Len Cotton', desc: 'Cotton, acrylic, bamboo...', type: 'raw_material', color: 'from-rose-100 to-pink-100 border-rose-200' },
    { icon: '🪡', label: 'Phụ Kiện Đan', desc: 'Kim, móc, bông nhồi...', type: 'accessory',    color: 'from-purple-100 to-violet-100 border-purple-200' },
    { icon: '🧸', label: 'Gấu & Thú Bông', desc: 'Handmade 100% từ len', link: '/products?type=finished_product&categoryId=7', color: 'from-amber-100 to-yellow-100 border-amber-200' },
    { icon: '👜', label: 'Túi Handmade', desc: 'Túi móc, ví len...', link: '/products?type=finished_product&categoryId=8', color: 'from-teal-100 to-cyan-100 border-teal-200' },
    { icon: '🌸', label: 'Hoa Len', desc: 'Hoa giả, phụ kiện trang trí', link: '/products?type=accessory', color: 'from-pink-100 to-fuchsia-100 border-pink-200' },
    { icon: '✨', label: 'Đặt Hàng Riêng', desc: 'Thiết kế theo yêu cầu', link: '/custom-order',  color: 'from-slate-100 to-gray-100 border-slate-200' },
  ];

  /* ─────────── Testimonials ─────────── */
  const REVIEWS = [
    { name: 'Nguyễn Thị Lan', avatar: '👩', rating: 5, text: 'Len rất mềm và màu đẹp như hình, giao hàng nhanh. Mình đã mua lần thứ 3 rồi!' },
    { name: 'Trần Minh Huy', avatar: '👨', rating: 5, text: 'Gấu bông handmade đẹp hơn mình tưởng, tặng bạn gái ai cũng khen. Sẽ ủng hộ tiếp!' },
    { name: 'Phạm Thu Hà', avatar: '👩‍🦱', rating: 5, text: 'Shop tư vấn nhiệt tình, len chất lượng tốt, giá cả hợp lý. Rất hài lòng!' },
    { name: 'Lê Văn Thành', avatar: '🧑', rating: 5, text: 'Đặt gấu theo yêu cầu, shop làm đúng theo hình mẫu, đóng gói cẩn thận.' },
  ];

  /* ─────────── Trust badges ─────────── */
  const BADGES = [
    { icon: '🚚', title: 'Miễn Phí Ship', desc: 'Đơn hàng từ 500.000đ' },
    { icon: '💝', title: '100% Handmade', desc: 'Từng sản phẩm thủ công' },
    { icon: '🎨', title: 'Đặt Theo Yêu Cầu', desc: 'Thiết kế riêng của bạn' },
    { icon: '🔄', title: 'Đổi Trả Dễ Dàng', desc: 'Trong vòng 7 ngày' },
    { icon: '⭐', title: 'Chất Lượng Cao', desc: 'Kiểm tra kỹ trước khi giao' },
    { icon: '📞', title: 'Hỗ Trợ Tận Tâm', desc: '8:00 – 20:00 mỗi ngày' },
  ];

  useEffect(() => {
    Promise.all([
      api.get('/products/featured'),
      api.get('/products', { params: { isNew: 'true', limit: 8 } }),
      api.get('/vouchers/flash-sale'),
      api.get('/livestreams', { params: { status: 'live' } }),
    ]).then(([f, n, fs, ls]) => {
      setFeatured(f.data || []);
      setNewArrivals(n.data?.items || []);
      const fsData = fs.data;
      if (fsData.vouchers?.length > 0 || fsData.products?.length > 0) setFlashSale(fsData);
      setLiveStreams(ls.data || []);
    }).finally(() => setLoading(false));
  }, []);

  // Poll live streams every 30s
  useEffect(() => {
    const t = setInterval(() =>
      api.get('/livestreams', { params: { status: 'live' } })
        .then(r => setLiveStreams(r.data || [])).catch(() => {}),
    30000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    timerRef.current = setInterval(() => setSlide(s => (s + 1) % SLIDES.length), 5000);
    return () => clearInterval(timerRef.current);
  }, []);

  const goSlide = (i) => {
    clearInterval(timerRef.current);
    setSlide(i);
    timerRef.current = setInterval(() => setSlide(s => (s + 1) % SLIDES.length), 5000);
  };

  const subscribeNewsletter = async (e) => {
    e.preventDefault();
    try {
      const r = await api.post('/subscriptions/subscribe', { email });
      toast.success(r.data.message);
      setEmail('');
    } catch (err) { toast.error(err.response?.data?.message || 'Đăng ký thất bại'); }
  };

  const cur = SLIDES[slide];

  return (
    <div className="bg-white">

      {/* ── HERO CAROUSEL ── */}
      <section className={`relative bg-gradient-to-br ${cur.bg} overflow-hidden transition-all duration-700`}>
        <div className="max-w-7xl mx-auto px-4 py-10 xs:py-12 sm:py-20 md:py-28 flex flex-col md:flex-row items-center gap-6 md:gap-10">
          <div className="flex-1 text-white z-10">
            <span className="inline-block bg-white/20 backdrop-blur-sm text-white text-xs font-semibold px-3 xs:px-4 py-1 xs:py-1.5 rounded-full mb-3 xs:mb-4 md:mb-5">
              {cur.tag}
            </span>
            <h1 className="text-2xl xs:text-3xl sm:text-4xl md:text-5xl font-bold leading-tight mb-3 xs:mb-4 md:mb-5 whitespace-pre-line">
              {cur.title}
            </h1>
            <p className="text-white/80 text-xs xs:text-sm sm:text-base md:text-lg mb-5 xs:mb-6 md:mb-8 max-w-md">
              {cur.desc}
            </p>
            <div className="flex gap-2 xs:gap-3 flex-wrap">
              <Link
                to={cur.cta.to}
                className="bg-white text-gray-800 font-semibold px-4 xs:px-5 sm:px-7 py-2.5 xs:py-3 rounded-full hover:bg-white/90 active:scale-95 transition shadow-lg text-xs xs:text-sm sm:text-base"
              >
                {cur.cta.label}
              </Link>
              <Link
                to={cur.cta2.to}
                className="border-2 border-white/60 text-white font-semibold px-4 xs:px-5 sm:px-7 py-2.5 xs:py-3 rounded-full hover:bg-white/10 active:scale-95 transition text-xs xs:text-sm sm:text-base"
              >
                {cur.cta2.label}
              </Link>
            </div>
          </div>
          {/* Emoji decoration */}
          <div className="hidden md:flex flex-1 items-center justify-center relative">
            <div className="text-[10rem] select-none animate-bounce">{cur.emoji}</div>
            {cur.floats.map((f, i) => (
              <span key={i} className="absolute text-4xl animate-pulse" style={{ top: `${20 + i * 30}%`, right: `${10 + i * 15}%`, animationDelay: `${i * 0.5}s` }}>{f}</span>
            ))}
          </div>
        </div>

        {/* Slide dots */}
        <div className="absolute bottom-3 xs:bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-10">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => goSlide(i)}
              className={`h-3 rounded-full transition-all ${i === slide ? 'bg-white w-8' : 'bg-white/40 w-3'}`}
            />
          ))}
        </div>
        {/* Nav arrows */}
        <button
          onClick={() => goSlide((slide - 1 + SLIDES.length) % SLIDES.length)}
          className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 active:bg-white/40 text-white w-11 h-11 rounded-full flex items-center justify-center text-xl transition"
        >‹</button>
        <button
          onClick={() => goSlide((slide + 1) % SLIDES.length)}
          className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 active:bg-white/40 text-white w-11 h-11 rounded-full flex items-center justify-center text-xl transition"
        >›</button>
      </section>

      {/* ── LIVE BANNER ── */}
      {liveStreams.length > 0 && (
        <section className="bg-gradient-to-r from-red-600 via-rose-600 to-pink-600 relative overflow-hidden">
          {/* Shimmer effect */}
          <div className="absolute inset-0 bg-[linear-gradient(105deg,transparent_40%,rgba(255,255,255,0.08)_50%,transparent_60%)] animate-[shimmer_2.5s_infinite]" />
          <div className="max-w-7xl mx-auto px-4 py-3 xs:py-4 flex items-center gap-3 xs:gap-5 flex-wrap">
            {/* LIVE badge */}
            <div className="flex items-center gap-2 shrink-0">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-60" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-white" />
              </span>
              <span className="text-white font-black text-sm xs:text-base tracking-widest uppercase">Live</span>
            </div>

            <div className="h-5 w-px bg-white/30 hidden xs:block shrink-0" />

            {/* Stream cards */}
            <div className="flex items-center gap-3 flex-wrap flex-1 min-w-0">
              {liveStreams.slice(0, 2).map(s => (
                <Link
                  key={s.id}
                  to={`/livestream/${s.id}`}
                  className="flex items-center gap-2 bg-white/15 hover:bg-white/25 active:scale-95 transition-all rounded-full px-3 py-1.5 min-w-0 max-w-[260px]"
                >
                  <div className="w-6 h-6 rounded-full bg-white/20 text-white text-xs flex items-center justify-center font-bold shrink-0">
                    {s.staff?.fullName?.[0]?.toUpperCase() || 'S'}
                  </div>
                  <span className="text-white text-xs xs:text-sm font-semibold truncate">{s.title}</span>
                  <span className="text-white/70 text-xs shrink-0 flex items-center gap-0.5">
                    👁 {s.viewerCount || 0}
                  </span>
                </Link>
              ))}
              {liveStreams.length > 2 && (
                <Link to="/livestream" className="text-white/80 text-xs hover:text-white transition">
                  +{liveStreams.length - 2} stream khác
                </Link>
              )}
            </div>

            <Link
              to="/livestream"
              className="ml-auto shrink-0 bg-white text-red-600 font-bold text-xs xs:text-sm px-3 xs:px-4 py-1.5 rounded-full hover:bg-red-50 active:scale-95 transition-all shadow-sm"
            >
              Xem ngay →
            </Link>
          </div>
        </section>
      )}

      {/* ── TRUST BADGES ── */}
      <section className="bg-rose-50 border-y border-rose-100">
        <div className="max-w-7xl mx-auto px-4 py-3 xs:py-4 sm:py-6 grid grid-cols-2 xs:grid-cols-3 md:grid-cols-6 gap-2 xs:gap-3 sm:gap-4">
          {BADGES.map((b, i) => (
            <div key={i} className="flex items-center gap-2 min-w-0">
              <span className="text-lg xs:text-xl sm:text-2xl shrink-0">{b.icon}</span>
              <div className="min-w-0">
                <p className="text-[11px] xs:text-xs font-semibold text-gray-800 leading-tight">{b.title}</p>
                <p className="text-[10px] xs:text-xs text-gray-500 leading-tight hidden xs:block">{b.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FLASH SALE BANNER ── */}
      {flashSale && (
        <section className="bg-gradient-to-r from-orange-500 via-red-500 to-rose-500 py-3 sm:py-4 px-4">
          <div className="max-w-7xl mx-auto flex flex-col xs:flex-row items-center justify-between gap-2 xs:gap-3">
            <div className="flex items-center gap-2 text-white">
              <span className="text-xl xs:text-2xl animate-bounce">⚡</span>
              <div>
                <p className="font-black text-sm xs:text-base sm:text-lg leading-tight">FLASH SALE ĐANG DIỄN RA!</p>
                <p className="text-orange-100 text-[10px] xs:text-xs">
                  {`Giảm đến ${Math.max(...(flashSale.products?.map(p => Math.round((1 - p.salePrice/p.price)*100)) || [0]))}% — Số lượng có hạn`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 xs:gap-4">
              {flashSale.endDate && (
                <div className="text-center">
                  <p className="text-orange-200 text-[9px] xs:text-[10px] uppercase tracking-wider mb-0.5">Kết thúc sau</p>
                  <MiniCountdown endDate={flashSale.endDate} />
                </div>
              )}
              <Link to="/flash-sale" className="bg-white text-orange-600 font-bold px-3 xs:px-4 sm:px-5 py-2 rounded-full text-xs xs:text-sm hover:bg-orange-50 active:scale-95 transition shadow-sm whitespace-nowrap">
                Mua ngay →
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ── CATEGORY SHOWCASE ── */}
      <section className="max-w-7xl mx-auto px-4 py-8 xs:py-10 sm:py-16">
        <div className="text-center mb-6 xs:mb-7 sm:mb-10">
          <h2 className="text-xl xs:text-2xl sm:text-3xl font-bold text-gray-800 mb-1 xs:mb-2">Khám Phá Danh Mục</h2>
          <p className="text-gray-500 text-xs xs:text-sm sm:text-base">Tìm kiếm sản phẩm theo sở thích của bạn</p>
        </div>
        <div className="grid grid-cols-2 xs:grid-cols-3 md:grid-cols-6 gap-2 xs:gap-3 sm:gap-4">
          {CATS.map((c, i) => (
            <Link
              key={i}
              to={c.link || `/products?type=${c.type}`}
              className={`bg-gradient-to-br ${c.color} border rounded-xl xs:rounded-2xl p-2.5 xs:p-3 sm:p-5 text-center hover:shadow-md hover:-translate-y-1 active:-translate-y-0.5 transition-all group`}
            >
              <div className="text-2xl xs:text-3xl sm:text-4xl mb-1.5 xs:mb-2 sm:mb-3 group-hover:scale-110 transition-transform">{c.icon}</div>
              <p className="font-semibold text-gray-800 text-[11px] xs:text-xs sm:text-sm leading-tight">{c.label}</p>
              <p className="text-[10px] xs:text-xs text-gray-500 mt-0.5 sm:mt-1 hidden xs:block leading-tight">{c.desc}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* ── NEW ARRIVALS ── */}
      <section className="bg-gradient-to-br from-rose-50 to-pink-50 py-10 sm:py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between mb-5 xs:mb-6 sm:mb-8">
            <div>
              <span className="text-rose-500 font-semibold text-[10px] xs:text-xs sm:text-sm uppercase tracking-wider">Mới Về</span>
              <h2 className="text-xl xs:text-2xl sm:text-3xl font-bold text-gray-800 mt-0.5 xs:mt-1">Hàng Mới Nhất 🆕</h2>
            </div>
            <Link to="/products?isNew=true" className="flex items-center gap-1 text-rose-500 font-medium hover:underline text-xs sm:text-sm whitespace-nowrap">
              Xem tất cả →
            </Link>
          </div>
          {loading ? (
            <div className="flex justify-center py-12"><Spinner /></div>
          ) : newArrivals.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
              {newArrivals.slice(0, 8).map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
              {featured.slice(0, 8).map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          )}
        </div>
      </section>

      {/* ── PROMO BANNER ── */}
      <section className="max-w-7xl mx-auto px-4 py-6 xs:py-8 sm:py-10">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          {[
            { bg: 'from-rose-500 to-pink-500',     icon: '🎟️', title: 'Giảm 10% đơn đầu', desc: 'Mã: WELCOME10', to: '/promotions' },
            { bg: 'from-violet-500 to-purple-600', icon: '🚚', title: 'Miễn phí vận chuyển', desc: 'Đơn từ 500.000đ', to: '/products' },
            { bg: 'from-amber-500 to-orange-500',  icon: '✨', title: 'Đặt hàng theo yêu cầu', desc: 'Thiết kế riêng của bạn', to: '/custom-order' },
          ].map((b, i) => (
            <Link
              key={i}
              to={b.to}
              className={`bg-gradient-to-r ${b.bg} text-white rounded-xl xs:rounded-2xl p-4 xs:p-4 sm:p-6 flex items-center gap-3 sm:gap-4 hover:scale-[1.02] active:scale-[0.98] transition-transform shadow-md`}
            >
              <span className="text-3xl xs:text-3xl sm:text-4xl shrink-0">{b.icon}</span>
              <div>
                <p className="font-bold text-sm xs:text-base sm:text-lg">{b.title}</p>
                <p className="text-white/80 text-xs sm:text-sm">{b.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── BEST SELLERS ── */}
      <section className="max-w-7xl mx-auto px-4 pb-10 sm:pb-16">
        <div className="flex items-center justify-between mb-5 xs:mb-6 sm:mb-8">
          <div>
            <span className="text-rose-500 font-semibold text-[10px] xs:text-xs sm:text-sm uppercase tracking-wider">Được Yêu Thích</span>
            <h2 className="text-xl xs:text-2xl sm:text-3xl font-bold text-gray-800 mt-0.5 xs:mt-1">Sản Phẩm Bán Chạy 🔥</h2>
          </div>
          <Link to="/products?sortBy=sold" className="flex items-center gap-1 text-rose-500 font-medium hover:underline text-xs sm:text-sm whitespace-nowrap">Xem tất cả →</Link>
        </div>
        {loading ? <div className="flex justify-center py-12"><Spinner /></div> : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
            {featured.slice(0, 8).map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
      </section>

      {/* ── CUSTOM ORDER BANNER ── */}
      <section className="bg-gradient-to-br from-slate-800 to-slate-900 py-12 xs:py-14 sm:py-20 px-4">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center gap-5 xs:gap-6 sm:gap-8">
          <div className="text-5xl xs:text-6xl sm:text-7xl shrink-0 animate-spin" style={{ animationDuration: '8s' }}>✨</div>
          <div className="text-white text-center md:text-left">
            <h2 className="text-xl xs:text-2xl sm:text-3xl md:text-4xl font-bold mb-2 xs:mb-3">Có Ý Tưởng Riêng?</h2>
            <p className="text-gray-300 text-xs xs:text-sm sm:text-base md:text-lg mb-5 sm:mb-6 max-w-xl">
              Gửi hình mẫu, chọn màu len và kích cỡ — chúng tôi sẽ tạo ra sản phẩm độc đáo chỉ dành cho bạn!
            </p>
            <div className="flex gap-2 xs:gap-3 flex-wrap justify-center md:justify-start">
              <Link to="/custom-order" className="bg-rose-500 text-white font-semibold px-5 xs:px-6 sm:px-8 py-2.5 xs:py-3 rounded-full hover:bg-rose-600 active:scale-95 transition text-xs xs:text-sm sm:text-base">
                Đặt hàng ngay
              </Link>
              <Link to="/how-to-buy" className="border-2 border-gray-600 text-gray-300 font-semibold px-5 xs:px-6 sm:px-8 py-2.5 xs:py-3 rounded-full hover:border-gray-400 hover:text-white active:scale-95 transition text-xs xs:text-sm sm:text-base">
                Hướng dẫn đặt hàng
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="bg-white py-10 sm:py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-6 xs:mb-7 sm:mb-10">
            <h2 className="text-xl xs:text-2xl sm:text-3xl font-bold text-gray-800 mb-1 xs:mb-2">Khách Hàng Nói Gì?</h2>
            <p className="text-gray-500 text-xs xs:text-sm sm:text-base">Hàng nghìn khách hàng tin tưởng YarnShop</p>
          </div>
          <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-4 gap-3 xs:gap-4 sm:gap-5">
            {REVIEWS.map((r, i) => (
              <div key={i} className="bg-gray-50 rounded-xl xs:rounded-2xl p-4 xs:p-5 hover:shadow-md transition-shadow">
                <div className="mb-2 xs:mb-3"><Stars n={r.rating} /></div>
                <p className="text-gray-700 text-xs xs:text-sm leading-relaxed mb-3 xs:mb-4">"{r.text}"</p>
                <div className="flex items-center gap-2">
                  <span className="text-xl xs:text-2xl">{r.avatar}</span>
                  <span className="font-medium text-xs xs:text-sm text-gray-800">{r.name}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section className="bg-rose-500 py-8 xs:py-10 sm:py-12 px-4">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 xs:gap-5 sm:gap-6 text-center text-white">
          {[
            { num: '5,000+', label: 'Khách hàng hài lòng' },
            { num: '200+',   label: 'Sản phẩm đa dạng' },
            { num: '10,000+', label: 'Đơn hàng đã giao' },
            { num: '4.9⭐',   label: 'Đánh giá trung bình' },
          ].map((s, i) => (
            <div key={i}>
              <p className="text-2xl xs:text-3xl sm:text-4xl font-bold mb-1">{s.num}</p>
              <p className="text-rose-100 text-[10px] xs:text-xs sm:text-sm">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── BLOG / TIPS ── */}
      <section className="max-w-7xl mx-auto px-4 py-10 sm:py-16">
        <div className="text-center mb-6 xs:mb-7 sm:mb-10">
          <h2 className="text-xl xs:text-2xl sm:text-3xl font-bold text-gray-800 mb-1 xs:mb-2">Mẹo & Hướng Dẫn Đan Móc</h2>
          <p className="text-gray-500 text-xs xs:text-sm sm:text-base">Học hỏi thêm kỹ thuật từ những người thợ có kinh nghiệm</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
          {[
            { emoji: '🧶', title: 'Cách chọn len phù hợp', cat: 'Kiến thức cơ bản', desc: 'Hướng dẫn lựa chọn loại len phù hợp với từng dự án đan móc của bạn.' },
            { emoji: '🪡', title: '5 mũi móc cơ bản cho người mới', cat: 'Tutorial', desc: 'Bắt đầu hành trình móc len với 5 mũi cơ bản mà ai cũng cần biết.' },
            { emoji: '🧸', title: 'Làm gấu bông từ len A đến Z', cat: 'Dự án thú vị', desc: 'Hướng dẫn chi tiết từng bước tạo ra chú gấu bông đáng yêu bằng tay.' },
          ].map((b, i) => (
            <div
              key={i}
              className="bg-white rounded-xl xs:rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md active:shadow-sm transition-shadow group cursor-pointer"
              onClick={() => navigate('/how-to-buy')}
            >
              <div className="h-32 xs:h-36 sm:h-44 bg-gradient-to-br from-rose-50 to-pink-50 flex items-center justify-center">
                <span className="text-5xl xs:text-6xl sm:text-7xl group-hover:scale-110 transition-transform">{b.emoji}</span>
              </div>
              <div className="p-3 xs:p-4 sm:p-5">
                <span className="text-[10px] xs:text-xs font-semibold text-rose-500 uppercase tracking-wider">{b.cat}</span>
                <h3 className="font-bold text-gray-800 mt-1 mb-1.5 xs:mb-2 text-sm xs:text-sm sm:text-base">{b.title}</h3>
                <p className="text-xs xs:text-sm text-gray-500 leading-relaxed">{b.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── NEWSLETTER ── */}
      <section className="bg-gradient-to-r from-rose-600 to-pink-600 py-10 xs:py-12 sm:py-16 px-4">
        <div className="max-w-2xl mx-auto text-center text-white">
          <div className="text-4xl xs:text-4xl sm:text-5xl mb-3 xs:mb-4">📬</div>
          <h2 className="text-xl xs:text-2xl sm:text-3xl font-bold mb-2">Đừng Bỏ Lỡ Ưu Đãi!</h2>
          <p className="text-rose-100 text-xs xs:text-sm sm:text-base mb-5 xs:mb-6 sm:mb-8">
            Đăng ký nhận email và nhận ngay mã giảm giá 10% cho đơn hàng đầu tiên
          </p>
          <form onSubmit={subscribeNewsletter} className="flex flex-col xs:flex-row gap-2 xs:gap-3 max-w-md mx-auto">
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Nhập email của bạn..."
              className="flex-1 min-w-0 px-4 xs:px-5 py-3 xs:py-3.5 rounded-full text-gray-800 text-base focus:outline-none focus:ring-2 focus:ring-white/60 shadow-lg w-full xs:w-auto"
            />
            <button
              type="submit"
              className="bg-white text-rose-600 font-bold px-5 xs:px-6 py-3 xs:py-3.5 rounded-full hover:bg-rose-50 active:scale-95 transition shadow-lg whitespace-nowrap text-sm xs:text-base"
            >
              Đăng ký
            </button>
          </form>
          <p className="text-rose-200 text-[10px] xs:text-xs mt-3">Bạn có thể hủy đăng ký bất cứ lúc nào. Không spam!</p>
        </div>
      </section>

    </div>
  );
}

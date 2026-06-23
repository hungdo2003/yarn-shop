import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import ProductCard from '../components/common/ProductCard';
import Spinner from '../components/common/Spinner';
import toast from 'react-hot-toast';

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
  { icon: '🪡', label: 'Phụ Kiện Đan', desc: 'Kim, móc, bông nhồi...', type: 'accessory', color: 'from-purple-100 to-violet-100 border-purple-200' },
  { icon: '🧸', label: 'Gấu & Thú Bông', desc: 'Handmade 100% từ len', link: '/products?type=finished_product&categoryId=7', color: 'from-amber-100 to-yellow-100 border-amber-200' },
  { icon: '👜', label: 'Túi Handmade', desc: 'Túi móc, ví len...', link: '/products?type=finished_product&categoryId=8', color: 'from-teal-100 to-cyan-100 border-teal-200' },
  { icon: '🌸', label: 'Hoa Len', desc: 'Hoa giả, phụ kiện trang trí', link: '/products?type=accessory', color: 'from-pink-100 to-fuchsia-100 border-pink-200' },
  { icon: '✨', label: 'Đặt Hàng Riêng', desc: 'Thiết kế theo yêu cầu', link: '/custom-order', color: 'from-slate-100 to-gray-100 border-slate-200' },
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
  { icon: '🚚', title: 'Miễn Phí Vận Chuyển', desc: 'Đơn hàng từ 500.000đ' },
  { icon: '💝', title: '100% Handmade', desc: 'Từng sản phẩm được làm thủ công' },
  { icon: '🎨', title: 'Đặt Theo Yêu Cầu', desc: 'Thiết kế riêng theo ý bạn' },
  { icon: '🔄', title: 'Đổi Trả Dễ Dàng', desc: 'Trong vòng 7 ngày' },
  { icon: '⭐', title: 'Chất Lượng Đảm Bảo', desc: 'Kiểm tra kỹ trước khi giao' },
  { icon: '📞', title: 'Hỗ Trợ Tận Tâm', desc: '8:00 – 20:00 mỗi ngày' },
];

/* ─────────── Stars ─────────── */
const Stars = ({ n }) => <span className="text-amber-400">{'★'.repeat(n)}{'☆'.repeat(5 - n)}</span>;

export default function Home() {
  const [slide, setSlide] = useState(0);
  const [featured, setFeatured] = useState([]);
  const [newArrivals, setNewArrivals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const navigate = useNavigate();
  const timerRef = useRef(null);

  useEffect(() => {
    Promise.all([
      api.get('/products/featured'),
      api.get('/products', { params: { isNew: 'true', limit: 8 } }),
    ]).then(([f, n]) => {
      setFeatured(f.data || []);
      setNewArrivals(n.data?.items || []);
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    timerRef.current = setInterval(() => setSlide(s => (s + 1) % SLIDES.length), 5000);
    return () => clearInterval(timerRef.current);
  }, []);

  const goSlide = (i) => { clearInterval(timerRef.current); setSlide(i); timerRef.current = setInterval(() => setSlide(s => (s + 1) % SLIDES.length), 5000); };

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
        <div className="max-w-7xl mx-auto px-4 py-20 md:py-28 flex flex-col md:flex-row items-center gap-10">
          <div className="flex-1 text-white z-10">
            <span className="inline-block bg-white/20 backdrop-blur-sm text-white text-sm font-semibold px-4 py-1.5 rounded-full mb-5">{cur.tag}</span>
            <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-5 whitespace-pre-line">{cur.title}</h1>
            <p className="text-white/80 text-lg mb-8 max-w-md">{cur.desc}</p>
            <div className="flex gap-3 flex-wrap">
              <Link to={cur.cta.to} className="bg-white text-gray-800 font-semibold px-7 py-3 rounded-full hover:bg-white/90 transition shadow-lg">{cur.cta.label}</Link>
              <Link to={cur.cta2.to} className="border-2 border-white/60 text-white font-semibold px-7 py-3 rounded-full hover:bg-white/10 transition">{cur.cta2.label}</Link>
            </div>
          </div>
          <div className="hidden md:flex flex-1 items-center justify-center relative">
            <div className="text-[10rem] select-none animate-bounce">{cur.emoji}</div>
            {cur.floats.map((f, i) => (
              <span key={i} className="absolute text-4xl animate-pulse" style={{ top: `${20 + i * 30}%`, right: `${10 + i * 15}%`, animationDelay: `${i * 0.5}s` }}>{f}</span>
            ))}
          </div>
        </div>
        {/* Slide dots */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-10">
          {SLIDES.map((_, i) => (
            <button key={i} onClick={() => goSlide(i)} className={`w-2.5 h-2.5 rounded-full transition-all ${i === slide ? 'bg-white w-7' : 'bg-white/40'}`} />
          ))}
        </div>
        {/* Nav arrows */}
        <button onClick={() => goSlide((slide - 1 + SLIDES.length) % SLIDES.length)} className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white w-10 h-10 rounded-full flex items-center justify-center text-lg transition">‹</button>
        <button onClick={() => goSlide((slide + 1) % SLIDES.length)} className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white w-10 h-10 rounded-full flex items-center justify-center text-lg transition">›</button>
      </section>

      {/* ── TRUST BADGES ── */}
      <section className="bg-rose-50 border-y border-rose-100">
        <div className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {BADGES.map((b, i) => (
            <div key={i} className="flex items-center gap-3">
              <span className="text-2xl">{b.icon}</span>
              <div>
                <p className="text-xs font-semibold text-gray-800">{b.title}</p>
                <p className="text-xs text-gray-500">{b.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CATEGORY SHOWCASE ── */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">Khám Phá Danh Mục</h2>
          <p className="text-gray-500">Tìm kiếm sản phẩm theo sở thích của bạn</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {CATS.map((c, i) => (
            <Link key={i} to={c.link || `/products?type=${c.type}`}
              className={`bg-gradient-to-br ${c.color} border rounded-2xl p-5 text-center hover:shadow-md hover:-translate-y-1 transition-all group`}>
              <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">{c.icon}</div>
              <p className="font-semibold text-gray-800 text-sm">{c.label}</p>
              <p className="text-xs text-gray-500 mt-1">{c.desc}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* ── NEW ARRIVALS ── */}
      <section className="bg-gradient-to-br from-rose-50 to-pink-50 py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <span className="text-rose-500 font-semibold text-sm uppercase tracking-wider">Mới Về</span>
              <h2 className="text-3xl font-bold text-gray-800 mt-1">Hàng Mới Nhất 🆕</h2>
            </div>
            <Link to="/products?isNew=true" className="flex items-center gap-1 text-rose-500 font-medium hover:underline text-sm">
              Xem tất cả →
            </Link>
          </div>
          {loading ? (
            <div className="flex justify-center py-12"><Spinner /></div>
          ) : newArrivals.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-4">
              {newArrivals.slice(0, 8).map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {featured.slice(0, 8).map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          )}
        </div>
      </section>

      {/* ── PROMO BANNER ── */}
      <section className="max-w-7xl mx-auto px-4 py-10">
        <div className="grid md:grid-cols-3 gap-4">
          {[
            { bg: 'from-rose-500 to-pink-500', icon: '🎟️', title: 'Giảm 10% đơn đầu', desc: 'Mã: WELCOME10', to: '/promotions' },
            { bg: 'from-violet-500 to-purple-600', icon: '🚚', title: 'Miễn phí vận chuyển', desc: 'Đơn từ 500.000đ', to: '/products' },
            { bg: 'from-amber-500 to-orange-500', icon: '✨', title: 'Đặt hàng theo yêu cầu', desc: 'Thiết kế riêng của bạn', to: '/custom-order' },
          ].map((b, i) => (
            <Link key={i} to={b.to} className={`bg-gradient-to-r ${b.bg} text-white rounded-2xl p-6 flex items-center gap-4 hover:scale-[1.02] transition-transform shadow-md`}>
              <span className="text-4xl">{b.icon}</span>
              <div>
                <p className="font-bold text-lg">{b.title}</p>
                <p className="text-white/80 text-sm">{b.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── BEST SELLERS ── */}
      <section className="max-w-7xl mx-auto px-4 pb-16">
        <div className="flex items-center justify-between mb-8">
          <div>
            <span className="text-rose-500 font-semibold text-sm uppercase tracking-wider">Được Yêu Thích</span>
            <h2 className="text-3xl font-bold text-gray-800 mt-1">Sản Phẩm Bán Chạy 🔥</h2>
          </div>
          <Link to="/products?sortBy=sold" className="flex items-center gap-1 text-rose-500 font-medium hover:underline text-sm">Xem tất cả →</Link>
        </div>
        {loading ? <div className="flex justify-center py-12"><Spinner /></div> : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {featured.slice(0, 8).map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
      </section>

      {/* ── CUSTOM ORDER BANNER ── */}
      <section className="bg-gradient-to-br from-slate-800 to-slate-900 py-20 px-4">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center gap-8">
          <div className="text-7xl shrink-0 animate-spin" style={{ animationDuration: '8s' }}>✨</div>
          <div className="text-white text-center md:text-left">
            <h2 className="text-3xl md:text-4xl font-bold mb-3">Có Ý Tưởng Riêng?</h2>
            <p className="text-gray-300 text-lg mb-6 max-w-xl">Gửi hình mẫu, chọn màu len và kích cỡ — chúng tôi sẽ tạo ra sản phẩm độc đáo chỉ dành cho bạn!</p>
            <div className="flex gap-3 flex-wrap justify-center md:justify-start">
              <Link to="/custom-order" className="bg-rose-500 text-white font-semibold px-8 py-3 rounded-full hover:bg-rose-600 transition">Đặt hàng ngay</Link>
              <Link to="/how-to-buy" className="border-2 border-gray-600 text-gray-300 font-semibold px-8 py-3 rounded-full hover:border-gray-400 hover:text-white transition">Hướng dẫn đặt hàng</Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="bg-white py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-gray-800 mb-2">Khách Hàng Nói Gì?</h2>
            <p className="text-gray-500">Hàng nghìn khách hàng tin tưởng YarnShop</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {REVIEWS.map((r, i) => (
              <div key={i} className="bg-gray-50 rounded-2xl p-5 hover:shadow-md transition-shadow">
                <div className="mb-3"><Stars n={r.rating} /></div>
                <p className="text-gray-700 text-sm leading-relaxed mb-4">"{r.text}"</p>
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{r.avatar}</span>
                  <span className="font-medium text-sm text-gray-800">{r.name}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section className="bg-rose-500 py-12 px-4">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center text-white">
          {[
            { num: '5,000+', label: 'Khách hàng hài lòng' },
            { num: '200+', label: 'Sản phẩm đa dạng' },
            { num: '10,000+', label: 'Đơn hàng đã giao' },
            { num: '4.9⭐', label: 'Đánh giá trung bình' },
          ].map((s, i) => (
            <div key={i}>
              <p className="text-4xl font-bold mb-1">{s.num}</p>
              <p className="text-rose-100 text-sm">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── BLOG / TIPS ── */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">Mẹo & Hướng Dẫn Đan Móc</h2>
          <p className="text-gray-500">Học hỏi thêm kỹ thuật từ những người thợ có kinh nghiệm</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { emoji: '🧶', title: 'Cách chọn len phù hợp', cat: 'Kiến thức cơ bản', desc: 'Hướng dẫn lựa chọn loại len phù hợp với từng dự án đan móc của bạn.' },
            { emoji: '🪡', title: '5 mũi móc cơ bản cho người mới', cat: 'Tutorial', desc: 'Bắt đầu hành trình móc len với 5 mũi cơ bản mà ai cũng cần biết.' },
            { emoji: '🧸', title: 'Làm gấu bông từ len A đến Z', cat: 'Dự án thú vị', desc: 'Hướng dẫn chi tiết từng bước tạo ra chú gấu bông đáng yêu bằng tay.' },
          ].map((b, i) => (
            <div key={i} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-shadow group cursor-pointer" onClick={() => navigate('/how-to-buy')}>
              <div className="h-44 bg-gradient-to-br from-rose-50 to-pink-50 flex items-center justify-center">
                <span className="text-7xl group-hover:scale-110 transition-transform">{b.emoji}</span>
              </div>
              <div className="p-5">
                <span className="text-xs font-semibold text-rose-500 uppercase tracking-wider">{b.cat}</span>
                <h3 className="font-bold text-gray-800 mt-1 mb-2">{b.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{b.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── NEWSLETTER ── */}
      <section className="bg-gradient-to-r from-rose-600 to-pink-600 py-16 px-4">
        <div className="max-w-2xl mx-auto text-center text-white">
          <div className="text-5xl mb-4">📬</div>
          <h2 className="text-3xl font-bold mb-2">Đừng Bỏ Lỡ Ưu Đãi!</h2>
          <p className="text-rose-100 mb-8">Đăng ký nhận email và nhận ngay mã giảm giá 10% cho đơn hàng đầu tiên</p>
          <form onSubmit={subscribeNewsletter} className="flex gap-3 max-w-md mx-auto">
            <input
              type="email" required value={email} onChange={e => setEmail(e.target.value)}
              placeholder="Nhập email của bạn..."
              className="flex-1 px-5 py-3.5 rounded-full text-gray-800 focus:outline-none focus:ring-2 focus:ring-white/60 shadow-lg"
            />
            <button type="submit" className="bg-white text-rose-600 font-bold px-6 py-3.5 rounded-full hover:bg-rose-50 transition shadow-lg whitespace-nowrap">
              Đăng ký
            </button>
          </form>
          <p className="text-rose-200 text-xs mt-3">Bạn có thể hủy đăng ký bất cứ lúc nào. Không spam!</p>
        </div>
      </section>

    </div>
  );
}

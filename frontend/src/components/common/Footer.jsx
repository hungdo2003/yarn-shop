import { Link } from 'react-router-dom';
import { useState } from 'react';
import { FiFacebook, FiInstagram, FiMail, FiPhone, FiMapPin } from 'react-icons/fi';
import api from '../../services/api';
import toast from 'react-hot-toast';

const Footer = () => {
  const [email, setEmail] = useState('');

  const subscribe = async (e) => {
    e.preventDefault();
    try {
      const r = await api.post('/subscriptions/subscribe', { email });
      toast.success(r.data.message);
      setEmail('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Đăng ký thất bại');
    }
  };

  return (
    <footer className="bg-gray-900 text-gray-300 mt-12 xs:mt-16 sm:mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 xs:py-12 grid grid-cols-1 xs:grid-cols-2 md:grid-cols-4 gap-6 xs:gap-8">
        {/* Brand */}
        <div className="xs:col-span-2 md:col-span-1">
          <div className="text-white font-bold text-xl mb-3 flex items-center gap-2">
            <span className="text-2xl">🧶</span> YarnShop
          </div>
          <p className="text-sm leading-relaxed mb-4">Len sợi chất lượng cao, phụ kiện đan móc và sản phẩm handmade độc đáo. Đặt hàng theo yêu cầu!</p>
          <div className="flex gap-1">
            <a href="#" className="w-11 h-11 flex items-center justify-center rounded-lg hover:text-white hover:bg-white/10 active:scale-95 transition-all">
              <FiFacebook size={20} />
            </a>
            <a href="#" className="w-11 h-11 flex items-center justify-center rounded-lg hover:text-white hover:bg-white/10 active:scale-95 transition-all">
              <FiInstagram size={20} />
            </a>
          </div>
        </div>

        {/* Products */}
        <div>
          <h4 className="text-white font-semibold mb-3 xs:mb-4">Sản Phẩm</h4>
          <ul className="space-y-1.5 xs:space-y-2 text-sm">
            <li><Link to="/products?type=raw_material" className="block py-1 hover:text-white transition-colors">Len & Sợi</Link></li>
            <li><Link to="/products?type=accessory" className="block py-1 hover:text-white transition-colors">Phụ Kiện Đan Móc</Link></li>
            <li><Link to="/products?type=finished_product" className="block py-1 hover:text-white transition-colors">Sản Phẩm Handmade</Link></li>
            <li><Link to="/products?isNew=true" className="block py-1 hover:text-white transition-colors">Hàng Mới Về</Link></li>
            <li><Link to="/products?sortBy=sold" className="block py-1 hover:text-white transition-colors">Bán Chạy Nhất</Link></li>
            <li><Link to="/custom-order" className="block py-1 hover:text-white transition-colors">Đặt Hàng Theo Yêu Cầu</Link></li>
          </ul>
        </div>

        {/* Support */}
        <div>
          <h4 className="text-white font-semibold mb-3 xs:mb-4">Hỗ Trợ Khách Hàng</h4>
          <ul className="space-y-1.5 xs:space-y-2 text-sm">
            <li><Link to="/how-to-buy" className="block py-1 hover:text-white transition-colors">Hướng Dẫn Mua Hàng</Link></li>
            <li><Link to="/policies" className="block py-1 hover:text-white transition-colors">Chính Sách Đổi Trả</Link></li>
            <li><Link to="/policies" className="block py-1 hover:text-white transition-colors">Chính Sách Giao Hàng</Link></li>
            <li><Link to="/policies" className="block py-1 hover:text-white transition-colors">Chính Sách Bảo Mật</Link></li>
            <li><Link to="/contact" className="block py-1 hover:text-white transition-colors">Liên Hệ Chúng Tôi</Link></li>
            <li><Link to="/promotions" className="block py-1 hover:text-white transition-colors">Khuyến Mãi & Voucher</Link></li>
          </ul>
        </div>

        {/* Contact + newsletter */}
        <div className="xs:col-span-2 md:col-span-1">
          <h4 className="text-white font-semibold mb-3 xs:mb-4">Liên Hệ</h4>
          <ul className="space-y-2.5 xs:space-y-3 text-sm mb-5">
            <li className="flex items-start gap-2"><FiMapPin size={14} className="mt-0.5 shrink-0" /><span>123 Đường ABC, Quận 1, TP.HCM</span></li>
            <li className="flex items-center gap-2"><FiPhone size={14} className="shrink-0" /> 0901 234 567</li>
            <li className="flex items-center gap-2"><FiMail size={14} className="shrink-0" /> hello@yarnshop.vn</li>
            <li className="text-xs text-gray-400">8:00 – 20:00, Thứ 2 – Chủ nhật</li>
          </ul>
          <h4 className="text-white font-semibold mb-2 text-sm">Nhận Thông Báo Ưu Đãi</h4>
          <form onSubmit={subscribe} className="flex gap-2">
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="Email của bạn"
              className="flex-1 min-w-0 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-base text-white placeholder-gray-500 focus:outline-none focus:border-rose-400"
            />
            <button type="submit" className="bg-rose-500 text-white px-3 py-2.5 rounded-lg text-sm hover:bg-rose-600 active:scale-95 transition-all whitespace-nowrap">
              Đăng ký
            </button>
          </form>
        </div>
      </div>
      <div className="border-t border-gray-800 text-center py-4 text-xs text-gray-500">
        © {new Date().getFullYear()} YarnShop. Tất cả quyền được bảo lưu.
      </div>
    </footer>
  );
};

export default Footer;

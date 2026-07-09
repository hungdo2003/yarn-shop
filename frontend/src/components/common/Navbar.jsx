import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { FiShoppingCart, FiUser, FiMenu, FiX, FiSearch, FiLogOut, FiPackage, FiSettings, FiTag, FiPhone } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import NotificationBell from './NotificationBell';
import TierBadge from './TierBadge';
import api from '../../services/api';

const Navbar = () => {
  const { user, logout, isRole } = useAuth();
  const { itemCount } = useCart();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [walletBalance, setWalletBalance] = useState(null);
  const [tier, setTier] = useState(null);
  const [liveCount, setLiveCount] = useState(0);

  useEffect(() => {
    if (user && isRole('customer')) {
      api.get('/wallet').then(r => setWalletBalance(r.data.balance)).catch(() => {});
      api.get('/users/membership').then(r => setTier(r.data.tier)).catch(() => {});
    }
  }, [user]);

  useEffect(() => {
    const fetchLive = () => api.get('/livestreams', { params: { status: 'live' } })
      .then(r => setLiveCount(r.data?.length || 0)).catch(() => {});
    fetchLive();
    const t = setInterval(fetchLive, 30000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      if (search.trim()) navigate(`/products?search=${encodeURIComponent(search.trim())}`);
    }, 400);
    return () => clearTimeout(t);
  }, [search]);

  const handleLogout = () => { logout(); navigate('/'); setUserMenuOpen(false); setMenuOpen(false); };

  const dashboardLink = isRole('admin') ? '/manager' : isRole('staff') ? '/staff' : '/profile';

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 xs:h-16">
          <Link to="/" className="flex items-center gap-2 text-rose-600 font-bold text-lg xs:text-xl shrink-0 active:scale-95 transition-transform">
            <span className="text-xl xs:text-2xl">🧶</span>
            <span>YarnShop</span>
          </Link>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-5 text-sm">
            <Link to="/products" className="text-gray-600 hover:text-rose-600 transition-colors font-medium">Shop</Link>
            <Link to="/flash-sale" className="flex items-center gap-1 font-bold text-orange-500 hover:text-orange-600 transition-colors">
              <span className="animate-pulse">⚡</span> Flash Sale
            </Link>
            <Link to="/promotions" className="text-gray-600 hover:text-rose-600 transition-colors flex items-center gap-1">
              <FiTag size={14} /> Khuyến mãi
            </Link>
            <Link to="/livestream" className="relative flex items-center gap-1.5 font-bold transition-colors text-red-500 hover:text-red-600">
              {liveCount > 0 ? (
                <>
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
                  </span>
                  LIVE
                  <span className="bg-red-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full leading-none">{liveCount}</span>
                </>
              ) : (
                <>
                  <span className="inline-block w-2 h-2 rounded-full bg-gray-300" /> Live
                </>
              )}
            </Link>
            <div className="relative group">
              <button className="text-gray-600 hover:text-rose-600 transition-colors">Hỗ trợ ▾</button>
              <div className="absolute left-0 mt-2 w-52 bg-white rounded-xl shadow-lg border border-gray-100 py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 z-50">
                <Link to="/how-to-buy" className="block px-4 py-2 text-sm text-gray-700 hover:bg-rose-50">Hướng dẫn mua hàng</Link>
                <Link to="/policies" className="block px-4 py-2 text-sm text-gray-700 hover:bg-rose-50">Chính sách</Link>
                <Link to="/contact" className="block px-4 py-2 text-sm text-gray-700 hover:bg-rose-50 flex items-center gap-2"><FiPhone size={14}/> Liên hệ</Link>
                <Link to="/custom-order" className="block px-4 py-2 text-sm text-gray-700 hover:bg-rose-50">Đặt hàng theo yêu cầu</Link>
              </div>
            </div>
            {user && isRole('customer') && walletBalance !== null && (
              <Link to="/wallet" className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-green-500 text-white px-3.5 py-1.5 rounded-xl font-bold hover:from-emerald-600 hover:to-green-600 transition-all shadow-sm hover:shadow-md active:scale-95" style={{ fontSize: '13px' }}>
                <span className="text-base leading-none">💰</span>
                <span>{Number(walletBalance).toLocaleString('vi-VN')}đ</span>
              </Link>
            )}
          </div>

          {/* Desktop search */}
          <div className="hidden md:flex items-center">
            <div className="relative">
              <FiSearch size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Tìm kiếm sản phẩm..."
                className="border border-gray-300 rounded-lg pl-9 pr-3 py-1.5 text-base focus:outline-none focus:ring-1 focus:ring-rose-400 w-52"
              />
            </div>
          </div>

          {/* Right icons */}
          <div className="flex items-center gap-2 xs:gap-3">
            {user && isRole('customer') && <NotificationBell />}
            <Link
              to={user && isRole('customer') ? '/cart' : '/login'}
              className="relative w-11 h-11 flex items-center justify-center text-gray-600 hover:text-rose-600 active:scale-95 transition-all rounded-lg"
            >
              <FiShoppingCart size={21} />
              {itemCount > 0 && (
                <span className="absolute top-1 right-1 bg-rose-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center leading-none">
                  {itemCount > 99 ? '99+' : itemCount}
                </span>
              )}
            </Link>

            <div className="hidden xs:block w-px h-5 bg-gray-200 mx-1" />

            {user ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 text-gray-700 hover:text-rose-600 h-11 px-1 active:scale-95 transition-all rounded-lg min-w-0"
                >
                  {user.avatar ? (
                    <img src={user.avatar} alt="" className="w-8 h-8 rounded-full object-cover shrink-0" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-rose-500 text-white flex items-center justify-center text-sm font-semibold shrink-0">
                      {user.fullName?.[0]?.toUpperCase()}
                    </div>
                  )}
                  <span className="hidden md:block text-sm font-medium max-w-[120px] truncate min-w-0">{user.fullName}</span>
                </button>
                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50">
                    <div className="px-4 py-2 border-b">
                      <p className="text-xs text-gray-400">Đăng nhập với vai trò</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-sm font-semibold text-rose-600 capitalize">{user.Role?.name}</p>
                        {tier && <TierBadge tier={tier} size="sm" />}
                      </div>
                    </div>
                    <Link to={dashboardLink} onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 active:bg-gray-100">
                      <FiSettings size={16} /> Dashboard
                    </Link>
                    {isRole('customer') && <>
                      <Link to="/wallet" onClick={() => setUserMenuOpen(false)} className="flex items-center justify-between px-4 py-2.5 text-sm text-gray-700 hover:bg-green-50 active:bg-green-100">
                        <span className="flex items-center gap-2">💰 Ví của tôi</span>
                        {walletBalance !== null && (
                          <span className="text-xs font-bold text-green-600 bg-green-100 px-2 py-0.5 rounded-full ml-1 shrink-0">
                            {walletBalance.toLocaleString('vi-VN')}đ
                          </span>
                        )}
                      </Link>
                      <Link to="/orders" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 active:bg-gray-100">
                        <FiPackage size={16} /> Đơn hàng của tôi
                      </Link>
                      <Link to="/addresses" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 active:bg-gray-100">
                        📍 Địa chỉ giao hàng
                      </Link>
                      <Link to="/returns" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 active:bg-gray-100">
                        🔄 Đổi trả hàng
                      </Link>
                    </>}
                    <Link to="/profile" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 active:bg-gray-100">
                      <FiUser size={16} /> Thông tin cá nhân
                    </Link>
                    <hr className="my-1" />
                    <button onClick={handleLogout} className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 active:bg-red-100 active:scale-95 transition-all">
                      <FiLogOut size={16} /> Đăng xuất
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="hidden xs:flex items-center gap-1.5">
                <Link to="/login" className="text-xs xs:text-sm px-2.5 xs:px-3 py-1.5 border border-rose-300 text-rose-600 rounded-lg hover:bg-rose-50 active:scale-95 transition-all">Đăng nhập</Link>
                <Link to="/register" className="text-xs xs:text-sm px-2.5 xs:px-3 py-1.5 bg-rose-500 text-white rounded-lg hover:bg-rose-600 active:scale-95 transition-all">Đăng ký</Link>
              </div>
            )}

            {/* Hamburger */}
            <button
              className="md:hidden w-11 h-11 flex items-center justify-center text-gray-600 hover:text-gray-900 active:scale-95 transition-all rounded-lg"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {menuOpen ? <FiX size={22} /> : <FiMenu size={22} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile drawer */}
      {menuOpen && (
        <div className="md:hidden border-t bg-white px-4 py-3 space-y-1 max-h-[80vh] overflow-y-auto">
          {/* Mobile search */}
          <div className="relative mb-3">
            <FiSearch size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Tìm kiếm..."
              className="border rounded-lg pl-9 pr-3 py-2.5 text-base w-full focus:outline-none focus:ring-1 focus:ring-rose-400"
            />
          </div>

          {/* Nav links */}
          {[
            ['/', 'Trang chủ'],
            ['/products', 'Shop'],
            ['/flash-sale', '⚡ Flash Sale'],
            ['/livestream', '🔴 Livestream'],
            ['/promotions', 'Khuyến mãi'],
            ['/how-to-buy', 'Hướng dẫn mua'],
            ['/policies', 'Chính sách'],
            ['/contact', 'Liên hệ'],
            ['/custom-order', 'Đặt theo yêu cầu'],
          ].map(([to, label]) => (
            <Link
              key={to}
              to={to}
              onClick={() => setMenuOpen(false)}
              className="flex items-center py-3 px-1 text-gray-700 hover:text-rose-600 border-b border-gray-50 text-sm active:bg-rose-50 rounded-lg transition-colors"
            >
              {label}
            </Link>
          ))}

          {/* Login/Register for guests */}
          {!user && (
            <div className="flex gap-2 pt-2 pb-1">
              <Link to="/login" onClick={() => setMenuOpen(false)} className="flex-1 text-center py-2.5 border border-rose-300 text-rose-600 rounded-lg text-sm font-medium active:scale-95 transition-all">Đăng nhập</Link>
              <Link to="/register" onClick={() => setMenuOpen(false)} className="flex-1 text-center py-2.5 bg-rose-500 text-white rounded-lg text-sm font-medium active:scale-95 transition-all">Đăng ký</Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;

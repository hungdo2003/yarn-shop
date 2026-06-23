import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { FiShoppingCart, FiUser, FiMenu, FiX, FiSearch, FiLogOut, FiPackage, FiSettings, FiTag, FiPhone } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import NotificationBell from './NotificationBell';
import api from '../../services/api';

const Navbar = () => {
  const { user, logout, isRole } = useAuth();
  const { itemCount } = useCart();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [walletBalance, setWalletBalance] = useState(null);

  useEffect(() => {
    if (user && isRole('customer')) {
      api.get('/wallet').then(r => setWalletBalance(r.data.balance)).catch(() => {});
    }
  }, [user]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (search.trim()) navigate(`/products?search=${encodeURIComponent(search.trim())}`);
  };

  const handleLogout = () => { logout(); navigate('/'); setUserMenuOpen(false); };

  const dashboardLink = isRole('admin') ? '/admin' : isRole('manager') ? '/manager' : isRole('staff') ? '/staff' : '/profile';

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2 text-rose-600 font-bold text-xl shrink-0">
            <span className="text-2xl">🧶</span>
            <span>YarnShop</span>
          </Link>

          <div className="hidden md:flex items-center gap-5 text-sm">
            <Link to="/products" className="text-gray-600 hover:text-rose-600 transition-colors font-medium">Shop</Link>
            <Link to="/promotions" className="text-gray-600 hover:text-rose-600 transition-colors flex items-center gap-1">
              <FiTag size={14} /> Khuyến mãi
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
              <Link to="/wallet" className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-green-500 text-white px-3.5 py-1.5 rounded-xl font-bold hover:from-emerald-600 hover:to-green-600 transition-all shadow-sm hover:shadow-md" style={{ fontSize: '13px' }}>
                <span className="text-base leading-none">💰</span>
                <span>{Number(walletBalance).toLocaleString('vi-VN')}đ</span>
              </Link>
            )}
          </div>

          <form onSubmit={handleSearch} className="hidden md:flex items-center">
            <div className="relative">
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Tìm kiếm sản phẩm..."
                className="border border-gray-300 rounded-l-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-rose-400 w-52"
              />
              <button type="submit" className="bg-rose-500 text-white px-3 py-1.5 rounded-r-lg hover:bg-rose-600">
                <FiSearch />
              </button>
            </div>
          </form>

          <div className="flex items-center gap-3">
            {user && isRole('customer') && <NotificationBell />}
            <Link to={user && isRole('customer') ? '/cart' : '/login'} className="relative p-2 text-gray-600 hover:text-rose-600">
              <FiShoppingCart size={22} />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {itemCount > 99 ? '99+' : itemCount}
                </span>
              )}
            </Link>

            {user ? (
              <div className="relative">
                <button onClick={() => setUserMenuOpen(!userMenuOpen)} className="flex items-center gap-2 text-gray-700 hover:text-rose-600">
                  {user.avatar ? (
                    <img src={user.avatar} alt="" className="w-8 h-8 rounded-full object-cover" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-rose-500 text-white flex items-center justify-center text-sm font-semibold">
                      {user.fullName?.[0]?.toUpperCase()}
                    </div>
                  )}
                  <span className="hidden md:block text-sm font-medium max-w-[120px] truncate">{user.fullName}</span>
                </button>
                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50">
                    <div className="px-4 py-2 border-b">
                      <p className="text-xs text-gray-400">Đăng nhập với vai trò</p>
                      <p className="text-sm font-semibold text-rose-600 capitalize">{user.Role?.name}</p>
                    </div>
                    <Link to={dashboardLink} onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                      <FiSettings size={16} /> Dashboard
                    </Link>
                    {isRole('customer') && <>
                      <Link to="/wallet" onClick={() => setUserMenuOpen(false)} className="flex items-center justify-between px-4 py-2 text-sm text-gray-700 hover:bg-green-50 group">
                        <span className="flex items-center gap-2">💰 Ví của tôi</span>
                        {walletBalance !== null && (
                          <span className="text-xs font-bold text-green-600 bg-green-100 px-2 py-0.5 rounded-full">
                            {walletBalance.toLocaleString('vi-VN')}đ
                          </span>
                        )}
                      </Link>
                      <Link to="/orders" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                        <FiPackage size={16} /> Đơn hàng của tôi
                      </Link>
                      <Link to="/addresses" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                        📍 Địa chỉ giao hàng
                      </Link>
                      <Link to="/returns" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                        🔄 Đổi trả hàng
                      </Link>
                    </>}
                    <Link to="/profile" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                      <FiUser size={16} /> Thông tin cá nhân
                    </Link>
                    <hr className="my-1" />
                    <button onClick={handleLogout} className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                      <FiLogOut size={16} /> Đăng xuất
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login" className="text-sm px-3 py-1.5 border border-rose-300 text-rose-600 rounded-lg hover:bg-rose-50 transition">Đăng nhập</Link>
                <Link to="/register" className="text-sm px-3 py-1.5 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition">Đăng ký</Link>
              </div>
            )}

            <button className="md:hidden text-gray-600" onClick={() => setMenuOpen(!menuOpen)}>
              {menuOpen ? <FiX size={22} /> : <FiMenu size={22} />}
            </button>
          </div>
        </div>
      </div>

      {menuOpen && (
        <div className="md:hidden border-t bg-white px-4 py-3 space-y-2">
          <form onSubmit={handleSearch} className="flex mb-3">
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm kiếm..." className="border rounded-l-lg px-3 py-2 text-sm flex-1 focus:outline-none" />
            <button type="submit" className="bg-rose-500 text-white px-3 rounded-r-lg"><FiSearch /></button>
          </form>
          {[['/', 'Trang chủ'], ['/products', 'Shop'], ['/promotions', 'Khuyến mãi'], ['/how-to-buy', 'Hướng dẫn mua'], ['/policies', 'Chính sách'], ['/contact', 'Liên hệ'], ['/custom-order', 'Đặt theo yêu cầu']].map(([to, label]) => (
            <Link key={to} to={to} onClick={() => setMenuOpen(false)} className="block py-2 text-gray-600 hover:text-rose-600 border-b border-gray-50 text-sm">{label}</Link>
          ))}
        </div>
      )}
    </nav>
  );
};

export default Navbar;

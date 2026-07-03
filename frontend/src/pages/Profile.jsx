import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import { FiUser, FiLock, FiMapPin, FiStar, FiRefreshCw, FiGift, FiTrendingUp } from 'react-icons/fi';

const roleLabel = { admin: 'Quản trị viên', manager: 'Quản lý', staff: 'Nhân viên', customer: 'Khách hàng' };
const roleBg = { admin: 'bg-red-100 text-red-700', manager: 'bg-purple-100 text-purple-700', staff: 'bg-blue-100 text-blue-700', customer: 'bg-rose-100 text-rose-700' };

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [tab, setTab] = useState('profile');
  const [profileForm, setProfileForm] = useState({ fullName: user?.fullName || '', phone: user?.phone || '', address: user?.address || '' });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    if (!profileForm.fullName.trim()) return toast.error('Vui lòng nhập họ tên');
    setLoading(true);
    const tid = toast.loading('Đang cập nhật...');
    try {
      const res = await api.put('/users/profile', profileForm);
      updateUser(res.data);
      toast.dismiss(tid);
      toast.success('Cập nhật thông tin thành công! ✅');
    } catch (err) {
      toast.dismiss(tid);
      toast.error(err?.response?.data?.message || 'Cập nhật thất bại');
    } finally { setLoading(false); }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword.length < 6) return toast.error('Mật khẩu mới phải có ít nhất 6 ký tự');
    if (passwordForm.newPassword !== passwordForm.confirmPassword) return toast.error('Mật khẩu xác nhận không khớp');
    setLoading(true);
    const tid = toast.loading('Đang đổi mật khẩu...');
    try {
      await api.put('/auth/change-password', { currentPassword: passwordForm.currentPassword, newPassword: passwordForm.newPassword });
      toast.dismiss(tid);
      toast.success('Đổi mật khẩu thành công! 🔒');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.dismiss(tid);
      const msg = err?.response?.data?.message || '';
      if (msg.toLowerCase().includes('current') || msg.toLowerCase().includes('incorrect')) {
        toast.error('Mật khẩu hiện tại không đúng');
      } else {
        toast.error(msg || 'Đổi mật khẩu thất bại');
      }
    } finally { setLoading(false); }
  };

  const TABS = [
    { id: 'profile', icon: FiUser, label: 'Thông tin' },
    { id: 'password', icon: FiLock, label: 'Mật khẩu' },
  ];

  const role = user?.Role?.name;

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Tài Khoản Của Tôi</h1>

      {/* User card */}
      <div className="bg-gradient-to-r from-rose-500 to-pink-500 rounded-2xl p-6 text-white mb-6 flex items-center gap-5">
        <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-3xl font-bold shrink-0">
          {user?.avatar ? <img src={user.avatar} className="w-full h-full rounded-full object-cover" /> : user?.fullName?.[0]?.toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xl font-bold truncate">{user?.fullName}</p>
          <p className="text-rose-100 text-sm">{user?.email}</p>
          <div className="flex items-center gap-3 mt-2">
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full bg-white/20 text-white`}>{roleLabel[role] || role}</span>
            {role === 'customer' && user?.loyaltyPoints > 0 && (
              <span className="flex items-center gap-1 text-xs text-amber-200">
                <FiStar size={12} /> {user.loyaltyPoints} điểm tích lũy
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Quick links for customer */}
      {role === 'customer' && (
        <>
          <div className="grid grid-cols-4 gap-3 mb-6">
            <Link to="/orders" className="bg-white rounded-xl shadow-sm p-4 text-center hover:shadow-md transition group">
              <div className="text-2xl mb-1">📦</div>
              <p className="text-xs font-medium text-gray-700 group-hover:text-rose-600">Đơn hàng</p>
            </Link>
            <Link to="/wishlist" className="bg-white rounded-xl shadow-sm p-4 text-center hover:shadow-md transition group">
              <div className="text-2xl mb-1">❤️</div>
              <p className="text-xs font-medium text-gray-700 group-hover:text-rose-600">Yêu thích</p>
            </Link>
            <Link to="/addresses" className="bg-white rounded-xl shadow-sm p-4 text-center hover:shadow-md transition group">
              <FiMapPin className="mx-auto mb-1 text-gray-400 group-hover:text-rose-500" size={22} />
              <p className="text-xs font-medium text-gray-700 group-hover:text-rose-600">Địa chỉ</p>
            </Link>
            <Link to="/returns" className="bg-white rounded-xl shadow-sm p-4 text-center hover:shadow-md transition group">
              <FiRefreshCw className="mx-auto mb-1 text-gray-400 group-hover:text-rose-500" size={22} />
              <p className="text-xs font-medium text-gray-700 group-hover:text-rose-600">Đổi trả</p>
            </Link>
          </div>

          {/* Loyalty Points Card */}
          <div className="bg-gradient-to-r from-amber-400 to-orange-400 rounded-2xl p-5 text-white mb-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <FiGift size={18} />
                <span className="font-bold text-base">Điểm Tích Lũy</span>
              </div>
              <span className="text-3xl font-black">{(user?.loyaltyPoints || 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-xs text-amber-100 mb-4">
              <span>Chi tiêu 1.000đ = 1 điểm</span>
              <span>1 điểm = 100đ giảm giá</span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="bg-white/20 rounded-xl py-2">
                <p className="text-lg font-bold">{(user?.loyaltyPoints || 0).toLocaleString()}</p>
                <p className="text-xs text-amber-100">Điểm hiện có</p>
              </div>
              <div className="bg-white/20 rounded-xl py-2">
                <p className="text-lg font-bold">{((user?.loyaltyPoints || 0) * 100).toLocaleString()}đ</p>
                <p className="text-xs text-amber-100">Giá trị quy đổi</p>
              </div>
            </div>
            <p className="text-xs text-amber-100 mt-3 text-center">
              Sử dụng điểm khi thanh toán — tối đa 20% giá trị đơn hàng
            </p>
          </div>
        </>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-5">
        {TABS.map(({ id, icon: Icon, label }) => (
          <button key={id} onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${tab === id ? 'bg-rose-500 text-white' : 'bg-white border text-gray-600 hover:bg-gray-50'}`}>
            <Icon size={15} /> {label}
          </button>
        ))}
      </div>

      {tab === 'profile' && (
        <form onSubmit={handleProfileSubmit} className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Họ và tên</label>
            <input value={profileForm.fullName} onChange={e => setProfileForm(f => ({ ...f, fullName: e.target.value }))} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-rose-300 focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
            <input value={user?.email} disabled className="w-full border border-gray-100 rounded-xl px-4 py-2.5 text-sm bg-gray-50 text-gray-400 cursor-not-allowed" />
            <p className="text-xs text-gray-400 mt-1">Email không thể thay đổi</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Số điện thoại</label>
            <input value={profileForm.phone} onChange={e => setProfileForm(f => ({ ...f, phone: e.target.value }))} placeholder="0901 234 567" className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-rose-300 focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Địa chỉ mặc định</label>
            <textarea value={profileForm.address} onChange={e => setProfileForm(f => ({ ...f, address: e.target.value }))} rows={2} placeholder="Địa chỉ của bạn..." className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-rose-300 focus:outline-none resize-none" />
          </div>
          <button type="submit" disabled={loading} className="bg-rose-500 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-rose-600 transition disabled:opacity-60">
            {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
          </button>
        </form>
      )}

      {tab === 'password' && (
        <form onSubmit={handlePasswordSubmit} className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Mật khẩu hiện tại</label>
            <input type="password" value={passwordForm.currentPassword} onChange={e => setPasswordForm(f => ({ ...f, currentPassword: e.target.value }))} required className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-rose-300 focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Mật khẩu mới</label>
            <input type="password" value={passwordForm.newPassword} onChange={e => setPasswordForm(f => ({ ...f, newPassword: e.target.value }))} required placeholder="Tối thiểu 6 ký tự" className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-rose-300 focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Xác nhận mật khẩu mới</label>
            <input type="password" value={passwordForm.confirmPassword} onChange={e => setPasswordForm(f => ({ ...f, confirmPassword: e.target.value }))} required className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-rose-300 focus:outline-none ${passwordForm.confirmPassword && passwordForm.newPassword !== passwordForm.confirmPassword ? 'border-red-300' : 'border-gray-200'}`} />
            {passwordForm.confirmPassword && passwordForm.newPassword !== passwordForm.confirmPassword && <p className="text-red-500 text-xs mt-1">Mật khẩu không khớp</p>}
          </div>
          <button type="submit" disabled={loading} className="bg-rose-500 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-rose-600 transition disabled:opacity-60">
            {loading ? 'Đang đổi...' : 'Đổi mật khẩu'}
          </button>
        </form>
      )}
    </div>
  );
};

export default Profile;

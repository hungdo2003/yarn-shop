import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ fullName: '', email: '', password: '', confirmPassword: '', phone: '' });
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.fullName.trim()) return toast.error('Vui lòng nhập họ tên');
    if (form.password.length < 6) return toast.error('Mật khẩu phải có ít nhất 6 ký tự');
    if (form.password !== form.confirmPassword) return toast.error('Mật khẩu xác nhận không khớp');

    setLoading(true);
    const toastId = toast.loading('Đang tạo tài khoản...');
    try {
      const user = await register({ fullName: form.fullName.trim(), email: form.email.trim(), password: form.password, phone: form.phone });
      toast.dismiss(toastId);
      toast.success(`Tạo tài khoản thành công! Chào ${user.fullName} 🎉`, { duration: 4000 });
      navigate('/');
    } catch (err) {
      toast.dismiss(toastId);
      const msg = err?.response?.data?.message || '';
      if (msg.toLowerCase().includes('email') && msg.toLowerCase().includes('exist')) {
        toast.error('Email này đã được sử dụng. Vui lòng dùng email khác.');
      } else if (msg.toLowerCase().includes('email')) {
        toast.error('Email không hợp lệ.');
      } else {
        toast.error(msg || 'Đăng ký thất bại. Vui lòng thử lại.', { duration: 4000 });
      }
    } finally {
      setLoading(false);
    }
  };

  const strength = form.password.length === 0 ? 0 : form.password.length < 6 ? 1 : form.password.length < 10 ? 2 : 3;
  const strengthLabel = ['', 'Yếu', 'Trung bình', 'Mạnh'];
  const strengthColor = ['', 'bg-red-400', 'bg-yellow-400', 'bg-green-400'];

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-8 bg-gradient-to-br from-rose-50 to-pink-50">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-block"><div className="text-5xl mb-3">🧶</div></Link>
          <h1 className="text-2xl font-bold text-gray-800">Tạo Tài Khoản</h1>
          <p className="text-gray-500 text-sm mt-1">Tham gia cộng đồng YarnShop ngay hôm nay</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg p-8 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Họ và tên *</label>
            <input value={form.fullName} onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))} required placeholder="Nguyễn Văn A" className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 transition" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Email *</label>
            <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required placeholder="email@example.com" className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 transition" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Số điện thoại</label>
            <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="0901 234 567 (tuỳ chọn)" className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 transition" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Mật khẩu *</label>
            <div className="relative">
              <input type={showPass ? 'text' : 'password'} value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required placeholder="Tối thiểu 6 ký tự" className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 transition pr-10" />
              <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">{showPass ? 'Ẩn' : 'Hiện'}</button>
            </div>
            {form.password && (
              <div className="mt-1.5 flex gap-1 items-center">
                {[1, 2, 3].map(i => <div key={i} className={`h-1 flex-1 rounded-full transition ${i <= strength ? strengthColor[strength] : 'bg-gray-200'}`} />)}
                <span className="text-xs text-gray-400 ml-1">{strengthLabel[strength]}</span>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Xác nhận mật khẩu *</label>
            <input type="password" value={form.confirmPassword} onChange={e => setForm(f => ({ ...f, confirmPassword: e.target.value }))} required className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 transition ${form.confirmPassword && form.password !== form.confirmPassword ? 'border-red-300 bg-red-50' : 'border-gray-200'}`} />
            {form.confirmPassword && form.password !== form.confirmPassword && <p className="text-red-500 text-xs mt-1">Mật khẩu không khớp</p>}
          </div>

          <button type="submit" disabled={loading} className="w-full bg-rose-500 text-white py-3 rounded-xl font-semibold hover:bg-rose-600 transition disabled:opacity-60 mt-2">
            {loading ? 'Đang tạo tài khoản...' : 'Tạo Tài Khoản'}
          </button>

          <p className="text-center text-sm text-gray-500">
            Đã có tài khoản?{' '}
            <Link to="/login" className="text-rose-500 font-semibold hover:underline">Đăng nhập</Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Register;

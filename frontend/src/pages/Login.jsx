import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || '/';
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email.trim()) return toast.error('Vui lòng nhập email');
    if (!form.password) return toast.error('Vui lòng nhập mật khẩu');

    setLoading(true);
    const toastId = toast.loading('Đang đăng nhập...');
    try {
      const user = await login(form.email.trim(), form.password);
      toast.dismiss(toastId);
      toast.success(`Chào mừng trở lại, ${user.fullName}! 👋`, { duration: 3000 });
      const role = user.Role?.name;
      if (role === 'admin') navigate('/manager');
      else if (role === 'staff') navigate('/staff');
      else navigate(from);
    } catch (err) {
      toast.dismiss(toastId);
      const msg = err?.response?.data?.message || '';
      if (msg.toLowerCase().includes('password') || msg.toLowerCase().includes('incorrect') || msg.toLowerCase().includes('invalid')) {
        toast.error('Sai mật khẩu. Vui lòng kiểm tra lại.', { duration: 4000 });
      } else if (msg.toLowerCase().includes('not found') || msg.toLowerCase().includes('email')) {
        toast.error('Email không tồn tại trong hệ thống.', { duration: 4000 });
      } else if (msg.toLowerCase().includes('inactive') || msg.toLowerCase().includes('locked') || msg.toLowerCase().includes('disabled')) {
        toast.error('Tài khoản đã bị khóa. Vui lòng liên hệ hỗ trợ.', { duration: 5000 });
      } else {
        toast.error(msg || 'Đăng nhập thất bại. Vui lòng thử lại.', { duration: 4000 });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 bg-gradient-to-br from-rose-50 to-pink-50">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-block">
            <div className="text-5xl mb-3">🧶</div>
          </Link>
          <h1 className="text-2xl font-bold text-gray-800">Đăng Nhập</h1>
          <p className="text-gray-500 text-sm mt-1">Chào mừng bạn quay trở lại YarnShop</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg p-8 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              required
              placeholder="email@example.com"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-transparent transition"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Mật khẩu</label>
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'}
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                required
                placeholder="••••••••"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-transparent transition pr-10"
              />
              <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs">
                {showPass ? 'Ẩn' : 'Hiện'}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-rose-500 text-white py-3 rounded-xl font-semibold hover:bg-rose-600 transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? 'Đang đăng nhập...' : 'Đăng Nhập'}
          </button>

          <div className="text-center text-sm text-gray-500">
            Chưa có tài khoản?{' '}
            <Link to="/register" className="text-rose-500 font-semibold hover:underline">Đăng ký ngay</Link>
          </div>
        </form>

        <div className="mt-4 bg-white/70 rounded-xl p-4 text-xs text-gray-500 space-y-1">
          <p className="font-medium text-gray-600 mb-2">Tài khoản demo:</p>
          {[
            { role: 'Admin', email: 'admin@yarnshop.com', pass: 'Admin@123' },
            { role: 'Staff', email: 'staff@yarnshop.com', pass: 'Staff@123' },
            { role: 'Customer', email: 'jane@example.com', pass: 'Customer@123' },
          ].map(acc => (
            <button
              key={acc.role}
              type="button"
              onClick={() => { setForm({ email: acc.email, password: acc.pass }); toast('Đã điền thông tin ' + acc.role, { icon: '✏️' }); }}
              className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-rose-50 hover:text-rose-700 transition flex justify-between"
            >
              <span className="font-medium">{acc.role}</span>
              <span className="text-gray-400">{acc.email}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Login;

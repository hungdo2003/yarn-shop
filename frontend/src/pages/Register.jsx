import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const Register = () => {
  const { sendOtp, verifyOtp } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1); // 1: form, 2: otp
  const [form, setForm] = useState({ fullName: '', email: '', password: '', confirmPassword: '', phone: '' });
  const [otp, setOtp] = useState(['', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const otpRefs = [useRef(), useRef(), useRef(), useRef()];

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.fullName.trim()) return toast.error('Vui lòng nhập họ tên');
    if (form.password.length < 6) return toast.error('Mật khẩu phải có ít nhất 6 ký tự');
    if (form.password !== form.confirmPassword) return toast.error('Mật khẩu xác nhận không khớp');

    setLoading(true);
    const toastId = toast.loading('Đang gửi mã xác nhận...');
    try {
      await sendOtp({ fullName: form.fullName.trim(), email: form.email.trim(), password: form.password, phone: form.phone });
      toast.dismiss(toastId);
      toast.success('Mã OTP đã gửi đến email của bạn!');
      setStep(2);
      setCountdown(60);
      setTimeout(() => otpRefs[0].current?.focus(), 100);
    } catch (err) {
      toast.dismiss(toastId);
      const msg = err?.response?.data?.message || '';
      if (msg.toLowerCase().includes('email') && (msg.toLowerCase().includes('exist') || msg.toLowerCase().includes('registered'))) {
        toast.error('Email này đã được sử dụng. Vui lòng dùng email khác.');
      } else {
        toast.error(msg || 'Gửi OTP thất bại. Vui lòng thử lại.', { duration: 4000 });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const next = [...otp];
    next[index] = value.slice(-1);
    setOtp(next);
    if (value && index < 3) otpRefs[index + 1].current?.focus();
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs[index - 1].current?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4);
    if (!text) return;
    e.preventDefault();
    const next = ['', '', '', ''];
    text.split('').forEach((ch, i) => { next[i] = ch; });
    setOtp(next);
    otpRefs[Math.min(text.length, 3)].current?.focus();
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    const code = otp.join('');
    if (code.length < 4) return toast.error('Vui lòng nhập đủ 4 số OTP');

    setLoading(true);
    const toastId = toast.loading('Đang xác nhận...');
    try {
      const user = await verifyOtp(form.email.trim(), code);
      toast.dismiss(toastId);
      toast.success(`Tạo tài khoản thành công! Chào ${user.fullName} 🎉`, { duration: 4000 });
      navigate('/');
    } catch (err) {
      toast.dismiss(toastId);
      const msg = err?.response?.data?.message || 'Xác nhận thất bại. Vui lòng thử lại.';
      toast.error(msg, { duration: 4000 });
      setOtp(['', '', '', '']);
      otpRefs[0].current?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0) return;
    setLoading(true);
    const toastId = toast.loading('Đang gửi lại mã...');
    try {
      await sendOtp({ fullName: form.fullName.trim(), email: form.email.trim(), password: form.password, phone: form.phone });
      toast.dismiss(toastId);
      toast.success('Đã gửi lại mã OTP!');
      setCountdown(60);
      setOtp(['', '', '', '']);
      otpRefs[0].current?.focus();
    } catch (err) {
      toast.dismiss(toastId);
      toast.error('Gửi lại thất bại. Vui lòng thử lại.');
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
          <Link to="/" className="inline-block active:scale-95 transition-all"><div className="text-5xl mb-3">🧶</div></Link>
          <h1 className="text-2xl font-bold text-gray-800">Tạo Tài Khoản</h1>
          <p className="text-gray-500 text-sm mt-1">Tham gia cộng đồng YarnShop ngay hôm nay</p>
        </div>

        {step === 1 ? (
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg p-5 xs:p-8 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Họ và tên *</label>
              <input value={form.fullName} onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))} required placeholder="Nguyễn Văn A" className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-rose-300 transition" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email *</label>
              <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required placeholder="email@example.com" className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-rose-300 transition" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Số điện thoại</label>
              <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="0901 234 567 (tuỳ chọn)" className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-rose-300 transition" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Mật khẩu *</label>
              <div className="relative">
                <input type={showPass ? 'text' : 'password'} value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required placeholder="Tối thiểu 6 ký tự" className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-rose-300 transition pr-12" />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-400 text-xs w-11 h-11 flex items-center justify-center active:scale-95 transition-all">{showPass ? 'Ẩn' : 'Hiện'}</button>
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
              <input type="password" value={form.confirmPassword} onChange={e => setForm(f => ({ ...f, confirmPassword: e.target.value }))} required className={`w-full border rounded-xl px-4 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-rose-300 transition ${form.confirmPassword && form.password !== form.confirmPassword ? 'border-red-300 bg-red-50' : 'border-gray-200'}`} />
              {form.confirmPassword && form.password !== form.confirmPassword && <p className="text-red-500 text-xs mt-1">Mật khẩu không khớp</p>}
            </div>

            <button type="submit" disabled={loading} className="w-full bg-rose-500 text-white py-3 rounded-xl font-semibold hover:bg-rose-600 active:scale-95 transition-all disabled:opacity-60 mt-2">
              {loading ? 'Đang gửi mã...' : 'Tiếp theo'}
            </button>

            <p className="text-center text-sm text-gray-500">
              Đã có tài khoản?{' '}
              <Link to="/login" className="text-rose-500 font-semibold hover:underline active:scale-95 transition-all">Đăng nhập</Link>
            </p>
          </form>
        ) : (
          <form onSubmit={handleVerify} className="bg-white rounded-2xl shadow-lg p-5 xs:p-8">
            <button type="button" onClick={() => setStep(1)} className="flex items-center gap-1 text-gray-400 hover:text-gray-600 text-sm mb-6 transition min-h-[44px]">
              ← Quay lại
            </button>

            <div className="text-center mb-6">
              <div className="text-4xl mb-3">📧</div>
              <h2 className="text-lg font-bold text-gray-800">Nhập mã xác nhận</h2>
              <p className="text-gray-500 text-sm mt-1">
                Mã OTP đã được gửi đến<br />
                <span className="font-medium text-gray-700">{form.email}</span>
              </p>
            </div>

            <div className="flex justify-center gap-3 mb-6" onPaste={handleOtpPaste}>
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={otpRefs[i]}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={e => handleOtpChange(i, e.target.value)}
                  onKeyDown={e => handleOtpKeyDown(i, e)}
                  className="w-14 h-14 text-center text-2xl font-bold border-2 rounded-xl focus:outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100 transition border-gray-200"
                />
              ))}
            </div>

            <button type="submit" disabled={loading || otp.join('').length < 4} className="w-full bg-rose-500 text-white py-3 rounded-xl font-semibold hover:bg-rose-600 active:scale-95 transition-all disabled:opacity-60 mb-4">
              {loading ? 'Đang xác nhận...' : 'Xác nhận'}
            </button>

            <p className="text-center text-sm text-gray-500">
              Không nhận được mã?{' '}
              {countdown > 0 ? (
                <span className="text-gray-400">Gửi lại sau {countdown}s</span>
              ) : (
                <button type="button" onClick={handleResend} disabled={loading} className="text-rose-500 font-semibold hover:underline active:scale-95 transition-all disabled:opacity-50">
                  Gửi lại
                </button>
              )}
            </p>
          </form>
        )}
      </div>
    </div>
  );
};

export default Register;

import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '']);
  const [form, setForm] = useState({ newPassword: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const otpRefs = [useRef(), useRef(), useRef(), useRef()];

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!email.trim()) return toast.error('Vui lòng nhập email');
    setLoading(true);
    const id = toast.loading('Đang gửi mã xác nhận...');
    try {
      await api.post('/auth/forgot-password', { email: email.trim().toLowerCase() });
      toast.dismiss(id);
      toast.success('Mã OTP đã được gửi đến email của bạn');
      setStep(2);
    } catch (err) {
      toast.dismiss(id);
      toast.error(err?.response?.data?.message || 'Không thể gửi email. Vui lòng thử lại.', { duration: 4000 });
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (i, val) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...otp];
    next[i] = val;
    setOtp(next);
    if (val && i < 3) otpRefs[i + 1].current?.focus();
  };

  const handleOtpKeyDown = (i, e) => {
    if (e.key === 'Backspace' && !otp[i] && i > 0) otpRefs[i - 1].current?.focus();
  };

  const handleOtpPaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4);
    if (!pasted) return;
    e.preventDefault();
    const next = ['', '', '', ''];
    pasted.split('').forEach((c, i) => { next[i] = c; });
    setOtp(next);
    const focusIdx = Math.min(pasted.length, 3);
    otpRefs[focusIdx].current?.focus();
  };

  const handleVerifyOtp = (e) => {
    e.preventDefault();
    if (otp.join('').length < 4) return toast.error('Vui lòng nhập đủ 4 chữ số');
    setStep(3);
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!form.newPassword) return toast.error('Vui lòng nhập mật khẩu mới');
    if (form.newPassword.length < 6) return toast.error('Mật khẩu phải có ít nhất 6 ký tự');
    if (form.newPassword !== form.confirmPassword) return toast.error('Mật khẩu xác nhận không khớp');

    setLoading(true);
    const id = toast.loading('Đang cập nhật mật khẩu...');
    try {
      await api.post('/auth/reset-password', {
        email: email.trim().toLowerCase(),
        otp: otp.join(''),
        newPassword: form.newPassword,
      });
      toast.dismiss(id);
      toast.success('Đặt lại mật khẩu thành công! Vui lòng đăng nhập.', { duration: 4000 });
      navigate('/login');
    } catch (err) {
      toast.dismiss(id);
      const msg = err?.response?.data?.message || 'OTP không hợp lệ hoặc đã hết hạn';
      toast.error(msg, { duration: 4000 });
      if (msg.toLowerCase().includes('otp') || msg.toLowerCase().includes('hết hạn') || msg.toLowerCase().includes('sử dụng')) {
        setOtp(['', '', '', '']);
        setStep(2);
      }
    } finally {
      setLoading(false);
    }
  };

  const resendOtp = async () => {
    setLoading(true);
    const id = toast.loading('Đang gửi lại mã...');
    try {
      await api.post('/auth/forgot-password', { email: email.trim().toLowerCase() });
      toast.dismiss(id);
      toast.success('Đã gửi lại mã OTP');
      setOtp(['', '', '', '']);
      otpRefs[0].current?.focus();
    } catch (err) {
      toast.dismiss(id);
      toast.error(err?.response?.data?.message || 'Gửi lại thất bại. Vui lòng thử lại.', { duration: 4000 });
    } finally {
      setLoading(false);
    }
  };

  const stepSubtitles = ['', 'Nhập email để nhận mã xác nhận', 'Nhập mã OTP đã gửi đến email của bạn', 'Tạo mật khẩu mới cho tài khoản'];

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 bg-gradient-to-br from-rose-50 to-pink-50">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-block active:scale-95 transition-all">
            <div className="text-5xl mb-3">🧶</div>
          </Link>
          <h1 className="text-2xl font-bold text-gray-800">Quên Mật Khẩu</h1>
          <p className="text-gray-500 text-sm mt-1">{stepSubtitles[step]}</p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center mb-6">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                s < step
                  ? 'bg-rose-500 text-white'
                  : s === step
                  ? 'bg-rose-500 text-white ring-4 ring-rose-100'
                  : 'bg-gray-200 text-gray-400'
              }`}>
                {s < step ? '✓' : s}
              </div>
              {s < 3 && (
                <div className={`w-10 xs:w-14 h-0.5 transition-all ${s < step ? 'bg-rose-500' : 'bg-gray-200'}`} />
              )}
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-5 xs:p-8">
          {/* Step 1: Email */}
          {step === 1 && (
            <form onSubmit={handleSendOtp} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                  placeholder="email@example.com"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-transparent transition"
                />
                <p className="text-xs text-gray-400 mt-1.5">Mã xác nhận sẽ được gửi đến địa chỉ email này</p>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-rose-500 text-white py-3 rounded-xl font-semibold hover:bg-rose-600 active:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? 'Đang gửi...' : 'Gửi Mã Xác Nhận'}
              </button>
              <div className="text-center text-sm text-gray-500">
                Nhớ mật khẩu rồi?{' '}
                <Link to="/login" className="text-rose-500 font-semibold hover:underline active:scale-95 transition-all">
                  Đăng nhập
                </Link>
              </div>
            </form>
          )}

          {/* Step 2: OTP */}
          {step === 2 && (
            <form onSubmit={handleVerifyOtp} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3 text-center">Nhập mã OTP</label>
                <div className="flex gap-2 xs:gap-3 justify-center">
                  {otp.map((d, i) => (
                    <input
                      key={i}
                      ref={otpRefs[i]}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={d}
                      onChange={(e) => handleOtpChange(i, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(i, e)}
                      onPaste={i === 0 ? handleOtpPaste : undefined}
                      className="w-12 h-12 xs:w-14 xs:h-14 text-center text-2xl font-bold border-2 border-gray-200 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-rose-400 transition"
                    />
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-3 text-center">
                  Đã gửi đến <strong className="text-gray-600">{email}</strong>
                </p>
              </div>
              <button
                type="submit"
                className="w-full bg-rose-500 text-white py-3 rounded-xl font-semibold hover:bg-rose-600 active:scale-95 transition-all"
              >
                Xác Nhận OTP
              </button>
              <div className="flex items-center justify-between text-sm">
                <button
                  type="button"
                  onClick={() => { setStep(1); setOtp(['', '', '', '']); }}
                  className="text-gray-400 hover:text-gray-600 py-2 active:scale-95 transition-all"
                >
                  ← Quay lại
                </button>
                <button
                  type="button"
                  onClick={resendOtp}
                  disabled={loading}
                  className="text-rose-500 font-medium hover:underline py-2 active:scale-95 transition-all disabled:opacity-50"
                >
                  Gửi lại mã
                </button>
              </div>
            </form>
          )}

          {/* Step 3: New password */}
          {step === 3 && (
            <form onSubmit={handleResetPassword} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Mật khẩu mới</label>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={form.newPassword}
                    onChange={(e) => setForm((f) => ({ ...f, newPassword: e.target.value }))}
                    required
                    autoFocus
                    placeholder="Ít nhất 6 ký tự"
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-transparent transition pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs w-11 h-11 flex items-center justify-center active:scale-95 transition-all"
                  >
                    {showPass ? 'Ẩn' : 'Hiện'}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Xác nhận mật khẩu</label>
                <input
                  type={showPass ? 'text' : 'password'}
                  value={form.confirmPassword}
                  onChange={(e) => setForm((f) => ({ ...f, confirmPassword: e.target.value }))}
                  required
                  placeholder="Nhập lại mật khẩu mới"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-transparent transition"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-rose-500 text-white py-3 rounded-xl font-semibold hover:bg-rose-600 active:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? 'Đang cập nhật...' : 'Đặt Lại Mật Khẩu'}
              </button>
              <button
                type="button"
                onClick={() => setStep(2)}
                className="w-full text-gray-400 hover:text-gray-600 py-2 text-sm active:scale-95 transition-all"
              >
                ← Quay lại
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;

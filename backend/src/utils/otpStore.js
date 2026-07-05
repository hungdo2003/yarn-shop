// In-memory OTP store: email -> { otp, expiresAt, userData }
const store = new Map();

const OTP_TTL_MS = 5 * 60 * 1000; // 5 minutes

function generateOtp() {
  return String(Math.floor(1000 + Math.random() * 9000));
}

function saveOtp(email, otp, userData) {
  store.set(email.toLowerCase(), {
    otp,
    expiresAt: Date.now() + OTP_TTL_MS,
    userData,
  });
}

function consumeOtp(email, otp) {
  const key = email.toLowerCase();
  const entry = store.get(key);
  if (!entry) return { valid: false, reason: 'OTP không tồn tại hoặc đã được sử dụng' };
  if (Date.now() > entry.expiresAt) {
    store.delete(key);
    return { valid: false, reason: 'OTP đã hết hạn, vui lòng đăng ký lại' };
  }
  if (entry.otp !== otp) return { valid: false, reason: 'OTP không đúng' };
  store.delete(key);
  return { valid: true, userData: entry.userData };
}

module.exports = { generateOtp, saveOtp, consumeOtp };

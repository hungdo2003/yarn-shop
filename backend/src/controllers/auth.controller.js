const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User, Role } = require('../models');
const { log } = require('./log.controller');
const { sendOtpEmail } = require('../services/emailService');
const { generateOtp, saveOtp, consumeOtp } = require('../utils/otpStore');

const signToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });

const sendOtp = async (req, res) => {
  try {
    const { fullName, email, password, phone } = req.body;
    if (!fullName || !email || !password) {
      return res.status(400).json({ message: 'Vui lòng điền đầy đủ thông tin' });
    }
    const exists = await User.findOne({ where: { email } });
    if (exists) return res.status(409).json({ message: 'Email already registered' });

    const hashed = await bcrypt.hash(password, 12);
    const otp = generateOtp();
    saveOtp(email, otp, { fullName, email, password: hashed, phone });

    await sendOtpEmail(email, otp, fullName);
    res.json({ message: 'OTP đã được gửi đến email của bạn' });
  } catch (err) {
    console.error('sendOtp error:', err);
    res.status(500).json({ message: 'Không thể gửi email. Vui lòng thử lại.' });
  }
};

const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ message: 'Thiếu email hoặc OTP' });

    const result = consumeOtp(email, otp);
    if (!result.valid) return res.status(400).json({ message: result.reason });

    const { fullName, password, phone } = result.userData;
    const user = await User.create({ fullName, email, password, phone, roleId: 2 });
    const token = signToken(user.id);
    const { password: _, ...userData } = user.toJSON();
    await log(user.id, email, 'REGISTER', 'User', user.id, { fullName, phone }, req);
    res.status(201).json({ token, user: userData });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email }, include: [Role] });
    if (!user || !user.isActive) {
      await log(null, email, 'LOGIN', 'User', null, { reason: 'user_not_found_or_inactive' }, req, 'failure');
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      await log(user.id, email, 'LOGIN', 'User', user.id, { reason: 'wrong_password' }, req, 'failure');
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    const token = signToken(user.id);
    const { password: _, ...userData } = user.toJSON();
    await log(user.id, email, 'LOGIN', 'User', user.id, { role: user.Role?.name }, req);
    res.json({ token, user: userData });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getMe = async (req, res) => {
  const { password: _, ...userData } = req.user.toJSON();
  res.json(userData);
};

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const valid = await bcrypt.compare(currentPassword, req.user.password);
    if (!valid) {
      await log(req.user.id, req.user.email, 'CHANGE_PASSWORD', 'User', req.user.id, { reason: 'wrong_current_password' }, req, 'failure');
      return res.status(400).json({ message: 'Current password is incorrect' });
    }
    const hashed = await bcrypt.hash(newPassword, 12);
    await req.user.update({ password: hashed });
    await log(req.user.id, req.user.email, 'CHANGE_PASSWORD', 'User', req.user.id, {}, req);
    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { sendOtp, verifyOtp, login, getMe, changePassword };

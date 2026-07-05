const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

async function sendOtpEmail(toEmail, otp, fullName) {
  await transporter.sendMail({
    from: `"YarnShop 🧶" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: 'Mã xác nhận đăng ký tài khoản YarnShop',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;border:1px solid #f0e0e0;border-radius:12px;">
        <div style="text-align:center;margin-bottom:24px;">
          <span style="font-size:48px;">🧶</span>
          <h2 style="color:#e11d48;margin:8px 0 0;">YarnShop</h2>
        </div>
        <p style="color:#374151;font-size:15px;">Xin chào <strong>${fullName}</strong>,</p>
        <p style="color:#374151;font-size:15px;">Mã xác nhận đăng ký tài khoản của bạn là:</p>
        <div style="text-align:center;margin:24px 0;">
          <span style="display:inline-block;font-size:40px;font-weight:700;letter-spacing:12px;color:#e11d48;background:#fff1f2;padding:16px 28px;border-radius:10px;border:2px dashed #fda4af;">
            ${otp}
          </span>
        </div>
        <p style="color:#6b7280;font-size:13px;">Mã có hiệu lực trong <strong>5 phút</strong>. Vui lòng không chia sẻ mã này với bất kỳ ai.</p>
        <hr style="border:none;border-top:1px solid #f3f4f6;margin:20px 0;" />
        <p style="color:#9ca3af;font-size:12px;text-align:center;">Nếu bạn không thực hiện yêu cầu này, hãy bỏ qua email này.</p>
      </div>
    `,
  });
}

module.exports = { sendOtpEmail };

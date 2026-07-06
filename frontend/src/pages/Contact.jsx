import { useState } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/contact', form);
      toast.success('Tin nhắn đã được gửi! Chúng tôi sẽ liên hệ sớm.');
      setSent(true);
    } catch {
      toast.error('Gửi thất bại, vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const info = [
    { icon: '📍', label: 'Địa chỉ', value: '123 Đường ABC, Quận 1, TP.HCM' },
    { icon: '📞', label: 'Điện thoại', value: '0901 234 567' },
    { icon: '✉️', label: 'Email', value: 'hello@yarnshop.vn' },
    { icon: '🕐', label: 'Giờ làm việc', value: '8:00 – 20:00, Thứ 2 – Chủ nhật' },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <h1 className="text-2xl sm:text-3xl font-bold text-rose-600 mb-2">Liên Hệ Với Chúng Tôi</h1>
      <p className="text-gray-500 mb-10">Chúng tôi luôn sẵn sàng hỗ trợ bạn</p>
      <div className="grid md:grid-cols-2 gap-10">
        <div>
          <h2 className="text-xl font-semibold text-gray-800 mb-6">Thông Tin Liên Hệ</h2>
          <div className="space-y-5">
            {info.map(i => (
              <div key={i.label} className="flex items-start gap-4">
                <span className="text-2xl">{i.icon}</span>
                <div>
                  <p className="text-sm text-gray-500">{i.label}</p>
                  <p className="font-medium text-gray-800">{i.value}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-8">
            <h3 className="font-semibold text-gray-800 mb-3">Mạng xã hội</h3>
            <div className="flex gap-3">
              {['Facebook', 'Instagram', 'Zalo', 'TikTok'].map(s => (
                <span key={s} className="bg-rose-100 text-rose-700 px-3 py-1 rounded-full text-sm font-medium min-h-[44px] flex items-center justify-center">{s}</span>
              ))}
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow p-6">
          {sent ? (
            <div className="text-center py-10">
              <div className="text-5xl mb-4">✅</div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Đã gửi thành công!</h3>
              <p className="text-gray-600 mb-4">Chúng tôi sẽ phản hồi trong vòng 24 giờ.</p>
              <button onClick={() => { setSent(false); setForm({ name: '', email: '', phone: '', subject: '', message: '' }); }} className="text-rose-500 font-medium hover:underline">Gửi tin nhắn khác</button>
            </div>
          ) : (
            <>
              <h2 className="text-xl font-semibold text-gray-800 mb-6">Gửi Tin Nhắn</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 xs:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Họ tên *</label>
                    <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-base focus:ring-rose-300 focus:outline-none focus:ring-2" />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Điện thoại</label>
                    <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-base focus:ring-rose-300 focus:outline-none focus:ring-2" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Email *</label>
                  <input type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-base focus:ring-rose-300 focus:outline-none focus:ring-2" />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Tiêu đề</label>
                  <input value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-base focus:ring-rose-300 focus:outline-none focus:ring-2" />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Nội dung *</label>
                  <textarea required rows={5} value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-base focus:ring-rose-300 focus:outline-none focus:ring-2 resize-none" />
                </div>
                <button type="submit" disabled={loading} className="w-full bg-rose-500 text-white py-3 rounded-lg font-semibold hover:bg-rose-600 active:scale-95 transition-all disabled:opacity-50">
                  {loading ? 'Đang gửi...' : 'Gửi Tin Nhắn'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import { FiUpload, FiX } from 'react-icons/fi';

const YARN_COLORS = ['White', 'Cream', 'Pink', 'Rose', 'Red', 'Orange', 'Yellow', 'Green', 'Mint', 'Teal', 'Blue', 'Navy', 'Purple', 'Lavender', 'Brown', 'Beige', 'Gray', 'Black', 'Multicolor'];

const CustomOrder = () => {
  const { user, isRole } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [form, setForm] = useState({ description: '', yarnColor: '', size: '' });

  const handleImages = (e) => {
    const files = Array.from(e.target.files).slice(0, 5);
    setImages(files);
    const urls = files.map(f => URL.createObjectURL(f));
    setPreviews(urls);
  };

  const removeImage = (i) => {
    setImages(imgs => imgs.filter((_, idx) => idx !== i));
    setPreviews(ps => ps.filter((_, idx) => idx !== i));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return toast.error('Vui lòng đăng nhập trước');
    if (!isRole('customer')) return toast.error('Chỉ khách hàng mới có thể gửi đơn đặt hàng theo yêu cầu');
    setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      images.forEach(f => fd.append('images', f));
      await api.post('/custom-orders', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Đơn đặt hàng đã được gửi! Chúng tôi sẽ liên hệ sớm.');
      navigate('/custom-orders/my');
    } finally { setLoading(false); }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <div className="text-5xl mb-3">✨</div>
        <h1>Đặt Hàng Thủ Công Theo Yêu Cầu</h1>
        <p className="text-gray-500 mt-2">Hãy cho chúng tôi biết ý tưởng của bạn, chúng tôi sẽ hiện thực hóa nó!</p>
      </div>

      {!user ? (
        <div className="card text-center py-8">
          <p className="text-gray-600 mb-4">Vui lòng đăng nhập để gửi đơn đặt hàng theo yêu cầu</p>
          <Link to="/login" className="btn-primary">Đăng nhập</Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="card space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Hình ảnh tham khảo (tối đa 5)</label>
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-primary transition-colors">
              <input type="file" accept="image/*" multiple onChange={handleImages} className="hidden" id="img-upload" />
              <label htmlFor="img-upload" className="cursor-pointer">
                <FiUpload size={28} className="mx-auto text-gray-400 mb-2" />
                <p className="text-sm text-gray-500">Nhấp để tải lên hình ảnh tham khảo</p>
                <p className="text-xs text-gray-400 mt-1">PNG, JPG tối đa 5MB mỗi file</p>
              </label>
            </div>
            {previews.length > 0 && (
              <div className="flex gap-2 flex-wrap mt-3">
                {previews.map((url, i) => (
                  <div key={i} className="relative">
                    <img src={url} alt="" className="w-20 h-20 object-cover rounded-lg" />
                    <button type="button" onClick={() => removeImage(i)} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5">
                      <FiX size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả *</label>
            <textarea
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              required rows={4} placeholder="Mô tả sản phẩm bạn muốn: loại thú, kích cỡ, phụ kiện, tính năng đặc biệt..."
              className="input text-base"
            />
          </div>

          <div className="grid grid-cols-1 xs:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Màu len</label>
              <select value={form.yarnColor} onChange={e => setForm(f => ({ ...f, yarnColor: e.target.value }))} className="input text-base">
                <option value="">Chọn màu...</option>
                {YARN_COLORS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Kích cỡ / Kích thước</label>
              <input
                value={form.size}
                onChange={e => setForm(f => ({ ...f, size: e.target.value }))}
                placeholder="Vd: cao 20cm, nhỏ, vừa..."
                className="input text-base"
              />
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
            Cách thức: Sau khi gửi, đội ngũ của chúng tôi sẽ xem xét yêu cầu và báo giá trong vòng 1-2 ngày làm việc. Bạn sẽ cần thanh toán 50% đặt cọc để bắt đầu sản xuất.
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full xs:w-auto py-3 active:scale-95 transition-all">
            {loading ? 'Đang gửi...' : 'Gửi Đơn Đặt Hàng'}
          </button>
        </form>
      )}

      {user && (
        <p className="text-center text-sm text-gray-500 mt-4">
          <Link to="/custom-orders/my" className="text-primary hover:underline">Xem đơn đặt hàng của tôi →</Link>
        </p>
      )}
    </div>
  );
};

export default CustomOrder;

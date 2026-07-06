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
    if (!user) return toast.error('Please login first');
    if (!isRole('customer')) return toast.error('Only customers can submit custom orders');
    setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      images.forEach(f => fd.append('images', f));
      const res = await api.post('/custom-orders', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Custom order submitted! We will contact you soon.');
      navigate('/custom-orders/my');
    } finally { setLoading(false); }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <div className="text-5xl mb-3">✨</div>
        <h1>Custom Knit/Crochet Order</h1>
        <p className="text-gray-500 mt-2">Tell us your vision and we'll bring it to life!</p>
      </div>

      {!user ? (
        <div className="card text-center py-8">
          <p className="text-gray-600 mb-4">Please login to submit a custom order</p>
          <Link to="/login" className="btn-primary">Login</Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="card space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Reference Images (up to 5)</label>
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-primary transition-colors">
              <input type="file" accept="image/*" multiple onChange={handleImages} className="hidden" id="img-upload" />
              <label htmlFor="img-upload" className="cursor-pointer">
                <FiUpload size={28} className="mx-auto text-gray-400 mb-2" />
                <p className="text-sm text-gray-500">Click to upload reference images</p>
                <p className="text-xs text-gray-400 mt-1">PNG, JPG up to 5MB each</p>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
            <textarea
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              required rows={4} placeholder="Describe what you want: animal type, size, accessories, special features..."
              className="input text-base"
            />
          </div>

          <div className="grid grid-cols-1 xs:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Yarn Color</label>
              <select value={form.yarnColor} onChange={e => setForm(f => ({ ...f, yarnColor: e.target.value }))} className="input text-base">
                <option value="">Select color...</option>
                {YARN_COLORS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Size / Dimensions</label>
              <input
                value={form.size}
                onChange={e => setForm(f => ({ ...f, size: e.target.value }))}
                placeholder="e.g. 20cm tall, small, medium..."
                className="input text-base"
              />
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
            <strong>How it works:</strong> After submitting, our team will review your request and provide a price quote within 1-2 business days. You'll need to pay a 50% deposit to start production.
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full xs:w-auto py-3 active:scale-95 transition-all">
            {loading ? 'Submitting...' : 'Submit Custom Order'}
          </button>
        </form>
      )}

      {user && (
        <p className="text-center text-sm text-gray-500 mt-4">
          <Link to="/custom-orders/my" className="text-primary hover:underline">View my custom orders →</Link>
        </p>
      )}
    </div>
  );
};

export default CustomOrder;

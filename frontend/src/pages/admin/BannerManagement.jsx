import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const positions = { home_hero: 'Hero Banner', home_banner: 'Banner Trang Chủ', popup: 'Popup', sidebar: 'Thanh Bên' };

export default function BannerManagement() {
  const [banners, setBanners] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ title: '', subtitle: '', imageUrl: '', linkUrl: '', position: 'home_banner', isActive: true, sortOrder: 0, startDate: '', endDate: '' });
  const [imageFile, setImageFile] = useState(null);
  const [filter, setFilter] = useState({ position: '', isActive: '' });

  const load = () => api.get('/banners', { params: filter }).then(r => setBanners(r.data));
  useEffect(() => { load(); }, [filter]);

  const openAdd = () => { setEditing(null); setForm({ title: '', subtitle: '', imageUrl: '', linkUrl: '', position: 'home_banner', isActive: true, sortOrder: 0, startDate: '', endDate: '' }); setImageFile(null); setShowForm(true); };
  const openEdit = (b) => { setEditing(b.id); setForm({ title: b.title, subtitle: b.subtitle || '', imageUrl: b.imageUrl, linkUrl: b.linkUrl || '', position: b.position, isActive: b.isActive, sortOrder: b.sortOrder, startDate: b.startDate ? b.startDate.slice(0, 10) : '', endDate: b.endDate ? b.endDate.slice(0, 10) : '' }); setImageFile(null); setShowForm(true); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, v));
    if (imageFile) fd.append('image', imageFile);
    try {
      if (editing) await api.put(`/banners/${editing}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      else await api.post('/banners', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success(editing ? 'Đã cập nhật banner' : 'Đã thêm banner');
      setShowForm(false); load();
    } catch (err) { toast.error(err.response?.data?.message || 'Lỗi'); }
  };

  const toggleActive = async (b) => {
    await api.put(`/banners/${b.id}`, { isActive: !b.isActive });
    toast.success(b.isActive ? 'Đã ẩn banner' : 'Đã hiện banner');
    load();
  };

  const del = async (id) => {
    if (!window.confirm('Xóa banner này?')) return;
    await api.delete(`/banners/${id}`);
    toast.success('Đã xóa'); load();
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Quản Lý Banner</h1>
        <button onClick={openAdd} className="bg-rose-500 text-white px-4 py-2 rounded-lg hover:bg-rose-600 font-medium">+ Thêm Banner</button>
      </div>

      <div className="flex gap-4 mb-6">
        <select value={filter.position} onChange={e => setFilter({ ...filter, position: e.target.value })} className="border rounded-lg px-3 py-2 text-sm">
          <option value="">Tất cả vị trí</option>
          {Object.entries(positions).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select value={filter.isActive} onChange={e => setFilter({ ...filter, isActive: e.target.value })} className="border rounded-lg px-3 py-2 text-sm">
          <option value="">Tất cả trạng thái</option>
          <option value="true">Đang hiện</option>
          <option value="false">Đã ẩn</option>
        </select>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {banners.map(b => (
          <div key={b.id} className={`bg-white rounded-xl shadow overflow-hidden ${!b.isActive ? 'opacity-50' : ''}`}>
            <div className="h-40 bg-gray-100 relative">
              <img src={b.imageUrl} alt={b.title} className="w-full h-full object-cover" onError={e => { e.target.src = 'https://placehold.co/400x160?text=Banner'; }} />
              <span className="absolute top-2 left-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded">{positions[b.position]}</span>
              <span className={`absolute top-2 right-2 text-xs px-2 py-0.5 rounded ${b.isActive ? 'bg-green-500 text-white' : 'bg-gray-500 text-white'}`}>{b.isActive ? 'Hiện' : 'Ẩn'}</span>
            </div>
            <div className="p-4">
              <h3 className="font-semibold text-gray-800 truncate">{b.title}</h3>
              {b.subtitle && <p className="text-sm text-gray-500 truncate">{b.subtitle}</p>}
              <p className="text-xs text-gray-400 mt-1">Thứ tự: {b.sortOrder}</p>
              <div className="flex gap-2 mt-3">
                <button onClick={() => openEdit(b)} className="flex-1 border text-sm py-1.5 rounded-lg hover:bg-gray-50">Sửa</button>
                <button onClick={() => toggleActive(b)} className={`flex-1 text-sm py-1.5 rounded-lg ${b.isActive ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}>{b.isActive ? 'Ẩn' : 'Hiện'}</button>
                <button onClick={() => del(b.id)} className="flex-1 bg-red-100 text-red-600 text-sm py-1.5 rounded-lg hover:bg-red-200">Xóa</button>
              </div>
            </div>
          </div>
        ))}
        {banners.length === 0 && <div className="col-span-3 text-center py-16 text-gray-400 bg-white rounded-xl">Chưa có banner nào</div>}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-5">{editing ? 'Sửa Banner' : 'Thêm Banner Mới'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm text-gray-600 block mb-1">Tiêu đề *</label>
                <input required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-sm text-gray-600 block mb-1">Phụ đề</label>
                <input value={form.subtitle} onChange={e => setForm({ ...form, subtitle: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-sm text-gray-600 block mb-1">Hình ảnh</label>
                <input type="file" accept="image/*" onChange={e => setImageFile(e.target.files[0])} className="w-full text-sm mb-1" />
                {form.imageUrl && !imageFile && <img src={form.imageUrl} className="h-20 rounded mt-1 object-cover" />}
              </div>
              <div>
                <label className="text-sm text-gray-600 block mb-1">Link URL</label>
                <input value={form.linkUrl} onChange={e => setForm({ ...form, linkUrl: e.target.value })} placeholder="/san-pham" className="w-full border rounded-lg px-3 py-2 text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-600 block mb-1">Vị trí</label>
                  <select value={form.position} onChange={e => setForm({ ...form, position: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm">
                    {Object.entries(positions).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm text-gray-600 block mb-1">Thứ tự</label>
                  <input type="number" value={form.sortOrder} onChange={e => setForm({ ...form, sortOrder: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-600 block mb-1">Ngày bắt đầu</label>
                  <input type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="text-sm text-gray-600 block mb-1">Ngày kết thúc</label>
                  <input type="date" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" />
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked })} className="accent-rose-500" />
                <span className="text-sm text-gray-700">Hiển thị banner</span>
              </label>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 border py-2 rounded-lg hover:bg-gray-50">Huỷ</button>
                <button type="submit" className="flex-1 bg-rose-500 text-white py-2 rounded-lg hover:bg-rose-600 font-medium">Lưu</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

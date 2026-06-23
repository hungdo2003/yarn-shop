import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const typeOptions = [
  { value: 'raw_material', label: 'Len/Sợi' },
  { value: 'accessory', label: 'Phụ kiện' },
  { value: 'finished_product', label: 'Sản phẩm hoàn thiện' },
];

const empty = { name: '', type: 'raw_material', description: '', parentId: '', isActive: true };

export default function CategoryManagement() {
  const [cats, setCats] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);
  const [filter, setFilter] = useState({ type: '' });

  const load = () => api.get('/categories', { params: filter }).then(r => setCats(Array.isArray(r.data) ? r.data : r.data.data || []));
  useEffect(() => { load(); }, [filter]);

  const openAdd = () => { setEditing(null); setForm(empty); setShowForm(true); };
  const openEdit = (c) => { setEditing(c.id); setForm({ name: c.name, type: c.type, description: c.description || '', parentId: c.parentId || '', isActive: c.isActive }); setShowForm(true); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...form, parentId: form.parentId || null };
      if (editing) await api.put(`/categories/${editing}`, payload);
      else await api.post('/categories', payload);
      toast.success(editing ? 'Đã cập nhật danh mục' : 'Đã thêm danh mục');
      setShowForm(false); load();
    } catch (err) { toast.error(err.response?.data?.message || 'Lỗi'); }
  };

  const del = async (id) => {
    if (!window.confirm('Xóa danh mục này?')) return;
    try { await api.delete(`/categories/${id}`); toast.success('Đã xóa'); load(); }
    catch (err) { toast.error(err.response?.data?.message || 'Lỗi'); }
  };

  const typeBg = { raw_material: 'bg-blue-100 text-blue-700', accessory: 'bg-purple-100 text-purple-700', finished_product: 'bg-green-100 text-green-700' };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Quản Lý Danh Mục</h1>
        <button onClick={openAdd} className="bg-rose-500 text-white px-4 py-2 rounded-lg hover:bg-rose-600 font-medium">+ Thêm Danh Mục</button>
      </div>

      <div className="bg-white rounded-xl shadow p-4 mb-4">
        <div className="flex gap-3">
          <select value={filter.type} onChange={e => setFilter({ ...filter, type: e.target.value })} className="border rounded-lg px-3 py-2 text-sm">
            <option value="">Tất cả loại</option>
            {typeOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              {['ID', 'Tên danh mục', 'Loại', 'Danh mục cha', 'Sản phẩm', 'Trạng thái', 'Hành động'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs text-gray-500 font-semibold uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {cats.map(c => (
              <tr key={c.id} className="border-t hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-400 text-xs">#{c.id}</td>
                <td className="px-4 py-3 font-medium text-gray-800">{c.name}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${typeBg[c.type]}`}>
                    {typeOptions.find(t => t.value === c.type)?.label}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500 text-xs">{c.parent?.name || '–'}</td>
                <td className="px-4 py-3 text-gray-600">{c.Products?.length || 0}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${c.isActive !== false ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{c.isActive !== false ? 'Hoạt động' : 'Ẩn'}</span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button onClick={() => openEdit(c)} className="text-blue-600 hover:underline text-xs">Sửa</button>
                    <button onClick={() => del(c.id)} className="text-red-500 hover:underline text-xs">Xóa</button>
                  </div>
                </td>
              </tr>
            ))}
            {cats.length === 0 && <tr><td colSpan={7} className="text-center py-12 text-gray-400">Không có danh mục</td></tr>}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-5">{editing ? 'Sửa Danh Mục' : 'Thêm Danh Mục Mới'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm text-gray-600 block mb-1">Tên danh mục *</label>
                <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-sm text-gray-600 block mb-1">Loại *</label>
                <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm">
                  {typeOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm text-gray-600 block mb-1">Danh mục cha</label>
                <select value={form.parentId} onChange={e => setForm({ ...form, parentId: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm">
                  <option value="">– Không có –</option>
                  {cats.filter(c => c.id !== editing).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm text-gray-600 block mb-1">Mô tả</label>
                <textarea rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm resize-none" />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked })} className="accent-rose-500" />
                <span className="text-sm">Hiển thị</span>
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

import { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';

const empty = { fullName: '', phone: '', address: '', province: '', district: '', ward: '', isDefault: false };

export default function Addresses() {
  const [addresses, setAddresses] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);
  const [loading, setLoading] = useState(true);

  const load = () => api.get('/addresses').then(r => setAddresses(r.data)).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const openAdd = () => { setEditing(null); setForm(empty); setShowForm(true); };
  const openEdit = (a) => { setEditing(a.id); setForm({ fullName: a.fullName, phone: a.phone, address: a.address, province: a.province || '', district: a.district || '', ward: a.ward || '', isDefault: a.isDefault }); setShowForm(true); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) await api.put(`/addresses/${editing}`, form);
      else await api.post('/addresses', form);
      toast.success(editing ? 'Đã cập nhật địa chỉ' : 'Đã thêm địa chỉ');
      setShowForm(false);
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Lỗi'); }
  };

  const setDefault = async (id) => {
    await api.patch(`/addresses/${id}/default`);
    toast.success('Đã đặt làm địa chỉ mặc định');
    load();
  };

  const del = async (id) => {
    if (!window.confirm('Xóa địa chỉ này?')) return;
    await api.delete(`/addresses/${id}`);
    toast.success('Đã xóa'); load();
  };

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Địa Chỉ Giao Hàng</h1>
        <button onClick={openAdd} className="bg-rose-500 text-white px-4 py-2 rounded-lg hover:bg-rose-600 text-sm font-medium">+ Thêm địa chỉ</button>
      </div>

      {loading ? <div className="text-center py-12 text-gray-400">Đang tải...</div> : addresses.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl shadow text-gray-400">
          <p className="text-5xl mb-4">📍</p>
          <p>Bạn chưa có địa chỉ nào</p>
          <button onClick={openAdd} className="mt-4 text-rose-500 font-medium hover:underline">Thêm địa chỉ đầu tiên</button>
        </div>
      ) : (
        <div className="space-y-4">
          {addresses.map(a => (
            <div key={a.id} className={`bg-white rounded-xl shadow p-5 border-2 ${a.isDefault ? 'border-rose-400' : 'border-transparent'}`}>
              <div className="flex items-start justify-between">
                <div>
                  {a.isDefault && <span className="bg-rose-100 text-rose-600 text-xs font-semibold px-2 py-0.5 rounded-full mb-2 inline-block">Mặc định</span>}
                  <p className="font-semibold text-gray-800">{a.fullName}</p>
                  <p className="text-sm text-gray-500">{a.phone}</p>
                  <p className="text-sm text-gray-600 mt-1">{[a.address, a.ward, a.district, a.province].filter(Boolean).join(', ')}</p>
                </div>
                <div className="flex flex-wrap gap-2 shrink-0 ml-4">
                  {!a.isDefault && <button onClick={() => setDefault(a.id)} className="text-xs text-gray-500 border rounded px-2 py-1 hover:bg-gray-50">Đặt mặc định</button>}
                  <button onClick={() => openEdit(a)} className="text-xs text-blue-600 border border-blue-200 rounded px-2 py-1 hover:bg-blue-50">Sửa</button>
                  <button onClick={() => del(a.id)} className="text-xs text-red-500 border border-red-200 rounded px-2 py-1 hover:bg-red-50">Xóa</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-5">{editing ? 'Sửa địa chỉ' : 'Thêm địa chỉ mới'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 xs:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-600 block mb-1">Họ tên *</label>
                  <input required value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-base" />
                </div>
                <div>
                  <label className="text-sm text-gray-600 block mb-1">Điện thoại *</label>
                  <input required value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-base" />
                </div>
              </div>
              <div>
                <label className="text-sm text-gray-600 block mb-1">Địa chỉ *</label>
                <input required value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} placeholder="Số nhà, tên đường..." className="w-full border rounded-lg px-3 py-2 text-base" />
              </div>
              <div className="grid grid-cols-1 xs:grid-cols-3 gap-3">
                <div>
                  <label className="text-sm text-gray-600 block mb-1">Tỉnh/TP</label>
                  <input value={form.province} onChange={e => setForm({ ...form, province: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-base" />
                </div>
                <div>
                  <label className="text-sm text-gray-600 block mb-1">Quận/Huyện</label>
                  <input value={form.district} onChange={e => setForm({ ...form, district: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-base" />
                </div>
                <div>
                  <label className="text-sm text-gray-600 block mb-1">Phường/Xã</label>
                  <input value={form.ward} onChange={e => setForm({ ...form, ward: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-base" />
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.isDefault} onChange={e => setForm({ ...form, isDefault: e.target.checked })} className="accent-rose-500" />
                <span className="text-sm text-gray-700">Đặt làm địa chỉ mặc định</span>
              </label>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 border py-2 rounded-lg text-gray-700 hover:bg-gray-50">Huỷ</button>
                <button type="submit" className="flex-1 bg-rose-500 text-white py-2 rounded-lg hover:bg-rose-600 font-medium">Lưu</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

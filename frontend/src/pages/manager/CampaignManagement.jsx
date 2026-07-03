import { useState } from 'react';
import useFetch from '../../hooks/useFetch';
import api from '../../services/api';
import { formatDate } from '../../utils/formatters';
import toast from 'react-hot-toast';
import { FiPlus, FiEdit2, FiTrash2, FiExternalLink } from 'react-icons/fi';

const THEMES = [
  { value: 'rose',   label: '🌹 Hồng (mặc định)' },
  { value: 'tet',    label: '🧧 Tết Nguyên Đán (Đỏ-Vàng)' },
  { value: 'noel',   label: '🎄 Noel (Xanh-Đỏ)' },
  { value: 'violet', label: '💜 8.8 / 11.11 (Tím-Hồng)' },
  { value: 'blue',   label: '💙 Summer Sale (Xanh dương)' },
  { value: 'amber',  label: '🌟 Black Friday (Vàng)' },
];

const EMPTY_FORM = {
  name: '', slug: '', description: '', theme: 'rose', emoji: '🎉',
  bannerImage: '', startDate: '', endDate: '', isActive: true,
  productIds: [], voucherIds: [],
};

function slugify(s) {
  return s.toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd').replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-').replace(/-+/g, '-').trim();
}

const CampaignModal = ({ campaign, onClose, onSave }) => {
  const isEdit = !!campaign?.id;
  const [form, setForm] = useState(isEdit ? {
    ...campaign,
    startDate: campaign.startDate?.slice(0, 16) || '',
    endDate:   campaign.endDate?.slice(0, 16)   || '',
    productIds: (campaign.products || []).map(p => p.id),
    voucherIds: (campaign.vouchers || []).map(v => v.id),
  } : EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [pidInput, setPidInput] = useState('');
  const [vidInput, setVidInput] = useState('');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleNameChange = (e) => {
    set('name', e.target.value);
    if (!isEdit) set('slug', slugify(e.target.value));
  };

  const addProduct = () => {
    const id = parseInt(pidInput);
    if (!id) return;
    if (!form.productIds.includes(id)) set('productIds', [...form.productIds, id]);
    setPidInput('');
  };

  const addVoucher = () => {
    const id = parseInt(vidInput);
    if (!id) return;
    if (!form.voucherIds.includes(id)) set('voucherIds', [...form.voucherIds, id]);
    setVidInput('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.slug || !form.startDate || !form.endDate) {
      toast.error('Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }
    setLoading(true);
    try {
      if (isEdit) await api.put(`/campaigns/${campaign.id}`, form);
      else await api.post('/campaigns', form);
      toast.success(isEdit ? 'Cập nhật campaign thành công' : 'Tạo campaign thành công');
      onSave();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi');
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-2xl p-6 my-4">
        <h3 className="font-bold text-lg mb-5">{isEdit ? 'Chỉnh sửa Campaign' : 'Tạo Campaign mới'}</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium mb-1">Tên campaign *</label>
              <input value={form.name} onChange={handleNameChange} required className="input" placeholder="VD: Tết Nguyên Đán 2026" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Slug (URL) *</label>
              <input value={form.slug} onChange={e => set('slug', e.target.value)} required className="input font-mono text-sm" placeholder="tet-nguyen-dan-2026" />
              <p className="text-xs text-gray-400 mt-0.5">/campaigns/{form.slug || '...'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Emoji</label>
              <input value={form.emoji} onChange={e => set('emoji', e.target.value)} className="input" placeholder="🎉" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Giao diện (theme)</label>
              <select value={form.theme} onChange={e => set('theme', e.target.value)} className="input">
                {THEMES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium mb-1">Ảnh banner (URL)</label>
              <input value={form.bannerImage} onChange={e => set('bannerImage', e.target.value)} className="input" placeholder="https://..." />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium mb-1">Mô tả</label>
              <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={2} className="input resize-none" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Ngày bắt đầu *</label>
              <input type="datetime-local" value={form.startDate} onChange={e => set('startDate', e.target.value)} required className="input" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Ngày kết thúc *</label>
              <input type="datetime-local" value={form.endDate} onChange={e => set('endDate', e.target.value)} required className="input" />
            </div>
          </div>

          {/* Products */}
          <div>
            <label className="block text-sm font-medium mb-1">ID Sản phẩm</label>
            <div className="flex gap-2">
              <input type="number" value={pidInput} onChange={e => setPidInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addProduct())}
                placeholder="Nhập ID sản phẩm..." className="input flex-1" />
              <button type="button" onClick={addProduct} className="btn-secondary px-4">Thêm</button>
            </div>
            {form.productIds.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {form.productIds.map(id => (
                  <span key={id} className="flex items-center gap-1 bg-rose-100 text-rose-700 px-2 py-1 rounded-lg text-xs font-medium">
                    SP #{id}
                    <button type="button" onClick={() => set('productIds', form.productIds.filter(x => x !== id))} className="hover:text-rose-900">×</button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Vouchers */}
          <div>
            <label className="block text-sm font-medium mb-1">ID Voucher</label>
            <div className="flex gap-2">
              <input type="number" value={vidInput} onChange={e => setVidInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addVoucher())}
                placeholder="Nhập ID voucher..." className="input flex-1" />
              <button type="button" onClick={addVoucher} className="btn-secondary px-4">Thêm</button>
            </div>
            {form.voucherIds.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {form.voucherIds.map(id => (
                  <span key={id} className="flex items-center gap-1 bg-purple-100 text-purple-700 px-2 py-1 rounded-lg text-xs font-medium">
                    Voucher #{id}
                    <button type="button" onClick={() => set('voucherIds', form.voucherIds.filter(x => x !== id))} className="hover:text-purple-900">×</button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.isActive} onChange={e => set('isActive', e.target.checked)} className="accent-primary" />
            Kích hoạt campaign
          </label>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Hủy</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1">{loading ? 'Đang lưu...' : 'Lưu'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const THEME_COLORS = {
  rose: 'bg-rose-100 text-rose-700',
  tet: 'bg-red-100 text-red-700',
  noel: 'bg-green-100 text-green-700',
  violet: 'bg-violet-100 text-violet-700',
  blue: 'bg-blue-100 text-blue-700',
  amber: 'bg-amber-100 text-amber-700',
};

export default function CampaignManagement() {
  const [modal, setModal] = useState(null);
  const { data: campaigns, loading, refetch } = useFetch('/campaigns');

  const openEdit = async (c) => {
    try {
      const r = await api.get(`/campaigns/${c.id}`);
      setModal(r.data);
    } catch { toast.error('Không tải được chi tiết campaign'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Xóa campaign này?')) return;
    await api.delete(`/campaigns/${id}`);
    toast.success('Đã xóa');
    refetch();
  };

  const now = new Date();
  const getStatus = (c) => {
    if (!c.isActive) return { label: 'Tắt', cls: 'bg-gray-100 text-gray-500' };
    if (new Date(c.endDate) < now) return { label: 'Kết thúc', cls: 'bg-gray-100 text-gray-500' };
    if (new Date(c.startDate) > now) return { label: 'Sắp diễn ra', cls: 'bg-blue-100 text-blue-700' };
    return { label: '🔴 Đang chạy', cls: 'bg-green-100 text-green-700' };
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Quản lý Campaign</h1>
          <p className="text-sm text-gray-400 mt-0.5">Tạo và quản lý các chiến dịch bán hàng theo sự kiện</p>
        </div>
        <button onClick={() => setModal({})} className="btn-primary flex items-center gap-2">
          <FiPlus size={16} /> Tạo Campaign
        </button>
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-400">Đang tải...</div>
      ) : !campaigns?.length ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-200">
          <p className="text-4xl mb-3">🎉</p>
          <p className="text-gray-500 font-medium">Chưa có campaign nào</p>
          <p className="text-sm text-gray-400 mt-1">Tạo campaign đầu tiên cho dịp Tết, Noel, 8.8...</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {campaigns.map(c => {
            const status = getStatus(c);
            const themeColor = THEME_COLORS[c.theme] || THEME_COLORS.rose;
            return (
              <div key={c.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-5">
                <div className="text-4xl w-14 h-14 bg-gray-50 rounded-xl flex items-center justify-center shrink-0">{c.emoji}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="font-bold text-gray-800">{c.name}</h3>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${status.cls}`}>{status.label}</span>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${themeColor}`}>{c.theme}</span>
                  </div>
                  <p className="text-sm text-gray-400 font-mono">/campaigns/{c.slug}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(c.startDate).toLocaleDateString('vi-VN')} → {new Date(c.endDate).toLocaleDateString('vi-VN')}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <a href={`/campaigns/${c.slug}`} target="_blank" rel="noreferrer"
                    className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition" title="Xem trang">
                    <FiExternalLink size={16} />
                  </a>
                  <button onClick={() => openEdit(c)} className="p-2 text-gray-500 hover:bg-gray-50 rounded-lg transition">
                    <FiEdit2 size={16} />
                  </button>
                  <button onClick={() => handleDelete(c.id)} className="p-2 text-red-400 hover:bg-red-50 rounded-lg transition">
                    <FiTrash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {modal !== null && (
        <CampaignModal
          campaign={modal?.id ? modal : null}
          onClose={() => setModal(null)}
          onSave={() => { setModal(null); refetch(); }}
        />
      )}
    </div>
  );
}

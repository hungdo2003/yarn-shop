import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const PAGES = [
  { key: 'policies', label: 'Chính Sách Chung' },
  { key: 'shipping_policy', label: 'Chính Sách Giao Hàng' },
  { key: 'return_policy', label: 'Chính Sách Đổi Trả' },
  { key: 'privacy_policy', label: 'Chính Sách Bảo Mật' },
  { key: 'how_to_buy', label: 'Hướng Dẫn Mua Hàng' },
  { key: 'contact_info', label: 'Thông Tin Liên Hệ' },
  { key: 'about_us', label: 'Giới Thiệu' },
];

export default function ContentManagement() {
  const [active, setActive] = useState('policies');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setLoading(true);
    api.get(`/content/${active}`).then(r => { setTitle(r.data.title); setContent(r.data.content); }).catch(() => {}).finally(() => setLoading(false));
  }, [active]);

  const save = async () => {
    setSaving(true);
    try {
      await api.put(`/content/${active}`, { title, content });
      toast.success('Đã lưu nội dung');
    } catch { toast.error('Lỗi lưu nội dung'); }
    setSaving(false);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Quản Lý Nội Dung Website</h1>
      {/* Mobile page selector */}
      <div className="md:hidden mb-4">
        <select value={active} onChange={e => setActive(e.target.value)}
          className="w-full border rounded-lg px-3 py-2 text-base bg-white shadow-sm">
          {PAGES.map(p => <option key={p.key} value={p.key}>{p.label}</option>)}
        </select>
      </div>

      <div className="md:flex md:gap-6 md:min-h-[600px]">
        <aside className="hidden md:block w-56 shrink-0">
          <nav className="bg-white rounded-xl shadow p-3 space-y-1">
            {PAGES.map(p => (
              <button key={p.key} onClick={() => setActive(p.key)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition ${active === p.key ? 'bg-rose-100 text-rose-700' : 'hover:bg-gray-100 text-gray-600'}`}>
                {p.label}
              </button>
            ))}
          </nav>
        </aside>

        <main className="flex-1 bg-white rounded-xl shadow p-4 xs:p-6 md:p-8">
          {loading ? <div className="text-center py-16 text-gray-400">Đang tải...</div> : (
            <>
              <div className="mb-4">
                <label className="text-sm text-gray-600 block mb-1">Tiêu đề trang</label>
                <input value={title} onChange={e => setTitle(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-base font-medium" />
              </div>
              <div className="mb-4">
                <label className="text-sm text-gray-600 block mb-1">Nội dung (HTML)</label>
                <textarea value={content} onChange={e => setContent(e.target.value)} rows={18} className="w-full border rounded-lg px-3 py-2 text-base font-mono resize-y" placeholder="<h2>Tiêu đề</h2><p>Nội dung...</p>" />
              </div>
              <div className="flex items-center gap-4">
                <button onClick={save} disabled={saving} className="bg-rose-500 text-white px-6 py-2 rounded-lg hover:bg-rose-600 font-medium disabled:opacity-50">{saving ? 'Đang lưu...' : 'Lưu nội dung'}</button>
                <span className="text-sm text-gray-400">* Nội dung hỗ trợ HTML cơ bản</span>
              </div>
              <div className="mt-6 border-t pt-4">
                <p className="text-sm text-gray-500 mb-3">Xem trước nội dung:</p>
                <div className="prose max-w-none border rounded-lg p-4 bg-gray-50 min-h-32" dangerouslySetInnerHTML={{ __html: content }} />
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}

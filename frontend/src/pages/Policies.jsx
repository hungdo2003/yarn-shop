import { useState, useEffect } from 'react';
import api from '../services/api';

const PAGES = [
  { key: 'policies', label: 'Chính Sách' },
  { key: 'shipping_policy', label: 'Chính Sách Giao Hàng' },
  { key: 'return_policy', label: 'Chính Sách Đổi Trả' },
  { key: 'privacy_policy', label: 'Bảo Mật' },
];

export default function Policies() {
  const [active, setActive] = useState('policies');
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    api.get(`/content/${active}`)
      .then(r => setContent(r.data))
      .catch(() => setContent(null))
      .finally(() => setLoading(false));
  }, [active]);

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold text-rose-600 mb-8">Chính Sách Cửa Hàng</h1>
      <div className="flex gap-8">
        <aside className="w-56 shrink-0">
          <nav className="bg-white rounded-xl shadow p-4 space-y-1">
            {PAGES.map(p => (
              <button key={p.key} onClick={() => setActive(p.key)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition ${active === p.key ? 'bg-rose-100 text-rose-700' : 'hover:bg-gray-100 text-gray-700'}`}>
                {p.label}
              </button>
            ))}
          </nav>
        </aside>
        <main className="flex-1 bg-white rounded-xl shadow p-8 min-h-80">
          {loading ? <div className="text-center py-16 text-gray-400">Đang tải...</div>
            : content ? (
              <>
                <h2 className="text-2xl font-bold text-gray-800 mb-6">{content.title}</h2>
                <div className="prose max-w-none text-gray-700 leading-relaxed" dangerouslySetInnerHTML={{ __html: content.content }} />
                <p className="text-xs text-gray-400 mt-8">Cập nhật lần cuối: {new Date(content.updatedAt).toLocaleDateString('vi-VN')}</p>
              </>
            ) : <div className="text-center py-16 text-gray-400">Không tìm thấy nội dung</div>}
        </main>
      </div>
    </div>
  );
}

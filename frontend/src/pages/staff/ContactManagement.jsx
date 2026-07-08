import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { FiMail, FiPhone, FiSearch, FiX, FiEye } from 'react-icons/fi';

const STATUS_COLOR = { new: 'bg-blue-100 text-blue-700', read: 'bg-gray-100 text-gray-600', replied: 'bg-green-100 text-green-700' };

export default function ContactManagement() {
  const STATUS_LABEL = {
    new: 'Mới',
    read: 'Đã đọc',
    replied: 'Đã trả lời',
  };
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selected, setSelected] = useState(null);
  const [replyNote, setReplyNote] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const params = {};
        if (search) params.search = search;
        if (statusFilter) params.status = statusFilter;
        const res = await api.get('/contact', { params });
        setMessages(res.data?.data || res.data || []);
      } catch {
        toast.error('Không thể tải danh sách tin nhắn');
      } finally {
        setLoading(false);
      }
    }, search ? 300 : 0);
    return () => clearTimeout(t);
  }, [search, statusFilter]);

  const openMessage = async (msg) => {
    setSelected(msg);
    setReplyNote(msg.replyNote || '');
    if (msg.status === 'new') {
      try {
        await api.get(`/contact/${msg.id}`);
        setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, status: 'read' } : m));
      } catch {}
    }
  };

  const handleReply = async () => {
    if (!replyNote.trim()) return toast.error('Vui lòng nhập nội dung trả lời');
    setSaving(true);
    try {
      await api.patch(`/contact/${selected.id}/reply`, { replyNote });
      toast.success('Đã lưu phản hồi');
      setMessages(prev => prev.map(m => m.id === selected.id ? { ...m, status: 'replied', replyNote } : m));
      setSelected(prev => ({ ...prev, status: 'replied', replyNote }));
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Lưu thất bại');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Tin Nhắn Liên Hệ</h1>

      {/* Filters */}
      <div className="flex gap-3 mb-5 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Tìm theo tên, email..."
            className="w-full pl-9 pr-4 py-2.5 border rounded-xl text-base focus:ring-2 focus:ring-rose-300 focus:outline-none"
          />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="border rounded-xl px-4 py-2.5 text-base focus:outline-none">
          <option value="">Tất cả trạng thái</option>
          <option value="new">Mới</option>
          <option value="read">Đã đọc</option>
          <option value="replied">Đã trả lời</option>
        </select>
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        {/* Message list */}
        <div className="space-y-2 max-h-[70vh] overflow-y-auto">
          {loading ? (
            <div className="text-center py-10 text-gray-400">Đang tải...</div>
          ) : messages.length === 0 ? (
            <div className="text-center py-10 text-gray-400">Không có tin nhắn</div>
          ) : messages.map(m => (
            <button key={m.id} onClick={() => openMessage(m)}
              className={`w-full text-left p-4 rounded-xl border transition-all ${selected?.id === m.id ? 'border-rose-300 bg-rose-50' : 'bg-white hover:bg-gray-50 border-gray-100'}`}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={`font-semibold text-sm truncate ${m.status === 'new' ? 'text-gray-900' : 'text-gray-600'}`}>{m.name}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 font-medium ${STATUS_COLOR[m.status]}`}>{STATUS_LABEL[m.status]}</span>
                  </div>
                  <p className="text-xs text-gray-500 truncate">{m.email}</p>
                  <p className="text-xs text-gray-600 mt-1 truncate">{m.subject || m.message?.slice(0, 50)}</p>
                </div>
                {m.status === 'new' && <div className="w-2 h-2 rounded-full bg-blue-500 mt-1 shrink-0" />}
              </div>
            </button>
          ))}
        </div>

        {/* Detail panel */}
        {selected ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-bold text-gray-800">{selected.name}</h3>
                <div className="flex items-center gap-3 mt-1">
                  <a href={`mailto:${selected.email}`} className="flex items-center gap-1 text-xs text-blue-600 hover:underline"><FiMail size={11} />{selected.email}</a>
                  {selected.phone && <a href={`tel:${selected.phone}`} className="flex items-center gap-1 text-xs text-green-600 hover:underline"><FiPhone size={11} />{selected.phone}</a>}
                </div>
              </div>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600"><FiX size={18} /></button>
            </div>

            {selected.subject && <p className="text-sm font-semibold text-gray-700 border-b pb-2">{selected.subject}</p>}

            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-sm text-gray-700 leading-relaxed">{selected.message}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Ghi chú / Phản hồi nội bộ</label>
              <textarea
                value={replyNote} onChange={e => setReplyNote(e.target.value)}
                rows={4} placeholder="Nhập nội dung phản hồi..."
                className="w-full border rounded-xl px-4 py-2.5 text-base focus:ring-2 focus:ring-rose-300 focus:outline-none resize-none"
              />
            </div>

            <button onClick={handleReply} disabled={saving} className="bg-rose-500 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-rose-600 disabled:opacity-60 transition">
              {saving ? 'Đang lưu...' : 'Lưu phản hồi & Đánh dấu đã trả lời'}
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-dashed border-gray-200 flex items-center justify-center text-gray-400 min-h-[200px]">
            <div className="text-center">
              <FiEye className="mx-auto mb-2" size={28} />
              <p className="text-sm">Chọn tin nhắn để xem chi tiết</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

import { useState, useEffect, useRef, useCallback } from 'react';
import { FiX, FiSend, FiMinus, FiMessageCircle } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useChat2 } from '../../context/ChatContext';
import api from '../../services/api';

const fmtTime = (d) => d ? new Date(d).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '';

export default function LiveChatWidget({ open, onClose }) {
  const { user, isRole } = useAuth();
  const { convId, setConvId, messages, setMessages, isClosed, setIsClosed, joinConversation, sendMessage: socketSend } = useChat2();
  const [minimized, setMinimized] = useState(false);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const endRef = useRef(null);
  const inputRef = useRef(null);

  const loadConversation = useCallback(async () => {
    if (convId || !user || !isRole('customer')) return;
    setLoading(true);
    try {
      const r = await api.get('/chat/my');
      setMessages(r.data.messages || []);
      setConvId(r.data.conversation.id);
      setIsClosed(r.data.conversation.status === 'closed');
      joinConversation(r.data.conversation.id);
    } catch {}
    setLoading(false);
  }, [convId, user]);

  useEffect(() => {
    if (open && !minimized) {
      loadConversation();
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [open, minimized]);

  useEffect(() => {
    if (open && !minimized) endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    const msg = text.trim();
    if (!msg || !convId || isClosed || sending) return;
    setText('');
    setSending(true);
    const optimistic = { id: `opt-${Date.now()}`, senderRole: 'customer', content: msg, createdAt: new Date(), User: { fullName: user.fullName } };
    setMessages(prev => [...prev, optimistic]);
    try {
      if (socketSend) {
        socketSend(convId, msg);
      } else {
        const r = await api.post(`/chat/conversations/${convId}/messages`, { content: msg });
        setMessages(prev => [...prev.filter(m => m.id !== optimistic.id), ...(r.data.messages || [])]);
      }
    } catch {
      try {
        const r = await api.post(`/chat/conversations/${convId}/messages`, { content: msg });
        setMessages(prev => [...prev.filter(m => m.id !== optimistic.id), ...(r.data.messages || [])]);
      } catch {}
    }
    setSending(false);
  };

  if (!open) return null;

  return (
    <div className="w-80 sm:w-[360px] bg-white rounded-2xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden" style={{ height: minimized ? 'auto' : '490px' }}>
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3 flex items-center gap-2.5 shrink-0">
        <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-lg shrink-0">💬</div>
        <div className="flex-1 min-w-0">
          <p className="text-white font-bold text-sm">Nhân viên hỗ trợ</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
            <p className="text-white/70 text-[11px]">Đang trực tuyến</p>
          </div>
        </div>
        <button onClick={() => setMinimized(v => !v)} className="text-white/60 hover:text-white p-1 transition"><FiMinus size={15} /></button>
        <button onClick={onClose} className="text-white/60 hover:text-white p-1 transition"><FiX size={15} /></button>
      </div>

      {!minimized && (
        <>
          {/* Body */}
          {!user ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center bg-gray-50">
              <div className="text-5xl mb-3">💬</div>
              <h3 className="font-bold text-gray-800 mb-1">Chat với nhân viên</h3>
              <p className="text-sm text-gray-500 mb-4">Đăng nhập để nhắn tin trực tiếp với đội ngũ hỗ trợ YarnShop</p>
              <Link to="/login" onClick={onClose} className="bg-blue-600 text-white px-5 py-2 rounded-xl font-semibold text-sm hover:bg-blue-700 transition">
                Đăng nhập ngay
              </Link>
              <Link to="/register" onClick={onClose} className="text-xs text-blue-400 hover:underline mt-2">Chưa có tài khoản? Đăng ký</Link>
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-gray-50">
                {loading && (
                  <div className="flex justify-center py-4">
                    <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
                {!loading && messages.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full text-center py-8 text-gray-400">
                    <FiMessageCircle size={32} className="mb-2 text-blue-300" />
                    <p className="text-sm font-medium text-gray-500">Bắt đầu cuộc trò chuyện</p>
                    <p className="text-xs mt-1">Nhân viên sẽ phản hồi trong vài phút</p>
                  </div>
                )}
                {messages
                  .filter(m => m.senderRole !== 'bot')
                  .map((msg, i, arr) => {
                    const isMe = msg.senderRole === 'customer';
                    const showName = !i || arr[i - 1]?.senderRole !== msg.senderRole;
                    return (
                      <div key={msg.id || i} className={`flex gap-2 ${isMe ? 'justify-end' : 'justify-start'}`}>
                        {!isMe && (
                          <div className="w-6 h-6 rounded-full bg-blue-500 text-white text-[10px] flex items-center justify-center shrink-0 mt-auto font-bold">
                            {msg.User?.fullName?.[0]?.toUpperCase() || 'S'}
                          </div>
                        )}
                        <div className="max-w-[76%]">
                          {showName && !isMe && (
                            <p className="text-[10px] text-gray-400 mb-0.5 px-1">{msg.User?.fullName || 'Nhân viên'}</p>
                          )}
                          <div className={`px-3 py-2 rounded-2xl text-sm leading-relaxed break-words ${
                            isMe ? 'bg-blue-600 text-white rounded-br-sm' : 'bg-white text-gray-800 shadow-sm border border-gray-100 rounded-bl-sm'
                          }`}>
                            {msg.content}
                          </div>
                          <p className={`text-[10px] text-gray-300 mt-0.5 px-1 ${isMe ? 'text-right' : ''}`}>{fmtTime(msg.createdAt)}</p>
                        </div>
                      </div>
                    );
                  })}
                {isClosed && (
                  <div className="text-center py-2">
                    <span className="text-xs bg-gray-200 text-gray-500 px-3 py-1 rounded-full">Cuộc trò chuyện đã kết thúc</span>
                  </div>
                )}
                <div ref={endRef} />
              </div>

              {!isClosed ? (
                <form onSubmit={handleSend} className="border-t bg-white px-3 py-2.5 flex items-center gap-2 shrink-0">
                  <input
                    ref={inputRef}
                    value={text}
                    onChange={e => setText(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(e); }}}
                    placeholder="Nhắn tin cho nhân viên..."
                    className="flex-1 text-sm bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-400"
                    disabled={!convId || sending}
                  />
                  <button type="submit" disabled={!text.trim() || !convId || sending}
                    className="w-9 h-9 bg-blue-600 text-white rounded-xl flex items-center justify-center hover:bg-blue-700 transition disabled:opacity-40 shrink-0">
                    <FiSend size={14} />
                  </button>
                </form>
              ) : (
                <div className="border-t bg-white px-4 py-3 text-center shrink-0">
                  <p className="text-xs text-gray-400">Phiên chat đã đóng. <Link to="/contact" onClick={onClose} className="text-blue-500 hover:underline">Gửi form liên hệ</Link></p>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}

import { useState, useEffect, useRef } from 'react';
import { FiMessageCircle, FiSend, FiUser, FiClock, FiCheck, FiCheckCircle } from 'react-icons/fi';
import { useChat2 } from '../../context/ChatContext';
import api from '../../services/api';

const ROLE_COLORS = { customer: 'bg-rose-500', staff: 'bg-blue-600', bot: 'bg-emerald-500' };
const fmtTime = (d) => new Date(d).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
const fmtDate = (d) => {
  const date = new Date(d);
  const today = new Date();
  if (date.toDateString() === today.toDateString()) return fmtTime(d);
  return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
};

export default function StaffChat() {
  const { conversations, setConversations, activeConvId, activeMessages, setActiveMessages, joinStaffConversation, sendMessage, closeConversation } = useChat2();
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const fetchConversations = async () => {
    try {
      const r = await api.get('/chat/conversations');
      setConversations(r.data || []);
    } catch {}
  };

  useEffect(() => {
    fetchConversations();
    const interval = setInterval(fetchConversations, 8000);
    return () => clearInterval(interval);
  }, []);

  // Refresh list when socket signals update
  useEffect(() => {
    const handler = () => fetchConversations();
    window.addEventListener('chat:refresh', handler);
    return () => window.removeEventListener('chat:refresh', handler);
  }, []);

  const selectConversation = async (conv) => {
    setLoading(true);
    try {
      const r = await api.get(`/chat/conversations/${conv.id}/messages`);
      setActiveMessages(r.data.messages || []);
      joinStaffConversation(conv.id);
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeMessages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!text.trim() || !activeConvId) return;
    sendMessage(activeConvId, text.trim());
    setText('');
  };

  const handleClose = () => {
    if (!activeConvId) return;
    closeConversation(activeConvId);
    setConversations(prev => prev.filter(c => c.id !== activeConvId));
    setActiveMessages([]);
    fetchConversations();
  };

  const activeConv = conversations.find(c => c.id === activeConvId);

  return (
    <div className="flex h-full bg-white rounded-2xl shadow overflow-hidden border border-gray-100">
      {/* Conversation list */}
      <div className="w-72 border-r flex flex-col shrink-0">
        <div className="px-4 py-3.5 border-b bg-gray-50">
          <h2 className="font-bold text-gray-800">Hội thoại</h2>
          <p className="text-xs text-gray-400 mt-0.5">{conversations.length} đang mở</p>
        </div>
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-gray-300 py-12">
              <FiMessageCircle size={36} />
              <p className="text-sm mt-3 font-medium">Chưa có hội thoại</p>
            </div>
          )}
          {conversations.map(conv => {
            const isActive = conv.id === activeConvId;
            return (
              <button key={conv.id} onClick={() => selectConversation(conv)}
                className={`w-full px-4 py-3.5 flex items-start gap-3 border-b border-gray-50 hover:bg-gray-50 transition text-left ${isActive ? 'bg-blue-50 border-l-2 border-l-blue-500' : ''}`}>
                <div className="w-9 h-9 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center font-bold text-sm shrink-0">
                  {conv.customer?.fullName?.[0]?.toUpperCase() || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <p className="font-semibold text-sm text-gray-800 truncate">{conv.customer?.fullName || 'Khách hàng'}</p>
                    <span className="text-[10px] text-gray-400 shrink-0">{conv.lastMessageAt ? fmtDate(conv.lastMessageAt) : ''}</span>
                  </div>
                  <p className="text-xs text-gray-500 truncate mt-0.5">{conv.lastMessage?.content || 'Bắt đầu trò chuyện'}</p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                      conv.status === 'active' ? 'bg-blue-100 text-blue-600' : 'bg-orange-100 text-orange-600'
                    }`}>{conv.status === 'active' ? 'Đang xử lý' : 'Chờ phản hồi'}</span>
                    {conv.unreadCount > 0 && (
                      <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                        {conv.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Chat panel */}
      <div className="flex-1 flex flex-col min-w-0">
        {activeConvId ? (
          <>
            {/* Chat header */}
            <div className="px-5 py-3.5 border-b bg-gray-50 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center font-bold text-sm">
                {activeConv?.customer?.fullName?.[0]?.toUpperCase() || '?'}
              </div>
              <div className="flex-1">
                <p className="font-bold text-gray-800">{activeConv?.customer?.fullName || 'Khách hàng'}</p>
                <p className="text-xs text-gray-400">{activeConv?.customer?.email}</p>
              </div>
              <button onClick={handleClose}
                className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-red-600 border border-gray-200 hover:border-red-300 px-3 py-1.5 rounded-lg transition">
                <FiCheckCircle size={13} /> Kết thúc
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-gray-50">
              {loading && (
                <div className="flex justify-center py-4">
                  <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                </div>
              )}
              {activeMessages
                .filter(msg => msg.senderRole !== 'bot' && (msg.conversationId === activeConvId || !msg.conversationId))
                .map((msg, i) => {
                  const isStaff = msg.senderRole === 'staff';
                  return (
                    <div key={msg.id || i} className={`flex gap-2 ${isStaff ? 'justify-end' : 'justify-start'}`}>
                      {!isStaff && (
                        <div className={`w-6 h-6 rounded-full ${ROLE_COLORS[msg.senderRole]} text-white text-[10px] flex items-center justify-center shrink-0 mt-auto font-bold`}>
                          {msg.senderRole === 'bot' ? '🤖' : (msg.User?.fullName?.[0] || '?')}
                        </div>
                      )}
                      <div className="max-w-[70%]">
                        {(!i || activeMessages[i - 1]?.senderRole !== msg.senderRole) && (
                          <p className={`text-[10px] text-gray-400 mb-0.5 px-1 ${isStaff ? 'text-right' : ''}`}>
                            {isStaff ? 'Bạn' : (msg.senderRole === 'bot' ? 'YarnBot' : (msg.User?.fullName || 'Khách hàng'))}
                          </p>
                        )}
                        <div className={`px-3 py-2 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words ${
                          isStaff ? 'bg-blue-600 text-white rounded-br-sm' : 'bg-white text-gray-800 shadow-sm border border-gray-100 rounded-bl-sm'
                        }`}>
                          {msg.content}
                        </div>
                        <p className={`text-[10px] text-gray-300 mt-0.5 px-1 ${isStaff ? 'text-right' : ''}`}>{fmtTime(msg.createdAt)}</p>
                      </div>
                    </div>
                  );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSend} className="border-t bg-white px-4 py-3 flex items-center gap-2">
              <input value={text} onChange={e => setText(e.target.value)}
                placeholder="Nhập tin nhắn..."
                className="flex-1 text-sm bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-blue-400" />
              <button type="submit" disabled={!text.trim()}
                className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center hover:bg-blue-700 transition disabled:opacity-40 shrink-0">
                <FiSend size={16} />
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-300">
            <FiMessageCircle size={48} />
            <p className="text-lg font-semibold mt-4 text-gray-400">Chọn một cuộc hội thoại</p>
            <p className="text-sm text-gray-300 mt-1">để bắt đầu hỗ trợ khách hàng</p>
          </div>
        )}
      </div>
    </div>
  );
}

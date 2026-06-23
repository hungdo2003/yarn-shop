import { useState, useRef, useEffect } from 'react';
import { FiX, FiSend, FiMinus, FiChevronRight } from 'react-icons/fi';
import api from '../../services/api';

const QUICK = [
  'Có những sản phẩm len nào?',
  'Phí giao hàng bao nhiêu?',
  'Chính sách đổi trả?',
  'Hình thức thanh toán?',
];

const renderContent = (text) =>
  text.split(/(\*\*[^*]+\*\*)/g).map((p, i) =>
    p.startsWith('**') ? <strong key={i}>{p.slice(2, -2)}</strong> : <span key={i}>{p}</span>
  );

const fmtTime = (d) => new Date(d).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

export default function AIChatWidget({ onOpenLiveChat }) {
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 0, role: 'bot', createdAt: new Date(),
      content: 'Xin chào! Tôi là **YarnBot** 🧶\nTôi có thể giúp bạn tìm hiểu về sản phẩm, giá cả, giao hàng và chính sách của YarnShop.\n\nBạn muốn hỏi gì?',
    },
  ]);
  const [text, setText] = useState('');
  const [typing, setTyping] = useState(false);
  const endRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (open && !minimized) {
      endRef.current?.scrollIntoView({ behavior: 'smooth' });
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open, minimized, messages]);

  const ask = async (question) => {
    if (!question.trim() || typing) return;
    const userMsg = { id: Date.now(), role: 'user', content: question.trim(), createdAt: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setText('');
    setTyping(true);
    try {
      const r = await api.post('/chat/bot', { message: question.trim() });
      setMessages(prev => [...prev, { id: Date.now() + 1, role: 'bot', content: r.data.reply, createdAt: new Date() }]);
    } catch {
      setMessages(prev => [...prev, { id: Date.now() + 1, role: 'bot', content: 'Xin lỗi, có lỗi xảy ra. Vui lòng thử lại!', createdAt: new Date() }]);
    }
    setTyping(false);
  };

  const handleSubmit = (e) => { e.preventDefault(); ask(text); };

  return (
    <div className="flex flex-col items-end gap-2">
      {open && !minimized && (
        <div className="w-80 sm:w-[360px] bg-white rounded-2xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden" style={{ height: '500px' }}>
          {/* Header */}
          <div className="bg-gradient-to-r from-violet-600 to-purple-600 px-4 py-3 flex items-center gap-2.5 shrink-0">
            <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-lg shrink-0">🤖</div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-bold text-sm">YarnBot — Trợ lý AI</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 bg-green-400 rounded-full" />
                <p className="text-white/70 text-[11px]">Hỏi bất cứ điều gì về YarnShop</p>
              </div>
            </div>
            <button onClick={() => setMinimized(true)} className="text-white/60 hover:text-white p-1 transition"><FiMinus size={15} /></button>
            <button onClick={() => setOpen(false)} className="text-white/60 hover:text-white p-1 transition"><FiX size={15} /></button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-gray-50">
            {messages.map((msg) => {
              const isUser = msg.role === 'user';
              return (
                <div key={msg.id} className={`flex gap-2 ${isUser ? 'justify-end' : 'justify-start'}`}>
                  {!isUser && (
                    <div className="w-6 h-6 rounded-full bg-violet-500 text-white text-xs flex items-center justify-center shrink-0 mt-auto">🤖</div>
                  )}
                  <div className="max-w-[78%]">
                    <div className={`px-3 py-2 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words ${
                      isUser
                        ? 'bg-violet-600 text-white rounded-br-sm'
                        : 'bg-white text-gray-800 shadow-sm border border-gray-100 rounded-bl-sm'
                    }`}>
                      {renderContent(msg.content)}
                    </div>
                    <p className={`text-[10px] text-gray-300 mt-0.5 px-1 ${isUser ? 'text-right' : ''}`}>{fmtTime(msg.createdAt)}</p>
                  </div>
                </div>
              );
            })}
            {typing && (
              <div className="flex gap-2 justify-start">
                <div className="w-6 h-6 rounded-full bg-violet-500 flex items-center justify-center text-xs shrink-0">🤖</div>
                <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-sm px-3 py-2.5 shadow-sm flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          {/* Quick questions */}
          {messages.length <= 2 && !typing && (
            <div className="px-3 py-2 border-t bg-white shrink-0">
              <p className="text-[10px] text-gray-400 mb-1.5 font-medium uppercase tracking-wide">Câu hỏi thường gặp</p>
              <div className="flex flex-wrap gap-1.5">
                {QUICK.map(q => (
                  <button key={q} onClick={() => ask(q)}
                    className="text-[11px] bg-violet-50 text-violet-700 border border-violet-200 px-2.5 py-1 rounded-full hover:bg-violet-100 transition">
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Live chat link */}
          <div className="border-t bg-white px-3 py-2 shrink-0">
            <button onClick={() => { setOpen(false); onOpenLiveChat?.(); }}
              className="w-full flex items-center justify-between text-xs text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-2 rounded-xl transition">
              <span>💬 Cần hỗ trợ thêm? Chat với nhân viên</span>
              <FiChevronRight size={13} />
            </button>
          </div>

          {/* Input */}
          <form onSubmit={handleSubmit} className="border-t bg-white px-3 py-2.5 flex items-center gap-2 shrink-0">
            <input
              ref={inputRef}
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="Hỏi YarnBot..."
              className="flex-1 text-sm bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-violet-400"
              disabled={typing}
            />
            <button type="submit" disabled={!text.trim() || typing}
              className="w-9 h-9 bg-violet-600 text-white rounded-xl flex items-center justify-center hover:bg-violet-700 transition disabled:opacity-40 shrink-0">
              <FiSend size={14} />
            </button>
          </form>
        </div>
      )}

      {open && minimized && (
        <button onClick={() => setMinimized(false)}
          className="bg-gradient-to-r from-violet-600 to-purple-600 text-white px-4 py-2.5 rounded-2xl shadow-lg flex items-center gap-2 hover:shadow-xl transition">
          <span className="text-sm">🤖</span>
          <span className="text-sm font-semibold">YarnBot</span>
        </button>
      )}

      {!open && (
        <button onClick={() => setOpen(true)}
          className="w-13 h-13 w-[52px] h-[52px] bg-gradient-to-br from-violet-600 to-purple-600 text-white rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all flex items-center justify-center relative group">
          <span className="text-xl">🤖</span>
          <span className="absolute right-14 bottom-1 bg-gray-800 text-white text-xs px-2.5 py-1.5 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow">
            Hỏi YarnBot
          </span>
        </button>
      )}
    </div>
  );
}

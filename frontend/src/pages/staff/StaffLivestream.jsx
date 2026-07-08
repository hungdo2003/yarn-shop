import { useEffect, useRef, useState } from 'react';
import {
  FiVideo, FiVideoOff, FiMic, FiMicOff, FiEye, FiSend,
  FiPlus, FiRadio, FiClock, FiCalendar, FiInfo, FiChevronDown, FiChevronUp,
  FiMessageSquare, FiUsers,
} from 'react-icons/fi';
import { io } from 'socket.io-client';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import toast from 'react-hot-toast';

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
const RTC_CONFIG = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }, { urls: 'stun:stun1.l.google.com:19302' }] };

const fmtTime   = (d) => new Date(d).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
const fmtFull   = (d) => new Date(d).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
const fmtDur    = (start, end) => {
  const s = Math.floor((new Date(end) - new Date(start)) / 1000);
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  return h > 0 ? `${h}g ${m}p ${sec}s` : `${m}p ${sec}s`;
};

/* ── Countdown chip cho stream chưa live ── */
function Countdown({ scheduledAt }) {
  const [label, setLabel] = useState('');
  useEffect(() => {
    const tick = () => {
      const diff = new Date(scheduledAt) - Date.now();
      if (diff <= 0) { setLabel('Sắp bắt đầu'); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setLabel(h > 0 ? `${h}g ${String(m).padStart(2,'0')}p` : `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`);
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [scheduledAt]);
  return (
    <span className="flex items-center gap-1 text-xs text-indigo-600 font-semibold bg-indigo-50 px-2 py-0.5 rounded-full">
      <FiClock size={10} /> {label}
    </span>
  );
}

/* ── Panel thông tin stream đã kết thúc (view-only) ── */
function EndedDetail({ stream }) {
  const [open, setOpen] = useState(false);
  const [commentCount, setCommentCount] = useState(null);

  useEffect(() => {
    if (open && commentCount === null) {
      api.get(`/livestreams/${stream.id}/comments`)
        .then(r => setCommentCount(r.data.length))
        .catch(() => setCommentCount(0));
    }
  }, [open]);

  const duration = stream.startedAt && stream.endedAt
    ? fmtDur(stream.startedAt, stream.endedAt) : null;

  return (
    <div className="mt-3 border-t border-gray-100 pt-3">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 font-medium transition"
      >
        <FiInfo size={13} />
        Xem thông tin chi tiết
        {open ? <FiChevronUp size={13} /> : <FiChevronDown size={13} />}
      </button>

      {open && (
        <div className="mt-3 grid grid-cols-2 xs:grid-cols-3 gap-3">
          <Stat label="Thời lượng" value={duration || '—'} />
          <Stat label="Bắt đầu" value={stream.startedAt ? fmtFull(stream.startedAt) : '—'} />
          <Stat label="Kết thúc"  value={stream.endedAt  ? fmtFull(stream.endedAt)  : '—'} />
          <Stat label="Bình luận" value={commentCount === null ? '...' : commentCount} />
          <Stat label="Người xem (cao nhất)" value={stream.viewerCount > 0 ? stream.viewerCount : (stream.viewerCount === 0 ? '0' : '—')} />
          {stream.scheduledAt && <Stat label="Dự kiến" value={fmtFull(stream.scheduledAt)} />}
          {stream.description && (
            <div className="col-span-2 xs:col-span-3">
              <p className="text-[11px] text-gray-400 mb-0.5">Mô tả</p>
              <p className="text-xs text-gray-600 leading-relaxed">{stream.description}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="bg-gray-50 rounded-xl p-2.5">
      <p className="text-[10px] text-gray-400 mb-0.5">{label}</p>
      <p className="text-xs font-semibold text-gray-700">{value}</p>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════ */
export default function StaffLivestream() {
  const { user } = useAuth();
  const token = localStorage.getItem('token');

  const [streams, setStreams] = useState([]);
  const [activeStream, setActiveStream] = useState(null);
  const [isLive, setIsLive] = useState(false);
  const [comments, setComments] = useState([]);
  const [viewerCount, setViewerCount] = useState(0);
  const [text, setText] = useState('');
  const [camOn, setCamOn] = useState(true);
  const [micOn, setMicOn] = useState(true);
  const [elapsed, setElapsed] = useState(0);

  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', scheduledAt: '' });
  const [creating, setCreating] = useState(false);

  const socketRef    = useRef(null);
  const localVideoRef = useRef(null);
  const localStreamRef = useRef(null);
  const peersRef     = useRef({});
  const commentsEndRef = useRef(null);
  const timerRef     = useRef(null);

  /* ── Scroll comments ── */
  useEffect(() => { commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [comments]);

  /* ── Assign camera to video after isLive render ── */
  useEffect(() => {
    if (isLive && localVideoRef.current && localStreamRef.current) {
      localVideoRef.current.srcObject = localStreamRef.current;
    }
  }, [isLive]);

  /* ── Fetch streams ── */
  const fetchStreams = async () => {
    try {
      const r = await api.get('/livestreams');
      setStreams(r.data.filter(s => s.staffId === user?.id));
    } catch {}
  };
  useEffect(() => { fetchStreams(); }, []);

  /* ── Socket ── */
  useEffect(() => {
    const socket = io(SOCKET_URL, { auth: { token }, transports: ['websocket'] });
    socketRef.current = socket;

    socket.on('livestream:viewer_count', setViewerCount);
    socket.on('livestream:comment_new', (c) => setComments(p => [...p.slice(-299), c]));

    socket.on('livestream:viewer_joined', async ({ viewerSocketId }) => {
      if (!localStreamRef.current) return;
      try {
        const pc = new RTCPeerConnection(RTC_CONFIG);
        peersRef.current[viewerSocketId] = pc;
        localStreamRef.current.getTracks().forEach(t => pc.addTrack(t, localStreamRef.current));
        pc.onicecandidate = (e) => {
          if (e.candidate) socket.emit('rtc:ice', { targetSocketId: viewerSocketId, candidate: e.candidate });
        };
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit('rtc:offer', { targetSocketId: viewerSocketId, offer });
      } catch (err) { console.error('offer error', err); }
    });

    socket.on('rtc:answer', async ({ fromSocketId, answer }) => {
      const pc = peersRef.current[fromSocketId];
      if (pc) await pc.setRemoteDescription(new RTCSessionDescription(answer)).catch(() => {});
    });

    socket.on('rtc:ice', ({ fromSocketId, candidate }) => {
      const pc = peersRef.current[fromSocketId];
      if (pc && candidate) pc.addIceCandidate(new RTCIceCandidate(candidate)).catch(() => {});
    });

    return () => {
      socket.disconnect();
      Object.values(peersRef.current).forEach(pc => pc.close());
      peersRef.current = {};
    };
  }, [token]);

  /* ── Timer ── */
  useEffect(() => {
    if (isLive) { timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000); }
    else { clearInterval(timerRef.current); setElapsed(0); }
    return () => clearInterval(timerRef.current);
  }, [isLive]);

  const fmtElapsed = (s) => {
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
    return [h, m, sec].map(v => String(v).padStart(2, '0')).join(':');
  };

  /* ── Handlers ── */
  const handleCreateStream = async () => {
    if (!form.title.trim()) return toast.error('Nhập tiêu đề livestream');
    setCreating(true);
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        ...(form.scheduledAt ? { scheduledAt: new Date(form.scheduledAt).toISOString() } : {}),
      };
      const r = await api.post('/livestreams', payload);
      setStreams(prev => [r.data, ...prev]);
      setShowCreate(false);
      setForm({ title: '', description: '', scheduledAt: '' });
      toast.success(form.scheduledAt ? 'Đã tạo và thông báo đến khách hàng!' : 'Tạo livestream thành công!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Tạo thất bại');
    }
    setCreating(false);
  };

  const handleStartLive = async (stream) => {
    try {
      const media = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localStreamRef.current = media;
      socketRef.current.emit('livestream:start_stream', stream.id);
      setActiveStream(stream);
      setIsLive(true);
      setViewerCount(0);
      setComments([]);
      const r = await api.get(`/livestreams/${stream.id}/comments`);
      setComments(r.data.slice(-100));
      toast.success('Bắt đầu phát sóng!');
    } catch (err) {
      if (err.name === 'NotAllowedError') toast.error('Vui lòng cho phép truy cập camera/microphone');
      else toast.error('Không thể bắt đầu stream');
    }
  };

  const handleEndStream = async () => {
    if (!activeStream) return;
    socketRef.current.emit('livestream:end_stream', activeStream.id);
    localStreamRef.current?.getTracks().forEach(t => t.stop());
    localStreamRef.current = null;
    Object.values(peersRef.current).forEach(pc => pc.close());
    peersRef.current = {};
    setIsLive(false);
    setActiveStream(null);
    await fetchStreams();
    toast('Đã kết thúc livestream');
  };

  const toggleCam = () => {
    const t = localStreamRef.current?.getVideoTracks()[0];
    if (t) { t.enabled = !t.enabled; setCamOn(v => !v); }
  };
  const toggleMic = () => {
    const t = localStreamRef.current?.getAudioTracks()[0];
    if (t) { t.enabled = !t.enabled; setMicOn(v => !v); }
  };

  const handleSendComment = (e) => {
    e.preventDefault();
    if (!text.trim() || !activeStream) return;
    socketRef.current?.emit('livestream:comment', { livestreamId: activeStream.id, content: text.trim() });
    setText('');
  };

  /* ── Min datetime for input (now + 5 min) ── */
  const minDateTime = new Date(Date.now() + 5 * 60 * 1000).toISOString().slice(0, 16);

  /* ════════════ LIVE VIEW ════════════ */
  if (isLive && activeStream) {
    return (
      <div className="flex flex-col lg:flex-row h-full bg-gray-950 overflow-hidden">
        {/* Video */}
        <div className="relative flex-1 flex flex-col items-center justify-center bg-black min-h-0">
          <video ref={localVideoRef} autoPlay muted playsInline className="w-full h-full object-contain" />

          <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between bg-gradient-to-b from-black/70 to-transparent">
            <div className="flex items-center gap-2">
              <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full animate-pulse">LIVE</span>
              <span className="text-white text-sm font-mono">{fmtElapsed(elapsed)}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 bg-black/50 text-white text-sm px-2 py-0.5 rounded-full">
                <FiEye size={13} /> {viewerCount}
              </span>
              <span className="flex items-center gap-1 bg-black/50 text-white text-sm px-2 py-0.5 rounded-full">
                <FiMessageSquare size={13} /> {comments.length}
              </span>
            </div>
          </div>

          <div className="absolute bottom-20 left-0 right-0 px-4">
            <p className="text-white font-bold text-lg drop-shadow">{activeStream.title}</p>
          </div>

          <div className="absolute bottom-4 left-0 right-0 flex items-center justify-center gap-4">
            <button onClick={toggleCam}
              className={`w-12 h-12 rounded-full flex items-center justify-center text-white transition ${camOn ? 'bg-white/20 hover:bg-white/30' : 'bg-red-500 hover:bg-red-600'}`}>
              {camOn ? <FiVideo size={20} /> : <FiVideoOff size={20} />}
            </button>
            <button onClick={toggleMic}
              className={`w-12 h-12 rounded-full flex items-center justify-center text-white transition ${micOn ? 'bg-white/20 hover:bg-white/30' : 'bg-red-500 hover:bg-red-600'}`}>
              {micOn ? <FiMic size={20} /> : <FiMicOff size={20} />}
            </button>
            <button onClick={handleEndStream}
              className="bg-red-600 hover:bg-red-700 text-white px-5 py-3 rounded-full font-bold text-sm transition">
              Kết thúc
            </button>
          </div>
        </div>

        {/* Comments */}
        <div className="w-full lg:w-96 flex flex-col bg-gray-900 border-l border-gray-800 max-h-64 lg:max-h-full">
          <div className="px-4 py-3 border-b border-gray-800">
            <p className="text-white font-semibold">Bình luận trực tiếp</p>
          </div>
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2 min-h-0">
            {comments.map((c, i) => (
              <div key={c.id || i} className="flex gap-2 items-start">
                <div className="w-7 h-7 rounded-full bg-rose-700 text-white text-xs flex items-center justify-center font-bold shrink-0">
                  {(c.displayName || 'K')[0].toUpperCase()}
                </div>
                <div>
                  <span className="text-rose-400 text-xs font-semibold">{c.displayName} </span>
                  <span className="text-gray-200 text-sm break-words">{c.content}</span>
                  <p className="text-gray-600 text-[10px]">{fmtTime(c.createdAt)}</p>
                </div>
              </div>
            ))}
            <div ref={commentsEndRef} />
          </div>
          <form onSubmit={handleSendComment} className="px-3 py-3 border-t border-gray-800 flex gap-2">
            <input value={text} onChange={e => setText(e.target.value)} placeholder="Phản hồi bình luận..."
              className="flex-1 bg-gray-800 text-white placeholder-gray-500 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-rose-500" />
            <button type="submit" disabled={!text.trim()}
              className="w-9 h-9 bg-rose-500 text-white rounded-xl flex items-center justify-center hover:bg-rose-600 transition disabled:opacity-40 shrink-0">
              <FiSend size={14} />
            </button>
          </form>
        </div>
      </div>
    );
  }

  /* ════════════ MANAGEMENT VIEW ════════════ */
  const waiting = streams.filter(s => s.status === 'waiting');
  const ended   = streams.filter(s => s.status === 'ended');

  return (
    <div className="p-6 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <FiRadio size={22} className="text-rose-500" />
          <h1 className="text-xl font-bold text-gray-800">Quản lý Livestream</h1>
        </div>
        <button onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-rose-500 hover:bg-rose-600 text-white px-4 py-2 rounded-xl font-semibold text-sm transition">
          <FiPlus size={16} /> Tạo livestream
        </button>
      </div>

      {/* ── Create form ── */}
      {showCreate && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 mb-6">
          <h2 className="font-bold text-gray-800 mb-4">Tạo livestream mới</h2>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Tiêu đề <span className="text-red-500">*</span></label>
              <input autoFocus value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="Ví dụ: Review len mới nhập tháng 7..."
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Mô tả</label>
              <textarea value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                rows={2} placeholder="Nội dung livestream hôm nay..."
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 resize-none" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 flex items-center gap-1.5 mb-1">
                <FiCalendar size={13} /> Thời gian dự kiến
                <span className="text-gray-400 font-normal text-xs">(tuỳ chọn — để trống nếu bắt đầu ngay)</span>
              </label>
              <input type="datetime-local" value={form.scheduledAt} min={minDateTime}
                onChange={e => setForm(f => ({ ...f, scheduledAt: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300" />
              {form.scheduledAt && (
                <p className="text-xs text-indigo-600 mt-1 flex items-center gap-1">
                  <FiClock size={11} /> Khách hàng sẽ nhận thông báo ngay sau khi tạo
                </p>
              )}
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => { setShowCreate(false); setForm({ title: '', description: '', scheduledAt: '' }); }}
                className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 font-medium">Huỷ</button>
              <button onClick={handleCreateStream} disabled={creating}
                className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white text-sm rounded-xl font-semibold transition disabled:opacity-50">
                {creating ? 'Đang tạo...' : 'Tạo'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Waiting / Scheduled ── */}
      {waiting.length > 0 && (
        <div className="mb-6">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Chờ phát sóng</p>
          <div className="space-y-3">
            {waiting.map(stream => (
              <div key={stream.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-rose-50 flex items-center justify-center shrink-0">
                    <FiVideo size={22} className="text-rose-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800">{stream.title}</p>
                    {stream.description && <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">{stream.description}</p>}
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <span className="text-xs bg-yellow-100 text-yellow-700 font-semibold px-2 py-0.5 rounded-full">
                        Chờ phát sóng
                      </span>
                      {stream.scheduledAt ? (
                        <>
                          <span className="text-xs text-gray-400 flex items-center gap-1">
                            <FiCalendar size={10} /> {fmtFull(stream.scheduledAt)}
                          </span>
                          <Countdown scheduledAt={stream.scheduledAt} />
                        </>
                      ) : (
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <FiClock size={10} /> Tạo lúc {fmtFull(stream.createdAt)}
                        </span>
                      )}
                    </div>
                  </div>
                  <button onClick={() => handleStartLive(stream)}
                    className="flex items-center gap-1.5 bg-rose-500 hover:bg-rose-600 text-white px-4 py-2 rounded-xl text-sm font-bold transition shrink-0">
                    <FiRadio size={14} /> Bắt đầu
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Ended (view-only) ── */}
      {ended.length > 0 && (
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Đã kết thúc</p>
          <div className="space-y-3">
            {ended.map(stream => (
              <div key={stream.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
                    <FiVideo size={22} className="text-gray-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-700">{stream.title}</p>
                    {stream.description && <p className="text-sm text-gray-400 mt-0.5 line-clamp-1">{stream.description}</p>}
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <span className="text-xs bg-gray-100 text-gray-500 font-semibold px-2 py-0.5 rounded-full">Đã kết thúc</span>
                      {stream.endedAt && (
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <FiClock size={10} /> {fmtFull(stream.endedAt)}
                        </span>
                      )}
                      {stream.startedAt && stream.endedAt && (
                        <span className="text-xs text-indigo-500 flex items-center gap-1 bg-indigo-50 px-2 py-0.5 rounded-full">
                          <FiRadio size={10} /> {fmtDur(stream.startedAt, stream.endedAt)}
                        </span>
                      )}
                      {stream.viewerCount > 0 && (
                        <span className="text-xs text-rose-500 flex items-center gap-1 bg-rose-50 px-2 py-0.5 rounded-full">
                          <FiUsers size={10} /> {stream.viewerCount} người xem
                        </span>
                      )}
                    </div>
                    <EndedDetail stream={stream} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Empty ── */}
      {streams.length === 0 && !showCreate && (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <FiVideo size={48} className="mb-4" />
          <p className="text-lg font-medium">Chưa có livestream nào</p>
          <p className="text-sm mt-1">Tạo livestream đầu tiên của bạn!</p>
        </div>
      )}
    </div>
  );
}

import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiSend, FiEye, FiArrowLeft, FiVideo, FiVideoOff } from 'react-icons/fi';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
const RTC_CONFIG = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }, { urls: 'stun:stun1.l.google.com:19302' }] };

const fmtTime = (d) => new Date(d).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

export default function LivestreamViewer() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [stream, setStream] = useState(null);
  const [comments, setComments] = useState([]);
  const [viewerCount, setViewerCount] = useState(0);
  const [ended, setEnded] = useState(false);
  const [text, setText] = useState('');
  const [guestName, setGuestName] = useState(() => localStorage.getItem('ls_guest_name') || '');
  const [showNameInput, setShowNameInput] = useState(false);
  const [loading, setLoading] = useState(true);
  const [hasVideo, setHasVideo] = useState(false);

  const socketRef = useRef(null);
  const videoRef = useRef(null);
  const peerRef = useRef(null);
  const broadcasterSocketIdRef = useRef(null);
  const commentsEndRef = useRef(null);

  useEffect(() => { commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [comments]);

  // Fetch stream info and recent comments
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [streamRes, commentsRes] = await Promise.all([
          api.get(`/livestreams/${id}`),
          api.get(`/livestreams/${id}/comments`),
        ]);
        setStream(streamRes.data);
        setViewerCount(streamRes.data.viewerCount || 0);
        setComments(commentsRes.data.slice(-100));
        if (streamRes.data.status === 'ended') setEnded(true);
      } catch {
        toast.error('Không tìm thấy livestream');
        navigate('/livestream');
      }
      setLoading(false);
    };
    fetchData();
  }, [id]);

  // WebRTC peer connection setup for viewer
  const setupPeer = useCallback((broadcasterSid) => {
    if (peerRef.current) peerRef.current.close();
    const pc = new RTCPeerConnection(RTC_CONFIG);
    peerRef.current = pc;
    broadcasterSocketIdRef.current = broadcasterSid;

    pc.ontrack = (e) => {
      if (videoRef.current && e.streams[0]) {
        videoRef.current.srcObject = e.streams[0];
        setHasVideo(true);
        videoRef.current.play().catch(() => {});
      }
    };

    pc.onicecandidate = (e) => {
      if (e.candidate && socketRef.current) {
        socketRef.current.emit('rtc:ice', { targetSocketId: broadcasterSid, candidate: e.candidate });
      }
    };

    return pc;
  }, []);

  // Socket connection — guestName intentionally excluded from deps:
  // it's sent per-comment, so reconnecting on every keystroke would break WebRTC.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (loading) return;

    const token = localStorage.getItem('token');
    const socket = io(SOCKET_URL, {
      auth: { token: token || undefined, guestName: guestName || 'Khách' },
      transports: ['websocket'],
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('livestream:join_as_viewer', Number(id));
    });

    socket.on('livestream:viewer_count', (count) => setViewerCount(count));

    socket.on('livestream:comment_new', (comment) => {
      setComments(prev => [...prev.slice(-199), comment]);
    });

    socket.on('livestream:stream_ended', () => {
      setEnded(true);
      toast('Livestream đã kết thúc', { icon: '📺' });
    });

    // WebRTC: broadcaster sends us an offer
    socket.on('rtc:offer', async ({ fromSocketId, offer }) => {
      try {
        const pc = setupPeer(fromSocketId);
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit('rtc:answer', { targetSocketId: fromSocketId, answer });
      } catch (err) {
        console.error('rtc:offer handling error', err);
      }
    });

    // ICE candidate from broadcaster
    socket.on('rtc:ice', ({ candidate }) => {
      if (peerRef.current && candidate) {
        peerRef.current.addIceCandidate(new RTCIceCandidate(candidate)).catch(() => {});
      }
    });

    return () => {
      socket.emit('livestream:leave_viewer', Number(id));
      socket.disconnect();
      if (peerRef.current) { peerRef.current.close(); peerRef.current = null; }
    };
  }, [id, loading]); // guestName excluded — see comment above

  const handleSend = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    if (!user && !guestName.trim()) {
      setShowNameInput(true);
      return;
    }
    socketRef.current?.emit('livestream:comment', {
      livestreamId: Number(id),
      content: text.trim(),
      guestName: guestName.trim(),
    });
    setText('');
  };

  const handleSetGuestName = () => {
    if (!guestName.trim()) return;
    localStorage.setItem('ls_guest_name', guestName.trim());
    setShowNameInput(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="w-10 h-10 border-2 border-rose-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-3.5rem)] bg-black overflow-hidden">
      {/* ── Video panel ───────────────────────────────── */}
      <div className="relative flex-1 flex items-center justify-center bg-black min-h-0">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className="w-full h-full object-contain"
        />

        {!hasVideo && !ended && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500 gap-3">
            <FiVideo size={56} />
            <p className="text-lg font-medium text-gray-400">Đang kết nối stream...</p>
          </div>
        )}

        {ended && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 gap-4">
            <FiVideoOff size={56} className="text-gray-500" />
            <p className="text-xl font-bold text-white">Livestream đã kết thúc</p>
            <button onClick={() => navigate('/livestream')} className="bg-rose-500 text-white px-5 py-2 rounded-xl font-semibold hover:bg-rose-600 transition">
              Xem livestream khác
            </button>
          </div>
        )}

        {/* Overlay info */}
        <div className="absolute top-0 left-0 right-0 p-4 flex items-start justify-between bg-gradient-to-b from-black/60 to-transparent">
          <button onClick={() => navigate('/livestream')} className="text-white/80 hover:text-white flex items-center gap-1 text-sm">
            <FiArrowLeft size={18} /> Quay lại
          </button>
          <div className="flex items-center gap-2">
            {!ended && (
              <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full animate-pulse">LIVE</span>
            )}
            <span className="flex items-center gap-1 bg-black/50 text-white text-xs px-2 py-0.5 rounded-full">
              <FiEye size={11} /> {viewerCount}
            </span>
          </div>
        </div>

        {/* Stream title */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 to-transparent lg:hidden">
          <p className="text-white font-bold text-lg leading-tight">{stream?.title}</p>
          {stream?.description && <p className="text-white/70 text-sm mt-1">{stream.description}</p>}
        </div>
      </div>

      {/* ── Comments panel ────────────────────────────── */}
      <div className="w-full lg:w-96 flex flex-col bg-gray-950 border-l border-gray-800 max-h-72 lg:max-h-full">
        {/* Header (desktop only) */}
        <div className="hidden lg:block px-4 py-3 border-b border-gray-800">
          <p className="text-white font-bold truncate">{stream?.title}</p>
          {stream?.description && <p className="text-gray-400 text-xs mt-0.5 line-clamp-2">{stream.description}</p>}
          <div className="flex items-center gap-2 mt-2">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-white/60 text-xs">{stream?.staff?.fullName}</span>
          </div>
        </div>

        {/* Comments list */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2 min-h-0">
          {comments.length === 0 && (
            <p className="text-center text-gray-600 text-sm mt-8">Chưa có bình luận. Hãy là người đầu tiên!</p>
          )}
          {comments.map((c, i) => (
            <div key={c.id || i} className="flex gap-2 items-start">
              <div className="w-7 h-7 rounded-full bg-rose-700 text-white text-xs flex items-center justify-center font-bold shrink-0 mt-0.5">
                {(c.displayName || 'K')[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-rose-400 text-xs font-semibold">{c.displayName || 'Khách'} </span>
                <span className="text-gray-200 text-sm break-words">{c.content}</span>
                <p className="text-gray-600 text-[10px] mt-0.5">{fmtTime(c.createdAt)}</p>
              </div>
            </div>
          ))}
          <div ref={commentsEndRef} />
        </div>

        {/* Guest name input modal */}
        {showNameInput && (
          <div className="px-3 py-3 bg-gray-900 border-t border-gray-800">
            <p className="text-white text-sm font-medium mb-2">Nhập tên của bạn để bình luận</p>
            <div className="flex gap-2">
              <input
                autoFocus
                value={guestName}
                onChange={e => setGuestName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSetGuestName()}
                placeholder="Tên của bạn..."
                className="flex-1 bg-gray-800 text-white placeholder-gray-500 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-rose-500"
              />
              <button
                onClick={handleSetGuestName}
                className="bg-rose-500 text-white px-3 py-2 rounded-xl text-sm font-semibold hover:bg-rose-600 transition"
              >
                OK
              </button>
            </div>
          </div>
        )}

        {/* Comment input */}
        {!ended && !showNameInput && (
          <form onSubmit={handleSend} className="px-3 py-3 border-t border-gray-800 flex gap-2">
            <input
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder={user ? 'Bình luận...' : (guestName ? `Bình luận với tên ${guestName}...` : 'Bình luận...')}
              className="flex-1 bg-gray-800 text-white placeholder-gray-500 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-rose-500"
            />
            <button
              type="submit"
              disabled={!text.trim()}
              className="w-10 h-10 bg-rose-500 text-white rounded-xl flex items-center justify-center hover:bg-rose-600 transition disabled:opacity-40 shrink-0"
            >
              <FiSend size={16} />
            </button>
          </form>
        )}

        {ended && (
          <div className="px-3 py-3 border-t border-gray-800 text-center text-gray-600 text-sm">
            Stream đã kết thúc
          </div>
        )}
      </div>
    </div>
  );
}

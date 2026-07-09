import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiVideo, FiEye, FiClock } from 'react-icons/fi';
import api from '../services/api';

const fmtDate = (d) => new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

const StatusBadge = ({ status }) => {
  if (status === 'live') return <span className="inline-flex items-center gap-1 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full animate-pulse">LIVE</span>;
  if (status === 'waiting') return <span className="inline-flex items-center gap-1 bg-yellow-400 text-white text-xs font-bold px-2 py-0.5 rounded-full">Sắp diễn ra</span>;
  return <span className="inline-flex items-center gap-1 bg-gray-300 text-gray-600 text-xs font-bold px-2 py-0.5 rounded-full">Đã kết thúc</span>;
};

export default function LivestreamList() {
  const [streams, setStreams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('live');

  const fetchStreams = async (status) => {
    setLoading(true);
    try {
      const params = status === 'all' ? {} : { status };
      const r = await api.get('/livestreams', { params });
      setStreams(r.data || []);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchStreams(tab); }, [tab]);

  // Poll for live updates
  useEffect(() => {
    if (tab !== 'live') return;
    const t = setInterval(() => fetchStreams('live'), 15000);
    return () => clearInterval(t);
  }, [tab]);

  const TABS = [
    { key: 'live', label: 'Đang live' },
    { key: 'waiting', label: 'Sắp diễn ra' },
    { key: 'ended', label: 'Đã kết thúc' },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <FiVideo size={24} className="text-rose-500" />
        <h1 className="text-2xl font-bold text-gray-800">Livestream</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors -mb-px ${
              tab === t.key ? 'border-rose-500 text-rose-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-3 border-rose-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : streams.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <FiVideo size={48} className="mb-4" />
          <p className="text-lg font-medium">Không có livestream nào</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {streams.map(stream => (
            <Link
              key={stream.id}
              to={`/livestream/${stream.id}`}
              className="group bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
            >
              {/* Thumbnail */}
              <div className="relative bg-gray-900 aspect-video flex items-center justify-center">
                {stream.thumbnailUrl ? (
                  <img src={stream.thumbnailUrl} alt={stream.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-gray-600">
                    <FiVideo size={40} />
                    <span className="text-sm">YarnShop Live</span>
                  </div>
                )}
                <div className="absolute top-2 left-2">
                  <StatusBadge status={stream.status} />
                </div>
                {stream.status === 'live' && (
                  <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/60 text-white text-xs px-2 py-0.5 rounded-full">
                    <FiEye size={11} /> {stream.viewerCount || 0}
                  </div>
                )}
                {stream.status === 'live' && (
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30">
                    <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
                      <div className="w-0 h-0 border-t-[10px] border-t-transparent border-l-[18px] border-l-white border-b-[10px] border-b-transparent ml-1" />
                    </div>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="p-4">
                <h3 className="font-semibold text-gray-800 line-clamp-2 group-hover:text-rose-600 transition-colors">
                  {stream.title}
                </h3>
                {stream.description && (
                  <p className="text-sm text-gray-500 mt-1 line-clamp-1">{stream.description}</p>
                )}
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-rose-100 text-rose-500 flex items-center justify-center text-xs font-bold">
                      {stream.staff?.fullName?.[0]?.toUpperCase() || 'S'}
                    </div>
                    <span className="text-xs text-gray-500">{stream.staff?.fullName || 'Nhân viên'}</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-400">
                    <FiClock size={11} />
                    {stream.startedAt ? fmtDate(stream.startedAt) : fmtDate(stream.createdAt)}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

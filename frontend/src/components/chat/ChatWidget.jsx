import { useState } from 'react';
import { FiMessageCircle } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import AIChatWidget from './AIChatWidget';
import LiveChatWidget from './LiveChatWidget';

export default function ChatWidget() {
  const { user, isRole } = useAuth();
  const [liveOpen, setLiveOpen] = useState(false);

  // Don't show on staff/manager/admin dashboards
  if (user && (isRole('staff') || isRole('admin'))) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3">
      {/* Live chat panel — sits above the FABs when open */}
      {liveOpen && (
        <LiveChatWidget open={liveOpen} onClose={() => setLiveOpen(false)} />
      )}

      {/* Two FABs stacked vertically */}
      <div className="flex flex-col items-end gap-2">
        {/* Live chat FAB — only show if logged-in customer or always to invite login */}
        {!liveOpen && (
          <button
            onClick={() => setLiveOpen(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white pl-3 pr-4 py-2.5 rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all group relative"
          >
            <FiMessageCircle size={18} />
            <span className="text-sm font-semibold">Chat nhân viên</span>
          </button>
        )}

        {/* AI Bot FAB */}
        <AIChatWidget onOpenLiveChat={() => setLiveOpen(true)} />
      </div>
    </div>
  );
}

import { NavLink, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import {
  FiHome, FiPackage, FiShoppingBag, FiUsers, FiBarChart2,
  FiTag, FiGrid, FiList, FiTool, FiFileText,
  FiMessageSquare, FiImage, FiActivity, FiLogOut, FiRefreshCw, FiMessageCircle
} from 'react-icons/fi';
import NotificationBell from '../common/NotificationBell';
import api from '../../services/api';

const MENUS = {
  admin: [
    {
      title: 'Tổng quan',
      items: [
        { label: 'Dashboard', icon: FiHome, to: '/manager' },
      ]
    },
    {
      title: 'Kinh doanh',
      items: [
        { label: 'Sản phẩm', icon: FiShoppingBag, to: '/manager/products' },
        { label: 'Danh mục', icon: FiGrid, to: '/manager/categories' },
        { label: 'Voucher', icon: FiTag, to: '/manager/vouchers' },
      ]
    },
    {
      title: 'Vận hành',
      items: [
        { label: 'Đơn hàng', icon: FiPackage, to: '/manager/orders' },
        { label: 'Kho hàng', icon: FiTool, to: '/manager/inventory' },
        { label: 'Báo cáo', icon: FiBarChart2, to: '/manager/reports' },
      ]
    },
    {
      title: 'Hệ thống',
      items: [
        { label: 'Quản lý tài khoản', icon: FiUsers, to: '/admin/users' },
        { label: 'Quản lý banner', icon: FiImage, to: '/admin/banners' },
        { label: 'Nội dung website', icon: FiFileText, to: '/admin/content' },
        { label: 'Nhật ký hệ thống', icon: FiActivity, to: '/admin/logs' },
      ]
    }
  ],
  staff: [
    {
      title: 'Công việc',
      items: [
        { label: 'Quản lý đơn hàng', icon: FiPackage, to: '/staff/orders' },
        { label: 'Đặt hàng tùy chỉnh', icon: FiList, to: '/staff/custom-orders' },
      ]
    },
    {
      title: 'Hỗ trợ khách hàng',
      items: [
        { label: 'Chat trực tiếp', icon: FiMessageCircle, to: '/staff/chat' },
        { label: 'Đổi trả / Khiếu nại', icon: FiRefreshCw, to: '/staff/complaints' },
        { label: 'Tin nhắn liên hệ', icon: FiMessageSquare, to: '/staff/contacts' },
      ]
    }
  ]
};

const ROLE_CONFIG = {
  admin: {
    label: 'Quản trị viên',
    badge: 'ADMIN',
    gradient: 'from-slate-800 via-slate-900 to-slate-950',
    avatarBg: 'bg-violet-500',
    activeText: 'text-violet-700',
    activeBg: 'bg-violet-50',
    activeBorder: 'border-violet-500',
    onlineDot: 'bg-violet-400',
  },
  staff: {
    label: 'Nhân viên',
    badge: 'STAFF',
    gradient: 'from-blue-600 via-blue-700 to-indigo-800',
    avatarBg: 'bg-blue-400',
    activeText: 'text-blue-700',
    activeBg: 'bg-blue-50',
    activeBorder: 'border-blue-500',
    onlineDot: 'bg-blue-400',
  }
};

const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const role = user?.Role?.name;
  const [lowStockCount, setLowStockCount] = useState(0);

  useEffect(() => {
    if (role === 'admin') {
      api.get('/inventory/low-stock-count').then(r => setLowStockCount(r.data.count || 0)).catch(() => {});
    }
  }, [role]);
  const cfg = ROLE_CONFIG[role] || ROLE_CONFIG.admin;
  const sections = MENUS[role] || [];
  const initials = user?.fullName
    ? user.fullName.trim().split(/\s+/).map(w => w[0]).slice(-2).join('').toUpperCase()
    : '?';

  const handleLogout = () => {
    logout();
    toast.success('Đã đăng xuất thành công');
    navigate('/');
  };

  return (
    <aside className="w-64 h-screen flex flex-col bg-white shrink-0" style={{ boxShadow: '2px 0 16px rgba(0,0,0,0.07)' }}>

      {/* ── Brand + user header ── */}
      <div className={`bg-gradient-to-b ${cfg.gradient} px-4 pt-5 pb-4`}>
        {/* Logo */}
        <div className="flex items-center gap-2.5 mb-5 px-1">
          <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center shrink-0">
            <span className="text-base leading-none">🧶</span>
          </div>
          <div>
            <p className="text-white font-bold text-sm leading-tight">YarnShop</p>
            <p className="text-white/40 text-[9px] uppercase tracking-[0.15em]">Dashboard</p>
          </div>
        </div>

        {/* User card */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-3 flex items-center gap-3 border border-white/10">
          <div className={`w-10 h-10 rounded-xl ${cfg.avatarBg} flex items-center justify-center text-white font-bold text-sm shrink-0 shadow`}>
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-white font-semibold text-[13px] truncate leading-snug">{user?.fullName}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={`w-1.5 h-1.5 rounded-full ${cfg.onlineDot} shrink-0`} />
              <span className="text-white/55 text-[11px]">{cfg.label}</span>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {role === 'staff' && <NotificationBell isStaff light openRight />}
            <span className="text-[9px] font-bold bg-white/15 text-white/80 px-2 py-0.5 rounded-md tracking-wider border border-white/10">
              {cfg.badge}
            </span>
          </div>
        </div>
      </div>

      {/* ── Navigation ── */}
      <nav className="flex-1 py-4 px-3 overflow-y-auto">
        {sections.map((section, si) => (
          <div key={section.title} className={si > 0 ? 'mt-5' : ''}>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.12em] px-3 mb-2">
              {section.title}
            </p>
            <div className="space-y-0.5">
              {section.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to.split('/').length <= 2}
                  className={({ isActive }) =>
                    `group flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all border-l-2 ${
                      isActive
                        ? `${cfg.activeBg} ${cfg.activeText} ${cfg.activeBorder}`
                        : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50 border-transparent'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <item.icon
                        size={15}
                        className={`shrink-0 transition-colors ${
                          isActive ? cfg.activeText : 'text-gray-400 group-hover:text-gray-600'
                        }`}
                      />
                      <span className="truncate flex-1">{item.label}</span>
                      {item.to === '/manager/inventory' && lowStockCount > 0 && (
                        <span className="ml-auto text-[10px] font-bold bg-orange-500 text-white rounded-full w-4 h-4 flex items-center justify-center shrink-0">
                          {lowStockCount > 9 ? '9+' : lowStockCount}
                        </span>
                      )}
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* ── Logout ── */}
      <div className="px-3 pb-4">
        <div className="h-px bg-gray-100 mb-3" />
        <button
          onClick={handleLogout}
          className="group w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all border-l-2 border-transparent hover:border-red-400"
        >
          <FiLogOut size={15} className="shrink-0 text-gray-400 group-hover:text-red-500 transition-colors" />
          Đăng xuất
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;

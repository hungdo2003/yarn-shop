import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { formatCurrency } from '../../utils/formatters';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Spinner from '../../components/common/Spinner';

const StatCard = ({ title, value, icon, color, sub }) => (
  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex items-center gap-4">
    <div className={`text-3xl p-3 rounded-xl ${color}`}>{icon}</div>
    <div>
      <p className="text-gray-500 text-xs">{title}</p>
      <p className="text-2xl font-bold text-gray-900 mt-0.5">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  </div>
);

const ManagerDashboard = () => {
  const [summary, setSummary] = useState(null);
  const [revenue, setRevenue] = useState([]);
  const [bestSelling, setBestSelling] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/reports/summary'),
      api.get('/reports/revenue', { params: { period: 'month', year: new Date().getFullYear() } }),
      api.get('/reports/best-selling')
    ]).then(([s, r, b]) => {
      setSummary(s.data);
      setRevenue(r.data);
      setBestSelling(b.data);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex-1 flex items-center justify-center min-h-[400px]"><Spinner size="lg" /></div>;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Tổng Quan Quản Lý</h1>
        <p className="text-gray-500 text-sm mt-1">Xem nhanh tình hình kinh doanh</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Doanh thu tháng" value={formatCurrency(summary?.monthRevenue || summary?.totalRevenue || 0)} icon="💰" color="bg-green-50" />
        <StatCard title="Tổng đơn hàng" value={summary?.totalOrders || 0} icon="📦" color="bg-blue-50" />
        <StatCard title="Khách hàng" value={summary?.totalCustomers || 0} icon="👥" color="bg-purple-50" />
        <StatCard title="Sản phẩm đang bán" value={summary?.totalProducts || 0} icon="🧶" color="bg-pink-50" />
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <h3 className="font-semibold text-gray-800 mb-4">Doanh thu theo tháng ({new Date().getFullYear()})</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={revenue}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="period" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={v => formatCurrency(v)} labelFormatter={l => `Tháng ${l}`} />
              <Bar dataKey="revenue" fill="#f43f5e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <h3 className="font-semibold text-gray-800 mb-4">Sản phẩm bán chạy</h3>
          <div className="space-y-3">
            {bestSelling.slice(0, 6).map((p, i) => (
              <div key={p.id} className="flex items-center gap-3">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${i < 3 ? 'bg-rose-100 text-rose-600' : 'bg-gray-100 text-gray-500'}`}>{i + 1}</span>
                {p.thumbnailImage
                  ? <img src={p.thumbnailImage} alt="" className="w-9 h-9 rounded-lg object-cover" />
                  : <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center text-base">🧶</div>}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 line-clamp-1">{p.name}</p>
                  <p className="text-xs text-gray-400">Đã bán: {p.sold}</p>
                </div>
                <p className="text-sm font-semibold text-rose-500 shrink-0">{formatCurrency(p.price)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div>
        <h3 className="font-semibold text-gray-800 mb-3">Truy cập nhanh</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[
            { label: 'Quản lý sản phẩm', link: '/manager/products', icon: '🧶' },
            { label: 'Đơn hàng', link: '/manager/orders', icon: '📦' },
            { label: 'Kho hàng', link: '/manager/inventory', icon: '📊' },
            { label: 'Voucher', link: '/manager/vouchers', icon: '🎟️' },
            { label: 'Đặt hàng tùy chỉnh', link: '/manager/custom-orders', icon: '✨' },
            { label: 'Báo cáo', link: '/manager/reports', icon: '📈' },
          ].map((item) => (
            <Link key={item.link} to={item.link} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-center hover:shadow-md hover:border-rose-200 transition-all group">
              <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">{item.icon}</div>
              <p className="font-medium text-sm text-gray-700 group-hover:text-rose-600">{item.label}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ManagerDashboard;

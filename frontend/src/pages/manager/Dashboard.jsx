import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import useFetch from '../../hooks/useFetch';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Spinner from '../../components/common/Spinner';
import Pagination from '../../components/common/Pagination';

const StatusBadge = ({ status, map }) => {
  const cfg = map[status] || { label: status, color: 'bg-gray-100 text-gray-600' };
  return <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cfg.color}`}>{cfg.label}</span>;
};

const DateRangeFilter = ({ from, to, onFrom, onTo, onClear }) => (
  <div className="flex flex-wrap items-center gap-1.5">
    <input type="date" value={from} onChange={e => onFrom(e.target.value)}
      className="border border-gray-200 rounded-lg px-2 py-1.5 text-base text-gray-600 focus:outline-none focus:ring-1 focus:ring-rose-300 min-w-0" />
    <span className="text-gray-300 text-xs">—</span>
    <input type="date" value={to} onChange={e => onTo(e.target.value)}
      className="border border-gray-200 rounded-lg px-2 py-1.5 text-base text-gray-600 focus:outline-none focus:ring-1 focus:ring-rose-300 min-w-0" />
    {(from || to) && (
      <button onClick={onClear} className="text-xs text-gray-400 hover:text-rose-500 transition">✕</button>
    )}
  </div>
);

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

const OrdersSection = () => {
  const [tab, setTab] = useState('regular');

  const REG_STATUS = {
    pending_payment: { label: 'Chờ thanh toán', color: 'bg-orange-100 text-orange-700' },
    paid:            { label: 'Đã thanh toán',  color: 'bg-blue-100 text-blue-700' },
    confirmed:       { label: 'Đã xác nhận',    color: 'bg-indigo-100 text-indigo-700' },
    preparing:       { label: 'Đang chuẩn bị',  color: 'bg-purple-100 text-purple-700' },
    shipping:        { label: 'Đang giao hàng', color: 'bg-cyan-100 text-cyan-700' },
    delivered:       { label: 'Đã giao hàng',   color: 'bg-green-100 text-green-700' },
    cancelled:       { label: 'Đã hủy',         color: 'bg-red-100 text-red-700' },
  };

  const CUS_STATUS = {
    submitted:      { label: 'Đã gửi yêu cầu',   color: 'bg-gray-100 text-gray-600' },
    reviewing:      { label: 'Đang xem xét',      color: 'bg-blue-100 text-blue-700' },
    quoted:         { label: 'Đã báo giá',        color: 'bg-amber-100 text-amber-700' },
    deposit_paid:   { label: 'Đã thanh toán cọc', color: 'bg-indigo-100 text-indigo-700' },
    in_production:  { label: 'Đang sản xuất',     color: 'bg-purple-100 text-purple-700' },
    completed:      { label: 'Hoàn thành',        color: 'bg-teal-100 text-teal-700' },
    delivered:      { label: 'Đã giao hàng',      color: 'bg-green-100 text-green-700' },
    remaining_paid: { label: 'Đã thanh toán đủ',  color: 'bg-green-100 text-green-700' },
    cancelled:      { label: 'Đã hủy',            color: 'bg-red-100 text-red-700' },
  };

  const [regPage, setRegPage] = useState(1);
  const [regStatus, setRegStatus] = useState('');
  const [regFrom, setRegFrom]   = useState('');
  const [regTo, setRegTo]       = useState('');

  const [cusPage, setCusPage]     = useState(1);
  const [cusStatus, setCusStatus] = useState('');
  const [cusFrom, setCusFrom]     = useState('');
  const [cusTo, setCusTo]         = useState('');

  const { data: regData, loading: regLoading } = useFetch('/orders', {
    page: regPage, limit: 8,
    ...(regStatus && { status: regStatus }),
    ...(regFrom   && { from: regFrom }),
    ...(regTo     && { to: regTo }),
  });

  const { data: cusData, loading: cusLoading } = useFetch('/custom-orders', {
    page: cusPage, limit: 8,
    ...(cusStatus && { status: cusStatus }),
    ...(cusFrom   && { from: cusFrom }),
    ...(cusTo     && { to: cusTo }),
  });

  const resetReg = () => { setRegPage(1); setRegStatus(''); setRegFrom(''); setRegTo(''); };
  const resetCus = () => { setCusPage(1); setCusStatus(''); setCusFrom(''); setCusTo(''); };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-5 pt-5 pb-3 border-b">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <h3 className="font-semibold text-gray-800">Đơn hàng</h3>
          <div className="flex gap-2 overflow-x-auto">
            {[['regular', '🛒 Đơn thường'], ['custom', '✂️ Đơn tùy chỉnh']].map(([v, l]) => (
              <button key={v} onClick={() => setTab(v)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap ${tab === v ? 'bg-rose-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                {l}
              </button>
            ))}
          </div>
        </div>

        {tab === 'regular' && (
          <div className="flex flex-wrap gap-2 items-center">
            <select value={regStatus} onChange={e => { setRegStatus(e.target.value); setRegPage(1); }}
              className="border border-gray-200 rounded-lg px-2 py-1.5 text-base text-gray-600 focus:outline-none focus:ring-1 focus:ring-rose-300">
              <option value="">Tất cả trạng thái</option>
              {Object.entries(REG_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
            <DateRangeFilter from={regFrom} to={regTo}
              onFrom={v => { setRegFrom(v); setRegPage(1); }}
              onTo={v => { setRegTo(v); setRegPage(1); }}
              onClear={resetReg} />
          </div>
        )}

        {tab === 'custom' && (
          <div className="flex flex-wrap gap-2 items-center">
            <select value={cusStatus} onChange={e => { setCusStatus(e.target.value); setCusPage(1); }}
              className="border border-gray-200 rounded-lg px-2 py-1.5 text-base text-gray-600 focus:outline-none focus:ring-1 focus:ring-rose-300">
              <option value="">Tất cả trạng thái</option>
              {Object.entries(CUS_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
            <DateRangeFilter from={cusFrom} to={cusTo}
              onFrom={v => { setCusFrom(v); setCusPage(1); }}
              onTo={v => { setCusTo(v); setCusPage(1); }}
              onClear={resetCus} />
          </div>
        )}
      </div>

      {tab === 'regular' && (
        regLoading ? <div className="flex justify-center py-10"><Spinner /></div> : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    {[
                      ['Mã đơn', ''], ['Khách hàng', ''], ['SĐT', 'hidden md:table-cell'],
                      ['Tổng tiền', ''], ['Trạng thái', ''], ['Ngày đặt', 'hidden sm:table-cell']
                    ].map(([h, cls]) => (
                      <th key={h} className={`text-left px-4 py-3 text-xs font-semibold text-gray-500 whitespace-nowrap ${cls}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {!regData?.items?.length
                    ? <tr><td colSpan={6} className="text-center py-10 text-gray-400">Chưa có đơn hàng</td></tr>
                    : regData.items.map(o => (
                      <tr key={o.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3"><code className="text-xs font-mono text-rose-600">{o.orderCode}</code></td>
                        <td className="px-4 py-3 font-medium text-gray-800 max-w-[140px] truncate">{o.shippingName}</td>
                        <td className="px-4 py-3 text-gray-500 text-xs hidden md:table-cell">{o.shippingPhone}</td>
                        <td className="px-4 py-3 font-semibold text-gray-800">{formatCurrency(o.total)}</td>
                        <td className="px-4 py-3"><StatusBadge status={o.status} map={REG_STATUS} /></td>
                        <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap hidden sm:table-cell">{formatDate(o.createdAt)}</td>
                      </tr>
                    ))
                  }
                </tbody>
              </table>
            </div>
            <div className="px-4 pb-3">
              <Pagination pagination={regData?.pagination} onPageChange={setRegPage} />
            </div>
          </>
        )
      )}

      {tab === 'custom' && (
        cusLoading ? <div className="flex justify-center py-10"><Spinner /></div> : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    {[
                      ['Mã đơn', ''], ['Khách hàng', ''], ['Mô tả', 'hidden md:table-cell'],
                      ['Báo giá', ''], ['Trạng thái', ''], ['Ngày gửi', 'hidden sm:table-cell']
                    ].map(([h, cls]) => (
                      <th key={h} className={`text-left px-4 py-3 text-xs font-semibold text-gray-500 whitespace-nowrap ${cls}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {!cusData?.items?.length
                    ? <tr><td colSpan={6} className="text-center py-10 text-gray-400">Chưa có đơn tùy chỉnh</td></tr>
                    : cusData.items.map(o => (
                      <tr key={o.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3"><code className="text-xs font-mono text-violet-600">{o.code}</code></td>
                        <td className="px-4 py-3 font-medium text-gray-800 max-w-[120px] truncate">{o.User?.fullName || '—'}</td>
                        <td className="px-4 py-3 text-gray-500 text-xs max-w-[200px] truncate hidden md:table-cell">{o.description}</td>
                        <td className="px-4 py-3 font-semibold text-gray-800">
                          {o.quotedPrice ? formatCurrency(o.quotedPrice) : <span className="text-gray-400 text-xs italic">Chưa có</span>}
                        </td>
                        <td className="px-4 py-3"><StatusBadge status={o.status} map={CUS_STATUS} /></td>
                        <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap hidden sm:table-cell">{formatDate(o.createdAt)}</td>
                      </tr>
                    ))
                  }
                </tbody>
              </table>
            </div>
            <div className="px-4 pb-3">
              <Pagination pagination={cusData?.pagination} onPageChange={setCusPage} />
            </div>
          </>
        )
      )}
    </div>
  );
};

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

  const QUICK_ACCESS = [
    { label: 'Quản lý sản phẩm',   link: '/manager/products',      icon: '🧶' },
    { label: 'Đơn hàng',           link: '/manager/orders',        icon: '📦' },
    { label: 'Kho hàng',           link: '/manager/inventory',     icon: '📊' },
    { label: 'Voucher',            link: '/manager/vouchers',      icon: '🎟️' },
    { label: 'Đặt hàng tùy chỉnh', link: '/manager/custom-orders', icon: '✨' },
    { label: 'Báo cáo',            link: '/manager/reports',       icon: '📈' },
  ];

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
          <h3 className="font-semibold text-gray-800 mb-4">{`Doanh thu theo tháng (${new Date().getFullYear()})`}</h3>
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
                  <p className="text-xs text-gray-400">{`Đã bán: ${p.sold}`}</p>
                </div>
                <p className="text-sm font-semibold text-rose-500 shrink-0">{formatCurrency(p.price)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <OrdersSection />

      <div>
        <h3 className="font-semibold text-gray-800 mb-3">Truy cập nhanh</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {QUICK_ACCESS.map((item) => (
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

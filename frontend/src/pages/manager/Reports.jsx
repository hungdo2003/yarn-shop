import { useState, useEffect } from 'react';
import api from '../../services/api';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

const fmt = (n) => Number(n || 0).toLocaleString('vi-VN') + 'đ';
const fmtM = (n) => {
  if (n >= 1e9) return (n / 1e9).toFixed(1) + ' tỷ';
  if (n >= 1e6) return (n / 1e6).toFixed(1) + ' triệu';
  if (n >= 1e3) return (n / 1e3).toFixed(0) + 'k';
  return n;
};

const MONTH_NAMES = ['T1','T2','T3','T4','T5','T6','T7','T8','T9','T10','T11','T12'];

const Trend = ({ value }) => {
  if (value === null || value === undefined) return null;
  const up = value >= 0;
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-semibold px-1.5 py-0.5 rounded-full ${up ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'}`}>
      {up ? '↑' : '↓'} {Math.abs(value)}%
    </span>
  );
};

const KpiCard = ({ icon, label, value, sub, trend, color = 'rose' }) => {
  const colors = {
    rose:   'from-rose-500 to-pink-600',
    blue:   'from-blue-500 to-indigo-600',
    emerald:'from-emerald-500 to-teal-600',
    amber:  'from-amber-500 to-orange-500',
    violet: 'from-violet-500 to-purple-600',
  };
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-start gap-4">
      <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${colors[color]} flex items-center justify-center text-white text-xl shrink-0 shadow-sm`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-500 font-medium mb-0.5">{label}</p>
        <p className="text-2xl font-bold text-gray-800 leading-tight truncate">{value}</p>
        {(sub || trend !== undefined) && (
          <div className="flex items-center gap-2 mt-1">
            {sub && <span className="text-xs text-gray-400">{sub}</span>}
            {trend !== undefined && <Trend value={trend} />}
          </div>
        )}
      </div>
    </div>
  );
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-lg px-4 py-3 text-sm">
      <p className="font-semibold text-gray-700 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full inline-block" style={{ background: p.color }} />
          {p.name}: <strong>{typeof p.value === 'number' && p.value > 10000 ? fmt(p.value) : p.value}</strong>
        </p>
      ))}
    </div>
  );
};

export default function Reports() {
  const year = new Date().getFullYear();
  const [selYear, setSelYear] = useState(year);
  const [tab, setTab] = useState('overview');

  const [summary, setSummary] = useState(null);
  const [revenue, setRevenue] = useState([]);
  const [orderStats, setOrderStats] = useState([]);
  const [categories, setCategories] = useState([]);
  const [bestSelling, setBestSelling] = useState([]);
  const [topCustomers, setTopCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get('/reports/summary'),
      api.get('/reports/revenue', { params: { period: 'month', year: selYear } }),
      api.get('/reports/order-stats'),
      api.get('/reports/category-breakdown', { params: { year: selYear } }),
      api.get('/reports/best-selling', { params: { year: selYear, limit: 8 } }),
      api.get('/reports/loyal-customers', { params: { year: selYear, limit: 8 } }),
    ]).then(([s, r, os, cat, bs, lc]) => {
      setSummary(s.data);
      // Fill all 12 months
      const byPeriod = {};
      (r.data || []).forEach(d => { byPeriod[d.period] = d; });
      setRevenue(MONTH_NAMES.map((name, i) => {
        const key = `${selYear}-${String(i + 1).padStart(2, '0')}`;
        return { name, ...( byPeriod[key] || { revenue: 0, orderCount: 0, prevRevenue: 0, avgOrder: 0 }) };
      }));
      setOrderStats(os.data || []);
      setCategories(cat.data || []);
      setBestSelling(bs.data || []);
      setTopCustomers(lc.data || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [selYear]);

  const totalRevCat = categories.reduce((s, c) => s + c.revenue, 0);

  const TABS = [
    { id: 'overview', label: 'Tổng quan' },
    { id: 'revenue', label: 'Doanh thu' },
    { id: 'products', label: 'Sản phẩm' },
    { id: 'customers', label: 'Khách hàng' },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Báo cáo & Thống kê</h1>
          <p className="text-sm text-gray-400 mt-0.5">Dữ liệu kinh doanh YarnShop</p>
        </div>
        <div className="flex items-center gap-2">
          <select value={selYear} onChange={e => setSelYear(Number(e.target.value))}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-rose-300 bg-white">
            {[year - 1, year, year + 1].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${tab === t.id ? 'bg-white shadow text-rose-600' : 'text-gray-500 hover:text-gray-700'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-3 border-rose-400 border-t-transparent rounded-full animate-spin" style={{ borderWidth: 3 }} />
        </div>
      ) : (
        <>
          {/* ── OVERVIEW TAB ── */}
          {tab === 'overview' && (
            <div className="space-y-6">
              {/* KPI cards */}
              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                <KpiCard icon="💰" label="Doanh thu tháng này" value={fmtM(summary?.thisMonthRevenue)} sub={`Cả năm: ${fmtM(summary?.totalRevenue)}`} trend={summary?.revTrend} color="rose" />
                <KpiCard icon="📦" label="Đơn hàng tháng này" value={summary?.thisMonthOrders?.toLocaleString()} sub={`Tổng: ${summary?.totalOrders?.toLocaleString()}`} trend={summary?.orderTrend} color="blue" />
                <KpiCard icon="🛒" label="Giá trị đơn TB" value={fmtM(summary?.avgOrder)} sub="Trên các đơn hoàn thành" color="violet" />
                <KpiCard icon="👥" label="Khách hàng" value={summary?.totalCustomers?.toLocaleString()} sub={`+${summary?.newThisMonth} tháng này`} color="emerald" />
                <KpiCard icon="📦" label="Sản phẩm đang bán" value={summary?.totalProducts?.toLocaleString()} sub={summary?.lowStock ? `⚠️ ${summary.lowStock} sắp hết hàng` : 'Tất cả còn hàng'} color="amber" />
                <KpiCard icon="❌" label="Đơn bị hủy" value={summary?.cancelledOrders?.toLocaleString()} sub="Tổng từ trước đến nay" color="rose" />
              </div>

              {/* Revenue area chart */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-bold text-gray-800">Doanh thu theo tháng — {selYear}</h2>
                </div>
                <ResponsiveContainer width="100%" height={260}>
                  <AreaChart data={revenue} margin={{ left: 0, right: 8 }}>
                    <defs>
                      <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="prevGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.1} />
                        <stop offset="95%" stopColor="#94a3b8" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={fmtM} width={52} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Area type="monotone" dataKey="prevRevenue" name={`Năm ${selYear - 1}`} stroke="#cbd5e1" fill="url(#prevGrad)" strokeWidth={1.5} strokeDasharray="4 3" dot={false} />
                    <Area type="monotone" dataKey="revenue" name={`Năm ${selYear}`} stroke="#f43f5e" fill="url(#revGrad)" strokeWidth={2.5} dot={{ r: 3, fill: '#f43f5e' }} activeDot={{ r: 5 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Order status pie + category bar */}
              <div className="grid md:grid-cols-2 gap-5">
                {/* Order status donut */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                  <h2 className="font-bold text-gray-800 mb-4">Phân bổ trạng thái đơn hàng</h2>
                  <div className="flex items-center gap-4">
                    <ResponsiveContainer width={160} height={160}>
                      <PieChart>
                        <Pie data={orderStats} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={2} dataKey="count">
                          {orderStats.map((s, i) => <Cell key={i} fill={s.color} />)}
                        </Pie>
                        <Tooltip formatter={(v, n, p) => [v + ' đơn', p.payload.label]} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="flex-1 space-y-1.5">
                      {orderStats.map(s => (
                        <div key={s.status} className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: s.color }} />
                            <span className="text-gray-600">{s.label}</span>
                          </div>
                          <span className="font-bold text-gray-700">{s.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Category breakdown */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                  <h2 className="font-bold text-gray-800 mb-4">Doanh thu theo danh mục</h2>
                  <div className="space-y-3">
                    {categories.slice(0, 6).map((c, i) => {
                      const pct = totalRevCat > 0 ? (c.revenue / totalRevCat * 100) : 0;
                      const colors2 = ['#f43f5e', '#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#06b6d4'];
                      return (
                        <div key={c.categoryId || i}>
                          <div className="flex items-center justify-between text-xs mb-0.5">
                            <span className="font-medium text-gray-700">{c.name}</span>
                            <span className="text-gray-500">{fmtM(c.revenue)}đ · {c.unitsSold} sp</span>
                          </div>
                          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: colors2[i % colors2.length] }} />
                          </div>
                        </div>
                      );
                    })}
                    {categories.length === 0 && <p className="text-sm text-gray-400 py-4 text-center">Chưa có dữ liệu</p>}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── REVENUE TAB ── */}
          {tab === 'revenue' && (
            <div className="space-y-5">
              {/* Bar + order count dual axis */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                <h2 className="font-bold text-gray-800 mb-4">Doanh thu & số đơn theo tháng</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={revenue} margin={{ left: 0, right: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <YAxis yAxisId="left" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={fmtM} width={54} />
                    <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={36} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar yAxisId="left" dataKey="revenue" name="Doanh thu" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                    <Bar yAxisId="right" dataKey="orderCount" name="Số đơn" fill="#c4b5fd" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Monthly table */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-5 py-4 border-b">
                  <h2 className="font-bold text-gray-800">Chi tiết doanh thu theo tháng</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
                        <th className="px-5 py-3 text-left">Tháng</th>
                        <th className="px-5 py-3 text-right">Doanh thu</th>
                        <th className="px-5 py-3 text-right">Năm trước</th>
                        <th className="px-5 py-3 text-right">Tăng trưởng</th>
                        <th className="px-5 py-3 text-right">Số đơn</th>
                        <th className="px-5 py-3 text-right">Đơn TB</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {revenue.map((r, i) => {
                        const growth = r.prevRevenue > 0 ? ((r.revenue - r.prevRevenue) / r.prevRevenue * 100).toFixed(1) : null;
                        return (
                          <tr key={i} className="hover:bg-gray-50 transition">
                            <td className="px-5 py-3 font-medium text-gray-800">{r.name}/{selYear}</td>
                            <td className="px-5 py-3 text-right font-semibold text-rose-600">{fmt(r.revenue)}</td>
                            <td className="px-5 py-3 text-right text-gray-400">{fmt(r.prevRevenue)}</td>
                            <td className="px-5 py-3 text-right">
                              {growth !== null ? <Trend value={parseFloat(growth)} /> : <span className="text-gray-300">—</span>}
                            </td>
                            <td className="px-5 py-3 text-right text-gray-600">{r.orderCount}</td>
                            <td className="px-5 py-3 text-right text-gray-500">{r.orderCount > 0 ? fmt(r.avgOrder) : '—'}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr className="bg-rose-50 font-bold text-rose-700">
                        <td className="px-5 py-3">Tổng {selYear}</td>
                        <td className="px-5 py-3 text-right">{fmt(revenue.reduce((s, r) => s + r.revenue, 0))}</td>
                        <td className="px-5 py-3 text-right text-gray-400">{fmt(revenue.reduce((s, r) => s + r.prevRevenue, 0))}</td>
                        <td colSpan={3} />
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ── PRODUCTS TAB ── */}
          {tab === 'products' && (
            <div className="space-y-5">
              {/* Best selling table */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-5 py-4 border-b">
                  <h2 className="font-bold text-gray-800">Sản phẩm bán chạy — {selYear}</h2>
                </div>
                {bestSelling.length === 0 ? (
                  <div className="py-12 text-center text-gray-400">Chưa có dữ liệu bán hàng</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
                          <th className="px-5 py-3 text-left w-8">#</th>
                          <th className="px-5 py-3 text-left">Sản phẩm</th>
                          <th className="px-5 py-3 text-right">Đã bán</th>
                          <th className="px-5 py-3 text-right">Doanh thu</th>
                          <th className="px-5 py-3 text-left w-40">Tỷ lệ</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {bestSelling.map((p, i) => {
                          const maxSold = bestSelling[0]?.unitsSold || 1;
                          const pct = Math.max(4, (p.unitsSold / maxSold) * 100);
                          return (
                            <tr key={p.id} className="hover:bg-gray-50 transition">
                              <td className="px-5 py-3 text-gray-300 font-bold text-base">{i + 1}</td>
                              <td className="px-5 py-3">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                                    {p.thumbnailImage
                                      ? <img src={p.thumbnailImage} alt="" className="w-full h-full object-cover" />
                                      : <div className="w-full h-full flex items-center justify-center text-lg">🧶</div>}
                                  </div>
                                  <p className="font-medium text-gray-800 line-clamp-1">{p.name}</p>
                                </div>
                              </td>
                              <td className="px-5 py-3 text-right font-bold text-gray-700">{p.unitsSold.toLocaleString()}</td>
                              <td className="px-5 py-3 text-right font-semibold text-rose-600">{fmt(p.revenue)}</td>
                              <td className="px-5 py-3">
                                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden w-32">
                                  <div className="h-full bg-rose-400 rounded-full" style={{ width: `${pct}%` }} />
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Category chart */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                <h2 className="font-bold text-gray-800 mb-4">Doanh thu theo danh mục</h2>
                {categories.length > 0 ? (
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={categories} layout="vertical" margin={{ left: 8, right: 16 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={fmtM} />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: '#374151' }} axisLine={false} tickLine={false} width={100} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="revenue" name="Doanh thu" radius={[0, 4, 4, 0]}>
                        {categories.map((_, i) => {
                          const cs = ['#f43f5e','#8b5cf6','#3b82f6','#10b981','#f59e0b','#06b6d4'];
                          return <Cell key={i} fill={cs[i % cs.length]} />;
                        })}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : <p className="text-sm text-gray-400 py-6 text-center">Chưa có dữ liệu</p>}
              </div>
            </div>
          )}

          {/* ── CUSTOMERS TAB ── */}
          {tab === 'customers' && (
            <div className="space-y-5">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-5 py-4 border-b flex items-center justify-between">
                  <h2 className="font-bold text-gray-800">Khách hàng thân thiết — {selYear}</h2>
                  <span className="text-xs text-gray-400">Xếp theo doanh thu</span>
                </div>
                {topCustomers.length === 0 ? (
                  <div className="py-12 text-center text-gray-400">Chưa có dữ liệu</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
                          <th className="px-5 py-3 text-left w-8">#</th>
                          <th className="px-5 py-3 text-left">Khách hàng</th>
                          <th className="px-5 py-3 text-right">Số đơn</th>
                          <th className="px-5 py-3 text-right">Tổng chi tiêu</th>
                          <th className="px-5 py-3 text-right">Điểm tích lũy</th>
                          <th className="px-5 py-3 text-left w-36">Mức chi tiêu</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {topCustomers.map((c, i) => {
                          const maxSpent = topCustomers[0]?.totalSpent || 1;
                          const pct = Math.max(4, (c.totalSpent / maxSpent) * 100);
                          const medals = ['🥇', '🥈', '🥉'];
                          return (
                            <tr key={c.id} className="hover:bg-gray-50 transition">
                              <td className="px-5 py-3 text-lg">{medals[i] || <span className="text-gray-300 font-bold text-base">{i + 1}</span>}</td>
                              <td className="px-5 py-3">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-rose-400 to-pink-500 text-white flex items-center justify-center text-xs font-bold shrink-0">
                                    {c.fullName?.[0]?.toUpperCase() || '?'}
                                  </div>
                                  <div>
                                    <p className="font-semibold text-gray-800">{c.fullName}</p>
                                    <p className="text-xs text-gray-400">{c.email}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-5 py-3 text-right font-medium text-gray-700">{c.totalOrders}</td>
                              <td className="px-5 py-3 text-right font-bold text-emerald-600">{fmt(c.totalSpent)}</td>
                              <td className="px-5 py-3 text-right text-amber-500 font-medium">{(c.loyaltyPoints || 0).toLocaleString()} ✦</td>
                              <td className="px-5 py-3">
                                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden w-28">
                                  <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${pct}%` }} />
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Customer KPIs */}
              <div className="grid sm:grid-cols-3 gap-4">
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 text-center">
                  <p className="text-3xl font-bold text-gray-800">{summary?.totalCustomers?.toLocaleString() || 0}</p>
                  <p className="text-sm text-gray-500 mt-1">Tổng khách hàng</p>
                </div>
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 text-center">
                  <p className="text-3xl font-bold text-emerald-600">+{summary?.newThisMonth || 0}</p>
                  <p className="text-sm text-gray-500 mt-1">Khách mới tháng này</p>
                </div>
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 text-center">
                  <p className="text-3xl font-bold text-rose-500">{fmt(summary?.avgOrder)}</p>
                  <p className="text-sm text-gray-500 mt-1">Giá trị đơn hàng TB</p>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

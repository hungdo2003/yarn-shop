import { useState, useEffect } from 'react';
import api from '../../services/api';
import Pagination from '../../components/common/Pagination';
import { formatCurrency, formatDate } from '../../utils/formatters';

const REG_COLOR = {
  pending_payment: 'bg-orange-100 text-orange-700',
  paid: 'bg-blue-100 text-blue-700',
  confirmed: 'bg-indigo-100 text-indigo-700',
  preparing: 'bg-purple-100 text-purple-700',
  shipping: 'bg-cyan-100 text-cyan-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};
const REG_LABEL = {
  pending_payment: 'Chờ thanh toán', paid: 'Đã thanh toán', confirmed: 'Đã xác nhận',
  preparing: 'Đang chuẩn bị', shipping: 'Đang giao', delivered: 'Đã giao', cancelled: 'Đã hủy',
};
const CUS_COLOR = {
  submitted: 'bg-gray-100 text-gray-600',
  reviewing: 'bg-yellow-100 text-yellow-700',
  quoted: 'bg-purple-100 text-purple-700',
  deposit_paid: 'bg-indigo-100 text-indigo-700',
  in_production: 'bg-orange-100 text-orange-700',
  completed: 'bg-teal-100 text-teal-700',
  delivered: 'bg-green-100 text-green-700',
  remaining_paid: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};
const CUS_LABEL = {
  submitted: 'Mới gửi', reviewing: 'Đang xét', quoted: 'Chờ thanh toán',
  deposit_paid: 'Đã đặt cọc', in_production: 'Đang làm', completed: 'Hoàn thành',
  delivered: 'Đã giao', remaining_paid: 'Thanh toán xong', cancelled: 'Đã hủy',
};
const SHIP_LABEL = { standard: 'Tiêu chuẩn', express: 'Hỏa tốc', economy: 'Tiết kiệm' };

const DateFilter = ({ from, to, onFrom, onTo, onClear }) => (
  <div className="flex items-center gap-1.5">
    <input type="date" value={from} onChange={e => onFrom(e.target.value)}
      className="border border-gray-200 rounded-lg px-2 py-1.5 text-base text-gray-600 focus:outline-none focus:ring-1 focus:ring-rose-300" />
    <span className="text-gray-300 text-xs">—</span>
    <input type="date" value={to} onChange={e => onTo(e.target.value)}
      className="border border-gray-200 rounded-lg px-2 py-1.5 text-base text-gray-600 focus:outline-none focus:ring-1 focus:ring-rose-300" />
    {(from || to) && (
      <button onClick={onClear} className="text-gray-400 hover:text-rose-500 text-xs transition">✕</button>
    )}
  </div>
);

export default function OrderMonitor() {
  const [tab, setTab] = useState('regular');

  // Regular orders state
  const [regOrders, setRegOrders] = useState([]);
  const [regTotal, setRegTotal] = useState(0);
  const [regPage, setRegPage] = useState(1);
  const [regStatus, setRegStatus] = useState('');
  const [regSearch, setRegSearch] = useState('');
  const [regFrom, setRegFrom] = useState('');
  const [regTo, setRegTo] = useState('');
  const [regLoading, setRegLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  // Custom orders state
  const [cusOrders, setCusOrders] = useState([]);
  const [cusTotal, setCusTotal] = useState(0);
  const [cusPage, setCusPage] = useState(1);
  const [cusStatus, setCusStatus] = useState('');
  const [cusFrom, setCusFrom] = useState('');
  const [cusTo, setCusTo] = useState('');
  const [cusLoading, setCusLoading] = useState(true);
  const [cusSelected, setCusSelected] = useState(null);

  const loadReg = () => {
    setRegLoading(true);
    api.get('/orders', { params: {
      page: regPage, limit: 10, status: regStatus || undefined,
      search: regSearch || undefined, from: regFrom || undefined, to: regTo || undefined,
    }})
      .then(r => { setRegOrders(r.data.items || []); setRegTotal(r.data.pagination?.total || 0); })
      .finally(() => setRegLoading(false));
  };

  const loadCus = () => {
    setCusLoading(true);
    api.get('/custom-orders', { params: {
      page: cusPage, limit: 10, status: cusStatus || undefined,
      from: cusFrom || undefined, to: cusTo || undefined,
    }})
      .then(r => { setCusOrders(r.data.items || []); setCusTotal(r.data.pagination?.total || 0); })
      .finally(() => setCusLoading(false));
  };

  useEffect(() => { loadReg(); }, [regPage, regStatus, regSearch, regFrom, regTo]);
  useEffect(() => { loadCus(); }, [cusPage, cusStatus, cusFrom, cusTo]);

  const regTotalPages = Math.ceil(regTotal / 10);
  const cusTotalPages = Math.ceil(cusTotal / 10);

  const openDetail = async (o) => {
    const r = await api.get(`/orders/${o.id}`);
    setSelected(r.data);
  };

  const REG_STATUS_PILLS = ['paid', 'confirmed', 'preparing', 'shipping', 'delivered', 'cancelled'];
  const CUS_STATUS_PILLS = ['submitted', 'reviewing', 'quoted', 'deposit_paid', 'in_production', 'completed', 'delivered', 'cancelled'];

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Theo Dõi Đơn Hàng</h1>
        <p className="text-sm text-gray-400 mt-0.5">Chỉ xem — nhân viên xử lý các đơn hàng</p>
      </div>

      {/* Type tabs */}
      <div className="flex gap-2">
        {[['regular', '🛒 Đơn thường'], ['custom', '✂️ Đơn tùy chỉnh']].map(([v, l]) => (
          <button key={v} onClick={() => setTab(v)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition border ${tab === v ? 'bg-rose-500 text-white border-rose-500' : 'bg-white text-gray-600 border-gray-200 hover:border-rose-300'}`}>
            {l}
          </button>
        ))}
      </div>

      {/* ── REGULAR ORDERS ── */}
      {tab === 'regular' && (
        <>
          {/* Status pills */}
          <div className="overflow-x-auto pb-1">
            <div className="flex gap-2 items-center min-w-max">
              <button onClick={() => { setRegStatus(''); setRegPage(1); }}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition ${regStatus === '' ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                Tất cả ({regTotal})
              </button>
              {REG_STATUS_PILLS.map(s => (
                <button key={s} onClick={() => { setRegStatus(s); setRegPage(1); }}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition whitespace-nowrap ${regStatus === s ? 'bg-gray-800 text-white' : `${REG_COLOR[s]} hover:opacity-80`}`}>
                  {REG_LABEL[s]}
                </button>
              ))}
            </div>
          </div>

          {/* Search + date */}
          <div className="bg-white rounded-xl shadow p-4 flex flex-wrap gap-3 items-center">
            <input placeholder="Tìm mã đơn, tên khách, SĐT..."
              value={regSearch} onChange={e => { setRegSearch(e.target.value); setRegPage(1); }}
              className="flex-1 min-w-[200px] border rounded-lg px-3 py-1.5 text-base focus:outline-none focus:ring-2 focus:ring-rose-200" />
            <DateFilter from={regFrom} to={regTo}
              onFrom={v => { setRegFrom(v); setRegPage(1); }}
              onTo={v => { setRegTo(v); setRegPage(1); }}
              onClear={() => { setRegFrom(''); setRegTo(''); setRegPage(1); }} />
          </div>

          <div className="bg-white rounded-xl shadow overflow-hidden">
            <div className="px-4 py-3 border-b">
              <span className="text-sm text-gray-500">Tổng: <strong>{regTotal}</strong> đơn</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    {[
                      ['Mã ĐH', ''], ['Khách hàng', ''], ['SĐT', 'hidden md:table-cell'],
                      ['Vận chuyển', 'hidden md:table-cell'], ['Tổng tiền', ''],
                      ['Thanh toán', 'hidden md:table-cell'], ['Trạng thái', ''], ['', '']
                    ].map(([h, cls]) => (
                      <th key={h} className={`text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase whitespace-nowrap ${cls}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {regLoading
                    ? <tr><td colSpan={8} className="text-center py-12 text-gray-400">Đang tải...</td></tr>
                    : regOrders.length === 0
                      ? <tr><td colSpan={8} className="text-center py-12 text-gray-400">Chưa có đơn hàng</td></tr>
                      : regOrders.map(o => (
                        <tr key={o.id} className="border-t hover:bg-gray-50">
                          <td className="px-4 py-3"><code className="text-xs font-mono text-rose-600">{o.orderCode}</code></td>
                          <td className="px-4 py-3 font-medium text-gray-800 max-w-[140px] truncate">{o.shippingName || o.User?.fullName}</td>
                          <td className="px-4 py-3 text-gray-500 hidden md:table-cell">{o.shippingPhone}</td>
                          <td className="px-4 py-3 text-xs text-gray-500 hidden md:table-cell">{SHIP_LABEL[o.shippingMethod]}</td>
                          <td className="px-4 py-3 font-semibold">{formatCurrency(o.total)}</td>
                          <td className="px-4 py-3 hidden md:table-cell">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${o.Payment?.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                              {o.Payment?.status === 'paid' ? 'Đã TT' : 'Chưa TT'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${REG_COLOR[o.status] || 'bg-gray-100 text-gray-600'}`}>
                              {REG_LABEL[o.status] || o.status}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <button onClick={() => openDetail(o)} className="text-xs text-blue-600 hover:underline">Xem</button>
                          </td>
                        </tr>
                      ))
                  }
                </tbody>
              </table>
            </div>
            <div className="px-4 pb-3">
              <Pagination pagination={{ page: regPage, totalPages: regTotalPages }} onPageChange={setRegPage} />
            </div>
          </div>
        </>
      )}

      {/* ── CUSTOM ORDERS ── */}
      {tab === 'custom' && (
        <>
          {/* Status pills */}
          <div className="overflow-x-auto pb-1">
            <div className="flex gap-2 items-center min-w-max">
              <button onClick={() => { setCusStatus(''); setCusPage(1); }}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition ${cusStatus === '' ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                Tất cả ({cusTotal})
              </button>
              {CUS_STATUS_PILLS.map(s => (
                <button key={s} onClick={() => { setCusStatus(s); setCusPage(1); }}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition whitespace-nowrap ${cusStatus === s ? 'bg-gray-800 text-white' : `${CUS_COLOR[s]} hover:opacity-80`}`}>
                  {CUS_LABEL[s]}
                </button>
              ))}
            </div>
          </div>

          {/* Date filter */}
          <div className="bg-white rounded-xl shadow p-4 flex flex-wrap gap-3 items-center">
            <span className="text-sm text-gray-500">Lọc theo ngày:</span>
            <DateFilter from={cusFrom} to={cusTo}
              onFrom={v => { setCusFrom(v); setCusPage(1); }}
              onTo={v => { setCusTo(v); setCusPage(1); }}
              onClear={() => { setCusFrom(''); setCusTo(''); setCusPage(1); }} />
          </div>

          <div className="bg-white rounded-xl shadow overflow-hidden">
            <div className="px-4 py-3 border-b">
              <span className="text-sm text-gray-500">Tổng: <strong>{cusTotal}</strong> đơn</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    {[
                      ['Mã đơn', ''], ['Khách hàng', ''], ['Mô tả', 'hidden md:table-cell'],
                      ['Báo giá', ''], ['Trạng thái', ''], ['Ngày gửi', 'hidden sm:table-cell'], ['', '']
                    ].map(([h, cls]) => (
                      <th key={h} className={`text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase whitespace-nowrap ${cls}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {cusLoading
                    ? <tr><td colSpan={7} className="text-center py-12 text-gray-400">Đang tải...</td></tr>
                    : cusOrders.length === 0
                      ? <tr><td colSpan={7} className="text-center py-12 text-gray-400">Chưa có đơn tùy chỉnh</td></tr>
                      : cusOrders.map(o => (
                        <tr key={o.id} className="border-t hover:bg-gray-50">
                          <td className="px-4 py-3"><code className="text-xs font-mono text-violet-600">{o.code}</code></td>
                          <td className="px-4 py-3">
                            <p className="font-medium text-gray-800">{o.User?.fullName}</p>
                            <p className="text-xs text-gray-400">{o.User?.phone}</p>
                          </td>
                          <td className="px-4 py-3 max-w-[200px] hidden md:table-cell">
                            <p className="text-xs text-gray-600 line-clamp-2">{o.description}</p>
                          </td>
                          <td className="px-4 py-3 font-semibold">
                            {o.quotedPrice ? formatCurrency(o.quotedPrice) : <span className="text-gray-300 text-xs">—</span>}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CUS_COLOR[o.status] || 'bg-gray-100 text-gray-600'}`}>
                              {CUS_LABEL[o.status] || o.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap hidden sm:table-cell">{formatDate(o.createdAt)}</td>
                          <td className="px-4 py-3">
                            <button onClick={() => setCusSelected(o)} className="text-xs text-blue-600 hover:underline">Xem</button>
                          </td>
                        </tr>
                      ))
                  }
                </tbody>
              </table>
            </div>
            <div className="px-4 pb-3">
              <Pagination pagination={{ page: cusPage, totalPages: cusTotalPages }} onPageChange={setCusPage} />
            </div>
          </div>
        </>
      )}

      {/* Regular order detail modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 pt-10 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 mb-10">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-800">Đơn hàng <code className="text-rose-600">{selected.orderCode}</code></h2>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
            </div>
            <div className="grid grid-cols-2 gap-3 bg-gray-50 rounded-xl p-4 text-sm mb-4">
              <div><p className="text-xs text-gray-400">Khách hàng</p><p className="font-medium">{selected.shippingName}</p></div>
              <div><p className="text-xs text-gray-400">Điện thoại</p><p className="font-medium text-rose-600">{selected.shippingPhone}</p></div>
              <div className="col-span-2"><p className="text-xs text-gray-400">Địa chỉ</p><p className="font-medium">{selected.shippingAddress}</p></div>
              <div>
                <p className="text-xs text-gray-400">Trạng thái</p>
                <span className={`inline-block mt-0.5 text-xs px-2 py-0.5 rounded-full font-medium ${REG_COLOR[selected.status] || ''}`}>
                  {REG_LABEL[selected.status] || selected.status}
                </span>
              </div>
              <div>
                <p className="text-xs text-gray-400">Thanh toán</p>
                <span className={`inline-block mt-0.5 text-xs px-2 py-0.5 rounded-full font-medium ${selected.Payment?.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                  {selected.Payment?.status === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}
                </span>
              </div>
              <div><p className="text-xs text-gray-400">Phí ship</p><p className="font-medium">{formatCurrency(selected.shippingFee || 0)}</p></div>
              <div><p className="text-xs text-gray-400">Tổng tiền</p><p className="font-bold text-rose-600">{formatCurrency(selected.total)}</p></div>
            </div>
            <h3 className="text-sm font-semibold mb-2 text-gray-700">Sản phẩm</h3>
            <div className="space-y-2">
              {selected.OrderDetails?.map(d => (
                <div key={d.id} className="flex items-center gap-3 border rounded-xl p-3">
                  <img src={d.productImage} className="w-10 h-10 rounded-lg object-cover bg-gray-100 shrink-0" onError={e => { e.target.src = 'https://placehold.co/40?text=...'; }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{d.productName}</p>
                    <p className="text-xs text-gray-400">SL: {d.quantity} × {formatCurrency(d.unitPrice)}</p>
                  </div>
                  <p className="text-sm font-semibold shrink-0">{formatCurrency(d.totalPrice)}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-700">
              ℹ️ Chỉ nhân viên mới có thể xử lý đơn hàng này.
            </div>
          </div>
        </div>
      )}

      {/* Custom order detail modal */}
      {cusSelected && (
        <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 pt-10 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 mb-10">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-bold text-gray-800">Đơn tùy chỉnh <code className="text-violet-600">{cusSelected.code}</code></h2>
                <p className="text-sm text-gray-400 mt-0.5">{cusSelected.User?.fullName} · {cusSelected.User?.phone}</p>
              </div>
              <button onClick={() => setCusSelected(null)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 text-sm space-y-2 mb-4">
              <p className="font-semibold text-gray-700">Yêu cầu</p>
              <p className="text-gray-600 leading-relaxed">{cusSelected.description}</p>
              <div className="flex flex-wrap gap-3 text-xs text-gray-500 pt-1">
                {cusSelected.yarnColor && <span>🎨 {cusSelected.yarnColor}</span>}
                {cusSelected.size && <span>📐 {cusSelected.size}</span>}
              </div>
              {cusSelected.CustomOrderImages?.length > 0 && (
                <div className="flex gap-2 flex-wrap pt-1">
                  {cusSelected.CustomOrderImages.map((img, i) => (
                    <img key={i} src={img.imageUrl} alt="" className="w-16 h-16 rounded-lg object-cover border" />
                  ))}
                </div>
              )}
            </div>
            {cusSelected.quotedPrice && (
              <div className="bg-purple-50 border border-purple-100 rounded-xl px-4 py-3 text-sm space-y-1 mb-4">
                <p className="font-semibold text-purple-700">Báo giá</p>
                <div className="flex justify-between"><span className="text-gray-600">Giá:</span><span className="font-bold text-purple-700">{formatCurrency(cusSelected.quotedPrice)}</span></div>
                {cusSelected.depositAmount && <div className="flex justify-between"><span className="text-gray-600">Đặt cọc:</span><span>{formatCurrency(cusSelected.depositAmount)}</span></div>}
                {cusSelected.estimatedDays && <div className="flex justify-between"><span className="text-gray-600">Dự kiến:</span><span>{cusSelected.estimatedDays} ngày</span></div>}
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${CUS_COLOR[cusSelected.status]}`}>{CUS_LABEL[cusSelected.status]}</span>
              <span className="text-xs text-gray-400">{formatDate(cusSelected.createdAt)}</span>
            </div>
            <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-700">
              ℹ️ Chỉ nhân viên mới có thể xử lý đơn tùy chỉnh này.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

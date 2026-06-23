import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useFetch from '../hooks/useFetch';
import {
  formatCurrency, formatDate,
  ORDER_STATUS_LABEL, ORDER_STATUS_COLOR,
  CUSTOM_STATUS_LABEL, CUSTOM_STATUS_COLOR,
} from '../utils/formatters';
import Spinner from '../components/common/Spinner';
import Pagination from '../components/common/Pagination';
import { FiPackage, FiScissors, FiCalendar, FiChevronLeft, FiX } from 'react-icons/fi';

const REGULAR_STATUS_TABS = [
  { value: '', label: 'Tất cả' },
  { value: 'pending_payment', label: '⏳ Chờ TT' },
  { value: 'paid', label: '✅ Đã TT' },
  { value: 'confirmed', label: '📋 Đã xác nhận' },
  { value: 'preparing', label: '📦 Đang chuẩn bị' },
  { value: 'shipping', label: '🚚 Đang giao' },
  { value: 'delivered', label: '🏠 Đã giao' },
  { value: 'cancelled', label: '❌ Đã hủy' },
];

const PER_PAGE = 10;

function DateFilter({ from, to, onFromChange, onToChange, onClear }) {
  const hasFilter = from || to;
  return (
    <div className="flex items-center gap-2">
      <FiCalendar size={14} className="text-gray-400 shrink-0" />
      <input type="date" value={from} onChange={e => onFromChange(e.target.value)}
        className="border border-gray-200 rounded-lg px-2 py-1 text-xs text-gray-600 focus:outline-none focus:ring-1 focus:ring-rose-300 focus:border-rose-300" />
      <span className="text-gray-300 text-xs">—</span>
      <input type="date" value={to} onChange={e => onToChange(e.target.value)}
        className="border border-gray-200 rounded-lg px-2 py-1 text-xs text-gray-600 focus:outline-none focus:ring-1 focus:ring-rose-300 focus:border-rose-300" />
      {hasFilter && (
        <button onClick={onClear} className="text-gray-400 hover:text-rose-500 transition">
          <FiX size={14} />
        </button>
      )}
    </div>
  );
}

function RegularOrderCard({ order }) {
  return (
    <Link to={`/orders/${order.id}`}
      className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 block hover:shadow-md transition">
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <p className="font-bold text-gray-800">#{order.orderCode}</p>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100">
              Đơn thường
            </span>
          </div>
          <p className="text-xs text-gray-400">{formatDate(order.createdAt)}</p>
        </div>
        <span className={`text-xs px-3 py-1 rounded-full font-semibold ${ORDER_STATUS_COLOR[order.status]}`}>
          {ORDER_STATUS_LABEL[order.status]}
        </span>
      </div>

      {order.OrderDetails?.slice(0, 2).map(d => (
        <div key={d.id} className="flex items-center gap-2 mb-1">
          {d.productImage
            ? <img src={d.productImage} alt={d.productName} className="w-10 h-10 rounded-lg object-cover shrink-0" />
            : <div className="w-10 h-10 bg-rose-50 rounded-lg flex items-center justify-center text-lg shrink-0">🧶</div>}
          <p className="text-sm text-gray-700 truncate flex-1">{d.productName}</p>
          <p className="text-xs text-gray-400 shrink-0">×{d.quantity}</p>
        </div>
      ))}
      {order.OrderDetails?.length > 2 && (
        <p className="text-xs text-gray-400 mt-1">+{order.OrderDetails.length - 2} sản phẩm khác</p>
      )}

      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
        <p className="text-sm text-gray-500">{order.OrderDetails?.length} sản phẩm</p>
        <p className="font-bold text-rose-500 text-base">{formatCurrency(order.total)}</p>
      </div>

      {order.status === 'pending_payment' && (
        <div className="mt-3 bg-orange-50 border border-orange-100 rounded-xl px-3 py-2 text-xs text-orange-700 font-medium">
          ⏳ Đơn hàng chờ thanh toán — nhấn để thanh toán ngay
        </div>
      )}
    </Link>
  );
}

function CustomOrderCard({ order }) {
  const needsPayment = order.status === 'quoted';
  return (
    <Link to={`/custom-orders/${order.id}`}
      className={`bg-white rounded-2xl border shadow-sm p-5 block hover:shadow-md transition ${needsPayment ? 'border-amber-300 ring-1 ring-amber-100' : 'border-gray-100'}`}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <p className="font-bold text-gray-800">#{order.code}</p>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-violet-50 text-violet-600 border border-violet-100 flex items-center gap-1">
              <FiScissors size={9} /> Tùy chỉnh
            </span>
            {needsPayment && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 animate-pulse">
                Cần TT
              </span>
            )}
          </div>
          <p className="text-xs text-gray-400">{formatDate(order.createdAt)}</p>
        </div>
        <span className={`text-xs px-3 py-1 rounded-full font-semibold ${CUSTOM_STATUS_COLOR[order.status] || 'bg-gray-100 text-gray-600'}`}>
          {CUSTOM_STATUS_LABEL[order.status]}
        </span>
      </div>

      <p className="text-sm text-gray-600 line-clamp-2 mb-3">{order.description}</p>

      <div className="flex items-center justify-between pt-3 border-t border-gray-50">
        <p className="text-xs text-gray-400">Đơn handmade theo yêu cầu</p>
        {order.quotedPrice
          ? <p className="font-bold text-rose-500 text-base">{formatCurrency(order.quotedPrice)}</p>
          : <p className="text-xs text-gray-400 italic">Chưa có báo giá</p>}
      </div>
    </Link>
  );
}

export default function Orders() {
  const navigate = useNavigate();
  const [orderType, setOrderType] = useState('regular');

  // Regular orders
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const { data: regularData, loading: regularLoading } = useFetch('/orders/my', {
    status, page,
    ...(fromDate && { fromDate }),
    ...(toDate && { toDate }),
  });

  // Custom orders
  const [customPage, setCustomPage] = useState(1);
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const { data: customData, loading: customLoading } = useFetch('/custom-orders/my', {});
  const allCustom = customData?.items || customData || [];

  const filteredCustom = allCustom.filter(o => {
    const d = new Date(o.createdAt);
    if (customFrom && d < new Date(customFrom)) return false;
    if (customTo && d > new Date(customTo + 'T23:59:59')) return false;
    return true;
  });
  const customTotalPages = Math.ceil(filteredCustom.length / PER_PAGE);
  const paginatedCustom = filteredCustom.slice((customPage - 1) * PER_PAGE, customPage * PER_PAGE);

  const loading = orderType === 'regular' ? regularLoading : customLoading;

  const switchType = (type) => {
    setOrderType(type);
    setStatus(''); setPage(1); setFromDate(''); setToDate('');
    setCustomPage(1); setCustomFrom(''); setCustomTo('');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">

      {/* Header row — changes based on active tab */}
      {orderType === 'regular' ? (
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-800">Đơn Hàng Của Tôi</h1>
          <DateFilter
            from={fromDate} to={toDate}
            onFromChange={v => { setFromDate(v); setPage(1); }}
            onToChange={v => { setToDate(v); setPage(1); }}
            onClear={() => { setFromDate(''); setToDate(''); setPage(1); }}
          />
        </div>
      ) : (
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-rose-500 transition font-medium">
            <FiChevronLeft size={16} /> Trở về trang trước
          </button>
          <DateFilter
            from={customFrom} to={customTo}
            onFromChange={v => { setCustomFrom(v); setCustomPage(1); }}
            onToChange={v => { setCustomTo(v); setCustomPage(1); }}
            onClear={() => { setCustomFrom(''); setCustomTo(''); setCustomPage(1); }}
          />
        </div>
      )}

      {/* Type tabs */}
      <div className="flex gap-2 mb-4">
        {[
          { value: 'regular', label: '🛒 Đơn thường' },
          { value: 'custom', label: '✂️ Đơn tùy chỉnh' },
        ].map(t => (
          <button key={t.value} onClick={() => switchType(t.value)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition border ${orderType === t.value ? 'bg-rose-500 text-white border-rose-500 shadow-sm' : 'bg-white text-gray-600 border-gray-200 hover:border-rose-300 hover:text-rose-500'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Status tabs — regular orders only */}
      {orderType === 'regular' && (
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {REGULAR_STATUS_TABS.map(tab => (
            <button key={tab.value} onClick={() => { setStatus(tab.value); setPage(1); }}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition ${status === tab.value ? 'bg-rose-500 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-20"><Spinner /></div>
      ) : orderType === 'regular' ? (
        !regularData?.items?.length ? (
          <div className="text-center py-20">
            <FiPackage size={56} className="mx-auto text-gray-200 mb-4" />
            <p className="text-gray-500 text-lg mb-2">Không có đơn hàng nào</p>
            <Link to="/products" className="text-rose-500 font-medium hover:underline">Bắt đầu mua sắm</Link>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {regularData.items.map(order => <RegularOrderCard key={order.id} order={order} />)}
            </div>
            <Pagination pagination={regularData.pagination} onPageChange={setPage} />
          </>
        )
      ) : (
        paginatedCustom.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">✨</div>
            <p className="text-gray-500 text-lg mb-2">
              {customFrom || customTo ? 'Không có đơn nào trong khoảng thời gian này' : 'Không có đơn tùy chỉnh nào'}
            </p>
            <Link to="/custom-order" className="text-rose-500 font-medium hover:underline">Đặt đơn tùy chỉnh ngay</Link>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {paginatedCustom.map(order => <CustomOrderCard key={order.id} order={order} />)}
            </div>
            <Pagination pagination={{ page: customPage, totalPages: customTotalPages }} onPageChange={setCustomPage} />
          </>
        )
      )}
    </div>
  );
}

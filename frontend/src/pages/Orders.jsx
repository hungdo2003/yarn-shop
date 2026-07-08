import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import useFetch from '../hooks/useFetch';
import {
  formatCurrency, formatDate,
  ORDER_STATUS_LABEL,
  ORDER_STATUS_COLOR,
  CUSTOM_STATUS_LABEL,
  CUSTOM_STATUS_COLOR,
} from '../utils/formatters';
import Spinner from '../components/common/Spinner';
import Pagination from '../components/common/Pagination';
import { FiPackage, FiScissors, FiCalendar, FiX, FiChevronLeft, FiChevronRight } from 'react-icons/fi';

const PER_PAGE = 10;

function DateFilter({ from, to, onFromChange, onToChange, onClear }) {
  const hasFilter = from || to;
  return (
    <div className="flex items-center gap-1">
      <FiCalendar size={12} className="text-gray-300 shrink-0" />
      <input type="date" value={from} onChange={e => onFromChange(e.target.value)}
        className="border border-gray-200 rounded-md px-1.5 py-0.5 text-base text-gray-500 w-28 focus:outline-none focus:ring-1 focus:ring-rose-200 focus:border-rose-200" />
      <span className="text-gray-300 text-[11px]">—</span>
      <input type="date" value={to} onChange={e => onToChange(e.target.value)}
        className="border border-gray-200 rounded-md px-1.5 py-0.5 text-base text-gray-500 w-28 focus:outline-none focus:ring-1 focus:ring-rose-200 focus:border-rose-200" />
      {hasFilter && (
        <button onClick={onClear} className="text-gray-300 hover:text-rose-400 transition ml-0.5">
          <FiX size={12} />
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
          {ORDER_STATUS_LABEL[order.status] || order.status}
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
          {CUSTOM_STATUS_LABEL[order.status] || order.status}
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

function ScrollableTabs({ tabs, active, onChange }) {
  const ref = useRef(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  const check = () => {
    const el = ref.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 1);
    setCanRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 1);
  };

  useEffect(() => {
    check();
    const el = ref.current;
    el?.addEventListener('scroll', check);
    window.addEventListener('resize', check);
    return () => { el?.removeEventListener('scroll', check); window.removeEventListener('resize', check); };
  }, [tabs]);

  const scroll = (dir) => ref.current?.scrollBy({ left: dir * 180, behavior: 'smooth' });

  return (
    <div className="flex items-center gap-1 mb-6">
      <button
        onClick={() => scroll(-1)}
        className={`shrink-0 w-7 h-7 rounded-full border flex items-center justify-center transition
          ${canLeft ? 'border-gray-300 text-gray-500 hover:border-rose-400 hover:text-rose-500 bg-white shadow-sm' : 'border-gray-100 text-gray-200 cursor-default'}`}
        disabled={!canLeft}
      >
        <FiChevronLeft size={13} />
      </button>

      <div
        ref={ref}
        className="flex-1 flex gap-2 overflow-x-auto flex-nowrap scrollbar-hide"
      >
        {tabs.map(tab => (
          <button key={tab.value} onClick={() => onChange(tab.value)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition shrink-0 ${
              active === tab.value
                ? 'bg-rose-500 text-white shadow-sm'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}>
            {tab.label}
          </button>
        ))}
      </div>

      <button
        onClick={() => scroll(1)}
        className={`shrink-0 w-7 h-7 rounded-full border flex items-center justify-center transition
          ${canRight ? 'border-gray-300 text-gray-500 hover:border-rose-400 hover:text-rose-500 bg-white shadow-sm' : 'border-gray-100 text-gray-200 cursor-default'}`}
        disabled={!canRight}
      >
        <FiChevronRight size={13} />
      </button>
    </div>
  );
}

const REGULAR_STATUS_TABS = [
  { value: '', label: 'Tất cả' },
  { value: 'pending_payment', label: '⏳ Chờ thanh toán' },
  { value: 'paid', label: '✅ Đã thanh toán' },
  { value: 'confirmed', label: '📋 Đã xác nhận' },
  { value: 'preparing', label: '📦 Đang chuẩn bị' },
  { value: 'shipping', label: '🚚 Đang giao' },
  { value: 'delivered', label: '🏠 Đã giao' },
  { value: 'cancelled', label: '❌ Đã hủy' },
];

const CUSTOM_STATUS_TABS = [
  { value: '', label: 'Tất cả' },
  { value: 'submitted', label: '📝 Đã gửi yêu cầu' },
  { value: 'reviewing', label: '🔍 Đang xem xét' },
  { value: 'quoted', label: '⏳ Chờ thanh toán cọc' },
  { value: 'deposit_paid', label: '✅ Đã đặt cọc' },
  { value: 'in_production', label: '🧶 Đang sản xuất' },
  { value: 'completed', label: '✔️ Hoàn thành' },
  { value: 'delivered', label: '🏠 Đã giao' },
  { value: 'cancelled', label: '❌ Đã hủy' },
];

export default function Orders() {
  const [orderType, setOrderType] = useState('regular');

  // Regular orders
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const { data: regularData, loading: regularLoading } = useFetch('/orders/my', {
    status, page, limit: 5,
    ...(fromDate && { from: fromDate }),
    ...(toDate && { to: toDate }),
  });

  // Custom orders
  const [customStatus, setCustomStatus] = useState('');
  const [customPage, setCustomPage] = useState(1);
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const { data: customData, loading: customLoading } = useFetch('/custom-orders/my', {
    status: customStatus, page: customPage, limit: 5,
    ...(customFrom && { from: customFrom }),
    ...(customTo && { to: customTo }),
  });
  const paginatedCustom = customData?.items || [];

  const loading = orderType === 'regular' ? regularLoading : customLoading;

  const switchType = (type) => {
    setOrderType(type);
    setStatus(''); setPage(1); setFromDate(''); setToDate('');
    setCustomStatus(''); setCustomPage(1); setCustomFrom(''); setCustomTo('');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">

      {/* Header */}
      <h1 className="text-2xl font-bold text-gray-800 mb-4">Đơn Hàng Của Tôi</h1>

      {/* Type tabs + date filter on same row */}
      <div className="flex items-center justify-between gap-2 mb-4 flex-wrap">
        <div className="flex items-center gap-2">
          {[
            { value: 'regular', label: '🛒 Đơn thường' },
            { value: 'custom',  label: '✂️ Đơn tùy chỉnh' },
          ].map(tab => (
            <button key={tab.value} onClick={() => switchType(tab.value)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition border ${orderType === tab.value ? 'bg-rose-500 text-white border-rose-500 shadow-sm' : 'bg-white text-gray-600 border-gray-200 hover:border-rose-300 hover:text-rose-500'}`}>
              {tab.label}
            </button>
          ))}
        </div>
        {orderType === 'regular' ? (
          <DateFilter
            from={fromDate} to={toDate}
            onFromChange={v => { setFromDate(v); setPage(1); }}
            onToChange={v => { setToDate(v); setPage(1); }}
            onClear={() => { setFromDate(''); setToDate(''); setPage(1); }}
          />
        ) : (
          <DateFilter
            from={customFrom} to={customTo}
            onFromChange={v => { setCustomFrom(v); setCustomPage(1); }}
            onToChange={v => { setCustomTo(v); setCustomPage(1); }}
            onClear={() => { setCustomFrom(''); setCustomTo(''); setCustomPage(1); }}
          />
        )}
      </div>

      {/* Status tabs */}
      <ScrollableTabs
        tabs={orderType === 'regular' ? REGULAR_STATUS_TABS : CUSTOM_STATUS_TABS}
        active={orderType === 'regular' ? status : customStatus}
        onChange={v => orderType === 'regular' ? (setStatus(v), setPage(1)) : (setCustomStatus(v), setCustomPage(1))}
      />

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-20"><Spinner /></div>
      ) : orderType === 'regular' ? (
        !regularData?.items?.length ? (
          <div className="text-center py-20">
            <FiPackage size={56} className="mx-auto text-gray-200 mb-4" />
            <p className="text-gray-500 text-lg mb-2">{status ? 'Không có đơn nào phù hợp' : 'Không có đơn hàng nào'}</p>
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
              {customStatus || customFrom || customTo ? 'Không có đơn nào phù hợp' : 'Không có đơn tùy chỉnh nào'}
            </p>
            <Link to="/custom-order" className="text-rose-500 font-medium hover:underline">Đặt đơn tùy chỉnh ngay</Link>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {paginatedCustom.map(order => <CustomOrderCard key={order.id} order={order} />)}
            </div>
            <Pagination pagination={customData?.pagination} onPageChange={setCustomPage} />
          </>
        )
      )}
    </div>
  );
}

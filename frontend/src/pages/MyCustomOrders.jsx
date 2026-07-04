import { useState } from 'react';
import { Link } from 'react-router-dom';
import useFetch from '../hooks/useFetch';
import { formatCurrency, formatDate, CUSTOM_STATUS_LABEL, CUSTOM_STATUS_COLOR } from '../utils/formatters';
import Spinner from '../components/common/Spinner';
import Pagination from '../components/common/Pagination';
import { FiPlus, FiEye } from 'react-icons/fi';

const PER_PAGE = 10;

const STEPS = [
  { key: 'submitted' },
  { key: 'reviewing' },
  { key: 'quoted' },
  { key: 'deposit_paid' },
  { key: 'in_production' },
  { key: 'completed' },
  { key: 'delivered' },
  { key: 'remaining_paid' },
];

const FILTER_TABS = [
  { value: '', label: 'Tất cả' },
  { value: 'submitted', label: 'Mới gửi' },
  { value: 'reviewing', label: 'Đang xét' },
  { value: 'quoted', label: 'Cần thanh toán' },
  { value: 'deposit_paid', label: 'Đã cọc' },
  { value: 'in_production', label: 'Đang làm' },
  { value: 'delivered', label: 'Đã nhận' },
  { value: 'remaining_paid', label: 'Hoàn tất' },
  { value: 'cancelled', label: 'Đã hủy' },
];

export default function MyCustomOrders() {
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const { data, loading } = useFetch('/custom-orders/my', { status: statusFilter, page, limit: PER_PAGE });
  const orders = data?.items || [];
  const pagination = data?.pagination;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Đơn Đặt Hàng Tùy Chỉnh</h1>
          <p className="text-gray-500 text-sm mt-1">Theo dõi các yêu cầu handmade của bạn</p>
        </div>
        <Link to="/custom-order"
          className="flex items-center gap-2 bg-rose-500 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-rose-600 transition">
          <FiPlus size={15} /> Đặt mới
        </Link>
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {FILTER_TABS.map(tab => (
          <button key={tab.value} onClick={() => { setStatusFilter(tab.value); setPage(1); }}
            className={`px-4 py-1.5 rounded-full text-sm whitespace-nowrap font-medium transition ${statusFilter === tab.value ? 'bg-rose-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? <div className="flex justify-center py-20"><Spinner /></div> : orders.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-6xl mb-4">✨</div>
          <p className="text-gray-500 text-lg mb-2">Chưa có đơn đặt hàng nào</p>
          <p className="text-gray-400 text-sm mb-6">Hãy gửi yêu cầu để chúng tôi tạo ra sản phẩm handmade theo ý bạn!</p>
          <Link to="/custom-order" className="bg-rose-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-rose-600 transition">Đặt ngay</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map(order => {
            const curStep = STEPS.findIndex(s => s.key === order.status);
            const progress = order.status === 'cancelled' ? 0 : Math.round(((curStep + 1) / STEPS.length) * 100);
            const needsPayment = order.status === 'quoted';
            const needsRemainingPayment = order.status === 'delivered' &&
              order.depositAmount && order.quotedPrice &&
              parseFloat(order.quotedPrice) - parseFloat(order.depositAmount) > 0;
            return (
              <div key={order.id}
                className={`bg-white rounded-2xl border shadow-sm p-5 hover:shadow-md transition ${needsPayment || needsRemainingPayment ? 'border-amber-300 ring-1 ring-amber-200' : 'border-gray-100'}`}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-bold text-gray-800">#{order.code}</p>
                    <p className="text-xs text-gray-400">{formatDate(order.createdAt)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {needsPayment && (
                      <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-semibold animate-pulse">
                        Cần thanh toán
                      </span>
                    )}
                    {needsRemainingPayment && (
                      <span className="text-xs bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full font-semibold animate-pulse">
                        Thanh toán còn lại
                      </span>
                    )}
                    <span className={`text-xs px-3 py-1 rounded-full font-semibold ${CUSTOM_STATUS_COLOR[order.status] || 'bg-gray-100 text-gray-600'}`}>
                      {CUSTOM_STATUS_LABEL[order.status]}
                    </span>
                  </div>
                </div>

                <p className="text-sm text-gray-600 line-clamp-2 mb-3">{order.description}</p>

                {order.status !== 'cancelled' && (
                  <div className="mb-3">
                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                      <span>Tiến độ</span><span>{progress}%</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-rose-400 rounded-full transition-all" style={{ width: `${progress}%` }} />
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  {order.quotedPrice
                    ? <p className="text-sm font-bold text-rose-500">{formatCurrency(order.quotedPrice)}</p>
                    : <p className="text-xs text-gray-400">Chưa có báo giá</p>}
                  <Link to={`/custom-orders/${order.id}`}
                    className="flex items-center gap-1.5 text-rose-500 text-sm font-medium hover:underline">
                    <FiEye size={14} /> {needsPayment || needsRemainingPayment ? 'Thanh toán ngay' : 'Chi tiết'}
                  </Link>
                </div>
              </div>
            );
          })}
          <Pagination pagination={pagination} onPageChange={p => { setPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }); }} />
        </div>
      )}
    </div>
  );
}

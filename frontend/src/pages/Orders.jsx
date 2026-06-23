import { useState } from 'react';
import { Link } from 'react-router-dom';
import useFetch from '../hooks/useFetch';
import { formatCurrency, formatDate, ORDER_STATUS_LABEL, ORDER_STATUS_COLOR } from '../utils/formatters';
import Spinner from '../components/common/Spinner';
import Pagination from '../components/common/Pagination';
import { FiPackage } from 'react-icons/fi';

const STATUS_TABS = [
  { value: '', label: 'Tất cả' },
  { value: 'pending_payment', label: '⏳ Chờ TT' },
  { value: 'paid', label: '✅ Đã TT' },
  { value: 'confirmed', label: '📋 Đã xác nhận' },
  { value: 'preparing', label: '📦 Đang chuẩn bị' },
  { value: 'shipping', label: '🚚 Đang giao' },
  { value: 'delivered', label: '🏠 Đã giao' },
  { value: 'cancelled', label: '❌ Đã hủy' },
];

export default function Orders() {
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const { data, loading } = useFetch('/orders/my', { status, page });

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Đơn Hàng Của Tôi</h1>
        <Link to="/custom-orders/my" className="text-sm text-rose-500 hover:underline font-medium">Đơn tùy chỉnh →</Link>
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {STATUS_TABS.map(tab => (
          <button key={tab.value} onClick={() => { setStatus(tab.value); setPage(1); }}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition ${status === tab.value ? 'bg-rose-500 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? <div className="flex justify-center py-20"><Spinner /></div>
        : !data?.items?.length ? (
          <div className="text-center py-20">
            <FiPackage size={56} className="mx-auto text-gray-200 mb-4" />
            <p className="text-gray-500 text-lg mb-2">Không có đơn hàng nào</p>
            <Link to="/products" className="text-rose-500 font-medium hover:underline">Bắt đầu mua sắm</Link>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {data.items.map(order => (
                <Link key={order.id} to={`/orders/${order.id}`}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 block hover:shadow-md transition">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-bold text-gray-800">#{order.orderCode}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{formatDate(order.createdAt)}</p>
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
              ))}
            </div>
            <Pagination pagination={data.pagination} onPageChange={setPage} />
          </>
        )}
    </div>
  );
}

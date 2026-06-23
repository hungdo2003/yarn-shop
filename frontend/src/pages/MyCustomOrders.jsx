import { useState } from 'react';
import { Link } from 'react-router-dom';
import useFetch from '../hooks/useFetch';
import api from '../services/api';
import { formatCurrency, formatDate, CUSTOM_STATUS_LABEL, CUSTOM_STATUS_COLOR } from '../utils/formatters';
import Spinner from '../components/common/Spinner';
import Pagination from '../components/common/Pagination';
import { FiPlus, FiEye, FiX, FiAlertCircle, FiCheckCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const PER_PAGE = 10;

const STEPS = [
  { key: 'submitted',    label: 'Đã gửi',     icon: '📝' },
  { key: 'reviewing',   label: 'Đang xét',   icon: '🔍' },
  { key: 'quoted',      label: 'Báo giá',    icon: '💰' },
  { key: 'deposit_paid',label: 'Đã thanh toán', icon: '💳' },
  { key: 'in_production',label: 'Sản xuất',  icon: '🧶' },
  { key: 'completed',   label: 'Xong',       icon: '✅' },
  { key: 'delivered',   label: 'Đã giao',    icon: '🏠' },
];

const stepIndex = (s) => STEPS.findIndex(x => x.key === s);

function DetailModal({ order, walletBalance, onClose, onPaid }) {
  const steps = STEPS;
  const curIdx = steps.findIndex(s => s.key === order.status);
  const [paying, setPaying] = useState(false);
  const [localOrder, setLocalOrder] = useState(order);
  const [localBalance, setLocalBalance] = useState(walletBalance);

  const payAmount = parseFloat(localOrder.depositAmount || localOrder.quotedPrice || 0);
  const canPay = localOrder.status === 'quoted' && payAmount > 0;
  const balanceOk = localBalance >= payAmount;

  const handlePay = async () => {
    if (!balanceOk) return;
    setPaying(true);
    try {
      const r = await api.post(`/custom-orders/my/${localOrder.id}/pay`);
      setLocalOrder(prev => ({ ...prev, status: 'deposit_paid', depositPaidAt: new Date().toISOString() }));
      setLocalBalance(r.data.walletBalance);
      toast.success('Thanh toán thành công!');
      onPaid?.();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Thanh toán thất bại');
    } finally { setPaying(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-5">
          <div>
            <h3 className="font-bold text-gray-800 text-lg">#{localOrder.code}</h3>
            <p className="text-gray-500 text-sm">{formatDate(localOrder.createdAt)}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1"><FiX size={20} /></button>
        </div>

        {/* Progress stepper */}
        {localOrder.status !== 'cancelled' && (
          <div className="mb-6 overflow-x-auto">
            <div className="flex items-start gap-1 min-w-[460px]">
              {steps.map((step, i) => (
                <div key={step.key} className="flex items-center flex-1 min-w-0">
                  <div className="flex flex-col items-center shrink-0">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                      i < curIdx ? 'bg-rose-500 text-white' :
                      i === curIdx ? 'bg-rose-500 text-white ring-4 ring-rose-100' :
                      'bg-gray-100 text-gray-400'
                    }`}>
                      {i < curIdx ? '✓' : step.icon}
                    </div>
                    <p className={`text-[10px] mt-1 text-center leading-tight font-medium ${i <= curIdx ? 'text-rose-500' : 'text-gray-400'}`}>
                      {step.label}
                    </p>
                  </div>
                  {i < steps.length - 1 && (
                    <div className={`h-0.5 flex-1 mx-1 mt-[-14px] rounded-full ${i < curIdx ? 'bg-rose-400' : 'bg-gray-200'}`} />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {localOrder.status === 'cancelled' && (
          <div className="mb-4 bg-red-50 border border-red-100 rounded-xl p-3 text-sm text-red-600 flex items-center gap-2">
            <FiAlertCircle /> Đơn hàng đã bị hủy
          </div>
        )}

        <div className="space-y-3 text-sm">
          {/* Request details */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-2">
            <p className="font-semibold text-gray-700 mb-2">Chi tiết yêu cầu</p>
            <p><span className="text-gray-500">Mô tả:</span> {localOrder.description}</p>
            {localOrder.yarnColor && <p><span className="text-gray-500">Màu len:</span> {localOrder.yarnColor}</p>}
            {localOrder.size && <p><span className="text-gray-500">Kích thước:</span> {localOrder.size}</p>}
          </div>

          {/* Quote + payment section */}
          {localOrder.quotedPrice && (
            <div className={`border rounded-xl p-4 space-y-3 ${canPay ? 'bg-amber-50 border-amber-200' : 'bg-purple-50 border-purple-100'}`}>
              <div className="flex items-center justify-between">
                <p className={`font-semibold ${canPay ? 'text-amber-700' : 'text-purple-700'}`}>
                  {canPay ? '⏳ Chờ thanh toán' : '✅ Đã thanh toán'}
                </p>
                {localOrder.depositPaidAt && (
                  <span className="text-xs text-gray-400">{formatDate(localOrder.depositPaidAt)}</span>
                )}
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Giá báo:</span>
                  <span className="text-xl font-bold text-purple-700">{formatCurrency(localOrder.quotedPrice)}</span>
                </div>
                {localOrder.depositAmount && parseFloat(localOrder.depositAmount) !== parseFloat(localOrder.quotedPrice) && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Thanh toán ngay:</span>
                    <span className="font-semibold text-amber-700">{formatCurrency(localOrder.depositAmount)}</span>
                  </div>
                )}
                {localOrder.estimatedDays && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Thời gian dự kiến:</span>
                    <span className="text-gray-700">{localOrder.estimatedDays} ngày</span>
                  </div>
                )}
              </div>

              {/* Payment button */}
              {canPay && (
                <div className="pt-1 space-y-2">
                  <div className={`flex items-center justify-between text-xs px-3 py-2 rounded-lg ${balanceOk ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
                    <span>Số dư ví của bạn</span>
                    <span className="font-bold">{formatCurrency(localBalance)}</span>
                  </div>
                  {!balanceOk && (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                      <FiAlertCircle size={12} />
                      Số dư không đủ. Cần thêm {formatCurrency(payAmount - localBalance)}.{' '}
                      <Link to="/wallet" onClick={onClose} className="underline font-medium">Nạp ví</Link>
                    </p>
                  )}
                  <button
                    onClick={handlePay}
                    disabled={!balanceOk || paying}
                    className="w-full py-2.5 bg-rose-500 text-white rounded-xl font-bold text-sm hover:bg-rose-600 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {paying ? (
                      <><div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" /> Đang xử lý...</>
                    ) : (
                      <>💳 Thanh toán {formatCurrency(payAmount)} bằng ví</>
                    )}
                  </button>
                </div>
              )}

              {!canPay && localOrder.depositPaidAt && (
                <div className="flex items-center gap-2 text-emerald-600 text-sm font-medium">
                  <FiCheckCircle size={16} /> Đã thanh toán — đang chờ sản xuất
                </div>
              )}
            </div>
          )}

          {/* Staff note */}
          {localOrder.staffNote && (
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
              <p className="font-semibold text-blue-700 mb-1">Ghi chú từ nhân viên</p>
              <p className="text-gray-700">{localOrder.staffNote}</p>
            </div>
          )}

          {/* Images */}
          {localOrder.CustomOrderImages?.length > 0 && (
            <div>
              <p className="font-medium text-gray-700 mb-2">Hình ảnh đính kèm</p>
              <div className="flex gap-2 flex-wrap">
                {localOrder.CustomOrderImages.map((img, i) => (
                  <img key={i} src={img.imageUrl} alt="" className="w-20 h-20 object-cover rounded-xl border" />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function MyCustomOrders() {
  const { user } = useAuth();
  const [statusFilter, setStatusFilter] = useState('');
  const [selected, setSelected] = useState(null);
  const [page, setPage] = useState(1);
  const { data, loading, refetch } = useFetch('/custom-orders/my', { status: statusFilter });
  const orders = data?.items || data || [];
  const totalPages = Math.ceil(orders.length / PER_PAGE);
  const paginatedOrders = orders.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const FILTER_TABS = [
    { value: '', label: 'Tất cả' },
    { value: 'submitted', label: 'Mới gửi' },
    { value: 'reviewing', label: 'Đang xét' },
    { value: 'quoted', label: 'Cần thanh toán' },
    { value: 'deposit_paid', label: 'Đã thanh toán' },
    { value: 'in_production', label: 'Đang làm' },
    { value: 'delivered', label: 'Đã nhận' },
    { value: 'cancelled', label: 'Đã hủy' },
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Đơn Đặt Hàng Tùy Chỉnh</h1>
          <p className="text-gray-500 text-sm mt-1">Theo dõi các yêu cầu handmade của bạn</p>
        </div>
        <Link to="/custom-order" className="flex items-center gap-2 bg-rose-500 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-rose-600 transition">
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
          {paginatedOrders.map(order => {
            const curStep = stepIndex(order.status);
            const progress = order.status === 'cancelled' ? 0 : Math.round(((curStep + 1) / STEPS.length) * 100);
            const needsPayment = order.status === 'quoted';
            return (
              <div key={order.id} className={`bg-white rounded-2xl border shadow-sm p-5 hover:shadow-md transition ${needsPayment ? 'border-amber-300 ring-1 ring-amber-200' : 'border-gray-100'}`}>
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
                  {order.quotedPrice ? (
                    <p className="text-sm font-bold text-rose-500">{formatCurrency(order.quotedPrice)}</p>
                  ) : (
                    <p className="text-xs text-gray-400">Chưa có báo giá</p>
                  )}
                  <button onClick={() => setSelected(order)}
                    className="flex items-center gap-1.5 text-rose-500 text-sm font-medium hover:underline">
                    <FiEye size={14} /> {needsPayment ? 'Thanh toán ngay' : 'Chi tiết'}
                  </button>
                </div>
              </div>
            );
          })}
          <Pagination pagination={{ page, totalPages }} onPageChange={setPage} />
        </div>
      )}

      {selected && (
        <DetailModal
          order={selected}
          walletBalance={parseFloat(user?.walletBalance || 0)}
          onClose={() => setSelected(null)}
          onPaid={() => { refetch(); }}
        />
      )}
    </div>
  );
}

import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import { formatCurrency } from '../utils/formatters';
import { FiChevronLeft, FiChevronRight, FiSearch, FiX } from 'react-icons/fi';

// ── Status config ──────────────────────────────────────────────────────────────
const STATUS = {
  pending_payment: { label: 'Chờ thanh toán',    color: 'bg-rose-100 text-rose-700' },
  pending:         { label: 'Chờ xét duyệt',     color: 'bg-yellow-100 text-yellow-700' },
  approved:        { label: 'Đã duyệt',           color: 'bg-blue-100 text-blue-700' },
  goods_received:  { label: 'Đã nhận hàng',       color: 'bg-purple-100 text-purple-700' },
  shipping_new:    { label: 'Đang giao hàng mới', color: 'bg-indigo-100 text-indigo-700' },
  rejected:        { label: 'Từ chối',            color: 'bg-red-100 text-red-700' },
  completed:       { label: 'Hoàn thành',         color: 'bg-green-100 text-green-700' },
};

const FLOW_RETURN = [
  { key: 'pending',   label: 'Gửi yêu cầu' },
  { key: 'approved',  label: 'Shop duyệt' },
  { key: 'completed', label: 'Hoàn tiền ví' },
];
const FLOW_EXCHANGE = [
  { key: 'pending',        label: 'Gửi yêu cầu' },
  { key: 'approved',       label: 'Shop duyệt' },
  { key: 'goods_received', label: 'Shop nhận hàng' },
  { key: 'shipping_new',   label: 'Giao hàng mới' },
  { key: 'completed',      label: 'Hoàn tất' },
];
const FLOW_EXCHANGE_PAY = [
  { key: 'pending_payment', label: 'Thanh toán' },
  { key: 'pending',         label: 'Chờ duyệt' },
  { key: 'approved',        label: 'Shop duyệt' },
  { key: 'goods_received',  label: 'Shop nhận hàng' },
  { key: 'shipping_new',    label: 'Giao hàng mới' },
  { key: 'completed',       label: 'Hoàn tất' },
];

function StatusFlow({ request }) {
  const needsPayFlow = request.type === 'exchange' && parseFloat(request.priceDiff || 0) > 0;
  const flow = request.type === 'return' ? FLOW_RETURN
    : needsPayFlow ? FLOW_EXCHANGE_PAY : FLOW_EXCHANGE;
  const statusOrder = flow.map(f => f.key);
  const current = request.status === 'completed' ? statusOrder.length - 1
    : request.status === 'rejected' ? -1
    : statusOrder.indexOf(request.status);

  if (request.status === 'rejected') {
    return <p className="text-xs text-red-500 font-medium mt-2">❌ Yêu cầu bị từ chối</p>;
  }
  return (
    <div className="flex items-center gap-0 mt-3">
      {flow.map((step, i) => (
        <div key={step.key} className="flex items-center flex-1 min-w-0">
          <div className="flex flex-col items-center shrink-0">
            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold transition-colors
              ${i < current ? 'bg-rose-500 text-white' : i === current ? 'bg-rose-500 text-white ring-2 ring-rose-200' : 'bg-gray-100 text-gray-400'}`}>
              {i < current ? '✓' : i + 1}
            </div>
            <p className={`text-[9px] mt-0.5 text-center whitespace-nowrap ${i <= current ? 'text-rose-600 font-medium' : 'text-gray-300'}`}>
              {step.label}
            </p>
          </div>
          {i < flow.length - 1 && (
            <div className={`flex-1 h-0.5 mb-3 mx-0.5 ${i < current ? 'bg-rose-400' : 'bg-gray-100'}`} />
          )}
        </div>
      ))}
    </div>
  );
}

// ── Product Picker modal ───────────────────────────────────────────────────────
function ProductPicker({ onSelect, onClose }) {
  const [search, setSearch] = useState('');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const timerRef = useRef(null);

  const load = async (q, p = 1) => {
    setLoading(true);
    try {
      const r = await api.get('/products', { params: { search: q, page: p, limit: 8, inStock: 'true' } });
      setProducts(r.data.items || []);
      setTotal(r.data.pagination?.total || 0);
      setPage(p);
    } catch { toast.error('Không thể tải sản phẩm'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(''); }, []);

  useEffect(() => {
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => { load(search, 1); }, 300);
    return () => clearTimeout(timerRef.current);
  }, [search]);

  const totalPages = Math.ceil(total / 8);

  return (
    <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col" style={{ maxHeight: '85vh' }}>
        <div className="flex items-center justify-between px-5 py-4 border-b shrink-0">
          <h3 className="font-bold text-gray-800 text-lg">Chọn sản phẩm muốn đổi</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><FiX size={20} /></button>
        </div>
        <div className="px-5 py-3 border-b shrink-0">
          <div className="relative">
            <FiSearch size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input autoFocus value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Tìm tên sản phẩm, màu sắc..."
              className="w-full border border-gray-200 rounded-xl pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-rose-400" />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="text-center py-12 text-gray-400 text-sm">Đang tải...</div>
          ) : products.length === 0 ? (
            <div className="text-center py-12 text-gray-400 text-sm">Không tìm thấy sản phẩm</div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {products.map(p => {
                const price = parseFloat(p.salePrice || p.price);
                const hasDiscount = p.salePrice && parseFloat(p.salePrice) < parseFloat(p.price);
                return (
                  <button key={p.id} onClick={() => onSelect(p)}
                    className="border border-gray-100 rounded-xl p-2.5 text-left hover:border-rose-300 hover:bg-rose-50 transition group">
                    <div className="aspect-square rounded-lg overflow-hidden bg-gray-50 mb-2">
                      {p.thumbnailImage
                        ? <img src={p.thumbnailImage} alt={p.name} className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center text-2xl">🧶</div>}
                    </div>
                    <p className="text-xs font-semibold text-gray-800 line-clamp-2 mb-1 group-hover:text-rose-600">{p.name}</p>
                    <div className="flex items-center gap-1 flex-wrap">
                      <p className="text-sm font-bold text-rose-500">{formatCurrency(price)}</p>
                      {hasDiscount && <p className="text-[10px] text-gray-400 line-through">{formatCurrency(p.price)}</p>}
                    </div>
                    <p className={`text-[10px] mt-0.5 ${p.stock > 0 ? 'text-green-600' : 'text-red-400'}`}>
                      {p.stock > 0 ? `Còn ${p.stock}` : 'Hết hàng'}
                    </p>
                  </button>
                );
              })}
            </div>
          )}
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 p-3 border-t shrink-0">
            <button onClick={() => load(search, page - 1)} disabled={page === 1}
              className="p-1.5 rounded-lg border disabled:opacity-30 hover:bg-gray-50"><FiChevronLeft size={14} /></button>
            <span className="text-xs text-gray-500">{page} / {totalPages}</span>
            <button onClick={() => load(search, page + 1)} disabled={page === totalPages}
              className="p-1.5 rounded-lg border disabled:opacity-30 hover:bg-gray-50"><FiChevronRight size={14} /></button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Payment Modal ──────────────────────────────────────────────────────────────
function ReturnPaymentModal({ modal, walletBalance, onClose, onPaid }) {
  const [paying, setPaying] = useState(null);
  const canWallet = walletBalance >= modal.amount;

  const handleWallet = async () => {
    setPaying('wallet');
    try {
      await api.post(`/returns/${modal.returnId}/pay-wallet`);
      toast.success('Thanh toán ví thành công!');
      onPaid();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Thanh toán thất bại');
      setPaying(null);
    }
  };

  const handlePayos = async () => {
    setPaying('payos');
    try {
      const r = await api.post(`/returns/${modal.returnId}/pay-payos`);
      window.location.href = r.data.checkoutUrl;
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể tạo liên kết thanh toán');
      setPaying(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-[70] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
        <div className="px-6 pt-6 pb-4">
          <div className="text-center mb-4">
            <p className="text-3xl mb-2">💳</p>
            <h3 className="text-lg font-bold text-gray-800">Thanh toán chênh lệch</h3>
            <p className="text-sm text-gray-500 mt-0.5">Yêu cầu <span className="font-mono">{modal.code}</span></p>
          </div>

          <div className="bg-rose-50 border border-rose-200 rounded-xl px-4 py-3 mb-4 text-center">
            <p className="text-xs text-rose-500 mb-0.5">Số tiền cần thanh toán</p>
            <p className="text-2xl font-bold text-rose-600">{formatCurrency(modal.amount)}</p>
          </div>

          <div className="text-xs text-gray-500 mb-4 bg-gray-50 rounded-xl px-3 py-2">
            Số dư ví: <span className={`font-semibold ${canWallet ? 'text-gray-700' : 'text-red-500'}`}>{formatCurrency(walletBalance)}</span>
            {!canWallet && <span className="text-red-400 ml-1">(không đủ)</span>}
          </div>

          <div className="space-y-2.5">
            <button onClick={handleWallet} disabled={!canWallet || paying !== null}
              className="w-full flex items-center justify-center gap-2 bg-rose-500 text-white py-3 rounded-xl font-semibold text-sm hover:bg-rose-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all">
              {paying === 'wallet' ? 'Đang xử lý...' : '💰 Thanh toán từ ví'}
            </button>
            <button onClick={handlePayos} disabled={paying !== null}
              className="w-full flex items-center justify-center gap-2 bg-blue-500 text-white py-3 rounded-xl font-semibold text-sm hover:bg-blue-600 disabled:opacity-50 transition-all">
              {paying === 'payos' ? 'Đang chuyển hướng...' : '🏦 Thanh toán qua PayOS'}
            </button>
            <button onClick={onClose} disabled={paying !== null}
              className="w-full py-2.5 rounded-xl text-sm text-gray-500 hover:bg-gray-50 border border-gray-200 disabled:opacity-50">
              Để sau
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function Returns() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [returns, setReturns] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const LIMIT = 5;
  const [orders, setOrders] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [paymentModal, setPaymentModal] = useState(null);
  const [walletBalance, setWalletBalance] = useState(0);

  const [form, setForm] = useState({
    orderId: '', type: 'return', reason: '', customerNote: '',
    exchangeProductId: null, exchangeProduct: null, exchangeProductQty: 1,
  });
  const [files, setFiles] = useState([]);

  const load = (p = page, f = filter) => {
    setLoading(true);
    Promise.all([
      api.get('/returns/my', { params: { page: p, limit: LIMIT, ...(f ? { status: f } : {}) } }),
      api.get('/orders/my', { params: { status: 'delivered', limit: 50 } }),
    ]).then(([retRes, ordRes]) => {
      setReturns(retRes.data.items || []);
      setTotal(retRes.data.total || 0);
      setTotalPages(retRes.data.totalPages || 1);
      setOrders(ordRes.data?.items || ordRes.data?.data || []);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { load(page, filter); }, [page, filter]);

  // Handle PayOS return callback
  useEffect(() => {
    const returnId = searchParams.get('returnId');
    const paymentStatus = searchParams.get('paymentStatus');
    if (!returnId || !paymentStatus) return;
    if (paymentStatus === 'success') toast.success('Thanh toán thành công! Shop sẽ xét duyệt yêu cầu sớm.');
    else if (paymentStatus === 'cancelled') toast.error('Đã hủy thanh toán. Yêu cầu vẫn chờ thanh toán.');
    navigate('/returns', { replace: true });
  }, []);

  const usedOrderIds = new Set(
    returns.filter(r => r.status !== 'rejected').map(r => String(r.orderId))
  );
  const availableOrders = orders.filter(o => !usedOrderIds.has(String(o.id)));

  const selectedOrder = availableOrders.find(o => String(o.id) === String(form.orderId));
  const priceDiff = form.type === 'exchange' && form.exchangeProduct && selectedOrder
    ? parseFloat(form.exchangeProduct.salePrice || form.exchangeProduct.price) * form.exchangeProductQty - parseFloat(selectedOrder.total)
    : null;

  const resetForm = () => {
    setForm({ orderId: '', type: 'return', reason: '', customerNote: '', exchangeProductId: null, exchangeProduct: null, exchangeProductQty: 1 });
    setFiles([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.type === 'exchange' && !form.exchangeProductId) {
      return toast.error('Vui lòng chọn sản phẩm muốn đổi');
    }
    const fd = new FormData();
    fd.append('orderId', form.orderId);
    fd.append('type', form.type);
    fd.append('reason', form.reason);
    fd.append('customerNote', form.customerNote);
    if (form.type === 'exchange') {
      fd.append('exchangeProductId', form.exchangeProductId);
      fd.append('exchangeProductQty', form.exchangeProductQty);
    }
    files.forEach(f => fd.append('images', f));
    try {
      const r = await api.post('/returns', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setShowForm(false);
      resetForm();
      load();

      setPage(1);
      load(1, filter);
      if (r.data.needsPayment) {
        try {
          const w = await api.get('/wallet');
          setWalletBalance(parseFloat(w.data.balance || 0));
        } catch {}
        setPaymentModal({ returnId: r.data.id, amount: parseFloat(r.data.priceDiff), code: r.data.code });
      } else {
        toast.success('Đã gửi yêu cầu thành công!');
      }
    } catch (err) { toast.error(err.response?.data?.message || 'Lỗi gửi yêu cầu'); }
  };

  const openPaymentModal = async (r) => {
    try {
      const w = await api.get('/wallet');
      setWalletBalance(parseFloat(w.data.balance || 0));
    } catch {}
    setPaymentModal({ returnId: r.id, amount: parseFloat(r.priceDiff), code: r.code });
  };

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Đổi Trả Hàng</h1>
        <button onClick={() => setShowForm(true)}
          className="bg-rose-500 text-white px-4 py-2 rounded-xl hover:bg-rose-600 active:scale-95 transition-all text-sm font-semibold shadow-sm">
          + Yêu cầu đổi/trả
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1 flex-nowrap scrollbar-hide">
        {[['', 'Tất cả'], ...Object.entries(STATUS).map(([k, v]) => [k, v.label])].map(([s, label]) => (
          <button key={s} onClick={() => { setFilter(s); setPage(1); }}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition shrink-0 ${filter === s ? 'bg-rose-500 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {label}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="text-center py-16 text-gray-400">Đang tải...</div>
      ) : returns.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl shadow-sm border border-gray-100">
          <p className="text-5xl mb-3">📦</p>
          <p className="text-gray-400">Không có yêu cầu nào</p>
        </div>
      ) : (
        <div className="space-y-4">
          {returns.map(r => {
            const st = STATUS[r.status] || STATUS.pending;
            const diff = parseFloat(r.priceDiff || 0);

            return (
              <div key={r.id} className={`bg-white rounded-2xl border shadow-sm p-5 ${r.status === 'pending_payment' ? 'border-rose-300 ring-1 ring-rose-100' : 'border-gray-100'}`}>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-mono text-xs text-gray-400">{r.code}</p>
                    <p className="font-bold text-gray-800 mt-0.5">ĐH #{r.Order?.orderCode}</p>
                    <p className="text-xs text-gray-400">{new Date(r.createdAt).toLocaleDateString('vi-VN')}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${st.color}`}>{st.label}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${r.type === 'return' ? 'bg-rose-50 text-rose-600 border border-rose-100' : 'bg-blue-50 text-blue-600 border border-blue-100'}`}>
                      {r.type === 'return' ? '↩ Trả hàng' : '🔄 Đổi hàng'}
                    </span>
                  </div>
                </div>

                <p className="text-sm text-gray-600 mb-1"><span className="text-gray-400">Lý do:</span> {r.reason}</p>

                {r.type === 'exchange' && r.ExchangeProduct && (
                  <div className="bg-blue-50 rounded-xl p-3 mt-2 flex items-center gap-3">
                    {r.ExchangeProduct.thumbnailImage
                      ? <img src={r.ExchangeProduct.thumbnailImage} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0" />
                      : <span className="text-xl shrink-0">🧶</span>}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-700 truncate">Đổi sang: {r.ExchangeProduct.name}</p>
                      {diff > 0 && r.status !== 'pending_payment' && (
                        <p className="text-xs text-rose-600 font-semibold mt-0.5">Đã thanh toán thêm: {formatCurrency(diff)} ✅</p>
                      )}
                      {diff > 0 && r.status === 'pending_payment' && (
                        <p className="text-xs text-rose-500 font-medium mt-0.5">Cần thanh toán thêm: {formatCurrency(diff)}</p>
                      )}
                      {diff < 0 && (
                        <p className="text-xs text-green-600 font-medium mt-0.5">
                          Hoàn lại: {formatCurrency(Math.abs(diff))} {r.status === 'completed' ? '✅ Đã hoàn vào ví' : '(khi giao hàng xong)'}
                        </p>
                      )}
                      {diff === 0 && <p className="text-xs text-gray-500 mt-0.5">Giá trị tương đương</p>}
                    </div>
                  </div>
                )}

                {r.staffNote && (
                  <div className="mt-2 bg-blue-50 border border-blue-100 rounded-xl px-3 py-2 text-xs text-blue-700">
                    <span className="font-semibold">Phản hồi từ shop:</span> {r.staffNote}
                  </div>
                )}

                <StatusFlow request={r} />

                {r.status === 'pending_payment' && (
                  <div className="mt-3 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2.5">
                    <p className="text-xs text-rose-700 mb-2">
                      ⚡ Vui lòng hoàn tất thanh toán để shop bắt đầu xử lý yêu cầu
                    </p>
                    <button onClick={() => openPaymentModal(r)}
                      className="w-full bg-rose-500 text-white py-2 rounded-lg text-xs font-bold hover:bg-rose-600 active:scale-95 transition-all">
                      💳 Thanh toán ngay {formatCurrency(diff)}
                    </button>
                  </div>
                )}

                {r.status === 'approved' && (
                  <div className="mt-3 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2 text-xs text-amber-700">
                    📦 Vui lòng đóng gói và gửi hàng về địa chỉ shop để được xử lý.
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            className="p-2 rounded-xl border border-gray-200 disabled:opacity-30 hover:bg-gray-50 transition">
            <FiChevronLeft size={16} />
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
            <button key={p} onClick={() => setPage(p)}
              className={`w-8 h-8 rounded-xl text-sm font-medium transition ${p === page ? 'bg-rose-500 text-white shadow-sm' : 'border border-gray-200 hover:bg-gray-50 text-gray-600'}`}>
              {p}
            </button>
          ))}
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
            className="p-2 rounded-xl border border-gray-200 disabled:opacity-30 hover:bg-gray-50 transition">
            <FiChevronRight size={16} />
          </button>
        </div>
      )}

      {total > 0 && (
        <p className="text-center text-xs text-gray-400 mt-2">
          {(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, total)} / {total} yêu cầu
        </p>
      )}

      {/* Create form modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col" style={{ maxHeight: '90vh' }}>
            <div className="flex items-center justify-between px-6 py-4 border-b shrink-0">
              <h2 className="text-xl font-bold text-gray-800">Yêu Cầu Đổi/Trả Hàng</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600"><FiX size={20} /></button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              {/* Order select */}
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">Chọn đơn hàng *</label>
                <select required value={form.orderId} onChange={e => setForm({ ...form, orderId: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-rose-400">
                  <option value="">-- Chọn đơn hàng đã nhận --</option>
                  {availableOrders.map(o => (
                    <option key={o.id} value={o.id}>
                      #{o.orderCode} – {formatCurrency(o.total)} – {new Date(o.createdAt).toLocaleDateString('vi-VN')}
                    </option>
                  ))}
                </select>
                {availableOrders.length === 0 && (
                  <p className="text-xs text-gray-400 mt-1">
                    {orders.length === 0 ? 'Chỉ đổi/trả đơn hàng đã giao thành công.' : 'Tất cả đơn đã giao đều đã có yêu cầu đổi/trả.'}
                  </p>
                )}
              </div>

              {/* Type */}
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">Loại yêu cầu *</label>
                <div className="grid grid-cols-2 gap-3">
                  {[{ v: 'return', icon: '↩', label: 'Trả hàng', desc: 'Hoàn tiền về ví' },
                    { v: 'exchange', icon: '🔄', label: 'Đổi hàng', desc: 'Đổi sang sản phẩm khác' }].map(opt => (
                    <button type="button" key={opt.v}
                      onClick={() => setForm({ ...form, type: opt.v, exchangeProductId: null, exchangeProduct: null })}
                      className={`p-3 rounded-xl border-2 text-left transition ${form.type === opt.v ? 'border-rose-500 bg-rose-50' : 'border-gray-200 hover:border-gray-300'}`}>
                      <span className="text-lg">{opt.icon}</span>
                      <p className="text-sm font-semibold text-gray-800 mt-1">{opt.label}</p>
                      <p className="text-xs text-gray-500">{opt.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Exchange product picker */}
              {form.type === 'exchange' && (
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1.5">Sản phẩm muốn đổi sang *</label>
                  {form.exchangeProduct ? (
                    <div className="flex items-center gap-3 border border-rose-200 bg-rose-50 rounded-xl p-3">
                      {form.exchangeProduct.thumbnailImage
                        ? <img src={form.exchangeProduct.thumbnailImage} alt="" className="w-12 h-12 rounded-lg object-cover shrink-0" />
                        : <span className="text-2xl shrink-0">🧶</span>}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate">{form.exchangeProduct.name}</p>
                        <p className="text-sm font-bold text-rose-500">{formatCurrency(form.exchangeProduct.salePrice || form.exchangeProduct.price)}</p>
                      </div>
                      <button type="button" onClick={() => setForm({ ...form, exchangeProductId: null, exchangeProduct: null })}
                        className="text-gray-400 hover:text-red-400 shrink-0"><FiX size={16} /></button>
                    </div>
                  ) : (
                    <button type="button" onClick={() => setShowPicker(true)}
                      className="w-full border-2 border-dashed border-gray-200 rounded-xl py-4 text-sm text-gray-400 hover:border-rose-300 hover:text-rose-500 transition">
                      + Chọn sản phẩm
                    </button>
                  )}

                  {form.exchangeProduct && (
                    <div className="mt-2">
                      <label className="text-xs text-gray-500">Số lượng</label>
                      <input type="number" min={1} max={form.exchangeProduct.stock}
                        value={form.exchangeProductQty}
                        onChange={e => setForm({ ...form, exchangeProductQty: Math.max(1, parseInt(e.target.value) || 1) })}
                        className="w-20 ml-2 border border-gray-200 rounded-lg px-2 py-1 text-sm text-center" />
                    </div>
                  )}

                  {/* Price diff preview */}
                  {priceDiff !== null && selectedOrder && (
                    <div className={`mt-2 rounded-xl px-3 py-2.5 text-sm ${priceDiff > 0 ? 'bg-rose-50 border border-rose-200' : priceDiff < 0 ? 'bg-green-50 border border-green-100' : 'bg-gray-50 border border-gray-100'}`}>
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>Giá trị đơn cũ</span>
                        <span>{formatCurrency(selectedOrder.total)}</span>
                      </div>
                      <div className="flex justify-between text-xs text-gray-500 mb-2">
                        <span>Giá trị sản phẩm mới</span>
                        <span>{formatCurrency(parseFloat(form.exchangeProduct.salePrice || form.exchangeProduct.price) * form.exchangeProductQty)}</span>
                      </div>
                      <div className={`flex justify-between text-sm font-bold border-t pt-2 ${priceDiff > 0 ? 'text-rose-600' : priceDiff < 0 ? 'text-green-600' : 'text-gray-500'}`}>
                        <span>{priceDiff > 0 ? '💳 Cần thanh toán thêm' : priceDiff < 0 ? '💰 Shop hoàn lại' : '✅ Bằng nhau'}</span>
                        <span>{priceDiff !== 0 ? formatCurrency(Math.abs(priceDiff)) : '—'}</span>
                      </div>
                      {priceDiff > 0 && <p className="text-[10px] text-rose-500 mt-1.5 font-medium">⚡ Bạn sẽ chọn phương thức thanh toán ngay sau khi gửi yêu cầu</p>}
                      {priceDiff < 0 && <p className="text-[10px] text-green-500 mt-1">* Hoàn vào ví sau khi giao hàng mới thành công</p>}
                    </div>
                  )}
                </div>
              )}

              {/* Reason */}
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">Lý do *</label>
                <textarea required rows={3} value={form.reason}
                  onChange={e => setForm({ ...form, reason: e.target.value })}
                  placeholder="Mô tả lý do đổi/trả hàng..."
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-rose-400" />
              </div>

              {/* Note */}
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">Ghi chú thêm</label>
                <input value={form.customerNote} onChange={e => setForm({ ...form, customerNote: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-rose-400"
                  placeholder="Thêm thông tin nếu cần..." />
              </div>

              {/* Images */}
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">Hình ảnh <span className="text-gray-400 font-normal">(tối đa 5)</span></label>
                <input type="file" accept="image/*" multiple onChange={e => setFiles(Array.from(e.target.files).slice(0, 5))}
                  className="w-full text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-rose-50 file:text-rose-600 hover:file:bg-rose-100" />
                {files.length > 0 && <p className="text-xs text-gray-400 mt-1">{files.length} ảnh đã chọn</p>}
              </div>
            </form>

            <div className="flex gap-3 px-6 py-4 border-t shrink-0">
              <button type="button" onClick={() => setShowForm(false)}
                className="flex-1 border border-gray-200 py-2.5 rounded-xl text-sm text-gray-600 hover:bg-gray-50 font-medium">Hủy</button>
              <button onClick={handleSubmit}
                className="flex-1 bg-rose-500 text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-rose-600 active:scale-95 transition-all shadow-sm">
                {priceDiff > 0 ? 'Gửi & Thanh toán' : 'Gửi yêu cầu'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Product picker modal */}
      {showPicker && (
        <ProductPicker
          onSelect={p => { setForm({ ...form, exchangeProductId: p.id, exchangeProduct: p, exchangeProductQty: 1 }); setShowPicker(false); }}
          onClose={() => setShowPicker(false)}
        />
      )}

      {/* Payment modal */}
      {paymentModal && (
        <ReturnPaymentModal
          modal={paymentModal}
          walletBalance={walletBalance}
          onClose={() => setPaymentModal(null)}
          onPaid={() => { setPaymentModal(null); setPage(1); load(1, filter); }}
        />
      )}
    </div>
  );
}

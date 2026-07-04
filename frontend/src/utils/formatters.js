export const formatCurrency = (amount) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);

export const formatDate = (date) =>
  new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(date));

export const formatDateTime = (date) =>
  new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  }).format(new Date(date));

export const ORDER_STATUS_LABEL = {
  pending_payment: 'Chờ thanh toán',
  paid: 'Đã thanh toán',
  confirmed: 'Đã xác nhận',
  preparing: 'Đang chuẩn bị',
  shipping: 'Đang giao hàng',
  delivered: 'Đã giao hàng',
  cancelled: 'Đã hủy',
  // legacy
  pending: 'Chờ xác nhận',
  completed: 'Hoàn thành',
};

export const ORDER_STATUS_COLOR = {
  pending_payment: 'bg-orange-100 text-orange-700',
  paid: 'bg-blue-100 text-blue-700',
  confirmed: 'bg-indigo-100 text-indigo-700',
  preparing: 'bg-purple-100 text-purple-700',
  shipping: 'bg-cyan-100 text-cyan-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
  pending: 'bg-yellow-100 text-yellow-700',
  completed: 'bg-green-100 text-green-700',
};

// Shopee-like ordered flow steps
export const ORDER_STEPS = [
  { key: 'pending_payment', label: 'Chờ thanh toán', icon: '💳' },
  { key: 'paid', label: 'Đã thanh toán', icon: '✅' },
  { key: 'confirmed', label: 'Đã xác nhận', icon: '📋' },
  { key: 'preparing', label: 'Đang chuẩn bị', icon: '📦' },
  { key: 'shipping', label: 'Đang giao', icon: '🚚' },
  { key: 'delivered', label: 'Đã giao', icon: '🏠' },
];

export const getStepIndex = (status) => {
  const map = { pending_payment: 0, paid: 1, confirmed: 2, preparing: 3, shipping: 4, delivered: 5, pending: 0, completed: 5 };
  return map[status] ?? -1;
};

export const CUSTOM_STATUS_LABEL = {
  submitted: 'Đã gửi yêu cầu',
  reviewing: 'Đang xem xét',
  quoted: 'Đã báo giá',
  deposit_paid: 'Đã thanh toán cọc',
  in_production: 'Đang sản xuất',
  completed: 'Hoàn thành',
  delivered: 'Đã giao hàng',
  remaining_paid: 'Đã thanh toán đủ',
  cancelled: 'Đã hủy',
};

export const CUSTOM_STATUS_COLOR = {
  submitted: 'bg-blue-100 text-blue-700',
  reviewing: 'bg-yellow-100 text-yellow-700',
  quoted: 'bg-purple-100 text-purple-700',
  deposit_paid: 'bg-indigo-100 text-indigo-700',
  in_production: 'bg-orange-100 text-orange-700',
  completed: 'bg-green-100 text-green-700',
  delivered: 'bg-emerald-100 text-emerald-700',
  remaining_paid: 'bg-teal-100 text-teal-700',
  cancelled: 'bg-red-100 text-red-700',
};

export const PAYMENT_STATUS_COLOR = {
  unpaid: 'bg-red-100 text-red-700',
  paid: 'bg-green-100 text-green-700',
  refunded: 'bg-gray-100 text-gray-700',
  failed: 'bg-red-100 text-red-700',
  cancelled: 'bg-gray-100 text-gray-600',
};

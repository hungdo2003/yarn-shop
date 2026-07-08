/**
 * Re-exports react-hot-toast with an added `warning` helper.
 *
 * Usage:
 *   import toast, { toastWarning } from '../utils/toast';
 *   toast.success('Thành công!');          // xanh lá
 *   toast.error('Thất bại!');              // đỏ
 *   toastWarning('Cảnh báo!');             // vàng
 */
import toast from 'react-hot-toast';

export const toastWarning = (message, options) =>
  toast(message, {
    icon: '⚠️',
    duration: 4000,
    style: {
      background: '#f59e0b',
      color: '#fff',
      borderRadius: '10px',
      fontWeight: '500',
      fontSize: '14px',
    },
    ...options,
  });

export default toast;

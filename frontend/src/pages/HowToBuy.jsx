import { Link } from 'react-router-dom';

const steps = [
  { num: '01', title: 'Chọn sản phẩm', desc: 'Duyệt qua danh mục hoặc tìm kiếm sản phẩm bạn muốn mua. Xem thông tin chi tiết, hình ảnh và đánh giá từ khách hàng khác.' },
  { num: '02', title: 'Thêm vào giỏ hàng', desc: 'Nhấn "Thêm vào giỏ" hoặc "Mua ngay". Bạn có thể tiếp tục mua sắm hoặc tiến hành thanh toán ngay.' },
  { num: '03', title: 'Điền thông tin giao hàng', desc: 'Nhập tên, số điện thoại và địa chỉ giao hàng. Khách hàng đã đăng nhập có thể chọn địa chỉ đã lưu.' },
  { num: '04', title: 'Chọn phương thức vận chuyển', desc: 'Tiêu chuẩn (3-5 ngày): 30.000đ | Hỏa tốc (1-2 ngày): 50.000đ | Tiết kiệm (5-7 ngày): 15.000đ. Miễn phí giao hàng tiêu chuẩn cho đơn từ 500.000đ.' },
  { num: '05', title: 'Thanh toán', desc: 'Chọn thanh toán khi nhận hàng (COD) hoặc chuyển khoản ngân hàng. Áp dụng mã giảm giá nếu có.' },
  { num: '06', title: 'Xác nhận đơn hàng', desc: 'Nhân viên sẽ gọi điện xác nhận đơn hàng và địa chỉ giao hàng trong vòng 2-4 giờ (trong giờ làm việc).' },
  { num: '07', title: 'Nhận hàng', desc: 'Theo dõi trạng thái đơn hàng qua tài khoản. Kiểm tra hàng trước khi thanh toán (với COD).' },
];

const payments = [
  { icon: '💵', name: 'Thanh toán khi nhận hàng (COD)', desc: 'Trả tiền mặt khi nhận hàng. Kiểm tra sản phẩm trước khi thanh toán.' },
  { icon: '🏦', name: 'Chuyển khoản ngân hàng', desc: 'Vietcombank | Techcombank | Momo. Đơn hàng xử lý sau khi xác nhận thanh toán.' },
];

export default function HowToBuy() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <h1 className="text-2xl sm:text-3xl font-bold text-rose-600 mb-2">Hướng Dẫn Mua Hàng</h1>
      <p className="text-gray-500 mb-10">Quy trình mua hàng đơn giản, nhanh chóng tại Yarn Shop</p>

      <div className="space-y-4 mb-12">
        {steps.map(s => (
          <div key={s.num} className="flex gap-5 bg-white rounded-xl shadow-sm p-5 hover:shadow-md transition">
            <div className="w-11 h-11 xs:w-12 xs:h-12 bg-rose-100 rounded-full flex items-center justify-center shrink-0">
              <span className="text-rose-600 font-bold text-sm">{s.num}</span>
            </div>
            <div>
              <h3 className="font-semibold text-gray-800 mb-1">{s.title}</h3>
              <p className="text-gray-600 text-sm leading-relaxed">{s.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <h2 className="text-2xl font-bold text-gray-800 mb-6">Phương Thức Thanh Toán</h2>
      <div className="grid md:grid-cols-2 gap-4 mb-10">
        {payments.map(p => (
          <div key={p.name} className="bg-white rounded-xl shadow-sm p-6">
            <div className="text-3xl mb-3">{p.icon}</div>
            <h3 className="font-semibold text-gray-800 mb-2">{p.name}</h3>
            <p className="text-gray-600 text-sm">{p.desc}</p>
          </div>
        ))}
      </div>

      <div className="bg-rose-50 rounded-xl p-6 text-center">
        <p className="text-gray-700 mb-4">Bạn cần hỗ trợ thêm?</p>
        <Link to="/contact" className="bg-rose-500 text-white px-6 py-2 rounded-lg hover:bg-rose-600 active:scale-95 transition-all font-medium">Liên hệ với chúng tôi</Link>
      </div>
    </div>
  );
}

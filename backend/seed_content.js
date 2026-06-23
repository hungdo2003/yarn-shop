require('dotenv').config();
const { SiteContent } = require('./src/models');

const contents = [
  { key: 'policies', title: 'Chính Sách Cửa Hàng', content: '<h2>Chính sách đổi trả</h2><p>Sản phẩm được đổi trả trong vòng 7 ngày kể từ ngày nhận hàng với điều kiện còn nguyên vẹn, chưa qua sử dụng.</p><h2>Chính sách bảo hành</h2><p>Sản phẩm handmade được bảo hành 6 tháng về chất lượng đường may và vật liệu.</p><h2>Chính sách hoàn tiền</h2><p>Hoàn tiền 100% trong vòng 3-5 ngày làm việc nếu sản phẩm lỗi do nhà sản xuất.</p>' },
  { key: 'shipping_policy', title: 'Chính Sách Giao Hàng', content: '<h2>Phạm vi giao hàng</h2><p>Giao hàng toàn quốc qua các đơn vị vận chuyển uy tín (Giao Hàng Nhanh, Giao Hàng Tiết Kiệm, ViettelPost).</p><h2>Thời gian giao hàng</h2><ul><li>TP.HCM & Hà Nội: 1-2 ngày</li><li>Các tỉnh thành khác: 2-5 ngày</li><li>Vùng xa: 3-7 ngày</li></ul><h2>Phí vận chuyển</h2><ul><li>Tiêu chuẩn (3-5 ngày): 30.000đ – Miễn phí đơn từ 500.000đ</li><li>Hỏa tốc (1-2 ngày): 50.000đ</li><li>Tiết kiệm (5-7 ngày): 15.000đ</li></ul>' },
  { key: 'return_policy', title: 'Chính Sách Đổi Trả', content: '<h2>Điều kiện đổi trả</h2><ul><li>Trong vòng 7 ngày kể từ khi nhận hàng</li><li>Sản phẩm còn nguyên vẹn, chưa qua sử dụng</li><li>Có đầy đủ bao bì, nhãn mác gốc</li><li>Có hóa đơn mua hàng</li></ul><h2>Quy trình đổi trả</h2><ol><li>Liên hệ hotline 0901 234 567 hoặc email</li><li>Điền form yêu cầu đổi/trả trên website</li><li>Gửi hàng về địa chỉ cửa hàng</li><li>Nhận hàng mới hoặc hoàn tiền trong 3-5 ngày</li></ol>' },
  { key: 'privacy_policy', title: 'Chính Sách Bảo Mật', content: '<h2>Thông tin chúng tôi thu thập</h2><p>Chúng tôi thu thập tên, email, số điện thoại và địa chỉ giao hàng để xử lý đơn hàng.</p><h2>Cách chúng tôi sử dụng thông tin</h2><p>Thông tin chỉ được dùng để xử lý đơn hàng, gửi thông báo và cải thiện dịch vụ.</p><h2>Bảo mật dữ liệu</h2><p>Chúng tôi áp dụng các biện pháp bảo mật tiêu chuẩn ngành để bảo vệ dữ liệu của bạn.</p>' },
  { key: 'how_to_buy', title: 'Hướng Dẫn Mua Hàng', content: '<h2>Các bước đặt hàng</h2><ol><li>Chọn sản phẩm và thêm vào giỏ hàng</li><li>Kiểm tra giỏ hàng và điền mã giảm giá (nếu có)</li><li>Điền thông tin giao hàng</li><li>Chọn phương thức vận chuyển</li><li>Chọn phương thức thanh toán</li><li>Xác nhận đặt hàng</li><li>Nhân viên sẽ gọi điện xác nhận trong 2-4 giờ</li></ol>' },
  { key: 'contact_info', title: 'Thông Tin Liên Hệ', content: '<p><strong>📍 Địa chỉ:</strong> 123 Đường ABC, Phường XYZ, Quận 1, TP.HCM</p><p><strong>📞 Hotline:</strong> 0901 234 567 (8:00–20:00)</p><p><strong>✉️ Email:</strong> hello@yarnshop.vn</p><p><strong>🕐 Giờ làm việc:</strong> 8:00 – 20:00, Thứ 2 – Chủ nhật</p><p><strong>Facebook:</strong> fb.com/yarnshop.vn</p><p><strong>Instagram:</strong> @yarnshop.vn</p>' },
  { key: 'about_us', title: 'Về Chúng Tôi', content: '<p>Yarn Shop là cửa hàng chuyên cung cấp len sợi chất lượng cao và các sản phẩm handmade được làm từ len một cách tỉ mỉ và đầy sáng tạo.</p><p>Được thành lập từ năm 2020, chúng tôi tự hào là địa chỉ tin cậy cho những người yêu thích đan móc và handmade tại Việt Nam.</p>' }
];

const run = async () => {
  for (const c of contents) {
    const [record, created] = await SiteContent.findOrCreate({ where: { key: c.key }, defaults: c });
    console.log(`${created ? 'Created' : 'Exists'}: ${c.key}`);
  }
  process.exit(0);
};
run().catch(e => { console.error(e.message); process.exit(1); });

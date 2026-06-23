const { SiteContent } = require('../models');

const defaults = {
  policies: { title: 'Chính Sách Cửa Hàng', content: '<h2>Chính sách đổi trả</h2><p>Sản phẩm được đổi trả trong vòng 7 ngày...</p><h2>Chính sách bảo hành</h2><p>Bảo hành 6 tháng cho sản phẩm handmade...</p>' },
  how_to_buy: { title: 'Hướng Dẫn Mua Hàng', content: '<h2>Cách đặt hàng</h2><ol><li>Chọn sản phẩm và thêm vào giỏ hàng</li><li>Kiểm tra giỏ hàng</li><li>Điền thông tin giao hàng</li><li>Chọn phương thức thanh toán</li><li>Xác nhận đơn hàng</li></ol>' },
  contact_info: { title: 'Thông Tin Liên Hệ', content: '<p><strong>Địa chỉ:</strong> 123 Đường ABC, Quận 1, TP.HCM</p><p><strong>Điện thoại:</strong> 0901 234 567</p><p><strong>Email:</strong> hello@yarnshop.vn</p><p><strong>Giờ làm việc:</strong> 8:00 - 20:00, Thứ 2 - Chủ nhật</p>' },
  about_us: { title: 'Về Chúng Tôi', content: '<p>Yarn Shop là cửa hàng chuyên cung cấp len sợi chất lượng cao và các sản phẩm handmade được làm từ len...</p>' },
  shipping_policy: { title: 'Chính Sách Giao Hàng', content: '<p>Giao hàng toàn quốc. Miễn phí giao hàng cho đơn hàng trên 500.000đ...</p>' },
  return_policy: { title: 'Chính Sách Hoàn Trả', content: '<p>Hàng nguyên vẹn, chưa qua sử dụng được đổi trả trong 7 ngày...</p>' },
  privacy_policy: { title: 'Chính Sách Bảo Mật', content: '<p>Chúng tôi cam kết bảo vệ thông tin cá nhân của khách hàng...</p>' }
};

exports.get = async (req, res) => {
  const { key } = req.params;
  let content = await SiteContent.findOne({ where: { key } });
  if (!content) {
    const def = defaults[key];
    if (!def) return res.status(404).json({ message: 'Content not found' });
    content = await SiteContent.create({ key, ...def, updatedBy: null });
  }
  res.json(content);
};

exports.getAll = async (req, res) => {
  const contents = await SiteContent.findAll({ order: [['key', 'ASC']] });
  res.json(contents);
};

exports.upsert = async (req, res) => {
  const { key } = req.params;
  const { title, content } = req.body;
  const [record, created] = await SiteContent.findOrCreate({
    where: { key }, defaults: { key, title, content, updatedBy: req.user.id }
  });
  if (!created) await record.update({ title, content, updatedBy: req.user.id });
  res.json(record);
};

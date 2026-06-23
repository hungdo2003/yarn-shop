const { ChatConversation, ChatMessage, User, Product, Category, Order, OrderDetail } = require('../models');
const { Op } = require('sequelize');

// Customer: get or create their open conversation
const getOrCreateConversation = async (req, res) => {
  try {
    let conv = await ChatConversation.findOne({
      where: { customerId: req.user.id, status: { [Op.ne]: 'closed' } },
      order: [['createdAt', 'DESC']],
    });
    if (!conv) {
      conv = await ChatConversation.create({ customerId: req.user.id });
      await ChatMessage.create({
        conversationId: conv.id,
        senderRole: 'bot',
        content: 'Xin chào! Tôi là YarnBot trợ lý của YarnShop 🧶\nBạn có thể hỏi tôi về sản phẩm, giá cả, tình trạng hàng, giao hàng, hoặc đổi trả. Nhân viên cũng sẽ hỗ trợ bạn ngay khi trực tuyến!',
      });
    }
    const messages = await ChatMessage.findAll({
      where: { conversationId: conv.id },
      include: [{ model: User, attributes: ['id', 'fullName'], required: false }],
      order: [['createdAt', 'ASC']],
    });
    res.json({ conversation: conv, messages });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// Staff: list all open conversations
const listConversations = async (req, res) => {
  try {
    const convs = await ChatConversation.findAll({
      where: { status: { [Op.ne]: 'closed' } },
      include: [
        { model: User, as: 'customer', attributes: ['id', 'fullName', 'email'] },
        { model: User, as: 'staff', attributes: ['id', 'fullName'], required: false },
      ],
      order: [['lastMessageAt', 'DESC']],
    });
    const result = await Promise.all(convs.map(async c => {
      const last = await ChatMessage.findOne({ where: { conversationId: c.id }, order: [['createdAt', 'DESC']] });
      const unread = await ChatMessage.count({ where: { conversationId: c.id, isRead: false, senderRole: 'customer' } });
      return { ...c.toJSON(), lastMessage: last, unreadCount: unread };
    }));
    res.json(result);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// Get messages for a conversation
const getMessages = async (req, res) => {
  try {
    const { id } = req.params;
    const conv = await ChatConversation.findByPk(id);
    if (!conv) return res.status(404).json({ message: 'Không tìm thấy cuộc hội thoại' });
    if (req.user.Role?.name === 'customer' && conv.customerId !== req.user.id) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    if (req.user.Role?.name !== 'customer') {
      await ChatMessage.update({ isRead: true }, { where: { conversationId: id, senderRole: 'customer', isRead: false } });
    }
    const messages = await ChatMessage.findAll({
      where: { conversationId: id },
      include: [{ model: User, attributes: ['id', 'fullName'], required: false }],
      order: [['createdAt', 'ASC']],
    });
    res.json({ conversation: conv, messages });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// REST fallback: send a message (used when socket is unavailable)
const sendMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    if (!content?.trim()) return res.status(400).json({ message: 'Nội dung không được để trống' });

    const conv = await ChatConversation.findByPk(id);
    if (!conv) return res.status(404).json({ message: 'Không tìm thấy cuộc hội thoại' });
    const roleName = req.user.Role?.name;
    if (roleName === 'customer' && conv.customerId !== req.user.id) return res.status(403).json({ message: 'Forbidden' });

    const senderRole = (roleName === 'staff' || roleName === 'admin') ? 'staff' : 'customer';
    const msg = await ChatMessage.create({
      conversationId: conv.id,
      senderId: req.user.id,
      senderRole,
      content: content.trim(),
      isRead: senderRole === 'staff',
    });
    await conv.update({ lastMessageAt: new Date() });

    const messages = [{ ...msg.toJSON(), User: { id: req.user.id, fullName: req.user.fullName } }];

    // Auto bot reply for customer messages
    if (senderRole === 'customer') {
      const reply = await botReply(content.trim(), req.user.id);
      if (reply) {
        const botMsg = await ChatMessage.create({ conversationId: conv.id, senderRole: 'bot', content: reply, isRead: false });
        await conv.update({ lastMessageAt: new Date() });
        messages.push({ ...botMsg.toJSON(), User: { id: null, fullName: 'YarnBot' } });
      }
    }

    res.json({ messages });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// Bot: answer product/shop questions from live DB data
async function botReply(content, userId = null) {
  const q = content.toLowerCase().trim();

  // Greeting
  if (/^(xin chào|hello|hi|chào|hey|alo|ơi)\b/.test(q)) {
    return 'Xin chào bạn! 👋 Tôi là YarnBot của YarnShop.\n\nBạn có thể hỏi tôi về:\n• 🧶 Sản phẩm len, sợi, phụ kiện\n• 💰 Giá cả và khuyến mãi\n• 🚚 Giao hàng\n• 🔄 Đổi trả\n• 💳 Thanh toán';
  }

  // Order status check
  if ((q.includes('đơn hàng') || q.includes('đơn') || q.includes('order')) && userId) {
    try {
      const orders = await Order.findAll({
        where: { userId },
        order: [['createdAt', 'DESC']],
        limit: 3,
      });
      if (orders.length > 0) {
        const statusMap = {
          pending_payment: 'Chờ thanh toán', paid: 'Đã thanh toán',
          confirmed: 'Đã xác nhận', preparing: 'Đang chuẩn bị',
          shipping: 'Đang giao', delivered: 'Đã giao', cancelled: 'Đã hủy',
        };
        const list = orders.map(o => `• Đơn #${o.orderCode || o.id} — ${statusMap[o.status] || o.status}`).join('\n');
        return `Dưới đây là ${orders.length} đơn hàng gần nhất của bạn:\n${list}\n\nBạn muốn biết thêm về đơn nào?`;
      }
      return 'Bạn chưa có đơn hàng nào. Hãy khám phá sản phẩm của chúng tôi nhé!';
    } catch {}
  }

  // Shipping questions
  if (q.includes('giao hàng') || q.includes('ship') || q.includes('vận chuyển') || q.includes('phí ship')) {
    return '🚚 Phương thức giao hàng của YarnShop:\n\n• **Tiêu chuẩn** (3-5 ngày) — 30,000đ\n  ✅ Miễn phí khi đơn từ 500,000đ\n• **Hỏa tốc** (1-2 ngày) — 60,000đ\n• **Tiết kiệm** (5-7 ngày) — 15,000đ';
  }

  // Return/refund
  if (q.includes('đổi trả') || q.includes('hoàn tiền') || q.includes('trả hàng') || q.includes('refund')) {
    return '🔄 Chính sách đổi trả YarnShop:\n\n• Trong vòng **7 ngày** kể từ ngày nhận hàng\n• Sản phẩm còn nguyên vẹn, chưa sử dụng\n• Lỗi từ nhà sản xuất: đổi mới miễn phí\n• Hoàn tiền vào ví trong 24h sau khi xử lý';
  }

  // Payment
  if (q.includes('thanh toán') || q.includes('ví') || q.includes('payos') || q.includes('chuyển khoản') || q.includes('payment')) {
    return '💳 Hình thức thanh toán:\n\n• **Ví YarnShop** — Nạp tiền, thanh toán tức thì\n• **PayOS** — Chuyển khoản ngân hàng/thẻ nội địa/QR\n\nKhuyến khích dùng Ví YarnShop để nhận hoàn tiền khi hủy đơn tự động!';
  }

  // Promotions/discount
  if (q.includes('khuyến mãi') || q.includes('giảm giá') || q.includes('voucher') || q.includes('coupon') || q.includes('sale')) {
    return '🎉 Chương trình khuyến mãi hiện tại:\n\n• Miễn phí vận chuyển tiêu chuẩn khi đơn từ 500,000đ\n• Tích điểm thành viên với mỗi đơn hàng\n• Xem thêm tại trang Khuyến mãi!';
  }

  // Product search
  const productKeywords = ['len', 'sợi', 'móc', 'đan', 'kim', 'que', 'phụ kiện', 'màu', 'giá', 'còn hàng', 'bán', 'sản phẩm', 'mua', 'acrylic', 'cotton', 'wool', 'bamboo'];
  const isProductQuery = productKeywords.some(k => q.includes(k));

  if (isProductQuery) {
    try {
      // Build a meaningful search term
      const cleanQ = content.replace(/[?!.,;]/g, '').trim();
      const products = await Product.findAll({
        where: {
          status: 'active',
          [Op.or]: [
            { name: { [Op.iLike]: `%${cleanQ}%` } },
            { description: { [Op.iLike]: `%${cleanQ}%` } },
            { color: { [Op.iLike]: `%${cleanQ}%` } },
          ],
        },
        include: [{ model: Category, attributes: ['name'] }],
        limit: 4,
      });

      if (products.length > 0) {
        const list = products.map(p => {
          const price = Number(p.salePrice || p.price).toLocaleString('vi-VN');
          const stock = p.stock > 0 ? `còn ${p.stock}` : '**hết hàng**';
          const sale = p.salePrice ? ` 🏷️ Giảm còn ${price}đ` : ` — ${price}đ`;
          return `• **${p.name}**${sale} (${stock})`;
        }).join('\n');
        return `Tôi tìm thấy ${products.length} sản phẩm phù hợp:\n\n${list}\n\nBạn muốn biết thêm chi tiết về sản phẩm nào?`;
      }

      // No results: try broader search with individual words
      const words = cleanQ.split(/\s+/).filter(w => w.length > 2);
      if (words.length > 0) {
        const broader = await Product.findAll({
          where: {
            status: 'active',
            name: { [Op.iLike]: `%${words[0]}%` },
          },
          limit: 3,
        });
        if (broader.length > 0) {
          const list = broader.map(p => `• **${p.name}** — ${Number(p.salePrice || p.price).toLocaleString('vi-VN')}đ`).join('\n');
          return `Không tìm thấy kết quả chính xác, nhưng có các sản phẩm liên quan:\n\n${list}`;
        }
      }
      return 'Tôi chưa tìm thấy sản phẩm phù hợp với yêu cầu của bạn. Hãy thử tìm kiếm trên trang sản phẩm hoặc nhân viên sẽ tư vấn thêm!';
    } catch (err) {
      console.error('botReply product search error:', err.message);
    }
  }

  // Default fallback
  if (q.length > 2) {
    return 'Xin lỗi, tôi chưa hiểu câu hỏi của bạn 😅\n\nTôi có thể giúp bạn về:\n• Tìm sản phẩm len, sợi, phụ kiện\n• Thông tin giao hàng, đổi trả\n• Trạng thái đơn hàng\n\nHoặc nhân viên sẽ hỗ trợ bạn trực tiếp ngay!';
  }

  return null;
}

// Public bot endpoint — no auth required
const botEndpoint = async (req, res) => {
  try {
    const { message, userId } = req.body;
    if (!message?.trim()) return res.status(400).json({ reply: 'Vui lòng nhập câu hỏi.' });
    const reply = await botReply(message.trim(), userId || null);
    res.json({
      reply: reply || 'Xin lỗi, tôi chưa hiểu câu hỏi của bạn 😅\n\nBạn có thể hỏi tôi về sản phẩm, giao hàng, đổi trả hoặc thanh toán. Hoặc chọn **Chat với nhân viên** để được hỗ trợ trực tiếp!',
    });
  } catch (err) { res.status(500).json({ reply: 'Có lỗi xảy ra, vui lòng thử lại.' }); }
};

module.exports = { getOrCreateConversation, listConversations, getMessages, sendMessage, botEndpoint, botReply };

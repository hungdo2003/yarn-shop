const { GoogleGenerativeAI } = require('@google/generative-ai');
const { ChatConversation, ChatMessage, User, Product, Category, Order, CustomOrder } = require('../models');
const { Op: SeqOp } = require('sequelize');

const genAI = process.env.GEMINI_API_KEY
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null;

// ── Tool definitions (Gemini functionDeclarations format) ─────────────────────

const GEMINI_TOOLS = [{
  functionDeclarations: [
    {
      name: 'search_products',
      description: 'Tìm kiếm sản phẩm len/sợi/phụ kiện theo tên, màu sắc, hoặc từ khóa. Trả về danh sách sản phẩm phù hợp kèm giá và tồn kho.',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Từ khóa tìm kiếm (tên sản phẩm, màu sắc, chất liệu...)' },
          limit: { type: 'number', description: 'Số lượng kết quả tối đa (mặc định 5)' },
        },
        required: ['query'],
      },
    },
    {
      name: 'get_categories',
      description: 'Lấy danh sách tất cả danh mục sản phẩm trong cửa hàng.',
      parameters: { type: 'object', properties: {} },
    },
    {
      name: 'get_my_orders',
      description: 'Lấy danh sách đơn hàng thông thường gần đây của khách hàng đang đăng nhập.',
      parameters: {
        type: 'object',
        properties: {
          limit: { type: 'number', description: 'Số đơn hàng tối đa (mặc định 5)' },
        },
      },
    },
    {
      name: 'get_my_custom_orders',
      description: 'Lấy danh sách đơn hàng thiết kế/handmade tùy chỉnh của khách hàng đang đăng nhập.',
      parameters: {
        type: 'object',
        properties: {
          limit: { type: 'number', description: 'Số đơn hàng tối đa (mặc định 5)' },
        },
      },
    },
    {
      name: 'get_shop_info',
      description: 'Lấy thông tin chính sách cửa hàng: giao hàng, đổi trả, thanh toán, khuyến mãi.',
      parameters: {
        type: 'object',
        properties: {
          topic: {
            type: 'string',
            description: 'Chủ đề: shipping, return, payment, promotion, hoặc general',
          },
        },
        required: ['topic'],
      },
    },
  ],
}];

// ── Tool executors ────────────────────────────────────────────────────────────

const SHOP_INFO = {
  shipping: '🚚 Phương thức giao hàng YarnShop:\n• Tiêu chuẩn (3-5 ngày): 30,000đ — miễn phí khi đơn từ 500,000đ\n• Hỏa tốc (1-2 ngày): 60,000đ\n• Tiết kiệm (5-7 ngày): 15,000đ',
  return: '🔄 Chính sách đổi trả:\n• Trong vòng 7 ngày kể từ ngày nhận\n• Sản phẩm còn nguyên vẹn, chưa sử dụng\n• Lỗi nhà sản xuất: đổi mới miễn phí\n• Hoàn tiền vào ví trong 24h',
  payment: '💳 Hình thức thanh toán:\n• Ví YarnShop (tức thì, hoàn tiền tự động khi hủy)\n• PayOS — QR/thẻ nội địa/chuyển khoản',
  promotion: '🎉 Khuyến mãi:\n• Miễn phí ship tiêu chuẩn khi đơn từ 500,000đ\n• Tích điểm thành viên mỗi đơn\n• Xem thêm tại trang Khuyến mãi',
  general: 'YarnShop là cửa hàng chuyên len, sợi, phụ kiện đan móc và sản phẩm handmade. Chúng tôi nhận đặt hàng thiết kế theo yêu cầu.',
};

async function executeTool(name, input, userId) {
  try {
    if (name === 'search_products') {
      const { query, limit = 5 } = input;
      const products = await Product.findAll({
        where: {
          status: 'active',
          [SeqOp.or]: [
            { name: { [SeqOp.iLike]: `%${query}%` } },
            { description: { [SeqOp.iLike]: `%${query}%` } },
            { color: { [SeqOp.iLike]: `%${query}%` } },
          ],
        },
        include: [{ model: Category, attributes: ['name'] }],
        limit: Math.min(limit, 10),
      });
      if (!products.length) return { found: false, message: 'Không tìm thấy sản phẩm phù hợp.' };
      return {
        found: true,
        count: products.length,
        products: products.map(p => ({
          id: p.id,
          name: p.name,
          price: Number(p.price),
          salePrice: p.salePrice ? Number(p.salePrice) : null,
          stock: p.stock,
          color: p.color || null,
          category: p.Category?.name || null,
          inStock: p.stock > 0,
        })),
      };
    }

    if (name === 'get_categories') {
      const cats = await Category.findAll({
        where: { parentId: null },
        attributes: ['id', 'name', 'type'],
      });
      return { categories: cats.map(c => ({ id: c.id, name: c.name, type: c.type })) };
    }

    if (name === 'get_my_orders') {
      if (!userId) return { error: 'Khách hàng chưa đăng nhập.' };
      const { limit = 5 } = input;
      const orders = await Order.findAll({
        where: { userId },
        order: [['createdAt', 'DESC']],
        limit: Math.min(limit, 10),
        attributes: ['id', 'orderCode', 'status', 'totalAmount', 'createdAt'],
      });
      const statusMap = {
        pending_payment: 'Chờ thanh toán', paid: 'Đã thanh toán',
        confirmed: 'Đã xác nhận', preparing: 'Đang chuẩn bị',
        shipping: 'Đang giao hàng', delivered: 'Đã giao hàng', cancelled: 'Đã hủy',
      };
      return {
        count: orders.length,
        orders: orders.map(o => ({
          code: o.orderCode || String(o.id),
          status: statusMap[o.status] || o.status,
          total: Number(o.totalAmount || 0),
          date: new Date(o.createdAt).toLocaleDateString('vi-VN'),
        })),
      };
    }

    if (name === 'get_my_custom_orders') {
      if (!userId) return { error: 'Khách hàng chưa đăng nhập.' };
      const { limit = 5 } = input;
      const orders = await CustomOrder.findAll({
        where: { userId },
        order: [['createdAt', 'DESC']],
        limit: Math.min(limit, 10),
        attributes: ['id', 'code', 'status', 'quotedPrice', 'depositAmount', 'description', 'createdAt'],
      });
      const statusMap = {
        submitted: 'Đã gửi yêu cầu', reviewing: 'Đang xem xét', quoted: 'Đã báo giá',
        deposit_paid: 'Đã đặt cọc', in_production: 'Đang sản xuất',
        completed: 'Hoàn thành', delivered: 'Đã giao hàng',
        remaining_paid: 'Đã thanh toán đủ', cancelled: 'Đã hủy',
      };
      return {
        count: orders.length,
        orders: orders.map(o => ({
          code: o.code,
          status: statusMap[o.status] || o.status,
          quotedPrice: o.quotedPrice ? Number(o.quotedPrice) : null,
          needsAction: o.status === 'quoted' || o.status === 'delivered',
          description: o.description ? o.description.substring(0, 80) + (o.description.length > 80 ? '...' : '') : null,
          date: new Date(o.createdAt).toLocaleDateString('vi-VN'),
        })),
      };
    }

    if (name === 'get_shop_info') {
      return { info: SHOP_INFO[input.topic] || SHOP_INFO.general };
    }

    return { error: 'Unknown tool' };
  } catch (err) {
    return { error: err.message };
  }
}

// ── Gemini AI reply ───────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `Bạn là YarnBot, trợ lý AI thông minh của YarnShop — cửa hàng chuyên len sợi và sản phẩm handmade.
Bạn có thể tra cứu dữ liệu thực từ cơ sở dữ liệu cửa hàng qua các công cụ được cung cấp.

Hướng dẫn:
- Trả lời bằng tiếng Việt, thân thiện, ngắn gọn (tối đa 5-8 dòng nếu không cần liệt kê)
- Dùng emoji phù hợp để tăng tính thân thiện
- Giá tiền: định dạng "123,456đ"
- Nếu khách hỏi về đơn hàng cá nhân nhưng userId = null, nhắc đăng nhập
- Không bịa thông tin; nếu không chắc hãy dùng công cụ để tra cứu
- Khi liệt kê sản phẩm: hiển thị tên, giá, tình trạng tồn kho`;

async function geminiReply(content, userId) {
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    systemInstruction: SYSTEM_PROMPT,
    tools: GEMINI_TOOLS,
  });

  const chat = model.startChat();
  let result = await chat.sendMessage(content);

  // Tool-use loop
  while (true) {
    const calls = result.response.functionCalls();
    if (!calls || calls.length === 0) break;

    const responses = await Promise.all(
      calls.map(async call => ({
        functionResponse: {
          name: call.name,
          response: await executeTool(call.name, call.args, userId),
        },
      }))
    );

    result = await chat.sendMessage(responses);
  }

  return result.response.text() || null;
}

// ── Keyword fallback (no API key) ─────────────────────────────────────────────

// Extract meaningful search words (>2 chars, skip Vietnamese filler words)
const STOP_WORDS = new Set(['có', 'những', 'các', 'một', 'của', 'và', 'với', 'cho', 'từ', 'trong', 'nào', 'gì', 'không', 'được', 'bạn', 'tôi', 'muốn', 'cần', 'xem', 'hỏi', 'về', 'cho', 'thể', 'mình', 'ơi', 'ạ', 'nhé', 'nha', 'vậy', 'thì', 'là', 'này', 'đó', 'hay', 'hoặc']);

function extractSearchTerms(q) {
  return q.split(/[\s,?.!]+/).filter(w => w.length > 2 && !STOP_WORDS.has(w));
}

async function searchProductsByTerms(terms, limit = 5) {
  if (!terms.length) return [];
  const conditions = terms.map(t => ({
    [SeqOp.or]: [
      { name: { [SeqOp.iLike]: `%${t}%` } },
      { color: { [SeqOp.iLike]: `%${t}%` } },
      { description: { [SeqOp.iLike]: `%${t}%` } },
    ],
  }));
  return Product.findAll({
    where: { status: 'active', [SeqOp.or]: conditions },
    include: [{ model: Category, attributes: ['name'] }],
    limit,
  });
}

function formatProductList(products) {
  return products.map(p => {
    const price = Number(p.salePrice || p.price).toLocaleString('vi-VN');
    const stock = p.stock > 0 ? `còn ${p.stock}` : '**hết hàng**';
    const sale = p.salePrice ? ` 🏷️ sale còn ${price}đ` : ` — ${price}đ`;
    return `• **${p.name}**${sale} (${stock})`;
  }).join('\n');
}

async function keywordReply(content, userId) {
  const q = content.toLowerCase().trim();

  // ── Chào hỏi ──
  if (/\b(xin chào|hello|hi|chào|hey|alo|ơi bot|bot ơi|yarnbot)\b/.test(q) || q === 'hi' || q === 'hello') {
    return 'Xin chào bạn! 👋 Tôi là **YarnBot** của YarnShop.\n\nTôi có thể giúp bạn:\n• 🧶 Tìm sản phẩm len, sợi, phụ kiện\n• 📦 Kiểm tra trạng thái đơn hàng\n• 🚚 Thông tin giao hàng & đổi trả\n• 💳 Hướng dẫn thanh toán\n\nBạn cần hỗ trợ gì?';
  }

  // ── Cảm ơn ──
  if (/\b(cảm ơn|thank|thanks|ok|oke|được rồi)\b/.test(q)) {
    return 'Không có gì! 😊 Nếu cần hỗ trợ thêm, cứ hỏi YarnBot nhé!';
  }

  // ── Shop bán gì / danh mục ──
  if (q.includes('bán gì') || q.includes('có gì') || q.includes('sản phẩm gì') || q.includes('danh mục') || q.includes('loại sản phẩm') || q.includes('shop có')) {
    try {
      const cats = await Category.findAll({ where: { parentId: null }, attributes: ['name', 'type'] });
      const list = cats.map(c => `• ${c.name}`).join('\n');
      return `🧶 YarnShop chuyên bán:\n${list}\n\nBạn muốn tìm sản phẩm nào cụ thể?`;
    } catch {
      return '🧶 YarnShop chuyên cung cấp len sợi, phụ kiện đan móc và sản phẩm handmade. Hỏi tôi về sản phẩm cụ thể nhé!';
    }
  }

  // ── Sản phẩm bán chạy / phổ biến ──
  if (q.includes('bán chạy') || q.includes('phổ biến') || q.includes('hot') || q.includes('nổi bật') || q.includes('nhiều người mua') || q.includes('gợi ý') || q.includes('tư vấn')) {
    try {
      const products = await Product.findAll({
        where: { status: 'active', stock: { [SeqOp.gt]: 0 } },
        include: [{ model: Category, attributes: ['name'] }],
        order: [['sold', 'DESC']],
        limit: 5,
      });
      if (products.length) {
        return `🔥 Sản phẩm bán chạy tại YarnShop:\n\n${formatProductList(products)}\n\nBạn muốn biết thêm về sản phẩm nào?`;
      }
    } catch {}
  }

  // ── Đơn hàng thường ──
  if (q.includes('đơn hàng') || q.includes('order') || q.includes('mua rồi') || (q.includes('đơn') && !q.includes('thiết kế') && !q.includes('tùy chỉnh') && !q.includes('handmade'))) {
    if (!userId) return '🔐 Bạn cần **đăng nhập** để xem đơn hàng nhé!';
    try {
      const orders = await Order.findAll({ where: { userId }, order: [['createdAt', 'DESC']], limit: 5 });
      if (!orders.length) return 'Bạn chưa có đơn hàng nào. Hãy khám phá sản phẩm của YarnShop nhé! 🛍️';
      const statusMap = { pending_payment: 'Chờ thanh toán', paid: 'Đã thanh toán', confirmed: 'Đã xác nhận', preparing: 'Đang chuẩn bị', shipping: 'Đang giao hàng', delivered: 'Đã giao hàng', cancelled: 'Đã hủy' };
      const list = orders.map(o => `• Đơn **#${o.orderCode || o.id}** — ${statusMap[o.status] || o.status}`).join('\n');
      return `📦 Đơn hàng gần đây của bạn:\n\n${list}\n\nVào mục **"Đơn hàng"** để xem chi tiết!`;
    } catch {}
  }

  // ── Đơn thiết kế / custom ──
  if (q.includes('thiết kế') || q.includes('tùy chỉnh') || q.includes('handmade') || q.includes('custom') || q.includes('đặt theo yêu cầu') || q.includes('đan theo')) {
    if (q.includes('đơn') || q.includes('trạng thái') || q.includes('tiến độ')) {
      if (!userId) return '🔐 Bạn cần **đăng nhập** để xem đơn thiết kế nhé!';
      try {
        const orders = await CustomOrder.findAll({ where: { userId }, order: [['createdAt', 'DESC']], limit: 5 });
        if (!orders.length) return 'Bạn chưa có đơn thiết kế nào. Vào **"Đặt hàng tùy chỉnh"** để gửi yêu cầu nhé! 🧶';
        const statusMap = { submitted: 'Đã gửi', reviewing: 'Đang xem xét', quoted: '⚠️ Cần thanh toán cọc', deposit_paid: 'Đã đặt cọc', in_production: 'Đang sản xuất', completed: 'Hoàn thành', delivered: '⚠️ Cần thanh toán nốt', remaining_paid: 'Hoàn tất ✅', cancelled: 'Đã hủy' };
        const list = orders.map(o => `• **#${o.code}** — ${statusMap[o.status] || o.status}`).join('\n');
        return `✨ Đơn thiết kế của bạn:\n\n${list}\n\nVào **"Đơn đặt hàng tùy chỉnh"** để xem chi tiết!`;
      } catch {}
    }
    return '✨ YarnShop nhận đặt hàng thiết kế theo yêu cầu!\n\n• Mô tả sản phẩm bạn muốn\n• Chọn màu, kích thước\n• Nhân viên sẽ báo giá trong 24h\n\nVào mục **"Đặt hàng tùy chỉnh"** để bắt đầu nhé!';
  }

  // ── Giao hàng / ship ──
  if (q.includes('giao hàng') || q.includes('ship') || q.includes('vận chuyển') || q.includes('phí ship') || q.includes('phí giao') || q.includes('bao lâu') || q.includes('mất mấy ngày')) {
    return SHOP_INFO.shipping;
  }

  // ── Đổi trả / hoàn tiền ──
  if (q.includes('đổi trả') || q.includes('hoàn tiền') || q.includes('trả hàng') || q.includes('refund') || q.includes('hàng lỗi') || q.includes('hàng hỏng')) {
    return SHOP_INFO.return;
  }

  // ── Thanh toán ──
  if (q.includes('thanh toán') || q.includes('payos') || q.includes('chuyển khoản') || q.includes('nạp ví') || q.includes('ví yarnshop') || q.includes('payment') || (q.includes('ví') && !q.includes('đơn'))) {
    return SHOP_INFO.payment;
  }

  // ── Khuyến mãi / voucher ──
  if (q.includes('khuyến mãi') || q.includes('giảm giá') || q.includes('voucher') || q.includes('coupon') || q.includes('sale') || q.includes('ưu đãi') || q.includes('mã giảm')) {
    return SHOP_INFO.promotion;
  }

  // ── Tìm sản phẩm: từ khóa sản phẩm hoặc câu hỏi giá/còn hàng ──
  const productTriggers = ['len', 'sợi', 'móc', 'đan', 'kim đan', 'que đan', 'phụ kiện', 'acrylic', 'cotton', 'wool', 'bamboo', 'polyester', 'màu', 'còn hàng', 'hết hàng', 'bao nhiêu tiền', 'giá bao nhiêu', 'mua', 'tìm'];
  const isProductQuery = productTriggers.some(k => q.includes(k));

  if (isProductQuery) {
    try {
      const terms = extractSearchTerms(q);
      const products = await searchProductsByTerms(terms.length ? terms : ['len'], 5);
      if (products.length) {
        return `🧶 Tìm thấy ${products.length} sản phẩm:\n\n${formatProductList(products)}\n\nBạn muốn biết thêm về sản phẩm nào?`;
      }
      return '😔 Không tìm thấy sản phẩm phù hợp. Thử từ khóa khác hoặc xem toàn bộ danh mục tại trang Sản phẩm nhé!';
    } catch {}
  }

  // ── Giá / tồn kho sản phẩm cụ thể ──
  if (q.includes('giá') || q.includes('bao nhiêu') || q.includes('còn không') || q.includes('còn hàng')) {
    try {
      const terms = extractSearchTerms(q.replace(/giá|bao nhiêu|còn không|còn hàng/g, '').trim());
      if (terms.length) {
        const products = await searchProductsByTerms(terms, 4);
        if (products.length) {
          return `💰 Thông tin sản phẩm:\n\n${formatProductList(products)}`;
        }
      }
    } catch {}
    return '💰 Bạn muốn hỏi giá sản phẩm nào? Hãy gõ tên sản phẩm để tôi tra cứu nhé!';
  }

  // ── Liên hệ / hỗ trợ ──
  if (q.includes('liên hệ') || q.includes('hỗ trợ') || q.includes('tư vấn') || q.includes('nhân viên') || q.includes('hotline') || q.includes('zalo') || q.includes('facebook')) {
    return '📞 Để được hỗ trợ trực tiếp:\n\n• 💬 Nhấn **"Chat nhân viên"** bên dưới\n• 📧 Email: support@yarnshop.vn\n\nNhân viên sẽ phản hồi bạn sớm nhất!';
  }

  // ── Shop là gì / giới thiệu ──
  if (q.includes('yarnshop') || q.includes('shop') || q.includes('cửa hàng') || q.includes('giới thiệu') || q.includes('về shop')) {
    return SHOP_INFO.general + '\n\nHỏi tôi về sản phẩm, giá cả, giao hàng hoặc đổi trả nhé! 😊';
  }

  // ── Fallback thông minh: thử tìm sản phẩm từ bất kỳ câu nào ──
  try {
    const terms = extractSearchTerms(q);
    if (terms.length >= 1) {
      const products = await searchProductsByTerms(terms, 4);
      if (products.length) {
        return `🧶 Có thể bạn đang tìm:\n\n${formatProductList(products)}\n\nBạn muốn biết thêm không?`;
      }
    }
  } catch {}

  return 'Xin lỗi, tôi chưa hiểu câu hỏi của bạn 😅\n\nThử hỏi về:\n• **Sản phẩm**: "len acrylic màu đỏ", "còn kim đan không"\n• **Đơn hàng**: "đơn hàng của tôi"\n• **Giao hàng**: "phí ship bao nhiêu"\n• **Đổi trả**: "chính sách đổi trả"\n\nHoặc nhấn **"Chat nhân viên"** để được hỗ trợ trực tiếp!';
}

// ── Main botReply ─────────────────────────────────────────────────────────────

async function botReply(content, userId = null) {
  if (genAI) {
    try {
      return await geminiReply(content, userId);
    } catch (err) {
      console.error('Gemini API error:', err.message);
      // Fall through to keyword reply on API error
    }
  }
  return keywordReply(content, userId);
}

// ── HTTP handlers ─────────────────────────────────────────────────────────────

const getOrCreateConversation = async (req, res) => {
  try {
    let conv = await ChatConversation.findOne({
      where: { customerId: req.user.id, status: { [SeqOp.ne]: 'closed' } },
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

const listConversations = async (req, res) => {
  try {
    const convs = await ChatConversation.findAll({
      where: { status: { [SeqOp.ne]: 'closed' } },
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

const botEndpoint = async (req, res) => {
  try {
    const { message, userId } = req.body;
    if (!message?.trim()) return res.status(400).json({ reply: 'Vui lòng nhập câu hỏi.' });
    const reply = await botReply(message.trim(), userId || null);
    res.json({
      reply: reply || 'Xin lỗi, tôi chưa hiểu câu hỏi của bạn 😅\n\nBạn có thể hỏi về sản phẩm, giao hàng, đổi trả hoặc thanh toán.',
    });
  } catch (err) {
    console.error('botEndpoint error:', err.message);
    res.status(500).json({ reply: 'Có lỗi xảy ra, vui lòng thử lại.' });
  }
};

module.exports = { getOrCreateConversation, listConversations, getMessages, sendMessage, botEndpoint, botReply };

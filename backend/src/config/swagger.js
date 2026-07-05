const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'YarnShop API',
      version: '1.0.0',
      description: 'API documentation cho hệ thống e-commerce bán len & sản phẩm handmade YarnShop',
    },
    servers: [
      { url: process.env.BACKEND_URL || 'http://localhost:5000', description: 'Server' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            message: { type: 'string' },
          },
        },
        User: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            fullName: { type: 'string' },
            email: { type: 'string' },
            phone: { type: 'string' },
            address: { type: 'string' },
            avatar: { type: 'string' },
            roleId: { type: 'integer' },
            isActive: { type: 'boolean' },
            loyaltyPoints: { type: 'integer' },
            walletBalance: { type: 'number' },
          },
        },
        Product: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            code: { type: 'string' },
            name: { type: 'string' },
            slug: { type: 'string' },
            categoryId: { type: 'integer' },
            description: { type: 'string' },
            price: { type: 'number' },
            salePrice: { type: 'number' },
            color: { type: 'string' },
            size: { type: 'string' },
            stock: { type: 'integer' },
            sold: { type: 'integer' },
            averageRating: { type: 'number' },
            reviewCount: { type: 'integer' },
            status: { type: 'string', enum: ['active', 'inactive'] },
          },
        },
        Order: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            orderCode: { type: 'string' },
            status: { type: 'string', enum: ['pending', 'confirmed', 'preparing', 'shipping', 'completed', 'cancelled'] },
            subtotal: { type: 'number' },
            shippingFee: { type: 'number' },
            discount: { type: 'number' },
            total: { type: 'number' },
          },
        },
        CartItem: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            productId: { type: 'integer' },
            quantity: { type: 'integer' },
            price: { type: 'number' },
          },
        },
        Voucher: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            code: { type: 'string' },
            type: { type: 'string', enum: ['percentage', 'fixed', 'free_shipping', 'flash_sale'] },
            value: { type: 'number' },
            minOrderAmount: { type: 'number' },
            maxDiscountAmount: { type: 'number' },
            usageLimit: { type: 'integer' },
            isActive: { type: 'boolean' },
            startDate: { type: 'string', format: 'date-time' },
            endDate: { type: 'string', format: 'date-time' },
          },
        },
        CustomOrder: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            code: { type: 'string' },
            description: { type: 'string' },
            yarnColor: { type: 'string' },
            size: { type: 'string' },
            status: { type: 'string', enum: ['submitted', 'reviewing', 'quoted', 'deposit_paid', 'in_production', 'completed', 'delivered', 'cancelled'] },
            quotedPrice: { type: 'number' },
            depositAmount: { type: 'number' },
          },
        },
      },
    },
    tags: [
      { name: 'Auth', description: 'Đăng ký, đăng nhập, xác thực' },
      { name: 'Users', description: 'Quản lý người dùng' },
      { name: 'Products', description: 'Sản phẩm' },
      { name: 'Categories', description: 'Danh mục sản phẩm' },
      { name: 'Cart', description: 'Giỏ hàng' },
      { name: 'Orders', description: 'Đơn hàng' },
      { name: 'Reviews', description: 'Đánh giá sản phẩm' },
      { name: 'Vouchers', description: 'Mã giảm giá' },
      { name: 'Custom Orders', description: 'Đơn hàng theo yêu cầu' },
      { name: 'Inventory', description: 'Quản lý kho hàng' },
      { name: 'Reports', description: 'Báo cáo thống kê' },
      { name: 'Wallet', description: 'Ví điện tử' },
      { name: 'Notifications', description: 'Thông báo' },
      { name: 'Chat', description: 'Chat tư vấn' },
      { name: 'Addresses', description: 'Địa chỉ giao hàng' },
      { name: 'Banners', description: 'Banner quảng cáo' },
      { name: 'Returns', description: 'Yêu cầu đổi trả' },
      { name: 'Loyalty', description: 'Điểm tích lũy' },
    ],
    paths: {
      // ==================== AUTH ====================
      '/api/auth/register': {
        post: {
          tags: ['Auth'],
          summary: 'Gửi OTP xác nhận đăng ký',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['fullName', 'email', 'password'],
                  properties: {
                    fullName: { type: 'string', example: 'Nguyễn Văn A' },
                    email: { type: 'string', example: 'user@example.com' },
                    password: { type: 'string', example: 'password123' },
                    phone: { type: 'string', example: '0901234567' },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: 'OTP đã được gửi đến email' },
            409: { description: 'Email đã được đăng ký' },
          },
        },
      },
      '/api/auth/verify-otp': {
        post: {
          tags: ['Auth'],
          summary: 'Xác nhận OTP và tạo tài khoản',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['email', 'otp'],
                  properties: {
                    email: { type: 'string', example: 'user@example.com' },
                    otp: { type: 'string', example: '1234' },
                  },
                },
              },
            },
          },
          responses: {
            201: { description: 'Tạo tài khoản thành công, trả về token' },
            400: { description: 'OTP không đúng hoặc đã hết hạn' },
          },
        },
      },
      '/api/auth/login': {
        post: {
          tags: ['Auth'],
          summary: 'Đăng nhập',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['email', 'password'],
                  properties: {
                    email: { type: 'string', example: 'admin@yarnshop.com' },
                    password: { type: 'string', example: 'Admin@123' },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: 'Đăng nhập thành công, trả về token và user' },
            401: { description: 'Sai thông tin đăng nhập' },
          },
        },
      },
      '/api/auth/me': {
        get: {
          tags: ['Auth'],
          summary: 'Lấy thông tin người dùng hiện tại',
          security: [{ bearerAuth: [] }],
          responses: {
            200: { description: 'Thông tin user' },
            401: { description: 'Chưa đăng nhập' },
          },
        },
      },
      '/api/auth/change-password': {
        put: {
          tags: ['Auth'],
          summary: 'Đổi mật khẩu',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['currentPassword', 'newPassword'],
                  properties: {
                    currentPassword: { type: 'string' },
                    newPassword: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: 'Đổi mật khẩu thành công' },
            400: { description: 'Mật khẩu hiện tại không đúng' },
          },
        },
      },

      // ==================== USERS ====================
      '/api/users': {
        get: {
          tags: ['Users'],
          summary: 'Lấy danh sách người dùng [Admin]',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'search', in: 'query', schema: { type: 'string' } },
            { name: 'roleId', in: 'query', schema: { type: 'integer' } },
            { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
            { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
          ],
          responses: { 200: { description: 'Danh sách users' } },
        },
      },
      '/api/users/membership': {
        get: {
          tags: ['Users'],
          summary: 'Lấy thông tin membership của user hiện tại',
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: 'Thông tin membership' } },
        },
      },
      '/api/users/profile': {
        put: {
          tags: ['Users'],
          summary: 'Cập nhật hồ sơ cá nhân',
          security: [{ bearerAuth: [] }],
          requestBody: {
            content: {
              'multipart/form-data': {
                schema: {
                  type: 'object',
                  properties: {
                    fullName: { type: 'string' },
                    phone: { type: 'string' },
                    address: { type: 'string' },
                    avatar: { type: 'string', format: 'binary' },
                  },
                },
              },
            },
          },
          responses: { 200: { description: 'Cập nhật thành công' } },
        },
      },
      '/api/users/{id}': {
        get: {
          tags: ['Users'],
          summary: 'Lấy thông tin user theo ID [Admin]',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
          responses: { 200: { description: 'Thông tin user' } },
        },
        put: {
          tags: ['Users'],
          summary: 'Cập nhật user [Admin]',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    fullName: { type: 'string' },
                    roleId: { type: 'integer' },
                    isActive: { type: 'boolean' },
                  },
                },
              },
            },
          },
          responses: { 200: { description: 'Cập nhật thành công' } },
        },
        delete: {
          tags: ['Users'],
          summary: 'Xóa user [Admin]',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
          responses: { 200: { description: 'Xóa thành công' } },
        },
      },

      // ==================== CATEGORIES ====================
      '/api/categories': {
        get: {
          tags: ['Categories'],
          summary: 'Lấy danh sách danh mục',
          responses: { 200: { description: 'Danh sách categories' } },
        },
        post: {
          tags: ['Categories'],
          summary: 'Tạo danh mục mới [Admin]',
          security: [{ bearerAuth: [] }],
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['name', 'type'],
                  properties: {
                    name: { type: 'string' },
                    type: { type: 'string', enum: ['raw_material', 'accessory', 'finished_product'] },
                    description: { type: 'string' },
                    parentId: { type: 'integer' },
                  },
                },
              },
            },
          },
          responses: { 201: { description: 'Tạo thành công' } },
        },
      },
      '/api/categories/{id}': {
        put: {
          tags: ['Categories'],
          summary: 'Cập nhật danh mục [Admin]',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
          requestBody: {
            content: { 'application/json': { schema: { type: 'object', properties: { name: { type: 'string' }, description: { type: 'string' } } } } },
          },
          responses: { 200: { description: 'Cập nhật thành công' } },
        },
        delete: {
          tags: ['Categories'],
          summary: 'Xóa danh mục [Admin]',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
          responses: { 200: { description: 'Xóa thành công' } },
        },
      },

      // ==================== PRODUCTS ====================
      '/api/products': {
        get: {
          tags: ['Products'],
          summary: 'Lấy danh sách sản phẩm',
          parameters: [
            { name: 'search', in: 'query', schema: { type: 'string' } },
            { name: 'categoryId', in: 'query', schema: { type: 'integer' } },
            { name: 'type', in: 'query', schema: { type: 'string' } },
            { name: 'color', in: 'query', schema: { type: 'string' } },
            { name: 'minPrice', in: 'query', schema: { type: 'number' } },
            { name: 'maxPrice', in: 'query', schema: { type: 'number' } },
            { name: 'minRating', in: 'query', schema: { type: 'number' } },
            { name: 'sortBy', in: 'query', schema: { type: 'string', enum: ['newest', 'price_asc', 'price_desc', 'best_selling', 'rating'] } },
            { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
            { name: 'limit', in: 'query', schema: { type: 'integer', default: 12 } },
          ],
          responses: { 200: { description: 'Danh sách sản phẩm có phân trang' } },
        },
        post: {
          tags: ['Products'],
          summary: 'Tạo sản phẩm mới [Admin]',
          security: [{ bearerAuth: [] }],
          requestBody: {
            content: {
              'multipart/form-data': {
                schema: {
                  type: 'object',
                  required: ['name', 'price', 'categoryId'],
                  properties: {
                    name: { type: 'string' },
                    categoryId: { type: 'integer' },
                    description: { type: 'string' },
                    price: { type: 'number' },
                    salePrice: { type: 'number' },
                    color: { type: 'string' },
                    size: { type: 'string' },
                    stock: { type: 'integer' },
                    'images[]': { type: 'array', items: { type: 'string', format: 'binary' } },
                  },
                },
              },
            },
          },
          responses: { 201: { description: 'Tạo sản phẩm thành công' } },
        },
      },
      '/api/products/featured': {
        get: {
          tags: ['Products'],
          summary: 'Lấy sản phẩm nổi bật',
          responses: { 200: { description: 'Danh sách sản phẩm nổi bật' } },
        },
      },
      '/api/products/{slug}': {
        get: {
          tags: ['Products'],
          summary: 'Lấy chi tiết sản phẩm theo slug',
          parameters: [{ name: 'slug', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Chi tiết sản phẩm' }, 404: { description: 'Không tìm thấy' } },
        },
      },
      '/api/products/{id}': {
        put: {
          tags: ['Products'],
          summary: 'Cập nhật sản phẩm [Admin]',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
          requestBody: {
            content: { 'multipart/form-data': { schema: { type: 'object', properties: { name: { type: 'string' }, price: { type: 'number' } } } } },
          },
          responses: { 200: { description: 'Cập nhật thành công' } },
        },
        delete: {
          tags: ['Products'],
          summary: 'Xóa sản phẩm [Admin]',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
          responses: { 200: { description: 'Xóa thành công' } },
        },
      },
      '/api/products/{id}/related': {
        get: {
          tags: ['Products'],
          summary: 'Lấy sản phẩm liên quan',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
          responses: { 200: { description: 'Danh sách sản phẩm liên quan' } },
        },
      },

      // ==================== CART ====================
      '/api/cart': {
        get: {
          tags: ['Cart'],
          summary: 'Lấy giỏ hàng hiện tại',
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: 'Giỏ hàng với danh sách sản phẩm' } },
        },
        delete: {
          tags: ['Cart'],
          summary: 'Xóa toàn bộ giỏ hàng',
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: 'Đã xóa giỏ hàng' } },
        },
      },
      '/api/cart/items': {
        post: {
          tags: ['Cart'],
          summary: 'Thêm sản phẩm vào giỏ hàng',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['productId', 'quantity'],
                  properties: {
                    productId: { type: 'integer' },
                    quantity: { type: 'integer', minimum: 1 },
                  },
                },
              },
            },
          },
          responses: { 200: { description: 'Đã thêm vào giỏ hàng' } },
        },
      },
      '/api/cart/items/{id}': {
        put: {
          tags: ['Cart'],
          summary: 'Cập nhật số lượng sản phẩm trong giỏ',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' }, description: 'CartItem ID' }],
          requestBody: {
            content: { 'application/json': { schema: { type: 'object', properties: { quantity: { type: 'integer', minimum: 1 } } } } },
          },
          responses: { 200: { description: 'Cập nhật thành công' } },
        },
        delete: {
          tags: ['Cart'],
          summary: 'Xóa 1 sản phẩm khỏi giỏ hàng',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
          responses: { 200: { description: 'Đã xóa' } },
        },
      },

      // ==================== ORDERS ====================
      '/api/orders': {
        post: {
          tags: ['Orders'],
          summary: 'Đặt hàng (Customer)',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['shippingName', 'shippingPhone', 'shippingAddress', 'paymentMethod'],
                  properties: {
                    shippingName: { type: 'string' },
                    shippingPhone: { type: 'string' },
                    shippingAddress: { type: 'string' },
                    paymentMethod: { type: 'string', enum: ['cod', 'bank_transfer', 'e_wallet'] },
                    voucherCode: { type: 'string' },
                    note: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: {
            201: { description: 'Đặt hàng thành công' },
            400: { description: 'Giỏ hàng trống hoặc lỗi dữ liệu' },
          },
        },
        get: {
          tags: ['Orders'],
          summary: 'Lấy tất cả đơn hàng [Staff/Admin]',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'status', in: 'query', schema: { type: 'string' } },
            { name: 'search', in: 'query', schema: { type: 'string' } },
            { name: 'page', in: 'query', schema: { type: 'integer' } },
          ],
          responses: { 200: { description: 'Danh sách đơn hàng' } },
        },
      },
      '/api/orders/guest': {
        post: {
          tags: ['Orders'],
          summary: 'Đặt hàng không cần đăng nhập (Guest)',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['shippingName', 'shippingPhone', 'shippingAddress', 'paymentMethod', 'items'],
                  properties: {
                    shippingName: { type: 'string' },
                    shippingPhone: { type: 'string' },
                    shippingAddress: { type: 'string' },
                    paymentMethod: { type: 'string', enum: ['cod', 'bank_transfer'] },
                    items: { type: 'array', items: { type: 'object', properties: { productId: { type: 'integer' }, quantity: { type: 'integer' } } } },
                    note: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: { 201: { description: 'Đặt hàng thành công' } },
        },
      },
      '/api/orders/my': {
        get: {
          tags: ['Orders'],
          summary: 'Lấy lịch sử đơn hàng của tôi',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'status', in: 'query', schema: { type: 'string' } },
            { name: 'page', in: 'query', schema: { type: 'integer' } },
          ],
          responses: { 200: { description: 'Danh sách đơn hàng của user' } },
        },
      },
      '/api/orders/my/{id}': {
        get: {
          tags: ['Orders'],
          summary: 'Xem chi tiết đơn hàng của tôi',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
          responses: { 200: { description: 'Chi tiết đơn hàng' } },
        },
      },
      '/api/orders/my/{id}/cancel': {
        post: {
          tags: ['Orders'],
          summary: 'Hủy đơn hàng',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
          requestBody: {
            content: { 'application/json': { schema: { type: 'object', properties: { reason: { type: 'string' } } } } },
          },
          responses: { 200: { description: 'Hủy thành công' } },
        },
      },
      '/api/orders/{id}': {
        get: {
          tags: ['Orders'],
          summary: 'Xem chi tiết đơn hàng bất kỳ [Staff/Admin]',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
          responses: { 200: { description: 'Chi tiết đơn hàng' } },
        },
      },
      '/api/orders/{id}/status': {
        put: {
          tags: ['Orders'],
          summary: 'Cập nhật trạng thái đơn hàng [Staff/Admin]',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['status'],
                  properties: {
                    status: { type: 'string', enum: ['confirmed', 'preparing', 'shipping', 'completed', 'cancelled'] },
                    cancelledReason: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: { 200: { description: 'Cập nhật thành công' } },
        },
      },

      // ==================== REVIEWS ====================
      '/api/reviews/product/{productId}': {
        get: {
          tags: ['Reviews'],
          summary: 'Lấy đánh giá của sản phẩm',
          parameters: [{ name: 'productId', in: 'path', required: true, schema: { type: 'integer' } }],
          responses: { 200: { description: 'Danh sách đánh giá' } },
        },
      },
      '/api/reviews/can-review/{productId}': {
        get: {
          tags: ['Reviews'],
          summary: 'Kiểm tra có thể đánh giá sản phẩm không',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'productId', in: 'path', required: true, schema: { type: 'integer' } }],
          responses: { 200: { description: '{ canReview: boolean }' } },
        },
      },
      '/api/reviews': {
        post: {
          tags: ['Reviews'],
          summary: 'Tạo đánh giá sản phẩm [Customer]',
          security: [{ bearerAuth: [] }],
          requestBody: {
            content: {
              'multipart/form-data': {
                schema: {
                  type: 'object',
                  required: ['productId', 'orderId', 'rating'],
                  properties: {
                    productId: { type: 'integer' },
                    orderId: { type: 'integer' },
                    rating: { type: 'integer', minimum: 1, maximum: 5 },
                    comment: { type: 'string' },
                    'images[]': { type: 'array', items: { type: 'string', format: 'binary' } },
                  },
                },
              },
            },
          },
          responses: { 201: { description: 'Đánh giá thành công' } },
        },
      },

      // ==================== VOUCHERS ====================
      '/api/vouchers/public': {
        get: {
          tags: ['Vouchers'],
          summary: 'Lấy voucher đang hoạt động (public)',
          responses: { 200: { description: 'Danh sách voucher public' } },
        },
      },
      '/api/vouchers/flash-sale': {
        get: {
          tags: ['Vouchers'],
          summary: 'Lấy thông tin flash sale hiện tại',
          responses: { 200: { description: 'Vouchers flash sale và sản phẩm giảm giá' } },
        },
      },
      '/api/vouchers/validate': {
        post: {
          tags: ['Vouchers'],
          summary: 'Kiểm tra voucher hợp lệ',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['code', 'orderAmount'],
                  properties: {
                    code: { type: 'string' },
                    orderAmount: { type: 'number' },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: 'Voucher hợp lệ, trả về discount amount' },
            400: { description: 'Voucher không hợp lệ hoặc đã hết hạn' },
          },
        },
      },
      '/api/vouchers': {
        get: {
          tags: ['Vouchers'],
          summary: 'Lấy tất cả voucher [Admin]',
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: 'Danh sách voucher' } },
        },
        post: {
          tags: ['Vouchers'],
          summary: 'Tạo voucher mới [Admin]',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['code', 'type', 'value'],
                  properties: {
                    code: { type: 'string' },
                    type: { type: 'string', enum: ['percentage', 'fixed', 'free_shipping', 'flash_sale'] },
                    value: { type: 'number' },
                    minOrderAmount: { type: 'number' },
                    maxDiscountAmount: { type: 'number' },
                    usageLimit: { type: 'integer' },
                    startDate: { type: 'string', format: 'date-time' },
                    endDate: { type: 'string', format: 'date-time' },
                  },
                },
              },
            },
          },
          responses: { 201: { description: 'Tạo voucher thành công' } },
        },
      },
      '/api/vouchers/{id}': {
        put: {
          tags: ['Vouchers'],
          summary: 'Cập nhật voucher [Admin]',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
          requestBody: { content: { 'application/json': { schema: { type: 'object' } } } },
          responses: { 200: { description: 'Cập nhật thành công' } },
        },
        delete: {
          tags: ['Vouchers'],
          summary: 'Xóa voucher [Admin]',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
          responses: { 200: { description: 'Xóa thành công' } },
        },
      },

      // ==================== CUSTOM ORDERS ====================
      '/api/custom-orders': {
        post: {
          tags: ['Custom Orders'],
          summary: 'Gửi đơn hàng theo yêu cầu [Customer]',
          security: [{ bearerAuth: [] }],
          requestBody: {
            content: {
              'multipart/form-data': {
                schema: {
                  type: 'object',
                  required: ['description'],
                  properties: {
                    description: { type: 'string' },
                    yarnColor: { type: 'string' },
                    size: { type: 'string' },
                    'images[]': { type: 'array', items: { type: 'string', format: 'binary' } },
                  },
                },
              },
            },
          },
          responses: { 201: { description: 'Gửi đơn thành công' } },
        },
        get: {
          tags: ['Custom Orders'],
          summary: 'Lấy tất cả custom orders [Staff/Admin]',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'status', in: 'query', schema: { type: 'string' } },
            { name: 'page', in: 'query', schema: { type: 'integer' } },
          ],
          responses: { 200: { description: 'Danh sách custom orders' } },
        },
      },
      '/api/custom-orders/my': {
        get: {
          tags: ['Custom Orders'],
          summary: 'Lấy custom orders của tôi',
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: 'Danh sách custom orders của user' } },
        },
      },
      '/api/custom-orders/my/{id}': {
        get: {
          tags: ['Custom Orders'],
          summary: 'Chi tiết custom order của tôi',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
          responses: { 200: { description: 'Chi tiết custom order' } },
        },
      },
      '/api/custom-orders/my/{id}/pay': {
        post: {
          tags: ['Custom Orders'],
          summary: 'Thanh toán đặt cọc custom order [Customer]',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
          responses: { 200: { description: 'Thanh toán thành công' } },
        },
      },
      '/api/custom-orders/my/{id}/pay-remaining': {
        post: {
          tags: ['Custom Orders'],
          summary: 'Thanh toán phần còn lại custom order [Customer]',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
          responses: { 200: { description: 'Thanh toán thành công' } },
        },
      },
      '/api/custom-orders/{id}': {
        get: {
          tags: ['Custom Orders'],
          summary: 'Chi tiết custom order [Staff/Admin]',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
          responses: { 200: { description: 'Chi tiết custom order' } },
        },
      },
      '/api/custom-orders/{id}/status': {
        put: {
          tags: ['Custom Orders'],
          summary: 'Cập nhật trạng thái custom order [Staff/Admin]',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', enum: ['reviewing', 'quoted', 'in_production', 'completed', 'delivered', 'cancelled'] },
                    quotedPrice: { type: 'number' },
                    depositAmount: { type: 'number' },
                    staffNote: { type: 'string' },
                    estimatedDays: { type: 'integer' },
                  },
                },
              },
            },
          },
          responses: { 200: { description: 'Cập nhật thành công' } },
        },
      },

      // ==================== INVENTORY ====================
      '/api/inventory': {
        get: {
          tags: ['Inventory'],
          summary: 'Lấy danh sách tồn kho [Admin]',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'search', in: 'query', schema: { type: 'string' } },
            { name: 'lowStock', in: 'query', schema: { type: 'boolean' } },
          ],
          responses: { 200: { description: 'Danh sách tồn kho' } },
        },
      },
      '/api/inventory/low-stock-count': {
        get: {
          tags: ['Inventory'],
          summary: 'Lấy số lượng sản phẩm sắp hết hàng [Admin]',
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: '{ count: number }' } },
        },
      },
      '/api/inventory/import': {
        post: {
          tags: ['Inventory'],
          summary: 'Nhập kho [Admin]',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['productId', 'quantity'],
                  properties: {
                    productId: { type: 'integer' },
                    quantity: { type: 'integer', minimum: 1 },
                    note: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: { 200: { description: 'Nhập kho thành công' } },
        },
      },
      '/api/inventory/adjust': {
        post: {
          tags: ['Inventory'],
          summary: 'Điều chỉnh tồn kho [Admin]',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['productId', 'newQuantity'],
                  properties: {
                    productId: { type: 'integer' },
                    newQuantity: { type: 'integer', minimum: 0 },
                    note: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: { 200: { description: 'Điều chỉnh thành công' } },
        },
      },
      '/api/inventory/transactions': {
        get: {
          tags: ['Inventory'],
          summary: 'Lịch sử giao dịch kho [Admin]',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'productId', in: 'query', schema: { type: 'integer' } },
            { name: 'type', in: 'query', schema: { type: 'string', enum: ['import', 'export', 'adjustment', 'sale', 'return'] } },
            { name: 'page', in: 'query', schema: { type: 'integer' } },
          ],
          responses: { 200: { description: 'Lịch sử giao dịch' } },
        },
      },
      '/api/inventory/materials': {
        get: {
          tags: ['Inventory'],
          summary: 'Lấy danh sách nguyên liệu [Admin]',
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: 'Danh sách nguyên liệu' } },
        },
        post: {
          tags: ['Inventory'],
          summary: 'Thêm nguyên liệu [Admin]',
          security: [{ bearerAuth: [] }],
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['name', 'unit'],
                  properties: { name: { type: 'string' }, unit: { type: 'string' }, stock: { type: 'number' }, costPerUnit: { type: 'number' } },
                },
              },
            },
          },
          responses: { 201: { description: 'Tạo thành công' } },
        },
      },
      '/api/inventory/materials/{id}': {
        put: {
          tags: ['Inventory'],
          summary: 'Cập nhật nguyên liệu [Admin]',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
          requestBody: { content: { 'application/json': { schema: { type: 'object' } } } },
          responses: { 200: { description: 'Cập nhật thành công' } },
        },
      },

      // ==================== REPORTS ====================
      '/api/reports/summary': {
        get: {
          tags: ['Reports'],
          summary: 'Tổng quan doanh thu [Admin]',
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: 'Số liệu tổng quan: doanh thu, đơn hàng, khách hàng...' } },
        },
      },
      '/api/reports/revenue': {
        get: {
          tags: ['Reports'],
          summary: 'Báo cáo doanh thu theo thời gian [Admin]',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'period', in: 'query', schema: { type: 'string', enum: ['day', 'month', 'year'], default: 'month' } },
            { name: 'year', in: 'query', schema: { type: 'integer' } },
            { name: 'month', in: 'query', schema: { type: 'integer' } },
          ],
          responses: { 200: { description: 'Dữ liệu doanh thu theo từng mốc thời gian' } },
        },
      },
      '/api/reports/best-selling': {
        get: {
          tags: ['Reports'],
          summary: 'Sản phẩm bán chạy nhất [Admin]',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } }],
          responses: { 200: { description: 'Danh sách sản phẩm bán chạy' } },
        },
      },
      '/api/reports/loyal-customers': {
        get: {
          tags: ['Reports'],
          summary: 'Khách hàng thân thiết [Admin]',
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: 'Danh sách khách hàng theo doanh số' } },
        },
      },
      '/api/reports/order-stats': {
        get: {
          tags: ['Reports'],
          summary: 'Thống kê đơn hàng theo trạng thái [Admin]',
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: 'Số lượng đơn theo từng trạng thái' } },
        },
      },
      '/api/reports/category-breakdown': {
        get: {
          tags: ['Reports'],
          summary: 'Doanh thu theo danh mục [Admin]',
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: 'Breakdown doanh thu theo category' } },
        },
      },
      '/api/reports/slow-selling': {
        get: {
          tags: ['Reports'],
          summary: 'Sản phẩm bán chậm [Admin]',
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: 'Danh sách sản phẩm bán chậm' } },
        },
      },
      '/api/reports/profit': {
        get: {
          tags: ['Reports'],
          summary: 'Báo cáo lợi nhuận [Admin]',
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: 'Dữ liệu lợi nhuận' } },
        },
      },

      // ==================== HEALTH ====================
      '/api/health': {
        get: {
          tags: ['Auth'],
          summary: 'Kiểm tra server đang chạy',
          responses: { 200: { description: '{ status: "ok", timestamp }' } },
        },
      },
    },
  },
  apis: [],
};

const swaggerSpec = swaggerJsdoc(options);
module.exports = swaggerSpec;

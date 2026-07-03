const sequelize = require('../config/database');

const Role = require('./Role');
const User = require('./User');
const Category = require('./Category');
const Product = require('./Product');
const ProductImage = require('./ProductImage');
const Inventory = require('./Inventory');
const InventoryTransaction = require('./InventoryTransaction');
const Cart = require('./Cart');
const CartItem = require('./CartItem');
const Voucher = require('./Voucher');
const Order = require('./Order');
const OrderDetail = require('./OrderDetail');
const Payment = require('./Payment');
const Shipment = require('./Shipment');
const Review = require('./Review');
const CustomOrder = require('./CustomOrder');
const CustomOrderImage = require('./CustomOrderImage');
const Material = require('./Material');
const MaterialUsage = require('./MaterialUsage');
const ShippingAddress = require('./ShippingAddress');
const EmailSubscription = require('./EmailSubscription');
const ContactMessage = require('./ContactMessage');
const ReturnRequest = require('./ReturnRequest');
const Banner = require('./Banner');
const SiteContent = require('./SiteContent');
const SystemLog = require('./SystemLog');
const WalletTransaction = require('./WalletTransaction');
const WalletTopup = require('./WalletTopup');
const Notification = require('./Notification');
const ChatConversation = require('./ChatConversation');
const ChatMessage = require('./ChatMessage');
const Wishlist = require('./Wishlist');

// Role <-> User
Role.hasMany(User, { foreignKey: 'roleId' });
User.belongsTo(Role, { foreignKey: 'roleId' });

// Category
Category.hasMany(Product, { foreignKey: 'categoryId' });
Product.belongsTo(Category, { foreignKey: 'categoryId' });
Category.hasMany(Category, { as: 'children', foreignKey: 'parentId' });
Category.belongsTo(Category, { as: 'parent', foreignKey: 'parentId' });

// Product <-> ProductImage
Product.hasMany(ProductImage, { foreignKey: 'productId' });
ProductImage.belongsTo(Product, { foreignKey: 'productId' });

// Product <-> Inventory
Product.hasOne(Inventory, { foreignKey: 'productId' });
Inventory.belongsTo(Product, { foreignKey: 'productId' });

// Product <-> InventoryTransaction
Product.hasMany(InventoryTransaction, { foreignKey: 'productId' });
InventoryTransaction.belongsTo(Product, { foreignKey: 'productId' });
User.hasMany(InventoryTransaction, { foreignKey: 'performedBy' });
InventoryTransaction.belongsTo(User, { foreignKey: 'performedBy', as: 'performer' });

// Cart
User.hasOne(Cart, { foreignKey: 'userId' });
Cart.belongsTo(User, { foreignKey: 'userId' });
Cart.hasMany(CartItem, { foreignKey: 'cartId' });
CartItem.belongsTo(Cart, { foreignKey: 'cartId' });
Product.hasMany(CartItem, { foreignKey: 'productId' });
CartItem.belongsTo(Product, { foreignKey: 'productId' });

// Order
User.hasMany(Order, { foreignKey: 'userId' });
Order.belongsTo(User, { foreignKey: 'userId' });
Voucher.hasMany(Order, { foreignKey: 'voucherId' });
Order.belongsTo(Voucher, { foreignKey: 'voucherId' });
User.hasMany(Order, { foreignKey: 'confirmedBy', as: 'confirmedOrders' });
Order.belongsTo(User, { foreignKey: 'confirmedBy', as: 'confirmer' });

// OrderDetail
Order.hasMany(OrderDetail, { foreignKey: 'orderId' });
OrderDetail.belongsTo(Order, { foreignKey: 'orderId' });
Product.hasMany(OrderDetail, { foreignKey: 'productId' });
OrderDetail.belongsTo(Product, { foreignKey: 'productId' });

// Payment
Order.hasOne(Payment, { foreignKey: 'orderId' });
Payment.belongsTo(Order, { foreignKey: 'orderId' });

// Shipment
Order.hasOne(Shipment, { foreignKey: 'orderId' });
Shipment.belongsTo(Order, { foreignKey: 'orderId' });

// Review
Product.hasMany(Review, { foreignKey: 'productId' });
Review.belongsTo(Product, { foreignKey: 'productId' });
User.hasMany(Review, { foreignKey: 'userId' });
Review.belongsTo(User, { foreignKey: 'userId' });
Order.hasMany(Review, { foreignKey: 'orderId' });
Review.belongsTo(Order, { foreignKey: 'orderId' });

// CustomOrder
User.hasMany(CustomOrder, { foreignKey: 'userId' });
CustomOrder.belongsTo(User, { foreignKey: 'userId' });
User.hasMany(CustomOrder, { foreignKey: 'handledBy', as: 'handledCustomOrders' });
CustomOrder.belongsTo(User, { foreignKey: 'handledBy', as: 'handler' });
CustomOrder.hasMany(CustomOrderImage, { foreignKey: 'customOrderId' });
CustomOrderImage.belongsTo(CustomOrder, { foreignKey: 'customOrderId' });

// MaterialUsage
Material.hasMany(MaterialUsage, { foreignKey: 'materialId' });
MaterialUsage.belongsTo(Material, { foreignKey: 'materialId' });

// ShippingAddress
User.hasMany(ShippingAddress, { foreignKey: 'userId' });
ShippingAddress.belongsTo(User, { foreignKey: 'userId' });

// ReturnRequest
Order.hasMany(ReturnRequest, { foreignKey: 'orderId' });
ReturnRequest.belongsTo(Order, { foreignKey: 'orderId' });
User.hasMany(ReturnRequest, { foreignKey: 'userId' });
ReturnRequest.belongsTo(User, { foreignKey: 'userId' });
User.hasMany(ReturnRequest, { foreignKey: 'handledBy', as: 'handledReturns' });
ReturnRequest.belongsTo(User, { foreignKey: 'handledBy', as: 'handler' });

// ContactMessage
User.hasMany(ContactMessage, { foreignKey: 'repliedBy' });
ContactMessage.belongsTo(User, { foreignKey: 'repliedBy', as: 'replier' });

// Banner
User.hasMany(Banner, { foreignKey: 'createdBy' });
Banner.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });

// SiteContent
User.hasMany(SiteContent, { foreignKey: 'updatedBy' });
SiteContent.belongsTo(User, { foreignKey: 'updatedBy', as: 'editor' });

// SystemLog
User.hasMany(SystemLog, { foreignKey: 'userId' });
SystemLog.belongsTo(User, { foreignKey: 'userId' });

// Wallet
User.hasMany(WalletTransaction, { foreignKey: 'userId' });
WalletTransaction.belongsTo(User, { foreignKey: 'userId' });
Order.hasMany(WalletTransaction, { foreignKey: 'orderId' });
WalletTransaction.belongsTo(Order, { foreignKey: 'orderId' });

User.hasMany(WalletTopup, { foreignKey: 'userId' });
WalletTopup.belongsTo(User, { foreignKey: 'userId' });

// Notifications
User.hasMany(Notification, { foreignKey: 'userId' });
Notification.belongsTo(User, { foreignKey: 'userId' });

// Wishlist
User.hasMany(Wishlist, { foreignKey: 'userId' });
Wishlist.belongsTo(User, { foreignKey: 'userId' });
Product.hasMany(Wishlist, { foreignKey: 'productId' });
Wishlist.belongsTo(Product, { foreignKey: 'productId' });

// Chat
User.hasMany(ChatConversation, { foreignKey: 'customerId', as: 'customerConversations' });
ChatConversation.belongsTo(User, { foreignKey: 'customerId', as: 'customer' });
User.hasMany(ChatConversation, { foreignKey: 'staffId', as: 'staffConversations' });
ChatConversation.belongsTo(User, { foreignKey: 'staffId', as: 'staff' });
ChatConversation.hasMany(ChatMessage, { foreignKey: 'conversationId' });
ChatMessage.belongsTo(ChatConversation, { foreignKey: 'conversationId' });
ChatMessage.belongsTo(User, { foreignKey: 'senderId' });
User.hasMany(ChatMessage, { foreignKey: 'senderId' });

module.exports = {
  sequelize,
  Role, User, Category, Product, ProductImage,
  Inventory, InventoryTransaction,
  Cart, CartItem,
  Voucher, Order, OrderDetail, Payment, Shipment,
  Review, CustomOrder, CustomOrderImage,
  Material, MaterialUsage,
  ShippingAddress, EmailSubscription, ContactMessage,
  ReturnRequest, Banner, SiteContent, SystemLog,
  WalletTransaction, WalletTopup, Notification,
  ChatConversation, ChatMessage,
  Wishlist,
};

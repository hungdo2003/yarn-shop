import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';
import Sidebar from './components/layout/Sidebar';
import Spinner from './components/common/Spinner';

import Home from './pages/Home';
import ProductList from './pages/ProductList';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Orders from './pages/Orders';
import OrderDetail from './pages/OrderDetail';
import CustomOrder from './pages/CustomOrder';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import Profile from './pages/Profile';
import Policies from './pages/Policies';
import HowToBuy from './pages/HowToBuy';
import Contact from './pages/Contact';
import Promotions from './pages/Promotions';
import Addresses from './pages/Addresses';
import Returns from './pages/Returns';
import PaymentResult from './pages/PaymentResult';
import PaymentSimulate from './pages/PaymentSimulate';
import MyCustomOrders from './pages/MyCustomOrders';
import CustomOrderDetail from './pages/CustomOrderDetail';
import Wallet from './pages/Wallet';
import WalletTopupResult from './pages/WalletTopupResult';
import FlashSale from './pages/FlashSale';

import ManagerDashboard from './pages/manager/Dashboard';
import ProductManagement from './pages/manager/ProductManagement';
import OrderManagement from './pages/manager/OrderManagement';
import InventoryManagement from './pages/manager/InventoryManagement';
import VoucherManagement from './pages/manager/VoucherManagement';
import Reports from './pages/manager/Reports';
import CategoryManagement from './pages/manager/CategoryManagement';

import CustomOrderManagement from './pages/staff/CustomOrderManagement';
import StaffOrderManagement from './pages/staff/OrderManagement';
import ComplaintManagement from './pages/staff/ComplaintManagement';
import ContactManagement from './pages/staff/ContactManagement';
import StaffChat from './pages/staff/StaffChat';
import ChatWidget from './components/chat/ChatWidget';
import TierUpgradeModal from './components/common/TierUpgradeModal';

import UserManagement from './pages/admin/UserManagement';
import BannerManagement from './pages/admin/BannerManagement';
import ContentManagement from './pages/admin/ContentManagement';
import SystemLogs from './pages/admin/SystemLogs';
import SaleEventManagement from './pages/admin/SaleEventManagement';

// Route guard
const PrivateRoute = ({ roles }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center"><Spinner size="lg" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.Role?.name)) return <Navigate to="/" replace />;
  return <Outlet />;
};

// Customer / public layout: top navbar + footer
const PublicLayout = () => (
  <div className="min-h-screen flex flex-col bg-gray-50">
    <Navbar />
    <main className="flex-1"><Outlet /></main>
    <Footer />
    <ChatWidget />
    <TierUpgradeModal />
  </div>
);

// Admin / Manager / Staff layout: sidebar + content area (no footer)
const DashboardLayout = () => (
  <div className="flex h-screen overflow-hidden bg-gray-50">
    <Sidebar />
    <div className="flex-1 min-w-0 overflow-y-auto">
      <Outlet />
    </div>
  </div>
);

const App = () => (
  <Routes>
    {/* ── PUBLIC / CUSTOMER ROUTES ── */}
    <Route element={<PublicLayout />}>
      <Route path="/" element={<Home />} />
      <Route path="/products" element={<ProductList />} />
      <Route path="/products/:slug" element={<ProductDetail />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/custom-order" element={<CustomOrder />} />
      <Route path="/policies" element={<Policies />} />
      <Route path="/how-to-buy" element={<HowToBuy />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/promotions" element={<Promotions />} />
      <Route path="/flash-sale" element={<FlashSale />} />
      <Route path="/checkout/guest" element={<Checkout guest />} />
      <Route path="/payment/result" element={<PaymentResult />} />
      <Route path="/payment/simulate" element={<PaymentSimulate />} />

      <Route element={<PrivateRoute roles={['customer']} />}>
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/orders/:id" element={<OrderDetail />} />
        <Route path="/returns" element={<Returns />} />
      </Route>

      <Route path="/wallet/topup/result" element={<WalletTopupResult />} />

      <Route element={<PrivateRoute roles={['customer', 'staff', 'admin']} />}>
        <Route path="/profile" element={<Profile />} />
        <Route path="/addresses" element={<Addresses />} />
        <Route path="/custom-orders/my" element={<MyCustomOrders />} />
        <Route path="/custom-orders/:id" element={<CustomOrderDetail />} />
      </Route>

      <Route element={<PrivateRoute roles={['customer']} />}>
        <Route path="/wallet" element={<Wallet />} />
      </Route>
    </Route>

    {/* ── MANAGER DASHBOARD ── */}
    <Route element={<DashboardLayout />}>
      <Route element={<PrivateRoute roles={['admin']} />}>
        <Route path="/manager" element={<ManagerDashboard />} />
        <Route path="/manager/products" element={<ProductManagement />} />
        <Route path="/manager/orders" element={<OrderManagement />} />
        <Route path="/manager/inventory" element={<InventoryManagement />} />
        <Route path="/manager/vouchers" element={<VoucherManagement />} />
        <Route path="/manager/reports" element={<Reports />} />
        <Route path="/manager/custom-orders" element={<CustomOrderManagement />} />
        <Route path="/manager/categories" element={<CategoryManagement />} />
      </Route>

      {/* ── STAFF DASHBOARD ── */}
      <Route element={<PrivateRoute roles={['staff', 'admin']} />}>
        <Route path="/staff" element={<StaffOrderManagement />} />
        <Route path="/staff/orders" element={<StaffOrderManagement />} />
        <Route path="/staff/custom-orders" element={<CustomOrderManagement />} />
        <Route path="/staff/complaints" element={<ComplaintManagement />} />
        <Route path="/staff/contacts" element={<ContactManagement />} />
        <Route path="/staff/chat" element={<StaffChat />} />
      </Route>

      {/* ── ADMIN DASHBOARD ── */}
      <Route element={<PrivateRoute roles={['admin']} />}>
        <Route path="/admin" element={<UserManagement />} />
        <Route path="/admin/users" element={<UserManagement />} />
        <Route path="/admin/banners" element={<BannerManagement />} />
        <Route path="/admin/content" element={<ContentManagement />} />
        <Route path="/admin/logs" element={<SystemLogs />} />
        <Route path="/admin/sale-events" element={<SaleEventManagement />} />
      </Route>
    </Route>

    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);

export default App;

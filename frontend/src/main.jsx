import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { NotificationProvider } from './context/NotificationContext';
import { ChatProvider } from './context/ChatContext';
import { WishlistProvider } from './context/WishlistContext';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <NotificationProvider>
        <ChatProvider>
        <CartProvider>
        <WishlistProvider>
          <App />
          <Toaster
            position="top-right"
            containerStyle={{ top: 72 }}
            toastOptions={{
              duration: 3000,
              style: {
                fontSize: '14px',
                maxWidth: '360px',
                borderRadius: '10px',
                fontWeight: '500',
              },
              success: {
                style: { background: '#10b981', color: '#fff' },
                iconTheme: { primary: '#fff', secondary: '#10b981' },
              },
              error: {
                style: { background: '#ef4444', color: '#fff' },
                iconTheme: { primary: '#fff', secondary: '#ef4444' },
              },
              loading: {
                style: { background: '#6366f1', color: '#fff' },
                iconTheme: { primary: '#fff', secondary: '#6366f1' },
              },
            }}
          />
        </WishlistProvider>
        </CartProvider>
        </ChatProvider>
        </NotificationProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);

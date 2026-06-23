import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const { user } = useAuth();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchCart = async () => {
    if (!user || user.Role?.name !== 'customer') return;
    setLoading(true);
    try {
      const res = await api.get('/cart');
      setCart(res.data);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchCart(); }, [user]);

  const addItem = async (productId, quantity = 1) => {
    const res = await api.post('/cart/items', { productId, quantity });
    await fetchCart();
    return res.data;
  };

  const updateItem = async (itemId, quantity) => {
    await api.put(`/cart/items/${itemId}`, { quantity });
    await fetchCart();
  };

  const removeItem = async (itemId) => {
    await api.delete(`/cart/items/${itemId}`);
    await fetchCart();
    toast.success('Đã xóa sản phẩm khỏi giỏ hàng');
  };

  const clearCart = async () => {
    await api.delete('/cart');
    setCart(null);
    toast.success('Đã xóa toàn bộ giỏ hàng');
  };

  const itemCount = cart?.CartItems?.reduce((s, i) => s + i.quantity, 0) || 0;

  return (
    <CartContext.Provider value={{ cart, loading, addItem, updateItem, removeItem, clearCart, fetchCart, itemCount }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);

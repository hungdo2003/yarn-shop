import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';

const WishlistContext = createContext(null);

export const WishlistProvider = ({ children }) => {
  const { user } = useAuth();
  const [wishlistIds, setWishlistIds] = useState(new Set());
  const [count, setCount] = useState(0);

  const fetchWishlist = useCallback(async () => {
    if (!user || user.Role?.name !== 'customer') {
      setWishlistIds(new Set());
      setCount(0);
      return;
    }
    try {
      const res = await api.get('/wishlist');
      const ids = new Set(res.data.map(item => item.productId));
      setWishlistIds(ids);
      setCount(ids.size);
    } catch {}
  }, [user]);

  useEffect(() => { fetchWishlist(); }, [fetchWishlist]);

  const toggle = async (productId) => {
    if (!user || user.Role?.name !== 'customer') return null;
    try {
      const res = await api.post('/wishlist/toggle', { productId });
      setWishlistIds(prev => {
        const next = new Set(prev);
        if (res.data.wishlisted) next.add(productId);
        else next.delete(productId);
        setCount(next.size);
        return next;
      });
      return res.data;
    } catch { return null; }
  };

  const isWishlisted = (productId) => wishlistIds.has(productId);

  return (
    <WishlistContext.Provider value={{ wishlistIds, count, toggle, isWishlisted, fetchWishlist }}>
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => useContext(WishlistContext);

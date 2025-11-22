import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { apiGetAuth } from '../lib/api';

const CartContext = createContext();

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);
  const [mode, setMode] = useState('pickup'); // 'pickup' | 'delivery'
  const [address, setAddress] = useState('');

  const addItem = (product, quantity = 1, extras = []) => {
    setItems((prev) => {
      const idx = prev.findIndex((i) => i.product._id === product._id && JSON.stringify(i.extras) === JSON.stringify(extras));
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], quantity: copy[idx].quantity + quantity };
        return copy;
      }
      return [...prev, { product, quantity, extras }];
    });
  };

  const removeItem = (productId, extras = []) => {
    setItems((prev) => prev.filter((i) => !(i.product._id === productId && JSON.stringify(i.extras) === JSON.stringify(extras))));
  };

  const clear = () => setItems([]);

  const subtotal = useMemo(() => {
    return items.reduce((sum, i) => sum + i.product.price * i.quantity + (i.extras || []).reduce((e, x) => e + (x.price || 0), 0), 0);
  }, [items]);

  const deliveryFee = useMemo(() => {
    if (mode !== 'delivery') return 0;
    // Semplice logica: minimi d'ordine e costi variabili per zone future
    // Per ora flat €3 se subtotal < €25, altrimenti gratis
    return subtotal < 25 ? 3 : 0;
  }, [mode, subtotal]);

  const total = useMemo(() => subtotal + deliveryFee, [subtotal, deliveryFee]);

  useEffect(() => {
    async function autofillAddress() {
      if (mode !== 'delivery') return;
      if (address && address.trim().length > 0) return;
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        if (!token) return;
        const data = await apiGetAuth('/users/me', token);
        if (data && data.address) setAddress(data.address);
      } catch (_) {}
    }
    autofillAddress();
  }, [mode]);

  const value = {
    items,
    addItem,
    removeItem,
    clear,
    subtotal,
    deliveryFee,
    total,
    mode,
    setMode,
    address,
    setAddress,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  return useContext(CartContext);
}
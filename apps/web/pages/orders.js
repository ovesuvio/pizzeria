import useSWR from 'swr';
import { useEffect, useState } from 'react';
import { API_BASE } from '../src/lib/api';
import { io } from 'socket.io-client';
import { useI18n } from '../src/lib/i18n';

export default function OrdersPage() {
  const { t } = useI18n();
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const fetcher = async (path) => {
    const res = await fetch(`${API_BASE}${path}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || t('orders.errorAccess'));
    }
    return res.json();
  };
  const { data, error } = useSWR('/orders/me', fetcher);
  const [lastUpdate, setLastUpdate] = useState('');

  useEffect(() => {
    const socket = io(API_BASE, { transports: ['websocket'] });
    socket.on('order_update', (evt) => {
      setLastUpdate(`${t('orders.updatePrefix')}${evt.orderId} → ${evt.status}`);
    });
    return () => socket.disconnect();
  }, [t]);

  return (
    <div>
      <h2>{t('orders.title')}</h2>
      {error ? (
        <div className="status">{error.message || t('orders.errorAccess')}</div>
      ) : !data ? (
        <div>{t('orders.loading')}</div>
      ) : data.length === 0 ? (
        <div>{t('orders.empty')}</div>
      ) : (
        <div className="orders">
          {data.map((o) => (
            <div key={o._id} className="order">
              <div>#{o._id.slice(-6)} • {new Date(o.createdAt).toLocaleString()}</div>
              <div>{t('orders.status')}: {o.status}</div>
              <div>{t('orders.total')}: € {o.total.toFixed(2)}</div>
            </div>
          ))}
        </div>
      )}
      {lastUpdate && <div className="status">{lastUpdate}</div>}
    </div>
  );
}
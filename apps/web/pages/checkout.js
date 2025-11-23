import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useCart } from '../src/context/CartContext';
import { apiPost } from '../src/lib/api';
import { useI18n } from '../src/lib/i18n';

const OPEN_DAYS = ['wed', 'thu', 'fri', 'sat', 'sun'];

function isOpenNow(date = new Date()) {
  const day = ['sun','mon','tue','wed','thu','fri','sat'][date.getDay()];
  if (!OPEN_DAYS.includes(day)) return false;
  const h = date.getHours();
  const m = date.getMinutes();
  const min = h * 60 + m;
  return min >= 17*60 && min <= 22*60; // 17:00–22:00
}

export default function CheckoutPage() {
  const { items, total, mode, address, setAddress, clear } = useCart();
  const [scheduledAt, setScheduledAt] = useState('');
  const [payment, setPayment] = useState('cash');
  const [status, setStatus] = useState('');
  const [token, setToken] = useState(() => (typeof window !== 'undefined' ? localStorage.getItem('token') : null));
  const [mounted, setMounted] = useState(false);
  const { t } = useI18n();
  const [disabledOrders, setDisabledOrders] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [custFirst, setCustFirst] = useState('');
  const [custLast, setCustLast] = useState('');
  const [custPhone, setCustPhone] = useState('');
  const [custEmail, setCustEmail] = useState('');

  useEffect(() => {
    if (!isOpenNow() && !scheduledAt) {
      setStatus(t('checkout.closed'));
    }
  }, [scheduledAt, t]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/orders-status');
        const data = res.ok ? await res.json() : { disabled: false, message: '' };
        setDisabledOrders(!!data.disabled);
        if (data.disabled) setStatus(data.message || 'Al momento non è possibile ordinare');
      } catch (_) {}
    })();
  }, []);

  // Mantieni il token aggiornato se cambia in altre pagine
  useEffect(() => {
    const handle = () => setToken(localStorage.getItem('token'));
    if (typeof window !== 'undefined') {
      setMounted(true);
      window.addEventListener('storage', handle);
      // Leggi subito il token presente in localStorage
      handle();
      try {
        const t = localStorage.getItem('token');
        if (t) {
          const p = JSON.parse(atob(t.split('.')[1]));
          setIsAdmin(!!p?.isAdmin);
        } else {
          setIsAdmin(false);
        }
      } catch (_) { setIsAdmin(false); }
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('storage', handle);
      }
    };
  }, []);

  async function placeOrder() {
    try {
      const res = await apiPost('/orders', {
        items: items.map((i) => ({ productId: i.product._id, quantity: i.quantity, extras: i.extras })),
        total,
        mode,
        address,
        scheduledAt,
        paymentMethod: payment,
        customer: isAdmin ? { firstName: custFirst, lastName: custLast, phone: custPhone, email: custEmail } : undefined,
        mock: true,
      }, token);
      clear();
      setStatus(`${t('checkout.orderConfirmedPrefix')}${res.orderId}`);
    } catch (e) {
      setStatus(e?.message || t('checkout.loginRequired'));
    }
  }

  return (
    <div>
      <h2>{t('checkout.title')}</h2>
      {mounted && !token && (
        <div className="status">{t('checkout.mustLogin')} <Link href="/profile">{t('nav.profile')}</Link>.</div>
      )}
      <div className="checkout-grid">
        <div>
          <label>{t('checkout.address')}</label>
          <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder={t('checkout.addressPlaceholder')} />
          {isAdmin && (
            <div style={{ marginTop: 8 }}>
              <div style={{ fontWeight: 600, marginBottom: 6 }}>Dati cliente (telefono)</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <input value={custFirst} onChange={(e) => setCustFirst(e.target.value)} placeholder="Nome" />
                <input value={custLast} onChange={(e) => setCustLast(e.target.value)} placeholder="Cognome" />
              </div>
              <input style={{ marginTop: 8 }} value={custPhone} onChange={(e) => setCustPhone(e.target.value)} placeholder="Telefono" />
              <input style={{ marginTop: 8 }} value={custEmail} onChange={(e) => setCustEmail(e.target.value)} placeholder="Email (opzionale)" />
            </div>
          )}
          <label>{t('checkout.scheduled')}</label>
          <input type="time" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} />
          <button className="btn primary" disabled={(mounted ? !token : true) || disabledOrders} onClick={placeOrder}>{t('checkout.place')}</button>
        </div>
        <div>
          <div>{t('checkout.payment')}</div>
          <label><input type="radio" checked={payment==='stripe'} onChange={() => setPayment('stripe')} /> {t('checkout.payStripe')}</label>
          <label><input type="radio" checked={payment==='visa'} onChange={() => setPayment('visa')} /> {t('checkout.payVisa') || 'Visa'}</label>
          <label><input type="radio" checked={payment==='cash'} onChange={() => setPayment('cash')} /> {t('checkout.payCash')}</label>
        </div>
      </div>
      {status && <div className="status">{status}</div>}
    </div>
  );
}
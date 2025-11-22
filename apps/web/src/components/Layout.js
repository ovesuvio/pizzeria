import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import { io } from 'socket.io-client';
import { API_BASE } from '../lib/api';
import { useI18n, SUPPORTED_LANGS } from '../lib/i18n';
import { useCart } from '../context/CartContext';

export default function Layout({ children }) {
  const router = useRouter();
  const { lang, setLang, t } = useI18n();
  const [toast, setToast] = useState(null);
  const [logged, setLogged] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { items, total } = useCart();
  const audioCtxRef = useRef(null);
  const cartCount = Array.isArray(items) ? items.reduce((sum, i) => sum + (i.quantity || 0), 0) : 0;
  const localeMap = { it: 'it-IT', de: 'de-DE', en: 'en-GB' };
  const cartTotalFmt = new Intl.NumberFormat(localeMap[lang] || 'it-IT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 2 }).format(total || 0);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    setLogged(!!token);
    let payload = null;
    if (token) {
      try { payload = JSON.parse(atob(token.split('.')[1])); } catch (_) {}
    }
    setIsAdmin(!!payload?.isAdmin);

    const socket = io(API_BASE, { transports: ['websocket'] });
    const handler = (evt) => {
      if (!evt || !evt.status || !evt.orderId) return;
      // Notifica soltanto l'utente proprietario quando disponibile
      if (payload?.userId && evt.userId && payload.userId !== evt.userId) return;
      try {
        let ctx = audioCtxRef.current;
        if (!ctx) {
          ctx = new (window.AudioContext || window.webkitAudioContext)();
          audioCtxRef.current = ctx;
        }
        if (ctx.resume) ctx.resume();
        const o1 = ctx.createOscillator();
        const o2 = ctx.createOscillator();
        const o3 = ctx.createOscillator();
        const g = ctx.createGain();
        o1.type = 'sine';
        o2.type = 'sine';
        o3.type = 'sine';
        o1.frequency.value = 440;
        o2.frequency.value = 480;
        o3.frequency.value = 520;
        o1.connect(g);
        o2.connect(g);
        o3.connect(g);
        g.connect(ctx.destination);
        const t0 = ctx.currentTime;
        g.gain.setValueAtTime(0, t0);
        g.gain.linearRampToValueAtTime(0.14, t0 + 0.02);
        g.gain.setValueAtTime(0.14, t0 + 0.8);
        g.gain.linearRampToValueAtTime(0, t0 + 0.82);
        g.gain.setValueAtTime(0, t0 + 1.02);
        g.gain.linearRampToValueAtTime(0.14, t0 + 1.04);
        g.gain.setValueAtTime(0.14, t0 + 1.84);
        g.gain.linearRampToValueAtTime(0, t0 + 1.86);
        o1.start(t0);
        o2.start(t0);
        o3.start(t0);
        o1.stop(t0 + 2.0);
        o2.stop(t0 + 2.0);
        o3.stop(t0 + 2.0);
      } catch (_) {}
      const statusKeyMap = {
        ricevuto: 'order.status.received',
        preparazione: 'order.status.preparation',
        consegna: 'order.status.delivery',
        consegnato: 'order.status.delivered'
      };
      const msg = `${t(statusKeyMap[evt.status] || evt.status)} • #${evt.orderId.slice(-6)}`;
      setToast(msg);
      setTimeout(() => setToast(null), 5000);
    };
    socket.on('order_update', handler);
    const onStorage = () => {
      const t = localStorage.getItem('token');
      setLogged(!!t);
      if (t) {
        try {
          const p = JSON.parse(atob(t.split('.')[1]));
          setIsAdmin(!!p?.isAdmin);
        } catch (_) {
          setIsAdmin(false);
        }
      } else {
        setIsAdmin(false);
      }
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', onStorage);
    }
    return () => {
      socket.off('order_update', handler);
      socket.disconnect();
      if (typeof window !== 'undefined') {
        window.removeEventListener('storage', onStorage);
      }
    };
  }, []);

  useEffect(() => {
    const closeMenu = () => setMenuOpen(false);
    router.events.on('routeChangeStart', closeMenu);
    router.events.on('routeChangeComplete', closeMenu);
    return () => {
      router.events.off('routeChangeStart', closeMenu);
      router.events.off('routeChangeComplete', closeMenu);
    };
  }, [router.events]);

  function handleLogout() {
    try { localStorage.removeItem('token'); } catch (_) {}
    setLogged(false);
    setToast(t('profile.messages.logoutSuccess'));
    setTimeout(() => setToast(null), 4000);
    router.push('/');
  }

  function handleLogin() {
    try {
      const t = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (t) {
        try {
          const p = JSON.parse(atob(t.split('.')[1]));
          router.push(p?.isAdmin ? '/admin' : '/profile');
        } catch (_) {
          router.push('/profile');
        }
      } else {
        router.push('/profile');
      }
    } catch (_) {
      router.push('/profile');
    }
  }

  return (
    <div className="app">
      <header className="header">
        <div className="brand">
          O Vesuvio
          {total > 0 && (
            <span className="brand-total" aria-label={t('nav.cart') + ' totale'}>
              {cartTotalFmt} • {cartCount}
            </span>
          )}
        </div>
        <nav className={menuOpen ? 'open' : ''}>
          <button className="nav-toggle" aria-label="Menu" onClick={() => setMenuOpen((v) => !v)}>☰</button>
          <div className="nav-quick">
            <Link href="/cart" className="nav-primary cart-link" style={{ marginLeft: 8 }}>
              <span className="cart-icon">🛒</span>
              <span className="cart-label">{t('nav.cart')}</span>
            </Link>
            {!logged && (
              <Link href="/profile" aria-label={t('nav.login')} className="nav-primary login-link mobile-only" style={{ marginLeft: 8 }}>
                <span className="login-icon">👤</span>
              </Link>
            )}
          </div>
          <div className="nav-links">
            <Link href="/">{t('nav.home')}</Link>
            <Link href="/menu">{t('nav.menu')}</Link>
            <Link href="/news">{t('nav.news')}</Link>
            <Link href="/orders">{t('nav.orders')}</Link>
            <Link href="/gallery">{t('nav.gallery')}</Link>
            {isAdmin && <Link href="/admin">{t('nav.admin')}</Link>}
            <select
              aria-label={t('nav.language')}
              value={lang}
              onChange={(e) => setLang(e.target.value)}
              style={{ marginLeft: 8 }}
            >
              {SUPPORTED_LANGS.map((l) => (
                <option key={l} value={l}>
                  {l.toUpperCase()}
                </option>
              ))}
            </select>
            {!logged && (
              <Link href="/profile" aria-label={t('nav.login')} className="nav-primary login-link desktop-only" style={{ marginLeft: 8 }}>
                <span className="login-icon">👤</span>
              </Link>
            )}
            {logged ? (
              <button className="btn" style={{ marginLeft: 8 }} onClick={handleLogout}>{t('nav.logout')}</button>
            ) : null}
          </div>
      </nav>
      </header>
      {toast && (
        <div className="toast" role="status">{toast}</div>
      )}
      <main className="main">{children}</main>
      <footer className="footer">
        <div>Manzenstraße 60, 73037 Göppingen • Tel. 07161-811727</div>
        <div>Mer–Dom 17:00–22:00 • Lun–Mar chiuso</div>
      </footer>
    </div>
  );
}
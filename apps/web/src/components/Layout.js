import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { io } from 'socket.io-client';
import { API_BASE } from '../lib/api';
import { useI18n, SUPPORTED_LANGS } from '../lib/i18n';

export default function Layout({ children }) {
  const router = useRouter();
  const { lang, setLang, t } = useI18n();
  const [toast, setToast] = useState(null);
  const [logged, setLogged] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

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
        <div className="brand">O Vesuvio</div>
        <nav className={menuOpen ? 'open' : ''}>
          <button className="nav-toggle" aria-label="Menu" onClick={() => setMenuOpen((v) => !v)}>☰</button>
          <div className="nav-links">
          <Link href="/">{t('nav.home')}</Link>
          <Link href="/menu">{t('nav.menu')}</Link>
          <Link href="/cart">{t('nav.cart')}</Link>
          {!logged && <Link href="/profile">{t('nav.profile')}</Link>}
          <Link href="/orders">{t('nav.orders')}</Link>
          <Link href="/gallery">{t('nav.gallery')}</Link>
          <Link href="/news">{t('nav.news')}</Link>
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
          {logged ? (
            <button className="btn" style={{ marginLeft: 8 }} onClick={handleLogout}>{t('nav.logout')}</button>
          ) : (
            <button className="btn" style={{ marginLeft: 8 }} onClick={handleLogin}>{t('nav.login')}</button>
          )}
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
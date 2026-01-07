import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { API_BASE } from '../../src/lib/api';

export default function AdminUsersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [token, setToken] = useState(null);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    const t = localStorage.getItem('token');
    setToken(t);
    if (!t) setMsg('Accesso admin richiesto');
  }, []);

  useEffect(() => {
    if (!token) return;
    fetchUsers();
    fetchOrders();
  }, [token]);

  async function fetchUsers() {
    try {
      const res = await fetch(`${API_BASE}/users`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setMsg(err.error || 'Accesso admin richiesto');
        setUsers([]);
        return;
      }
      const data = await res.json();
      setUsers(Array.isArray(data) ? data : []);
    } catch (e) {
      setMsg('Errore nel caricare utenti');
      setUsers([]);
    }
  }

  async function fetchOrders() {
    try {
      const res = await fetch(`${API_BASE}/orders`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      if (!res.ok) {
        setOrders([]);
        return;
      }
      const data = await res.json();
      setOrders(Array.isArray(data) ? data : []);
    } catch (_) {
      setOrders([]);
    }
  }

  const ordersByUser = useMemo(() => {
    const map = {};
    (orders || []).forEach((o) => {
      map[o.userId] = map[o.userId] || [];
      map[o.userId].push(o);
    });
    return map;
  }, [orders]);

  return (
    <div>
      <div className="admin-back" style={{ marginBottom: 8 }}>
        <button type="button" className="btn" onClick={() => router.push('/admin')}>⬅️ Torna alla Dashboard</button>
      </div>
      <h2>Admin • Utenti registrati</h2>
      {msg && <div className="status">{msg}</div>}
      <div className="users">
        {(Array.isArray(users) ? users : []).map((u) => (
          <div key={u._id} className="user admin" style={{ border: '1px solid #ddd', padding: 12, marginBottom: 12 }}>
            <div><strong>{u.firstName} {u.lastName}</strong> — {u.email}</div>
            <div>Telefono: {u.phone || '—'} • Indirizzo: {u.address || '—'}</div>
            <div>Consenso privacy: {u.privacyConsent ? 'sì' : 'no'}{u.privacyConsentAt ? ` • ${new Date(u.privacyConsentAt).toLocaleString()}` : ''}</div>
            <div>Ordini effettuati: {ordersByUser[u._id]?.length || 0}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
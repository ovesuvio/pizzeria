import { useEffect, useState } from 'react';
import { API_BASE, apiPut } from '../../src/lib/api';

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [token, setToken] = useState(null);
  const [msg, setMsg] = useState('');
  const [products, setProducts] = useState([]);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const t = localStorage.getItem('token');
    setToken(t);
    if (!t) setMsg('Accesso admin richiesto');
  }, []);

  useEffect(() => {
    if (!token) return;
    fetchOrders();
    fetchProducts();
    fetchUsers();
  }, [token]);

  async function fetchOrders() {
    try {
      const res = await fetch(`${API_BASE}/orders`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setMsg(err.error || 'Accesso admin richiesto');
        setOrders([]);
        return;
      }
      const data = await res.json();
      setOrders(Array.isArray(data) ? data : []);
    } catch (e) {
      setMsg('Errore nel caricare ordini');
      setOrders([]);
    }
  }

  async function fetchProducts() {
    try {
      const res = await fetch(`${API_BASE}/products`);
      const data = res.ok ? await res.json() : [];
      setProducts(Array.isArray(data) ? data : []);
    } catch (_) {
      setProducts([]);
    }
  }

  async function fetchUsers() {
    try {
      const res = await fetch(`${API_BASE}/users`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      const data = res.ok ? await res.json() : [];
      setUsers(Array.isArray(data) ? data : []);
    } catch (_) {
      setUsers([]);
    }
  }

  async function updateStatus(id, status) {
    try {
      await apiPut(`/orders/${id}/status`, { status }, token);
      setMsg('Stato aggiornato');
      fetchOrders();
    } catch (e) {
      setMsg('Errore aggiornamento stato');
    }
  }

  return (
    <div>
      <h2>Admin • Ordini</h2>
      {msg && <div className="status">{msg}</div>}
      <div className="orders">
        {(Array.isArray(orders) ? orders : []).map((o) => {
          const prodMap = Object.fromEntries((products || []).map((p) => [p._id, p]));
          const userMap = Object.fromEntries((users || []).map((u) => [u._id, u]));
          const customer = userMap[o.userId];
          const payLabelMap = { stripe: 'Carta (Stripe)', paypal: 'PayPal', cash: 'Contanti' };
          return (
          <div key={o._id} className="order admin">
            <div>#{o._id.slice(-6)} • {new Date(o.createdAt).toLocaleString()}</div>
            <div>Totale: € {o.total.toFixed(2)}</div>
            <div>Stato: {o.status}</div>
            <div>Pagamento: {payLabelMap[o.paymentMethod] || o.paymentMethod || '-'}</div>
            <div>Cliente: {customer ? (customer.email || customer.phone || customer._id) : o.userId}</div>
            {o.address && <div>Indirizzo: {o.address}</div>}
            <div className="order-items">
              {(Array.isArray(o.items) ? o.items : []).map((it, idx) => {
                const p = prodMap[it.productId];
                const name = p?.name || it.productId;
                const extrasTotal = (Array.isArray(it.extras) ? it.extras : []).reduce((s, e) => s + (e.price || 0), 0);
                const base = (p?.price || 0) * (it.quantity || 0);
                const lineTotal = base + extrasTotal;
                return (
                  <div key={idx} className="order-item-line" style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                    <span>{name} × {it.quantity}</span>
                    <span>€ {lineTotal.toFixed(2)}{extrasTotal > 0 ? ` (extra + € ${extrasTotal.toFixed(2)})` : ''}</span>
                  </div>
                );
              })}
            </div>
            <div className="actions">
              <button className="btn" onClick={() => updateStatus(o._id, 'preparazione')}>In preparazione</button>
              <button className="btn" onClick={() => updateStatus(o._id, 'consegna')}>In consegna</button>
              <button className="btn" onClick={() => updateStatus(o._id, 'consegnato')}>Consegnato</button>
            </div>
          </div>
          );})}
      </div>
    </div>
  );
}
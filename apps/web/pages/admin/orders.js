import { useEffect, useRef, useState } from 'react';
import { API_BASE, apiPut } from '../../src/lib/api';
import { io } from 'socket.io-client';

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [token, setToken] = useState(null);
  const [msg, setMsg] = useState('');
  const [products, setProducts] = useState([]);
  const [users, setUsers] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const audioCtxRef = useRef(null);

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

  useEffect(() => {
    if (!token) return;
    const socket = io(API_BASE, { transports: ['websocket'] });
    const handler = (evt) => {
      if (evt && evt.status === 'ricevuto' && soundEnabled) {
        try {
          let ctx = audioCtxRef.current;
          if (!ctx) {
            ctx = new (window.AudioContext || window.webkitAudioContext)();
            audioCtxRef.current = ctx;
          }
          if (ctx.resume) ctx.resume();
          const o = ctx.createOscillator();
          const g = ctx.createGain();
          o.type = 'sine';
          o.frequency.value = 880;
          g.gain.value = 0.08;
          o.connect(g);
          g.connect(ctx.destination);
          o.start();
          setTimeout(() => { try { o.stop(); } catch (_) {} }, 400);
        } catch (_) {}
      }
      fetchOrders();
    };
    socket.on('order_update', handler);
    return () => socket.disconnect();
  }, [token, soundEnabled]);

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
      <div className="filters" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <label>Stato:</label>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">Tutti</option>
          <option value="ricevuto">Ricevuto</option>
          <option value="preparazione">In preparazione</option>
          <option value="consegna">In consegna</option>
          <option value="consegnato">Consegnato</option>
        </select>
        <label style={{ marginLeft: 12 }}>
          <input type="checkbox" checked={soundEnabled} onChange={(e) => setSoundEnabled(e.target.checked)} /> Suono allerta
        </label>
      </div>
      {msg && <div className="status">{msg}</div>}
      <div className="orders">
        {(() => {
          const list = (Array.isArray(orders) ? orders : []).filter((o) => !statusFilter || o.status === statusFilter);
          const groupMap = list.reduce((acc, o) => {
            const key = new Date(o.createdAt).toISOString().slice(0, 10);
            (acc[key] = acc[key] || []).push(o);
            return acc;
          }, {});
          const days = Object.keys(groupMap).sort((a, b) => (a > b ? -1 : 1));
          return days.map((day) => (
            <section key={day} style={{ marginTop: 16 }}>
              <h3>{new Date(day).toLocaleDateString()}</h3>
              <div style={{ marginBottom: 8, fontWeight: 600 }}>Totale giornaliero: € {groupMap[day].reduce((s, o) => s + (o.total || 0), 0).toFixed(2)}</div>
              {groupMap[day].map((o) => {
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
                  {(() => {
                    const sched = o.scheduledAt;
                    let invalid = false;
                    if (sched) {
                      const parts = String(sched).split(':');
                      const h = parseInt(parts[0] || '0', 10);
                      const m = parseInt(parts[1] || '0', 10);
                      const min = h * 60 + m;
                      invalid = !(min >= 17 * 60 && min <= 22 * 60);
                    }
                    return (
                      <div style={invalid ? { color: 'var(--lava-red)' } : undefined}>
                        {(o.mode === 'delivery' ? 'Consegna' : 'Asporto')}{o.scheduledAt ? ` alle ${o.scheduledAt}` : ''}
                      </div>
                    );
                  })()}
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
            </section>
          ));
        })()}
      </div>
    </div>
  );
}
import { useEffect, useState } from 'react';
import { API_BASE, apiPut } from '../../src/lib/api';

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [token, setToken] = useState(null);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    const t = localStorage.getItem('token');
    setToken(t);
    if (!t) setMsg('Accesso admin richiesto');
  }, []);

  useEffect(() => {
    if (!token) return;
    fetchOrders();
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
        {(Array.isArray(orders) ? orders : []).map((o) => (
          <div key={o._id} className="order admin">
            <div>#{o._id.slice(-6)} • {new Date(o.createdAt).toLocaleString()}</div>
            <div>Totale: € {o.total.toFixed(2)}</div>
            <div>Stato: {o.status}</div>
            <div className="actions">
              <button className="btn" onClick={() => updateStatus(o._id, 'preparazione')}>In preparazione</button>
              <button className="btn" onClick={() => updateStatus(o._id, 'consegna')}>In consegna</button>
              <button className="btn" onClick={() => updateStatus(o._id, 'consegnato')}>Consegnato</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
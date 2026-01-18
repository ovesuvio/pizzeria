export const API_BASE = process.env.NEXT_PUBLIC_API_BASE || process.env.REACT_APP_API_URL || 'http://localhost:4000';

export async function apiGet(path) {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) throw new Error('Errore richiesta');
  return res.json();
}

export async function apiGetAuth(path, token) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  if (!res.ok) throw new Error('Errore richiesta');
  return res.json();
}

export async function apiPost(path, body, token) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    let msg = 'Errore richiesta';
    try { const j = await res.json(); msg = j?.error || msg; } catch (_) {}
    throw new Error(msg);
  }
  return res.json();
}

export async function apiPut(path, body, token) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    let msg = 'Errore richiesta';
    try { const j = await res.json(); msg = j?.error || msg; } catch (_) {}
    throw new Error(msg);
  }
  return res.json();
}

export async function apiDelete(path, token) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'DELETE',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  if (!res.ok) {
    let msg = 'Errore richiesta';
    try { const j = await res.json(); msg = j?.error || msg; } catch (_) {}
    throw new Error(msg);
  }
  return res.json();
}
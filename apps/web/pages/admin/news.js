import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { API_BASE } from '../../src/lib/api';

export default function AdminNewsPage() {
  const router = useRouter();
  const [token, setToken] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [msg, setMsg] = useState('');
  const [list, setList] = useState([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [publishedAt, setPublishedAt] = useState('');
  const [busy, setBusy] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editImageUrl, setEditImageUrl] = useState('');
  const [editActive, setEditActive] = useState(true);

  useEffect(() => {
    const t = localStorage.getItem('token');
    setToken(t);
    if (!t) return;
    try {
      const p = JSON.parse(atob(t.split('.')[1]));
      setIsAdmin(!!p?.isAdmin);
    } catch (_) {}
  }, []);

  useEffect(() => {
    fetchList();
  }, []);

  async function fetchList() {
    try {
      const res = await fetch(`${API_BASE}/news`);
      const data = res.ok ? await res.json() : [];
      setList(Array.isArray(data) ? data : []);
    } catch (_) {
      setList([]);
    }
  }

  async function createItem() {
    if (!isAdmin || !token) { setMsg('Accesso admin richiesto'); return; }
    if (!title || !content) { setMsg('Titolo e contenuto richiesti'); return; }
    setBusy(true);
    setMsg('Creazione...');
    try {
      let finalImageUrl = imageUrl;
      if (imageFile) {
        const optimized = await optimizeImage(imageFile);
        const up = await fetch(`${API_BASE}/news/upload`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ files: [optimized] }) });
        if (!up.ok) throw new Error('Errore upload immagine');
        const out = await up.json();
        const rel = out?.saved?.[0]?.file;
        finalImageUrl = rel ? `${API_BASE}${rel}` : finalImageUrl;
      }
      const res = await fetch(`${API_BASE}/news`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title, content, imageUrl: finalImageUrl, publishedAt: publishedAt || undefined })
      });
      if (!res.ok) throw new Error('Errore creazione');
      setTitle(''); setContent(''); setImageUrl(''); setPublishedAt(''); setImageFile(null);
      setMsg('Notizia creata');
      fetchList();
    } catch (_) {
      setMsg('Errore creazione');
    } finally {
      setBusy(false);
    }
  }

  function startEdit(item) {
    setEditingId(item._id);
    setEditTitle(item.title || '');
    setEditContent(item.content || '');
    setEditImageUrl(item.imageUrl || '');
    setEditActive(item.active !== false);
  }

  async function saveEdit(id) {
    if (!isAdmin || !token) { setMsg('Accesso admin richiesto'); return; }
    setBusy(true);
    setMsg('Salvataggio...');
    try {
      const res = await fetch(`${API_BASE}/news/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title: editTitle, content: editContent, imageUrl: editImageUrl, active: editActive })
      });
      if (!res.ok) throw new Error('Errore salvataggio');
      setEditingId(null);
      setMsg('Notizia aggiornata');
      fetchList();
    } catch (_) {
      setMsg('Errore salvataggio');
    } finally {
      setBusy(false);
    }
  }

  async function optimizeImage(file) {
    const url = URL.createObjectURL(file);
    const img = await new Promise((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = reject;
      i.src = url;
    });
    URL.revokeObjectURL(url);
    const maxSide = 1600;
    const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
    const w = Math.max(1, Math.round(img.width * scale));
    const h = Math.max(1, Math.round(img.height * scale));
    const canvas = document.createElement('canvas');
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, w, h);
    const isGif = /gif$/i.test(file.type);
    const targetType = isGif ? 'image/gif' : 'image/jpeg';
    const dataUrl = canvas.toDataURL(targetType, 0.82);
    const name = file.name.replace(/\.[^.]+$/, targetType === 'image/jpeg' ? '.jpeg' : '.gif');
    return { name, type: targetType, data: dataUrl };
  }

  async function toggleActive(id, active) {
    if (!isAdmin || !token) { setMsg('Accesso admin richiesto'); return; }
    try {
      const res = await fetch(`${API_BASE}/news/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ active })
      });
      if (!res.ok) throw new Error('Errore stato');
      fetchList();
    } catch (_) {
      setMsg('Errore aggiornamento stato');
    }
  }

  async function deleteItem(id) {
    if (!isAdmin || !token) { setMsg('Accesso admin richiesto'); return; }
    try {
      const res = await fetch(`${API_BASE}/news/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Errore eliminazione');
      setMsg('Notizia eliminata');
      fetchList();
    } catch (_) {
      setMsg('Errore eliminazione');
    }
  }

  return (
    <div>
      <div className="admin-back" style={{ marginBottom: 8 }}>
        <button type="button" className="btn" onClick={() => router.push('/admin')}>⬅️ Torna alla Dashboard</button>
      </div>
      <h2>Admin • Notizie</h2>
      {msg && <div className="status">{msg}</div>}
      {!isAdmin && <div className="status">Accesso richiesto. Effettua il login admin.</div>}
      {isAdmin && (
        <section style={{ margin: '16px 0', padding: 12, border: '1px solid #ddd', borderRadius: 8 }}>
          <div className="form" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 8 }}>
            <input type="text" placeholder="Titolo" value={title} onChange={(e) => setTitle(e.target.value)} />
            <textarea placeholder="Contenuto" value={content} onChange={(e) => setContent(e.target.value)} rows={6} />
            <input type="url" placeholder="URL immagine (opzionale)" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} />
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)} />
              {imageFile && <span style={{ fontSize: 12, color: '#666' }}>{imageFile.name}</span>}
            </div>
            <input type="datetime-local" placeholder="Pubblicata il" value={publishedAt} onChange={(e) => setPublishedAt(e.target.value)} />
            <button className="btn primary" onClick={createItem} disabled={busy || !title || !content}>Crea notizia</button>
          </div>
        </section>
      )}
      <div className="news-list" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
        {list.map((n) => (
          <div key={n._id} className="card">
            {editingId === n._id ? (
              <div className="card-body">
                <input type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
                <textarea value={editContent} onChange={(e) => setEditContent(e.target.value)} rows={5} style={{ marginTop: 8 }} />
                <input type="url" value={editImageUrl} onChange={(e) => setEditImageUrl(e.target.value)} style={{ marginTop: 8 }} />
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
                  <input type="checkbox" checked={editActive} onChange={(e) => setEditActive(e.target.checked)} /> Attiva
                </label>
                <div className="actions" style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                  <button className="btn primary" onClick={() => saveEdit(n._id)} disabled={busy}>Salva</button>
                  <button className="btn" onClick={() => setEditingId(null)}>Annulla</button>
                  <label className="btn" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <input type="file" accept="image/*" style={{ display: 'none' }} onChange={async (e) => {
                      const f = e.target.files?.[0];
                      if (!f) return;
                      try {
                        const optimized = await optimizeImage(f);
                        const up = await fetch(`${API_BASE}/news/upload`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ files: [optimized] }) });
                        if (!up.ok) throw new Error('Upload fallito');
                        const out = await up.json();
                        const urlSaved = out?.saved?.[0]?.file;
                        if (urlSaved) setEditImageUrl(`${API_BASE}${urlSaved}`);
                        setMsg('Immagine caricata');
                      } catch (_) {
                        setMsg('Errore upload immagine');
                      }
                    }} />
                    Cambia immagine
                  </label>
                </div>
              </div>
            ) : (
              <>
                {n.imageUrl && <img src={n.imageUrl} alt={n.title} className="card-img" />}
                <div className="card-body">
                  <div className="card-title">{n.title}</div>
                  <div className="card-desc" style={{ whiteSpace: 'pre-line' }}>{n.content}</div>
                  <div style={{ fontSize: 12, color: '#666', marginTop: 6 }}>{new Date(n.publishedAt).toLocaleString()}</div>
                  <div className="actions" style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                    <button className="btn" onClick={() => startEdit(n)}>Modifica</button>
                    <button className="btn" onClick={() => toggleActive(n._id, !(n.active !== false))}>{(n.active !== false) ? 'Disattiva' : 'Attiva'}</button>
                    <button className="btn" onClick={() => deleteItem(n._id)}>Elimina</button>
                  </div>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
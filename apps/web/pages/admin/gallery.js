import { useEffect, useState } from 'react';

export default function AdminGalleryPage() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [msg, setMsg] = useState('');
  const [uploading, setUploading] = useState(false);
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [gallery, setGallery] = useState([]);

  useEffect(() => {
    const t = localStorage.getItem('token');
    if (!t) {
      setMsg('Accesso admin richiesto');
      setIsAdmin(false);
      return;
    }
    try {
      const p = JSON.parse(atob(t.split('.')[1]));
      setIsAdmin(!!p?.isAdmin);
    } catch (_) {
      setIsAdmin(false);
    }
  }, []);

  useEffect(() => {
    if (!files || files.length === 0) {
      setPreviews([]);
      return;
    }
    const urls = Array.from(files).map((f) => ({ name: f.name, url: URL.createObjectURL(f) }));
    setPreviews(urls);
    return () => {
      urls.forEach((u) => URL.revokeObjectURL(u.url));
    };
  }, [files]);

  useEffect(() => {
    if (!isAdmin) return;
    fetchGalleryList().then(setGallery).catch(() => setGallery([]));
  }, [isAdmin]);

  async function fetchGalleryList() {
    try {
      const res = await fetch('/api/gallery');
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    } catch (_) {
      return [];
    }
  }

  async function handleUpload() {
    if (!files || files.length === 0) return;
    setUploading(true);
    setMsg('Caricamento in corso...');
    try {
      const items = await Promise.all(Array.from(files).slice(0, 20).map(async (file) => {
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
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        const isGif = /gif$/i.test(file.type);
        const targetType = isGif ? 'image/gif' : 'image/jpeg';
        const dataUrl = canvas.toDataURL(targetType, 0.82);
        const name = file.name.replace(/\.[^.]+$/, targetType === 'image/jpeg' ? '.jpeg' : '.gif');
        return { name, type: targetType, data: dataUrl };
      }));
      const res = await fetch('/api/gallery-upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ files: items })
      });
      if (!res.ok) throw new Error('Errore upload');
      const out = await res.json();
      setMsg(out?.ok ? 'Immagini caricate' : 'Errore upload');
      setFiles([]);
      fetchGalleryList().then(setGallery).catch(() => {});
    } catch (e) {
      setMsg('Errore nel caricamento');
    } finally {
      setUploading(false);
    }
  }

  async function deleteImage(src) {
    try {
      const res = await fetch('/api/gallery-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ src })
      });
      if (!res.ok) throw new Error('Errore eliminazione');
      const out = await res.json();
      setMsg(out?.ok ? 'Immagine eliminata' : 'Errore eliminazione');
      fetchGalleryList().then(setGallery).catch(() => {});
    } catch (_) {
      setMsg('Errore eliminazione');
    }
  }

  return (
    <div>
      <h2>Admin • Galleria</h2>
      {msg && <div className="status">{msg}</div>}
      {!isAdmin && <div className="status">Accesso richiesto. Effettua il login admin.</div>}
      {isAdmin && (
        <section style={{ margin: '16px 0', padding: 12, border: '1px solid #ddd', borderRadius: 8 }}>
          <div className="form" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input type="file" multiple accept="image/*" onChange={(e) => setFiles(e.target.files)} />
            <button className="btn primary" onClick={handleUpload} disabled={uploading || !files || files.length === 0}>
              {uploading ? 'Caricamento...' : 'Carica immagini'}
            </button>
            <button className="btn" onClick={() => { window.location.href = '/gallery'; }}>
              Apri galleria
            </button>
          </div>
          {previews.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 8, marginTop: 12 }}>
              {previews.map((p) => (
                <div key={p.url} style={{ position: 'relative', height: 100, border: '1px solid #eee' }}>
                  <img src={p.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              ))}
            </div>
          )}
          {Array.isArray(gallery) && gallery.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 8 }}>
                {gallery.map((g) => (
                  <div key={g.src} style={{ border: '1px solid #eee', borderRadius: 6, overflow: 'hidden' }}>
                    <div style={{ position: 'relative', height: 110 }}>
                      <img src={g.src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 6 }}>
                      <span style={{ fontSize: 12 }}>{g.src.split('/').pop()}</span>
                      <button className="btn" onClick={() => deleteImage(g.src)}>Elimina</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div style={{ fontSize: 12, color: '#666', marginTop: 8 }}>I file vengono rinominati automaticamente con numeri progressivi.</div>
        </section>
      )}
    </div>
  );
}
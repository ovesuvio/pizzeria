import Link from 'next/link';

export default function AdminDashboard() {
  return (
    <div>
      <h2>Admin dashboard</h2>
      <div className="grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
        <Link className="card" href="/admin/orders"><div className="card-body"><div className="card-title">Ordini</div><div className="card-desc">Gestione stato ordini</div></div></Link>
        <Link className="card" href="/admin/gallery"><div className="card-body"><div className="card-title">Galleria</div><div className="card-desc">Carica ed elimina immagini</div></div></Link>
        <Link className="card" href="/admin/users"><div className="card-body"><div className="card-title">Utenti registrati</div><div className="card-desc">Elenco utenti</div></div></Link>
        <Link className="card" href="/admin/news"><div className="card-body"><div className="card-title">Notizie</div><div className="card-desc">Crea, modifica e elimina</div></div></Link>
      </div>
    </div>
  );
}
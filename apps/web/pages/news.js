import { API_BASE } from '../src/lib/api';
import { useI18n } from '../src/lib/i18n';

export default function NewsPage({ items = [] }) {
  const { t, lang } = useI18n();
  const localeMap = { it: 'it-IT', de: 'de-DE', en: 'en-GB' };
  const formatDate = (d) => new Intl.DateTimeFormat(localeMap[lang] || 'it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(d));
  return (
    <div>
      <h2>{t('nav.news')}</h2>
      {(!items || items.length === 0) ? (
        <div style={{ color: '#666' }}>Nessuna notizia al momento.</div>
      ) : (
        <div className="news-list" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
          {items.map((n) => (
            <article key={n._id || n.publishedAt} className="card">
              {n.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={n.imageUrl} alt={n.title} className="card-img" />
              )}
              <div className="card-body">
                <div className="card-title">{n.title}</div>
                <div className="card-desc" style={{ whiteSpace: 'pre-line' }}>{n.content}</div>
                <div style={{ fontSize: 12, color: '#666', marginTop: 6 }}>{formatDate(n.publishedAt)}</div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

export async function getServerSideProps() {
  try {
    const res = await fetch(`${API_BASE}/news`);
    const list = res.ok ? await res.json() : [];
    return { props: { items: Array.isArray(list) ? list : [] } };
  } catch (_) {
    return { props: { items: [] } };
  }
}
import Link from 'next/link';
import { useI18n } from '../src/lib/i18n';
import { API_BASE } from '../src/lib/api';

export default function Home({ latest = null }) {
  const { t, lang } = useI18n();
  const localeMap = { it: 'it-IT', de: 'de-DE', en: 'en-GB' };
  const formatDate = (d) => new Intl.DateTimeFormat(localeMap[lang] || 'it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(d));
  return (
    <div className="home">
      <div className="hero">
        <h1>{t('home.hero.title')}</h1>
        <p>{t('home.hero.address')}</p>
        <p>{t('home.hero.hours')}</p>
        <Link className="btn primary" href="/menu">{t('home.hero.browseMenu')}</Link>
      </div>
      <section style={{ marginTop: 16 }}>
        <div style={{ position: 'relative', overflow: 'hidden', borderRadius: 8, paddingTop: '56.25%' }}>
          <img src="/gallery/18.jpeg" alt="Pizza nel forno a legna" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        </div>
      </section>
      {latest && (
        <section style={{ marginTop: 16 }}>
          <div className="news-section">
          <h3>{t('nav.news')}</h3>
          <article className="card">
            <div className="card-body news-compact">
              {latest.imageUrl && (
                <div className="news-thumb">
                  <img src={latest.imageUrl} alt={latest.title} />
                </div>
              )}
              <div className="news-content">
                <div className="card-title news-title">{latest.title}</div>
                <div className="card-desc news-text">{latest.content}</div>
                <div style={{ fontSize: 12, color: '#666', marginTop: 6 }}>{formatDate(latest.publishedAt)}</div>
                <div className="news-actions">
                  <Link className="btn" href="/news">{t('home.readMore')}</Link>
                </div>
              </div>
            </div>
          </article>
          </div>
        </section>
      )}
    </div>
  );
}

export async function getServerSideProps() {
  try {
    const res = await fetch(`${API_BASE}/news`);
    const list = res.ok ? await res.json() : [];
    const latest = Array.isArray(list) && list.length ? list[0] : null;
    return { props: { latest } };
  } catch (_) {
    return { props: { latest: null } };
  }
}

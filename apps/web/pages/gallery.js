import fs from 'fs';
import path from 'path';
import { useI18n } from '../src/lib/i18n';
import Gallery from '../src/components/Gallery';

export default function GalleryPage({ images = [] }) {
  const { t } = useI18n();
  return (
    <div>
      {Array.isArray(images) && images.length > 0 ? (
        <Gallery images={images} />
      ) : null}
    </div>
  );
}

export async function getStaticProps() {
  function humanize(name) {
    const base = name.replace(/\.[^.]+$/, '');
    return base
      .replace(/[-_]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }
  try {
    const dir = path.join(process.cwd(), 'public', 'gallery');
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    const images = entries
      .filter((e) => e.isFile())
      .map((e) => e.name)
      .filter((n) => /(jpe?g|png|webp|gif)$/i.test(n))
      .filter((n) => {
        const base = n.replace(/\.[^.]+$/, '');
        return /^[0-9]+$/.test(base);
      })
      .sort((a, b) => {
        const an = parseInt(a.replace(/\.[^.]+$/, ''), 10);
        const bn = parseInt(b.replace(/\.[^.]+$/, ''), 10);
        return an - bn;
      })
      .map((n) => ({ src: `/gallery/${encodeURIComponent(n)}`, alt: humanize(n) }));
    return { props: { images } };
  } catch (_) {
    return { props: { images: [] } };
  }
}
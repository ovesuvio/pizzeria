import fs from 'fs';
import path from 'path';

function humanize(name) {
  const base = name.replace(/\.[^.]+$/, '');
  return base
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function handler(req, res) {
  try {
    const dir = path.join(process.cwd(), 'public', 'gallery');
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    const images = entries
      .filter((e) => e.isFile())
      .map((e) => e.name)
      .filter((n) => /\.(jpe?g|png|webp|gif)$/i.test(n))
      // Solo file con nome numerico (es. 1.jpg, 02.png, 123.webp)
      .filter((n) => {
        const base = n.replace(/\.[^.]+$/, '');
        return /^[0-9]+$/.test(base);
      })
      // Ordina numericamente in base al nome (senza estensione)
      .sort((a, b) => {
        const an = parseInt(a.replace(/\.[^.]+$/, ''), 10);
        const bn = parseInt(b.replace(/\.[^.]+$/, ''), 10);
        return an - bn;
      })
      .map((n) => ({ src: `/gallery/${encodeURIComponent(n)}`, alt: humanize(n) }));
    res.status(200).json(images);
  } catch (e) {
    // Se la cartella non esiste o è vuota, restituiamo un array vuoto
    res.status(200).json([]);
  }
}
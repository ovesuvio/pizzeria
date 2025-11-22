import fs from 'fs';
import path from 'path';

export default function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Metodo non consentito' });
  const { src } = req.body || {};
  if (!src || typeof src !== 'string') return res.status(400).json({ error: 'Parametro mancante' });
  const base = src.split('/').pop();
  if (!/^[0-9]+\.(jpe?g|png|webp|gif)$/i.test(base)) return res.status(400).json({ error: 'Nome file non valido' });
  try {
    const target = path.join(process.cwd(), 'public', 'gallery', base);
    fs.unlinkSync(target);
    return res.json({ ok: true });
  } catch (_) {
    return res.status(404).json({ error: 'File non trovato' });
  }
}
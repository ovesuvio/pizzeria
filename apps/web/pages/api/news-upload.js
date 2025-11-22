import fs from 'fs';
import path from 'path';

export const config = { api: { bodyParser: { sizeLimit: '20mb' } } };

function getNextIndex(dir) {
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    const nums = entries
      .filter((e) => e.isFile())
      .map((e) => e.name)
      .map((n) => n.replace(/\.[^.]+$/, ''))
      .map((b) => (/^[0-9]+$/.test(b) ? parseInt(b, 10) : null))
      .filter((v) => typeof v === 'number');
    return nums.length ? Math.max(...nums) + 1 : 1;
  } catch (_) {
    return 1;
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Metodo non consentito' });
  const dir = path.join(process.cwd(), 'public', 'news');
  try { fs.mkdirSync(dir, { recursive: true }); } catch (_) {}

  const files = Array.isArray(req.body?.files) ? req.body.files : req.body?.data ? [{ name: req.body.name, data: req.body.data, type: req.body.type }] : [];
  if (!files.length) return res.status(400).json({ error: 'Nessun file' });
  if (files.length > 5) return res.status(400).json({ error: 'Troppi file' });

  let index = getNextIndex(dir);
  const saved = [];
  for (const f of files) {
    const name = f.name || `${Date.now()}`;
    const ext = path.extname(name) || (f.type?.includes('png') ? '.png' : f.type?.includes('webp') ? '.webp' : f.type?.includes('gif') ? '.gif' : '.jpeg');
    if (!/\.(jpe?g|png|webp|gif)$/i.test(ext)) return res.status(400).json({ error: 'Tipo file non supportato' });
    const target = path.join(dir, `${index}${ext}`);
    const dataUrl = f.data || '';
    if (!/^data:image\/(jpeg|jpg|png|webp|gif);base64,/i.test(dataUrl)) return res.status(400).json({ error: 'Formato dati non valido' });
    const b64 = dataUrl.replace(/^data:[^;]+;base64,/, '');
    const buf = Buffer.from(b64, 'base64');
    if (buf.length > 8 * 1024 * 1024) return res.status(400).json({ error: 'File troppo grande' });
    fs.writeFileSync(target, buf);
    saved.push({ file: `/news/${index}${ext}` });
    index += 1;
  }
  res.json({ ok: true, saved });
}
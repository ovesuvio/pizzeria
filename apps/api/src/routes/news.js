const express = require('express');
const auth = require('../middleware/auth');
const News = require('../models/news');
const fs = require('fs');
const path = require('path');
const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(__dirname, '../../public/news');

module.exports = function(memory, db) {
  const router = express.Router();

  router.get('/', async (_req, res) => {
    if (db.useMemory) {
      const list = memory.news.slice().sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
      return res.json(list);
    }
    const list = await News.find({ active: true }).sort({ publishedAt: -1 });
    res.json(list);
  });

  router.post('/', auth(true), async (req, res) => {
    const { title, content, imageUrl, active, publishedAt } = req.body;
    if (!title || !content) return res.status(400).json({ error: 'Titolo e contenuto richiesti' });
    if (db.useMemory) {
      const item = { _id: 'n_' + Date.now(), title, content, imageUrl, active: active ?? true, publishedAt: publishedAt || new Date().toISOString() };
      memory.news.unshift(item);
      return res.json(item);
    }
    const item = await News.create({ title, content, imageUrl, active, publishedAt });
    res.json(item);
  });

  router.put('/:id', auth(true), async (req, res) => {
    const { id } = req.params;
    const payload = req.body;
    if (db.useMemory) {
      const idx = memory.news.findIndex(n => n._id === id);
      if (idx < 0) return res.status(404).json({ error: 'Notizia non trovata' });
      memory.news[idx] = { ...memory.news[idx], ...payload };
      return res.json(memory.news[idx]);
    }
    const item = await News.findByIdAndUpdate(id, payload, { new: true });
    res.json(item);
  });

  router.delete('/:id', auth(true), async (req, res) => {
    const { id } = req.params;
    if (db.useMemory) {
      memory.news = memory.news.filter(n => n._id !== id);
      return res.json({ ok: true });
    }
    await News.findByIdAndDelete(id);
    res.json({ ok: true });
  });

  router.post('/upload', auth(true), async (req, res) => {
    const files = Array.isArray(req.body?.files) ? req.body.files : [];
    if (!files.length) return res.status(400).json({ error: 'Nessun file' });
    const dir = UPLOAD_DIR;
    try { fs.mkdirSync(dir, { recursive: true }); } catch (_) {}
    function getNextIndex() {
      try {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        const nums = entries.filter(e => e.isFile()).map(e => e.name).map(n => n.replace(/\.[^.]+$/, ''))
          .map(b => (/^[0-9]+$/.test(b) ? parseInt(b, 10) : null)).filter(v => typeof v === 'number');
        return nums.length ? Math.max(...nums) + 1 : 1;
      } catch (_) { return 1; }
    }
    let index = getNextIndex();
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
      saved.push({ file: `/static/news/${index}${ext}` });
      index += 1;
    }
    res.json({ ok: true, saved });
  });

  return router;
}
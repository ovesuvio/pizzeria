const express = require('express');
const Category = require('../models/category');
const auth = require('../middleware/auth');

module.exports = function(memory, db) {
  const router = express.Router();

  router.get('/', async (_req, res) => {
    if (db.useMemory) return res.json(memory.categories);
    const cats = await Category.find();
    res.json(cats);
  });

  router.post('/', auth(true), async (req, res) => {
    const { name } = req.body;
    if (db.useMemory) {
      const c = { _id: 'c_' + Date.now(), name };
      memory.categories.push(c);
      return res.json(c);
    }
    const c = await Category.create({ name });
    res.json(c);
  });

  router.put('/:id', auth(true), async (req, res) => {
    const { id } = req.params;
    const { name } = req.body;
    if (db.useMemory) {
      const c = memory.categories.find(c => c._id === id);
      if (!c) return res.status(404).json({ error: 'Categoria non trovata' });
      c.name = name;
      return res.json(c);
    }
    const c = await Category.findByIdAndUpdate(id, { name }, { new: true });
    res.json(c);
  });

  router.delete('/:id', auth(true), async (req, res) => {
    const { id } = req.params;
    if (db.useMemory) {
      memory.categories = memory.categories.filter(c => c._id !== id);
      return res.json({ ok: true });
    }
    await Category.findByIdAndDelete(id);
    res.json({ ok: true });
  });

  return router;
}
const express = require('express');
const Discount = require('../models/discount');
const auth = require('../middleware/auth');

module.exports = function(memory, db) {
  const router = express.Router();

  router.get('/', async (_req, res) => {
    if (db.useMemory) return res.json(memory.discounts);
    const list = await Discount.find();
    res.json(list);
  });

  router.post('/', auth(true), async (req, res) => {
    const { code, percentage, active, minTotal } = req.body;
    if (db.useMemory) {
      const d = { _id: 'd_' + Date.now(), code, percentage, active: active ?? true, minTotal: minTotal || 0 };
      memory.discounts.push(d);
      return res.json(d);
    }
    const d = await Discount.create({ code, percentage, active, minTotal });
    res.json(d);
  });

  router.put('/:id', auth(true), async (req, res) => {
    const { id } = req.params;
    const payload = req.body;
    if (db.useMemory) {
      const d = memory.discounts.find(d => d._id === id);
      if (!d) return res.status(404).json({ error: 'Sconto non trovato' });
      Object.assign(d, payload);
      return res.json(d);
    }
    const d = await Discount.findByIdAndUpdate(id, payload, { new: true });
    res.json(d);
  });

  router.delete('/:id', auth(true), async (req, res) => {
    const { id } = req.params;
    if (db.useMemory) {
      memory.discounts = memory.discounts.filter(d => d._id !== id);
      return res.json({ ok: true });
    }
    await Discount.findByIdAndDelete(id);
    res.json({ ok: true });
  });

  return router;
}
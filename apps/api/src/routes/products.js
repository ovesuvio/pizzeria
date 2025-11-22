const express = require('express');
const Product = require('../models/product');
const auth = require('../middleware/auth');

module.exports = function(memory, db) {
  const router = express.Router();

  router.get('/', async (_req, res) => {
    if (db.useMemory) return res.json(memory.products);
    const prods = await Product.find();
    res.json(prods);
  });

  router.post('/', auth(true), async (req, res) => {
    const { name, description, price, categoryId, photoUrl, available, ingredients, extras } = req.body;
    if (db.useMemory) {
      const p = { _id: 'p_' + Date.now(), name, description, price, categoryId, photoUrl, available: available ?? true, ingredients: ingredients || [], extras: extras || [] };
      memory.products.push(p);
      return res.json(p);
    }
    const p = await Product.create({ name, description, price, categoryId, photoUrl, available, ingredients, extras });
    res.json(p);
  });

  router.put('/:id', auth(true), async (req, res) => {
    const { id } = req.params;
    const payload = req.body;
    if (db.useMemory) {
      const p = memory.products.find(p => p._id === id);
      if (!p) return res.status(404).json({ error: 'Prodotto non trovato' });
      Object.assign(p, payload);
      return res.json(p);
    }
    const p = await Product.findByIdAndUpdate(id, payload, { new: true });
    res.json(p);
  });

  router.delete('/:id', auth(true), async (req, res) => {
    const { id } = req.params;
    if (db.useMemory) {
      memory.products = memory.products.filter(p => p._id !== id);
      return res.json({ ok: true });
    }
    await Product.findByIdAndDelete(id);
    res.json({ ok: true });
  });

  return router;
}
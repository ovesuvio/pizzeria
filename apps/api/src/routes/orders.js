const express = require('express');
const Order = require('../models/order');
const auth = require('../middleware/auth');

module.exports = function(memory, db) {
  const router = express.Router();

  router.get('/', auth(true), async (_req, res) => {
    if (db.useMemory) return res.json(memory.orders);
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json(orders);
  });

  router.get('/me', auth(), async (req, res) => {
    const userId = req.user.userId;
    if (db.useMemory) return res.json(memory.orders.filter(o => o.userId === userId));
    const orders = await Order.find({ userId }).sort({ createdAt: -1 });
    res.json(orders);
  });

  router.post('/', auth(), async (req, res) => {
    const { items, total, mode, address, scheduledAt, paymentMethod, mock } = req.body;
    const userId = req.user.userId;
    const order = { _id: 'o_' + Date.now(), userId, items, total, mode, address, scheduledAt, paymentMethod, status: 'ricevuto', createdAt: new Date().toISOString() };
    if (db.useMemory) {
      memory.orders.unshift(order);
      // Mock pagamento ok
      if (!mock) {
        // TODO: integra Stripe/PayPal reali
      }
      req.io.emit('order_update', { orderId: order._id, status: order.status, userId });
      return res.json({ ok: true, orderId: order._id });
    }
    const created = await Order.create(order);
    req.io.emit('order_update', { orderId: created._id, status: created.status, userId: created.userId });
    res.json({ ok: true, orderId: created._id });
  });

  router.put('/:id/status', auth(true), async (req, res) => {
    const { id } = req.params;
    const { status } = req.body; // 'ricevuto' | 'preparazione' | 'consegna' | 'consegnato'
    if (db.useMemory) {
      const o = memory.orders.find(o => o._id === id);
      if (!o) return res.status(404).json({ error: 'Ordine non trovato' });
      o.status = status;
      req.io.emit('order_update', { orderId: id, status, userId: o.userId });
      return res.json(o);
    }
    const o = await Order.findByIdAndUpdate(id, { status }, { new: true });
    req.io.emit('order_update', { orderId: id, status, userId: o?.userId });
    res.json(o);
  });

  return router;
}
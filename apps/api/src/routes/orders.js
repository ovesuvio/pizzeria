const express = require('express');
const Order = require('../models/order');
const auth = require('../middleware/auth');
const { notifyOrderStatus } = require('../lib/notify');

module.exports = function(memory, db) {
  const router = express.Router();
  memory.settings = memory.settings || { orderingDisabled: false, orderingMessage: '' };

  router.get('/', auth(true), async (_req, res) => {
    if (db.useMemory) return res.json(memory.orders);
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json(orders);
  });

  router.get('/status', async (_req, res) => {
    res.json({ disabled: !!memory.settings.orderingDisabled, message: memory.settings.orderingMessage || '' });
  });

  router.put('/status', auth(true), async (req, res) => {
    const { disabled, message } = req.body || {};
    memory.settings.orderingDisabled = !!disabled;
    memory.settings.orderingMessage = typeof message === 'string' ? message : '';
    res.json({ ok: true, disabled: memory.settings.orderingDisabled, message: memory.settings.orderingMessage });
  });

  router.get('/me', auth(), async (req, res) => {
    const userId = req.user.userId;
    if (db.useMemory) return res.json(memory.orders.filter(o => o.userId === userId));
    const orders = await Order.find({ userId }).sort({ createdAt: -1 });
    res.json(orders);
  });

  router.post('/', auth(), async (req, res) => {
    if (memory.settings.orderingDisabled) {
      return res.status(503).json({ error: memory.settings.orderingMessage || 'Al momento non è possibile ordinare' });
    }
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
      notifyOrderStatus(memory, db, { userId, orderId: order._id, status: order.status });
      return res.json({ ok: true, orderId: order._id });
    }
    const created = await Order.create(order);
    req.io.emit('order_update', { orderId: created._id, status: created.status, userId: created.userId });
    notifyOrderStatus(memory, db, { userId: created.userId, orderId: created._id, status: created.status });
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
      notifyOrderStatus(memory, db, { userId: o.userId, orderId: id, status });
      return res.json(o);
    }
    const o = await Order.findByIdAndUpdate(id, { status }, { new: true });
    req.io.emit('order_update', { orderId: id, status, userId: o?.userId });
    if (o?.userId) notifyOrderStatus(memory, db, { userId: o.userId, orderId: id, status });
    res.json(o);
  });

  router.delete('/:id', auth(true), async (req, res) => {
    const { id } = req.params;
    if (db.useMemory) {
      const idx = memory.orders.findIndex((o) => o._id === id);
      if (idx === -1) return res.status(404).json({ error: 'Ordine non trovato' });
      const [removed] = memory.orders.splice(idx, 1);
      req.io.emit('order_update', { orderId: id, status: 'deleted', userId: removed?.userId });
      return res.json({ ok: true });
    }
    const removed = await Order.findByIdAndDelete(id);
    if (!removed) return res.status(404).json({ error: 'Ordine non trovato' });
    req.io.emit('order_update', { orderId: id, status: 'deleted', userId: removed?.userId });
    res.json({ ok: true });
  });

  return router;
}
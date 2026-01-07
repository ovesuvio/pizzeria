const express = require('express');
const Order = require('../models/order');
const auth = require('../middleware/auth');
const { notifyOrderStatus } = require('../lib/notify');

module.exports = function(memory, db) {
  const router = express.Router();
  memory.settings = memory.settings || { orderingDisabled: false, orderingMessage: '', orderingDisabledUntil: 0 };

  router.get('/', auth(true), async (_req, res) => {
    if (db.useMemory) return res.json(memory.orders);
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json(orders);
  });

  router.get('/status', async (_req, res) => {
    const until = Number(memory.settings.orderingDisabledUntil || 0);
    const now = Date.now();
    const disabled = !!memory.settings.orderingDisabled || (until && now < until);
    res.json({ disabled, message: memory.settings.orderingMessage || '', disabled_until: until || 0 });
  });

  router.put('/status', auth(true), async (req, res) => {
    const { disabled, message, duration } = req.body || {};
    const now = Date.now();
    memory.settings.orderingDisabled = !!disabled;
    memory.settings.orderingMessage = typeof message === 'string' ? message : '';
    const map = { '2h': 2 * 3600e3, '5h': 5 * 3600e3, '1d': 24 * 3600e3, '3d': 3 * 24 * 3600e3, '1w': 7 * 24 * 3600e3, '1m': 30 * 24 * 3600e3 };
    if (memory.settings.orderingDisabled && duration && map[duration]) {
      memory.settings.orderingDisabledUntil = now + map[duration];
    } else if (!memory.settings.orderingDisabled) {
      memory.settings.orderingDisabledUntil = 0;
    }
    res.json({ ok: true, disabled: !!memory.settings.orderingDisabled, message: memory.settings.orderingMessage, disabled_until: Number(memory.settings.orderingDisabledUntil || 0) });
  });

  router.get('/me', auth(), async (req, res) => {
    const userId = req.user.userId;
    if (db.useMemory) return res.json(memory.orders.filter(o => o.userId === userId));
    const orders = await Order.find({ userId }).sort({ createdAt: -1 });
    res.json(orders);
  });

  router.post('/', auth(), async (req, res) => {
    const until = Number(memory.settings.orderingDisabledUntil || 0);
    const now = Date.now();
    if (memory.settings.orderingDisabled || (until && now < until)) {
      return res.status(503).json({ error: memory.settings.orderingMessage || 'Al momento non è possibile ordinare' });
    }
    const { items, total, mode, address, scheduledAt, paymentMethod, mock, customer, lang } = req.body;
    const userId = req.user.userId;
    const order = { _id: 'o_' + Date.now(), userId, items, total, mode, address, scheduledAt, paymentMethod, status: 'ricevuto', createdAt: new Date().toISOString(), lang: typeof lang === 'string' ? lang : 'it' };
    if (customer && typeof customer === 'object') {
      order.customerFirstName = customer.firstName || '';
      order.customerLastName = customer.lastName || '';
      order.customerPhone = customer.phone || '';
      order.customerEmail = customer.email || '';
    }
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
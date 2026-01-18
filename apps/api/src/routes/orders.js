const express = require('express');
const net = require('net');
const Order = require('../models/order');
const Product = require('../models/product');
const auth = require('../middleware/auth');
const { notifyOrderStatus } = require('../lib/notify');

module.exports = function(memory, db) {
  const router = express.Router();
  memory.settings = memory.settings || { orderingDisabled: false, orderingMessage: '', orderingDisabledUntil: 0, printerMode: 'browser', printers: [] };

  function buildEscpos(text) {
    const init = Buffer.from([0x1b, 0x40]);
    const content = Buffer.from(String(text || '').replace(/\n/g, '\r\n') + '\r\n\r\n');
    const cut = Buffer.from([0x1d, 0x56, 0x00]);
    return Buffer.concat([init, content, cut]);
  }

  async function autoPrintOrder(order, products) {
    const mode = memory.settings.printerMode || 'browser';
    if (mode === 'browser') return;
    
    const printers = Array.isArray(memory.settings.printers) ? memory.settings.printers : [];
    if (!printers.length) return;

    const prodMap = Object.fromEntries((products || []).map((p) => [p._id, p]));
    const fmt = new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 2 });
    
    const payKeyMap = { stripe: 'Stripe', visa: 'Visa', paypal: 'PayPal', cash: 'Contanti' };
    const sched = order.scheduledAt ? ` ${order.scheduledAt}` : '';
    const modeLabel = order.mode === 'delivery' ? 'Consegna' : 'Ritiro';
    
    const linesText = [
      'O Vesuvio',
      'Via Roma 123, 80100 Napoli',
      `Ordine #${String(order._id).slice(-6)} • ${new Date(order.createdAt).toLocaleString()}`,
      `${modeLabel}${sched}`,
      order.address ? `Indirizzo: ${order.address}` : '',
      `Pagamento: ${payKeyMap[order.paymentMethod] || order.paymentMethod || '-'}`,
      '',
      'Articoli:',
      ...((Array.isArray(order.items) ? order.items : []).map((it) => {
        const p = prodMap[it.productId];
        const name = p?.name || it.productId;
        const extras = (Array.isArray(it.extras) ? it.extras : []).map((e) => `${e.name} +${fmt.format(Number(e.price || 0))}`).join(', ');
        return `${name} × ${it.quantity}${extras ? ` (${extras})` : ''}`;
      })),
      '',
      `Totale: ${fmt.format(Number(order.total || 0))}`,
      'Grazie per aver ordinato!',
    ].filter(Boolean).join('\n');

    const payload = buildEscpos(linesText);
    const results = [];
    for (const p of printers) {
      const host = p.host || 'localhost';
      const port = Number(p.port || 9100);
      const name = p.name || '';
      try {
        await new Promise((resolve) => {
          const socket = net.createConnection({ host, port }, () => {
            try { socket.write(payload); } catch (_) {}
            try { socket.end(); } catch (_) {}
          });
          const done = () => resolve();
          socket.on('error', done);
          socket.on('end', done);
          socket.on('close', done);
        });
        results.push({ name, host, port, ok: true });
      } catch (e) {
        results.push({ name, host, port, ok: false, error: e?.message });
      }
    }
    return results;
  }

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

  router.get('/print-config', auth(true), async (_req, res) => {
    res.json({ mode: memory.settings.printerMode || 'browser', printers: Array.isArray(memory.settings.printers) ? memory.settings.printers : [] });
  });

  router.put('/print-config', auth(true), async (req, res) => {
    const { mode, printers } = req.body || {};
    const m = typeof mode === 'string' && (mode === 'browser' || mode === 'network') ? mode : (memory.settings.printerMode || 'browser');
    memory.settings.printerMode = m;
    memory.settings.printers = Array.isArray(printers) ? printers.filter((p) => p && typeof p === 'object') : (memory.settings.printers || []);
    res.json({ ok: true, mode: memory.settings.printerMode, printers: memory.settings.printers });
  });

  router.post('/print', auth(true), async (req, res) => {
    const { order, receipt } = req.body || {};
    const mode = memory.settings.printerMode || 'browser';
    if (!order || !order._id) return res.status(400).json({ error: 'Ordine mancante' });
    if (mode === 'browser') {
      return res.json({ ok: true, handledBy: 'browser' });
    }
    const printers = Array.isArray(memory.settings.printers) ? memory.settings.printers : [];
    if (!printers.length) return res.status(400).json({ error: 'Nessuna stampante di rete configurata' });

    function buildEscpos(text) {
      const init = Buffer.from([0x1b, 0x40]);
      const content = Buffer.from(String(text || '').replace(/\n/g, '\r\n') + '\r\n\r\n');
      const cut = Buffer.from([0x1d, 0x56, 0x00]);
      return Buffer.concat([init, content, cut]);
    }

    const payload = buildEscpos(receipt || (`Ordine #${String(order._id).slice(-6)}\r\n`));
    const results = [];
    for (const p of printers) {
      const host = p.host || 'localhost';
      const port = Number(p.port || 9100);
      const name = p.name || '';
      try {
        await new Promise((resolve) => {
          const socket = net.createConnection({ host, port }, () => {
            try { socket.write(payload); } catch (_) {}
            try { socket.end(); } catch (_) {}
          });
          const done = () => resolve();
          socket.on('error', done);
          socket.on('end', done);
          socket.on('close', done);
        });
        results.push({ name, host, port, ok: true });
      } catch (e) {
        results.push({ name, host, port, ok: false, error: e?.message });
      }
    }
    res.json({ ok: true, handledBy: 'network', results });
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
    
    let createdOrder;
    if (db.useMemory) {
      memory.orders.unshift(order);
      // Mock pagamento ok
      if (!mock) {
        // TODO: integra Stripe/PayPal reali
      }
      createdOrder = order;
    } else {
      createdOrder = await Order.create(order);
    }
    
    // Emit immediato per notifica realtime
    req.io.emit('order_update', { orderId: createdOrder._id, status: createdOrder.status, userId: createdOrder.userId });
    notifyOrderStatus(memory, db, { userId: createdOrder.userId, orderId: createdOrder._id, status: createdOrder.status });
    
    // Stampa automatica se configurata per rete
    if (memory.settings.printerMode === 'network' && memory.settings.printers && memory.settings.printers.length > 0) {
      try {
        let products = [];
        if (!db.useMemory) {
          const productIds = (createdOrder.items || []).map(item => item.productId).filter(Boolean);
          if (productIds.length > 0) {
            products = await Product.find({ _id: { $in: productIds } });
          }
        } else {
          products = memory.products || [];
        }
        autoPrintOrder(createdOrder, products).catch(() => {});
      } catch (_) {}
    }
    
    res.json({ ok: true, orderId: createdOrder._id });
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
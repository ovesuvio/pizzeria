const https = require('https');
const http = require('http');
const { URL } = require('url');
const User = require('../models/user');
const Order = require('../models/order');

async function getUserEmail(memory, db, userId) {
  if (db.useMemory) {
    const u = (memory.users || []).find((x) => x._id === userId);
    return u?.email || null;
  }
  try {
    const u = await User.findById(userId);
    return u?.email || null;
  } catch (_) {
    return null;
  }
}

async function getRecipientEmail(memory, db, userId, orderId) {
  if (db.useMemory) {
    const o = (memory.orders || []).find((x) => x._id === orderId);
    if (o?.customerEmail) return o.customerEmail;
    if (userId) {
      const u = (memory.users || []).find((x) => x._id === userId);
      return u?.email || null;
    }
    return null;
  }
  try {
    const o = await Order.findById(orderId);
    if (o?.customerEmail) return o.customerEmail;
  } catch (_) {}
  if (userId) return await getUserEmail(memory, db, userId);
  return null;
}

function sendWebhook(urlStr, payload) {
  return new Promise((resolve, reject) => {
    try {
      const u = new URL(urlStr);
      const data = Buffer.from(JSON.stringify(payload));
      const opts = {
        method: 'POST',
        hostname: u.hostname,
        port: u.port || (u.protocol === 'https:' ? 443 : 80),
        path: u.pathname + (u.search || ''),
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': data.length,
        },
      };
      const client = u.protocol === 'https:' ? https : http;
      const req = client.request(opts, (res) => {
        res.on('data', () => {});
        res.on('end', () => resolve());
      });
      req.on('error', reject);
      req.write(data);
      req.end();
    } catch (e) {
      reject(e);
    }
  });
}

const statusLabels = {
  ricevuto: 'Ordine ricevuto',
  preparazione: 'Ordine in preparazione',
  consegna: 'Ordine in consegna',
  consegnato: 'Ordine consegnato',
};

async function notifyOrderStatus(memory, db, { userId, orderId, status }) {
  const webhook = process.env.MAIL_WEBHOOK_URL;
  const from = process.env.MAIL_FROM || 'no-reply@ovesuvio.com';
  if (!webhook) return;
  const email = await getRecipientEmail(memory, db, userId, orderId);
  if (!email) return;
  const label = statusLabels[status] || `Stato aggiornato: ${status}`;
  const subject = `Aggiornamento ordine #${String(orderId).slice(-6)}`;
  const text = `${label}\nNumero ordine: ${orderId}\nGrazie per aver ordinato da O Vesuvio.`;
  const payload = { to: email, from, subject, text };
  try { await sendWebhook(webhook, payload); } catch (_) {}
}

module.exports = { notifyOrderStatus };
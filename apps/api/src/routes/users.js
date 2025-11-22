const express = require('express');
const auth = require('../middleware/auth');
const bcrypt = require('bcryptjs');
const User = require('../models/user');

module.exports = function(memory, db) {
  const router = express.Router();

  // List all users (admin only)
  router.get('/', auth(true), async (_req, res) => {
    if (db.useMemory) {
      const safe = memory.users.map(({ passwordHash, ...rest }) => rest);
      return res.json(safe);
    }
    try {
      const users = await User.find({}, '-passwordHash');
      return res.json(users);
    } catch (e) {
      return res.status(400).json({ error: e.message });
    }
  });

  // Get current user's profile
  router.get('/me', auth(), async (req, res) => {
    const userId = req.user.userId;
    if (db.useMemory) {
      const u = memory.users.find(u => u._id === userId);
      if (!u) return res.status(404).json({ error: 'Utente non trovato' });
      const { firstName, lastName, email, phone, address, isAdmin } = u;
      return res.json({ _id: userId, firstName, lastName, email, phone, address, isAdmin });
    }
    try {
      const u = await User.findById(userId);
      if (!u) return res.status(404).json({ error: 'Utente non trovato' });
      const { firstName, lastName, email, phone, address, isAdmin } = u;
      return res.json({ _id: userId, firstName, lastName, email, phone, address, isAdmin });
    } catch (e) {
      return res.status(400).json({ error: e.message });
    }
  });

  // Update current user's profile (excluding email/password)
  router.put('/me', auth(), async (req, res) => {
    const userId = req.user.userId;
    const { firstName, lastName, phone, address } = req.body;
    const payload = { firstName, lastName, phone, address };
    if (db.useMemory) {
      const idx = memory.users.findIndex(u => u._id === userId);
      if (idx < 0) return res.status(404).json({ error: 'Utente non trovato' });
      memory.users[idx] = { ...memory.users[idx], ...payload };
      const { email, isAdmin } = memory.users[idx];
      return res.json({ _id: userId, ...payload, email, isAdmin });
    }
    try {
      const u = await User.findByIdAndUpdate(userId, payload, { new: true });
      if (!u) return res.status(404).json({ error: 'Utente non trovato' });
      const { email, isAdmin } = u;
      return res.json({ _id: userId, firstName: u.firstName, lastName: u.lastName, phone: u.phone, address: u.address, email, isAdmin });
    } catch (e) {
      return res.status(400).json({ error: e.message });
    }
  });

  // Change email (requires auth). Returns a new token.
  router.put('/me/email', auth(), async (req, res) => {
    const userId = req.user.userId;
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email richiesta' });
    if (db.useMemory) {
      if (memory.users.find(u => u.email === email && u._id !== userId)) {
        return res.status(409).json({ error: 'Email già in uso' });
      }
      const idx = memory.users.findIndex(u => u._id === userId);
      if (idx < 0) return res.status(404).json({ error: 'Utente non trovato' });
      memory.users[idx].email = email;
      const token = require('jsonwebtoken').sign({ userId, email, isAdmin: memory.users[idx].isAdmin }, process.env.JWT_SECRET || 'devsecret', { expiresIn: '7d' });
      return res.json({ ok: true, token, email });
    }
    try {
      const exist = await User.findOne({ email });
      if (exist && String(exist._id) !== String(userId)) return res.status(409).json({ error: 'Email già in uso' });
      const u = await User.findByIdAndUpdate(userId, { email }, { new: true });
      if (!u) return res.status(404).json({ error: 'Utente non trovato' });
      const token = require('jsonwebtoken').sign({ userId, email: u.email, isAdmin: u.isAdmin }, process.env.JWT_SECRET || 'devsecret', { expiresIn: '7d' });
      return res.json({ ok: true, token, email: u.email });
    } catch (e) {
      return res.status(400).json({ error: e.message });
    }
  });

  // Change password (requires current password)
  router.put('/me/password', auth(), async (req, res) => {
    const userId = req.user.userId;
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) return res.status(400).json({ error: 'Password corrente e nuova richieste' });
    if (db.useMemory) {
      const u = memory.users.find(u => u._id === userId);
      if (!u) return res.status(404).json({ error: 'Utente non trovato' });
      const ok = await bcrypt.compare(currentPassword, u.passwordHash);
      if (!ok) return res.status(401).json({ error: 'Password corrente errata' });
      u.passwordHash = await bcrypt.hash(newPassword, 10);
      return res.json({ ok: true });
    }
    try {
      const u = await User.findById(userId);
      if (!u) return res.status(404).json({ error: 'Utente non trovato' });
      const ok = await bcrypt.compare(currentPassword, u.passwordHash);
      if (!ok) return res.status(401).json({ error: 'Password corrente errata' });
      u.passwordHash = await bcrypt.hash(newPassword, 10);
      await u.save();
      return res.json({ ok: true });
    } catch (e) {
      return res.status(400).json({ error: e.message });
    }
  });

  return router;
}
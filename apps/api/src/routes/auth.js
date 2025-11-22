const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const bcrypt = require('bcryptjs');

module.exports = function(memory, db) {
  const router = express.Router();

  router.post('/register', async (req, res) => {
    const { firstName, lastName, email, phone, address, password } = req.body;
    if (!firstName || !lastName || !phone || !address) {
      return res.status(400).json({ error: 'Nome, cognome, telefono e indirizzo sono obbligatori' });
    }
    if (!email || !password) return res.status(400).json({ error: 'Email e password richieste' });
    const hash = await bcrypt.hash(password, 10);
    if (db.useMemory) {
      if (memory.users.find(u => u.email === email)) return res.status(409).json({ error: 'Utente esistente' });
      const user = { _id: 'u_' + Date.now(), firstName, lastName, email, phone, address, passwordHash: hash, isAdmin: false };
      memory.users.push(user);
      return res.json({ ok: true });
    } else {
      try {
        await User.create({ firstName, lastName, email, phone, address, passwordHash: hash });
        return res.json({ ok: true });
      } catch (e) {
        return res.status(400).json({ error: e.message });
      }
    }
  });

  router.post('/login', async (req, res) => {
    const { email, phone, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Credenziali mancanti' });
    let user;
    if (db.useMemory) {
      user = memory.users.find(u => u.email === email);
    } else {
      user = await User.findOne({ email });
    }
    if (!user) return res.status(404).json({ error: 'Utente non trovato' });
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: 'Password errata' });
    const token = jwt.sign({ userId: user._id, email: user.email, isAdmin: user.isAdmin }, process.env.JWT_SECRET || 'devsecret', { expiresIn: '7d' });
    return res.json({ token });
  });

  // Request password reset: generate short-lived token and log preview link
  router.post('/request-reset', async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email richiesta' });
    let user;
    if (db.useMemory) {
      user = memory.users.find(u => u.email === email);
    } else {
      user = await User.findOne({ email });
    }
    if (!user) return res.status(200).json({ ok: true }); // Non rivelare esistenza
    const token = jwt.sign({ userId: user._id, purpose: 'reset' }, process.env.JWT_SECRET || 'devsecret', { expiresIn: '15m' });
    const frontendBase = process.env.FRONTEND_BASE || 'http://localhost:3000';
    const previewResetUrl = `${frontendBase}/reset?token=${token}`;
    console.log('Password reset URL (dev):', previewResetUrl);
    return res.json({ ok: true, previewResetUrl: process.env.NODE_ENV !== 'production' ? previewResetUrl : undefined });
  });

  // Perform password reset
  router.post('/reset', async (req, res) => {
    const { token, password } = req.body;
    if (!token || !password) return res.status(400).json({ error: 'Token e nuova password richiesti' });
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET || 'devsecret');
      if (payload.purpose !== 'reset') return res.status(400).json({ error: 'Token non valido' });
      const hash = await bcrypt.hash(password, 10);
      if (db.useMemory) {
        const idx = memory.users.findIndex(u => u._id === payload.userId);
        if (idx < 0) return res.status(404).json({ error: 'Utente non trovato' });
        memory.users[idx].passwordHash = hash;
      } else {
        const u = await User.findByIdAndUpdate(payload.userId, { passwordHash: hash });
        if (!u) return res.status(404).json({ error: 'Utente non trovato' });
      }
      return res.json({ ok: true });
    } catch (e) {
      return res.status(400).json({ error: 'Token invalido o scaduto' });
    }
  });

  return router;
}
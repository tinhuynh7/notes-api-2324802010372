const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const router = express.Router();

function credentials(body) {
  const { email, password } = body ?? {};
  if (typeof email !== 'string' || typeof password !== 'string') return null;
  const normalized = email.trim().toLowerCase();
  if (!/^\S+@\S+\.\S+$/.test(normalized) || password.length < 8 || Buffer.byteLength(password) > 72) return null;
  return { email: normalized, password };
}

router.post('/register', async (req, res, next) => {
  const cred = credentials(req.body);
  if (!cred) return res.status(400).json({ error: 'Email hoặc mật khẩu không hợp lệ' });
  try {
    const passwordHash = await bcrypt.hash(cred.password, 10);
    const user = await User.create({ email: cred.email, passwordHash });
    res.status(201).json({ id: user.id, email: user.email });
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ error: 'Email đã được đăng ký' });
    next(err);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const cred = credentials(req.body);
    const user = cred && await User.findOne({ email: cred.email });
    if (!user || !await bcrypt.compare(cred.password, user.passwordHash)) {
      return res.status(401).json({ error: 'Sai email hoặc mật khẩu' });
    }
    res.json({ token: jwt.sign({ sub: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '1h' }) });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

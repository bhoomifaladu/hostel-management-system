const router = require('express').Router();
const bcrypt = require('bcryptjs');
const db = require('../config/db');
const { sign, requireAuth } = require('../middleware/auth');
const { wrap, HttpError, required } = require('../utils/http');

// POST /api/auth/login  { email, password }
router.post('/login', wrap(async (req, res) => {
  required(req.body, ['email', 'password']);
  const [[user]] = await db.query('SELECT * FROM users WHERE email=?', [req.body.email.trim().toLowerCase()]);
  if (!user || !(await bcrypt.compare(req.body.password, user.password_hash))) throw new HttpError(401, 'Invalid email or password');
  res.json({ token: sign(user), user: { id: user.id, name: user.name, email: user.email, role: user.role } });
}));

// GET /api/auth/me
router.get('/me', requireAuth, (req, res) => res.json({ user: req.user }));

// POST /api/auth/change-password  { currentPassword, newPassword }
router.post('/change-password', requireAuth, wrap(async (req, res) => {
  required(req.body, ['currentPassword', 'newPassword']);
  if (req.body.newPassword.length < 6) throw new HttpError(400, 'New password must be at least 6 characters');
  const [[user]] = await db.query('SELECT * FROM users WHERE id=?', [req.user.id]);
  if (!user || !(await bcrypt.compare(req.body.currentPassword, user.password_hash))) throw new HttpError(400, 'Current password is incorrect');
  await db.query('UPDATE users SET password_hash=? WHERE id=?', [await bcrypt.hash(req.body.newPassword, 10), user.id]);
  res.json({ message: 'Password updated' });
}));

module.exports = router;

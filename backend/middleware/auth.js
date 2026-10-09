const jwt = require('jsonwebtoken');
const secret = () => process.env.JWT_SECRET || 'dev-secret-change-me';

const sign = user => jwt.sign({ id: user.id, name: user.name, email: user.email, role: user.role }, secret(), { expiresIn: '8h' });

function requireAuth(req, res, next) {
  const token = (req.headers.authorization || '').replace(/^Bearer /, '');
  if (!token) return res.status(401).json({ message: 'Please log in' });
  try { req.user = jwt.verify(token, secret()); next(); }
  catch { res.status(401).json({ message: 'Session expired. Please log in again' }); }
}

const requireRole = (...roles) => (req, res, next) =>
  roles.includes(req.user?.role) ? next() : res.status(403).json({ message: 'You do not have permission for this action' });

module.exports = { sign, requireAuth, requireRole };

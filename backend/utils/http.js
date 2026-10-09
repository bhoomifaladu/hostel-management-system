// Wrap async handlers so thrown errors reach the error middleware.
const wrap = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

const required = (body, fields) => {
  const missing = fields.filter(f => body[f] === undefined || body[f] === null || String(body[f]).trim() === '');
  if (missing.length) throw new HttpError(400, `Required: ${missing.join(', ')}`);
};

const oneOf = (value, allowed, name) => {
  if (!allowed.includes(value)) throw new HttpError(400, `${name} must be one of: ${allowed.join(', ')}`);
};

const clean = v => (v === undefined || v === null || String(v).trim() === '' ? null : String(v).trim());

module.exports = { wrap, HttpError, required, oneOf, clean };

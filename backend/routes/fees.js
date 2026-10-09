const router = require('express').Router();
const db = require('../config/db');
const { wrap, HttpError, required } = require('../utils/http');

const SELECT = `SELECT f.id,f.student_id AS studentId,s.full_name AS studentName,s.course,f.amount,f.paid_amount AS paidAmount,
 f.amount-f.paid_amount AS balance,f.due_date AS dueDate,f.status FROM fees f JOIN students s ON s.id=f.student_id`;

const statusFor = (amount, paid) => (paid >= amount ? 'Paid' : paid > 0 ? 'Partial' : 'Pending');

// GET /api/fees?status=&studentId=
router.get('/', wrap(async (req, res) => {
  const where = [], params = [];
  if (req.query.status) { where.push('f.status=?'); params.push(req.query.status); }
  if (req.query.studentId) { where.push('f.student_id=?'); params.push(req.query.studentId); }
  const [rows] = await db.query(`${SELECT}${where.length ? ' WHERE ' + where.join(' AND ') : ''} ORDER BY f.id DESC`, params);
  res.json(rows);
}));

// POST /api/fees  { studentId, amount, dueDate, paidAmount? }
router.post('/', wrap(async (req, res) => {
  required(req.body, ['studentId', 'amount']);
  const amount = Number(req.body.amount), paid = Number(req.body.paidAmount || 0);
  if (!(amount > 0) || paid < 0 || paid > amount) throw new HttpError(400, 'Enter a valid amount; paid amount cannot exceed the total');
  const [[st]] = await db.query('SELECT id FROM students WHERE id=?', [req.body.studentId]);
  if (!st) throw new HttpError(400, 'Student not found');
  const [r] = await db.query('INSERT INTO fees(student_id,amount,paid_amount,due_date,status) VALUES(?,?,?,?,?)',
    [req.body.studentId, amount, paid, req.body.dueDate || null, statusFor(amount, paid)]);
  const [rows] = await db.query(`${SELECT} WHERE f.id=?`, [r.insertId]);
  res.status(201).json(rows[0]);
}));

// POST /api/fees/:id/payments  { amount }  -> records a payment (no payment gateway)
router.post('/:id/payments', wrap(async (req, res) => {
  const pay = Number(req.body.amount);
  if (!(pay > 0)) throw new HttpError(400, 'Payment amount must be greater than 0');
  const [[fee]] = await db.query('SELECT amount,paid_amount FROM fees WHERE id=?', [req.params.id]);
  if (!fee) throw new HttpError(404, 'Fee record not found');
  const paid = Number(fee.paid_amount) + pay;
  if (paid > Number(fee.amount)) throw new HttpError(400, 'Payment exceeds the outstanding balance');
  await db.query('UPDATE fees SET paid_amount=?,status=? WHERE id=?', [paid, statusFor(Number(fee.amount), paid), req.params.id]);
  const [rows] = await db.query(`${SELECT} WHERE f.id=?`, [req.params.id]);
  res.json(rows[0]);
}));

// PUT /api/fees/:id  { amount, dueDate }
router.put('/:id', wrap(async (req, res) => {
  required(req.body, ['amount']);
  const amount = Number(req.body.amount);
  const [[fee]] = await db.query('SELECT paid_amount FROM fees WHERE id=?', [req.params.id]);
  if (!fee) throw new HttpError(404, 'Fee record not found');
  if (!(amount >= Number(fee.paid_amount)) || amount <= 0) throw new HttpError(400, 'Amount cannot be less than what is already paid');
  await db.query('UPDATE fees SET amount=?,due_date=?,status=? WHERE id=?', [amount, req.body.dueDate || null, statusFor(amount, Number(fee.paid_amount)), req.params.id]);
  const [rows] = await db.query(`${SELECT} WHERE f.id=?`, [req.params.id]);
  res.json(rows[0]);
}));

// DELETE /api/fees/:id
router.delete('/:id', wrap(async (req, res) => {
  const [r] = await db.query('DELETE FROM fees WHERE id=?', [req.params.id]);
  if (!r.affectedRows) throw new HttpError(404, 'Fee record not found');
  res.json({ message: 'Fee record deleted' });
}));

module.exports = router;

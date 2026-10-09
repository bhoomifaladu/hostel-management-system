const router = require('express').Router();
const db = require('../config/db');
const { wrap, HttpError, required, clean } = require('../utils/http');

const SELECT = `SELECT v.id,v.student_id AS studentId,s.full_name AS studentName,v.visitor_name AS visitorName,v.relation,v.phone,
 v.purpose,v.check_in AS checkIn,v.check_out AS checkOut FROM visitors v JOIN students s ON s.id=v.student_id`;

// GET /api/visitors?inside=true
router.get('/', wrap(async (req, res) => {
  const sql = SELECT + (req.query.inside === 'true' ? ' WHERE v.check_out IS NULL' : '') + ' ORDER BY v.id DESC';
  const [rows] = await db.query(sql);
  res.json(rows);
}));

// POST /api/visitors  (check-in)
router.post('/', wrap(async (req, res) => {
  required(req.body, ['studentId', 'visitorName']);
  const [[st]] = await db.query('SELECT id FROM students WHERE id=?', [req.body.studentId]);
  if (!st) throw new HttpError(400, 'Student not found');
  const [r] = await db.query('INSERT INTO visitors(student_id,visitor_name,relation,phone,purpose) VALUES(?,?,?,?,?)',
    [req.body.studentId, req.body.visitorName.trim(), clean(req.body.relation), clean(req.body.phone), clean(req.body.purpose)]);
  const [rows] = await db.query(`${SELECT} WHERE v.id=?`, [r.insertId]);
  res.status(201).json(rows[0]);
}));

// PATCH /api/visitors/:id/checkout
router.patch('/:id/checkout', wrap(async (req, res) => {
  const [r] = await db.query('UPDATE visitors SET check_out=NOW() WHERE id=? AND check_out IS NULL', [req.params.id]);
  if (!r.affectedRows) throw new HttpError(404, 'Visitor not found or already checked out');
  const [rows] = await db.query(`${SELECT} WHERE v.id=?`, [req.params.id]);
  res.json(rows[0]);
}));

// DELETE /api/visitors/:id
router.delete('/:id', wrap(async (req, res) => {
  const [r] = await db.query('DELETE FROM visitors WHERE id=?', [req.params.id]);
  if (!r.affectedRows) throw new HttpError(404, 'Visitor not found');
  res.json({ message: 'Visitor record deleted' });
}));

module.exports = router;

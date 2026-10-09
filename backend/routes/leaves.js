const router = require('express').Router();
const db = require('../config/db');
const { wrap, HttpError, required, oneOf } = require('../utils/http');

const SELECT = `SELECT l.id,l.student_id AS studentId,s.full_name AS studentName,l.from_date AS fromDate,l.to_date AS toDate,
 l.reason,l.status,l.created_at AS createdAt FROM leave_requests l JOIN students s ON s.id=l.student_id`;

// GET /api/leaves?status=
router.get('/', wrap(async (req, res) => {
  const params = [];
  let sql = SELECT;
  if (req.query.status) { sql += ' WHERE l.status=?'; params.push(req.query.status); }
  const [rows] = await db.query(sql + ' ORDER BY l.id DESC', params);
  res.json(rows);
}));

// POST /api/leaves  { studentId, fromDate, toDate, reason }
router.post('/', wrap(async (req, res) => {
  required(req.body, ['studentId', 'fromDate', 'toDate', 'reason']);
  if (req.body.toDate < req.body.fromDate) throw new HttpError(400, 'End date cannot be before start date');
  const [[st]] = await db.query('SELECT id FROM students WHERE id=?', [req.body.studentId]);
  if (!st) throw new HttpError(400, 'Student not found');
  const [r] = await db.query('INSERT INTO leave_requests(student_id,from_date,to_date,reason) VALUES(?,?,?,?)',
    [req.body.studentId, req.body.fromDate, req.body.toDate, req.body.reason.trim()]);
  const [rows] = await db.query(`${SELECT} WHERE l.id=?`, [r.insertId]);
  res.status(201).json(rows[0]);
}));

// PATCH /api/leaves/:id  { status: Approved | Rejected | Pending }
router.patch('/:id', wrap(async (req, res) => {
  oneOf(req.body.status, ['Pending', 'Approved', 'Rejected'], 'status');
  const [r] = await db.query('UPDATE leave_requests SET status=? WHERE id=?', [req.body.status, req.params.id]);
  if (!r.affectedRows) throw new HttpError(404, 'Leave request not found');
  const [rows] = await db.query(`${SELECT} WHERE l.id=?`, [req.params.id]);
  res.json(rows[0]);
}));

// DELETE /api/leaves/:id
router.delete('/:id', wrap(async (req, res) => {
  const [r] = await db.query('DELETE FROM leave_requests WHERE id=?', [req.params.id]);
  if (!r.affectedRows) throw new HttpError(404, 'Leave request not found');
  res.json({ message: 'Leave request deleted' });
}));

module.exports = router;

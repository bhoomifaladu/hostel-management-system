const router = require('express').Router();
const db = require('../config/db');
const { wrap, HttpError, required, oneOf, clean } = require('../utils/http');

const STATUSES = ['Open', 'In Progress', 'Resolved'];
const SELECT = `SELECT c.id,c.student_id AS studentId,s.full_name AS studentName,c.title,c.description,c.status,c.created_at AS createdAt
 FROM complaints c LEFT JOIN students s ON s.id=c.student_id`;

// GET /api/complaints?status=
router.get('/', wrap(async (req, res) => {
  const params = [];
  let sql = SELECT;
  if (req.query.status) { sql += ' WHERE c.status=?'; params.push(req.query.status); }
  const [rows] = await db.query(sql + ' ORDER BY c.id DESC', params);
  res.json(rows);
}));

// POST /api/complaints  { studentId?, title, description? }
router.post('/', wrap(async (req, res) => {
  required(req.body, ['title']);
  const [r] = await db.query('INSERT INTO complaints(student_id,title,description) VALUES(?,?,?)',
    [req.body.studentId || null, req.body.title.trim(), clean(req.body.description)]);
  const [rows] = await db.query(`${SELECT} WHERE c.id=?`, [r.insertId]);
  res.status(201).json(rows[0]);
}));

// PATCH /api/complaints/:id  { status }
router.patch('/:id', wrap(async (req, res) => {
  oneOf(req.body.status, STATUSES, 'status');
  const [r] = await db.query('UPDATE complaints SET status=? WHERE id=?', [req.body.status, req.params.id]);
  if (!r.affectedRows) throw new HttpError(404, 'Complaint not found');
  const [rows] = await db.query(`${SELECT} WHERE c.id=?`, [req.params.id]);
  res.json(rows[0]);
}));

// DELETE /api/complaints/:id
router.delete('/:id', wrap(async (req, res) => {
  const [r] = await db.query('DELETE FROM complaints WHERE id=?', [req.params.id]);
  if (!r.affectedRows) throw new HttpError(404, 'Complaint not found');
  res.json({ message: 'Complaint deleted' });
}));

module.exports = router;

const router = require('express').Router();
const db = require('../config/db');
const { wrap, HttpError, required, oneOf } = require('../utils/http');

const STATUSES = ['Present', 'Absent', 'On Leave'];
const isDate = d => /^\d{4}-\d{2}-\d{2}$/.test(d || '');

// GET /api/attendance?date=YYYY-MM-DD  -> every active student with that day's status (null if not marked)
router.get('/', wrap(async (req, res) => {
  const date = req.query.date || new Date().toISOString().slice(0, 10);
  if (!isDate(date)) throw new HttpError(400, 'date must be YYYY-MM-DD');
  const [rows] = await db.query(
    `SELECT s.id AS studentId,s.full_name AS studentName,s.room_no AS roomNo,a.status
     FROM students s LEFT JOIN attendance a ON a.student_id=s.id AND a.attendance_date=?
     WHERE s.status='Active' ORDER BY s.full_name`, [date]);
  res.json(rows);
}));

// POST /api/attendance  { date, records: [{ studentId, status }] }  (upsert)
router.post('/', wrap(async (req, res) => {
  required(req.body, ['date']);
  if (!isDate(req.body.date)) throw new HttpError(400, 'date must be YYYY-MM-DD');
  const records = req.body.records;
  if (!Array.isArray(records) || !records.length) throw new HttpError(400, 'records must be a non-empty array');
  records.forEach(r => oneOf(r.status, STATUSES, 'status'));
  const values = records.map(r => [r.studentId, req.body.date, r.status]);
  await db.query('INSERT INTO attendance(student_id,attendance_date,status) VALUES ? ON DUPLICATE KEY UPDATE status=VALUES(status)', [values]);
  res.json({ message: `Attendance saved for ${records.length} students` });
}));

// GET /api/attendance/summary?month=YYYY-MM  -> per-student counts for the month
router.get('/summary', wrap(async (req, res) => {
  const month = req.query.month || new Date().toISOString().slice(0, 7);
  if (!/^\d{4}-\d{2}$/.test(month)) throw new HttpError(400, 'month must be YYYY-MM');
  const [rows] = await db.query(
    `SELECT s.id AS studentId,s.full_name AS studentName,
      SUM(a.status='Present') AS present,SUM(a.status='Absent') AS absent,SUM(a.status='On Leave') AS onLeave
     FROM students s LEFT JOIN attendance a ON a.student_id=s.id AND DATE_FORMAT(a.attendance_date,'%Y-%m')=?
     WHERE s.status='Active' GROUP BY s.id,s.full_name ORDER BY s.full_name`, [month]);
  res.json(rows.map(r => ({ ...r, present: Number(r.present || 0), absent: Number(r.absent || 0), onLeave: Number(r.onLeave || 0) })));
}));

module.exports = router;

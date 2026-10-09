const router = require('express').Router();
const db = require('../config/db');
const { wrap } = require('../utils/http');

// GET /api/reports/summary  -> numbers for the Reports page
router.get('/summary', wrap(async (req, res) => {
  const [[occ]] = await db.query('SELECT COALESCE(SUM(capacity),0) beds, COALESCE(SUM(occupied),0) occupied FROM rooms');
  const [[fee]] = await db.query('SELECT COALESCE(SUM(amount),0) billed, COALESCE(SUM(paid_amount),0) collected FROM fees');
  const [feeByStatus] = await db.query('SELECT status, COUNT(*) count FROM fees GROUP BY status');
  const [complaints] = await db.query('SELECT status, COUNT(*) count FROM complaints GROUP BY status');
  const [leaves] = await db.query('SELECT status, COUNT(*) count FROM leave_requests GROUP BY status');
  const [courses] = await db.query("SELECT course, COUNT(*) count FROM students WHERE status='Active' GROUP BY course ORDER BY count DESC");
  const [attendance] = await db.query(
    `SELECT attendance_date AS date, SUM(status='Present') present, SUM(status='Absent') absent, SUM(status='On Leave') onLeave
     FROM attendance WHERE attendance_date >= DATE_SUB(CURDATE(), INTERVAL 6 DAY) GROUP BY attendance_date ORDER BY attendance_date`);
  const num = rows => rows.map(r => ({ ...r, count: Number(r.count) }));
  res.json({
    occupancy: { beds: Number(occ.beds), occupied: Number(occ.occupied) },
    fees: { billed: Number(fee.billed), collected: Number(fee.collected), outstanding: Number(fee.billed) - Number(fee.collected), byStatus: num(feeByStatus) },
    complaints: num(complaints), leaves: num(leaves), courses: num(courses),
    attendance: attendance.map(a => ({ date: a.date, present: Number(a.present), absent: Number(a.absent), onLeave: Number(a.onLeave) }))
  });
}));

// GET /api/reports/fees.csv  -> downloadable fee report
router.get('/fees.csv', wrap(async (req, res) => {
  const [rows] = await db.query(`SELECT s.full_name,s.course,f.amount,f.paid_amount,f.amount-f.paid_amount AS balance,f.due_date,f.status
    FROM fees f JOIN students s ON s.id=f.student_id ORDER BY f.id`);
  const esc = v => { let s = v instanceof Date ? v.toISOString().slice(0, 10) : String(v ?? ''); if (/^[=+\-@]/.test(s)) s = "'" + s; return `"${s.replace(/"/g, '""')}"`; };
  const csv = ['Student,Course,Amount,Paid,Balance,Due date,Status', ...rows.map(r => Object.values(r).map(esc).join(','))].join('\n');
  res.set({ 'Content-Type': 'text/csv', 'Content-Disposition': 'attachment; filename="fee-report.csv"' }).send(csv);
}));

module.exports = router;

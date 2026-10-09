const router = require('express').Router();
const db = require('../config/db');
const { wrap } = require('../utils/http');

// GET /api/dashboard
router.get('/', wrap(async (req, res) => {
  const [[s]] = await db.query("SELECT COUNT(*) total FROM students WHERE status='Active'");
  const [[r]] = await db.query('SELECT COUNT(*) totalRooms, COALESCE(SUM(capacity),0) totalBeds, COALESCE(SUM(occupied),0) occupiedBeds FROM rooms');
  const [[st]] = await db.query("SELECT COUNT(*) total FROM staff WHERE status='Active'");
  const [[f]] = await db.query("SELECT COALESCE(SUM(amount-paid_amount),0) pending FROM fees WHERE status <> 'Paid'");
  const [[c]] = await db.query("SELECT COUNT(*) total FROM complaints WHERE status <> 'Resolved'");
  const [[l]] = await db.query("SELECT COUNT(*) total FROM leave_requests WHERE status='Pending'");
  const [[v]] = await db.query('SELECT COUNT(*) total FROM visitors WHERE check_out IS NULL');
  const [[a]] = await db.query("SELECT COUNT(*) total FROM attendance WHERE attendance_date=CURDATE() AND status='Present'");
  res.json({
    totalStudents: s.total, totalRooms: r.totalRooms, totalBeds: Number(r.totalBeds), occupiedBeds: Number(r.occupiedBeds),
    availableBeds: Number(r.totalBeds) - Number(r.occupiedBeds), totalStaff: st.total, pendingFees: Number(f.pending),
    openComplaints: c.total, pendingLeaves: l.total, visitorsInside: v.total, presentToday: a.total
  });
}));

module.exports = router;

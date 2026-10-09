const router = require('express').Router();
const db = require('../config/db');
const { wrap, HttpError, required, oneOf, clean } = require('../utils/http');

const SELECT = 'SELECT id,full_name AS fullName,role,phone,status FROM staff';

// GET /api/staff
router.get('/', wrap(async (req, res) => { const [rows] = await db.query(`${SELECT} ORDER BY id DESC`); res.json(rows); }));

// POST /api/staff
router.post('/', wrap(async (req, res) => {
  required(req.body, ['fullName', 'role']);
  const [r] = await db.query('INSERT INTO staff(full_name,role,phone) VALUES(?,?,?)', [req.body.fullName.trim(), req.body.role.trim(), clean(req.body.phone)]);
  const [rows] = await db.query(`${SELECT} WHERE id=?`, [r.insertId]);
  res.status(201).json(rows[0]);
}));

// PUT /api/staff/:id
router.put('/:id', wrap(async (req, res) => {
  required(req.body, ['fullName', 'role']);
  const status = req.body.status || 'Active';
  oneOf(status, ['Active', 'Inactive'], 'status');
  const [r] = await db.query('UPDATE staff SET full_name=?,role=?,phone=?,status=? WHERE id=?',
    [req.body.fullName.trim(), req.body.role.trim(), clean(req.body.phone), status, req.params.id]);
  if (!r.affectedRows) throw new HttpError(404, 'Staff member not found');
  const [rows] = await db.query(`${SELECT} WHERE id=?`, [req.params.id]);
  res.json(rows[0]);
}));

// DELETE /api/staff/:id
router.delete('/:id', wrap(async (req, res) => {
  const [r] = await db.query('DELETE FROM staff WHERE id=?', [req.params.id]);
  if (!r.affectedRows) throw new HttpError(404, 'Staff member not found');
  res.json({ message: 'Staff member deleted' });
}));

module.exports = router;

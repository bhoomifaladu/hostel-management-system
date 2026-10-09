const router = require('express').Router();
const db = require('../config/db');
const { wrap, HttpError, required, clean } = require('../utils/http');

const SELECT = `SELECT id,room_no AS roomNo,capacity,occupied,room_type AS roomType,
 CASE WHEN occupied>=capacity THEN 'Occupied' ELSE 'Available' END AS status FROM rooms`;

// GET /api/rooms
router.get('/', wrap(async (req, res) => { const [rows] = await db.query(`${SELECT} ORDER BY room_no`); res.json(rows); }));

// GET /api/rooms/:id  (includes residents)
router.get('/:id', wrap(async (req, res) => {
  const [rows] = await db.query(`${SELECT} WHERE id=?`, [req.params.id]);
  if (!rows.length) throw new HttpError(404, 'Room not found');
  const [students] = await db.query('SELECT id,full_name AS fullName,course FROM students WHERE room_no=?', [rows[0].roomNo]);
  res.json({ ...rows[0], students });
}));

const dup = e => { if (e.code === 'ER_DUP_ENTRY') throw new HttpError(409, 'Room number already exists'); throw e; };

// POST /api/rooms
router.post('/', wrap(async (req, res) => {
  required(req.body, ['roomNo', 'capacity']);
  const cap = Number(req.body.capacity);
  if (!Number.isInteger(cap) || cap < 1) throw new HttpError(400, 'Capacity must be a whole number of at least 1');
  const [r] = await db.query('INSERT INTO rooms(room_no,capacity,room_type) VALUES(?,?,?)',
    [req.body.roomNo.trim(), cap, clean(req.body.roomType) || 'Shared']).catch(dup);
  const [rows] = await db.query(`${SELECT} WHERE id=?`, [r.insertId]);
  res.status(201).json(rows[0]);
}));

// PUT /api/rooms/:id  (room number is not editable because students reference it)
router.put('/:id', wrap(async (req, res) => {
  required(req.body, ['capacity']);
  const cap = Number(req.body.capacity);
  const [[room]] = await db.query('SELECT occupied FROM rooms WHERE id=?', [req.params.id]);
  if (!room) throw new HttpError(404, 'Room not found');
  if (!Number.isInteger(cap) || cap < Math.max(1, room.occupied)) throw new HttpError(400, `Capacity cannot be below current occupancy (${room.occupied})`);
  await db.query('UPDATE rooms SET capacity=?,room_type=? WHERE id=?', [cap, clean(req.body.roomType) || 'Shared', req.params.id]);
  const [rows] = await db.query(`${SELECT} WHERE id=?`, [req.params.id]);
  res.json(rows[0]);
}));

// DELETE /api/rooms/:id  (only empty rooms)
router.delete('/:id', wrap(async (req, res) => {
  const [[room]] = await db.query('SELECT room_no,occupied FROM rooms WHERE id=?', [req.params.id]);
  if (!room) throw new HttpError(404, 'Room not found');
  if (room.occupied > 0) throw new HttpError(409, 'Cannot delete a room that has students');
  await db.query('DELETE FROM rooms WHERE id=?', [req.params.id]);
  res.json({ message: 'Room deleted' });
}));

module.exports = router;

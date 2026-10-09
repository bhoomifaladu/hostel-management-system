const router = require('express').Router();
const db = require('../config/db');
const { wrap, HttpError, required, oneOf, clean } = require('../utils/http');

const SELECT = 'SELECT id,full_name AS fullName,email,phone,course,room_no AS roomNo,status,admission_date AS admissionDate FROM students';

// Move a student between rooms inside a transaction, keeping rooms.occupied in sync.
async function changeRoom(conn, oldRoom, newRoom) {
  if (oldRoom === newRoom) return;
  if (newRoom) {
    const [rs] = await conn.query('SELECT id,capacity,occupied FROM rooms WHERE room_no=? FOR UPDATE', [newRoom]);
    if (!rs.length) throw new HttpError(400, 'Room not found');
    if (rs[0].occupied >= rs[0].capacity) throw new HttpError(409, 'Room is full');
    await conn.query('UPDATE rooms SET occupied=occupied+1 WHERE id=?', [rs[0].id]);
  }
  if (oldRoom) await conn.query('UPDATE rooms SET occupied=GREATEST(occupied-1,0) WHERE room_no=?', [oldRoom]);
}

async function tx(fn) {
  const conn = await db.getConnection();
  try { await conn.beginTransaction(); const out = await fn(conn); await conn.commit(); return out; }
  catch (e) { await conn.rollback(); throw e; }
  finally { conn.release(); }
}

const dup = e => { if (e.code === 'ER_DUP_ENTRY') throw new HttpError(409, 'This email is already registered'); throw e; };

// GET /api/students?search=&status=
router.get('/', wrap(async (req, res) => {
  const q = `%${req.query.search || ''}%`;
  const params = [q, q, q];
  let sql = `${SELECT} WHERE (full_name LIKE ? OR course LIKE ? OR COALESCE(room_no,'') LIKE ?)`;
  if (req.query.status) { sql += ' AND status=?'; params.push(req.query.status); }
  const [rows] = await db.query(sql + ' ORDER BY id DESC', params);
  res.json(rows);
}));

// GET /api/students/:id
router.get('/:id', wrap(async (req, res) => {
  const [rows] = await db.query(`${SELECT} WHERE id=?`, [req.params.id]);
  if (!rows.length) throw new HttpError(404, 'Student not found');
  res.json(rows[0]);
}));

// POST /api/students
router.post('/', wrap(async (req, res) => {
  required(req.body, ['fullName', 'course']);
  const { fullName, email, phone, course, roomNo } = req.body;
  const id = await tx(async conn => {
    await changeRoom(conn, null, clean(roomNo));
    const [r] = await conn.query('INSERT INTO students(full_name,email,phone,course,room_no) VALUES(?,?,?,?,?)',
      [fullName.trim(), clean(email), clean(phone), course.trim(), clean(roomNo)]);
    return r.insertId;
  }).catch(dup);
  const [rows] = await db.query(`${SELECT} WHERE id=?`, [id]);
  res.status(201).json(rows[0]);
}));

// PUT /api/students/:id
router.put('/:id', wrap(async (req, res) => {
  required(req.body, ['fullName', 'course']);
  const { fullName, email, phone, course, roomNo, status } = req.body;
  if (status) oneOf(status, ['Active', 'Inactive'], 'status');
  await tx(async conn => {
    const [[cur]] = await conn.query('SELECT room_no,status FROM students WHERE id=? FOR UPDATE', [req.params.id]);
    if (!cur) throw new HttpError(404, 'Student not found');
    const newStatus = status || cur.status;
    // Inactive students release their bed.
    const newRoom = newStatus === 'Inactive' ? null : clean(roomNo);
    await changeRoom(conn, cur.room_no, newRoom);
    await conn.query('UPDATE students SET full_name=?,email=?,phone=?,course=?,room_no=?,status=? WHERE id=?',
      [fullName.trim(), clean(email), clean(phone), course.trim(), newRoom, newStatus, req.params.id]);
  }).catch(dup);
  const [rows] = await db.query(`${SELECT} WHERE id=?`, [req.params.id]);
  res.json(rows[0]);
}));

// DELETE /api/students/:id
router.delete('/:id', wrap(async (req, res) => {
  await tx(async conn => {
    const [[cur]] = await conn.query('SELECT room_no FROM students WHERE id=? FOR UPDATE', [req.params.id]);
    if (!cur) throw new HttpError(404, 'Student not found');
    await changeRoom(conn, cur.room_no, null);
    await conn.query('DELETE FROM students WHERE id=?', [req.params.id]);
  });
  res.json({ message: 'Student deleted' });
}));

module.exports = router;

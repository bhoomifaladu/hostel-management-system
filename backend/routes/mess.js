const router = require('express').Router();
const db = require('../config/db');
const { wrap, HttpError, required, oneOf } = require('../utils/http');

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const MEALS = ['Breakfast', 'Lunch', 'Snacks', 'Dinner'];
const SELECT = 'SELECT id,day_of_week AS day,meal_type AS meal,items FROM mess_menu';

// GET /api/mess  -> weekly menu ordered Monday..Sunday, Breakfast..Dinner
router.get('/', wrap(async (req, res) => {
  const [rows] = await db.query(`${SELECT} ORDER BY FIELD(day_of_week,'${DAYS.join("','")}'),FIELD(meal_type,'${MEALS.join("','")}')`);
  res.json(rows);
}));

// PUT /api/mess  { day, meal, items }  (create or update one slot)
router.put('/', wrap(async (req, res) => {
  required(req.body, ['day', 'meal', 'items']);
  oneOf(req.body.day, DAYS, 'day'); oneOf(req.body.meal, MEALS, 'meal');
  await db.query('INSERT INTO mess_menu(day_of_week,meal_type,items) VALUES(?,?,?) ON DUPLICATE KEY UPDATE items=VALUES(items)',
    [req.body.day, req.body.meal, req.body.items.trim()]);
  const [rows] = await db.query(`${SELECT} WHERE day_of_week=? AND meal_type=?`, [req.body.day, req.body.meal]);
  res.json(rows[0]);
}));

// DELETE /api/mess/:id
router.delete('/:id', wrap(async (req, res) => {
  const [r] = await db.query('DELETE FROM mess_menu WHERE id=?', [req.params.id]);
  if (!r.affectedRows) throw new HttpError(404, 'Menu entry not found');
  res.json({ message: 'Menu entry deleted' });
}));

module.exports = router;

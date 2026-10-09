require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const db = require('./config/db');
const { requireAuth } = require('./middleware/auth');

const app = express();
const origins = (process.env.CLIENT_ORIGIN || 'http://localhost:5173,http://127.0.0.1:5173').split(',');
app.use(cors({ origin: origins }));
app.use(express.json());

app.get('/api/health', async (req, res) => {
  try { await db.query('SELECT 1'); res.json({ message: 'API and MySQL connected' }); }
  catch { res.status(500).json({ message: 'Database connection failed' }); }
});

// Public
app.use('/api/auth', require('./routes/auth'));

// Everything below needs a valid login token
app.use('/api', requireAuth);
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/students', require('./routes/students'));
app.use('/api/rooms', require('./routes/rooms'));
app.use('/api/fees', require('./routes/fees'));
app.use('/api/attendance', require('./routes/attendance'));
app.use('/api/complaints', require('./routes/complaints'));
app.use('/api/visitors', require('./routes/visitors'));
app.use('/api/mess', require('./routes/mess'));
app.use('/api/leaves', require('./routes/leaves'));
app.use('/api/staff', require('./routes/staff'));
app.use('/api/reports', require('./routes/reports'));

app.use((req, res) => res.status(404).json({ message: 'API route not found' }));
app.use((err, req, res, next) => {
  if (err.status) return res.status(err.status).json({ message: err.message });
  if (err.code === 'ER_NO_REFERENCED_ROW_2') return res.status(400).json({ message: 'Referenced record does not exist' });
  console.error(err);
  res.status(500).json({ message: 'Something went wrong on the server' });
});

// Create the first admin login if the users table is empty.
async function ensureAdmin() {
  // Create the table too, so an older hostel.sql import still works.
  await db.query(`CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(100) NOT NULL,
    email VARCHAR(120) UNIQUE NOT NULL, password_hash VARCHAR(255) NOT NULL,
    role ENUM('Admin','Warden','Accountant') DEFAULT 'Admin', created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`);
  const [[{ n }]] = await db.query('SELECT COUNT(*) n FROM users');
  if (n) return;
  const email = (process.env.ADMIN_EMAIL || 'admin@hostel.com').toLowerCase();
  const password = process.env.ADMIN_PASSWORD || 'admin123';
  await db.query('INSERT INTO users(name,email,password_hash,role) VALUES(?,?,?,?)',
    [process.env.ADMIN_NAME || 'Admin', email, await bcrypt.hash(password, 10), 'Admin']);
  console.log(`Created admin login: ${email} (change the password after first login)`);
}

const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`Backend running at http://localhost:${port}`));
ensureAdmin().catch(e => console.error('Could not create admin user (is the database imported?):', e.message));

const mysql = require('mysql2/promise');
require('dotenv').config();
const db = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'hostel_management',
  dateStrings: true, // return DATE/DATETIME as plain strings (avoids timezone day-shifts)
  waitForConnections: true, connectionLimit: 10
});
module.exports = db;

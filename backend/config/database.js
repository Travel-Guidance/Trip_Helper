const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host:     process.env.MYSQL_HOST     || 'localhost',
  port:     process.env.MYSQL_PORT     || 3306,
  user:     process.env.MYSQL_USER     || 'tripuser',
  password: process.env.MYSQL_PASSWORD || 'trippassword',
  database: process.env.MYSQL_DATABASE || 'trip_helper',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  timezone: '+09:00',
});

pool.getConnection()
  .then(conn => { console.log('MySQL connected'); conn.release(); })
  .catch(err => console.error('MySQL connection error:', err.message));

module.exports = pool;

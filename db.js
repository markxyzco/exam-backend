const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  password: process.env.DATABASE_URL,   // <-- Make sure this is a string literal, not a variable or from process.env
  host: 'localhost',
  port: 5432,
  database: 'jeetest_db',
});


module.exports = pool;

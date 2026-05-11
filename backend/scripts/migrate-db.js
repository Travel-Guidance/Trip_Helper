#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

require('dotenv').config({ path: path.join(__dirname, '../.env') });

const schemaPath = path.join(__dirname, '../models/schema.sql');

async function main() {
  const sql = fs.readFileSync(schemaPath, 'utf8');
  const connection = await mysql.createConnection({
    host: process.env.MYSQL_HOST || 'localhost',
    port: Number(process.env.MYSQL_PORT || 3306),
    user: process.env.MYSQL_USER || 'tripuser',
    password: process.env.MYSQL_PASSWORD || 'trippassword',
    database: process.env.MYSQL_DATABASE || 'trip_helper',
    multipleStatements: true,
  });

  try {
    await connection.query(sql);
    console.log(`Database migration complete: ${process.env.MYSQL_DATABASE || 'trip_helper'}`);
  } finally {
    await connection.end();
  }
}

main().catch(err => {
  console.error('[db:migrate] failed:', err.message);
  process.exit(1);
});

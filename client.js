const fs = require('fs');
// import { Client } from 'pg';
const { Client } = require('pg');

const schema = fs.readFileSync('./src/model/schema.sql', 'utf-8');

const pgclient = new Client({
  host: process.env.POSTGRES_HOST,
  port: process.env.POSTGRES_PORT,
  user: 'postgres',
  password: 'postgres',
  database: 'postgres',
});

pgclient.connect();

pgclient.query(schema, (err, _res) => {
  if (err) throw err;
  pgclient.end();
});
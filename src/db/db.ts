import path from 'path';
import fs from 'fs';

import debug from 'debug';
import sqlite3 from 'sqlite3';

import { DB_FILE_NAME } from '../constants.js';
import { getCurrentConfig } from '../lib/config.js';

const LOG = debug('db:db');

const dbFile = path.join(getCurrentConfig().dbPath, DB_FILE_NAME);

// Reset the DB during development
if (process.env.TT_PURGE_DB === 'true') {
  LOG('Deleting DB');
  fs.unlinkSync(dbFile);
}

LOG(`Opening DB Using file: ${dbFile}`);
const db = new sqlite3.Database(dbFile);
// LOG(db);
db.serialize();

LOG('Creating Tables');
LOG('--- time_entries');
db.run(`CREATE TABLE IF NOT EXISTS time_entries (
  id          INTEGER PRIMARY KEY
, description VARCHAR(200)
, project     VARCHAR(40)
, timeType    VARCHAR(40)
, entryDate   VARCHAR(10)
, entryTime   VARCHAR(5)
, minutes     INTEGER
, insertTime  DATE
, usefulness  INTEGER
)`);
LOG('--- projects');
db.run(`CREATE TABLE IF NOT EXISTS projects (
  name        VARCHAR(40) PRIMARY KEY
, aliases     TEXT
, archived    BOOLEAN
)`);
LOG('--- tt_schema_version');
db.run(`CREATE TABLE IF NOT EXISTS tt_schema_version (
  versionNumber INTEGER
)`);
db.run('DELETE FROM tt_schema_version');
db.run('INSERT INTO tt_schema_version VALUES ( 1 )');

async function dbGet(sql: string) {
  return new Promise((resolve, reject) => {
    db.get(sql, (err, row) => {
      if (err) {
        reject(err);
      }
      resolve(row);
    });
  });
}

async function dbAll(sql: string) {
  return new Promise((resolve, reject) => {
    db.all(sql, (err, rows) => {
      if (err) {
        reject(err);
      }
      resolve(rows);
    });
  });
}

// TODO: main methods for performing updates on the table
LOG(await dbAll('SELECT * FROM sqlite_schema'));
// db.each('SELECT * FROM sqlite_schema', (err, row) => { LOG(row); })
LOG(await dbGet('SELECT * FROM tt_schema_version'));
db.close();

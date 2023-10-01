import path from 'path';
import fs from 'fs';

import sqlite3 from 'sqlite3';

import { DB_FILE_NAME } from './constants.js';
import { getCurrentConfig } from './lib/config.js';

const dbFile = path.join(getCurrentConfig().dbPath, DB_FILE_NAME);

// Reset the DB during development
fs.unlinkSync(dbFile);

const db = new sqlite3.Database(dbFile);
console.log(db);
db.serialize();
// await new Promise<void>((resolve, reject) => {

//   db.serialize(() => {
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
db.run(`CREATE TABLE IF NOT EXISTS projects (
      name        VARCHAR(40) PRIMARY KEY
    , aliases     TEXT
    , archived    BOOLEAN
    )`);
db.run(`CREATE TABLE IF NOT EXISTS tt_schema_version (
      versionNumber INTEGER
    )`);
db.run('INSERT INTO tt_schema_version VALUES ( 1 )');
//   });
//   resolve();
// });

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
console.log(await dbAll('SELECT * FROM sqlite_schema'));
// db.each('SELECT * FROM sqlite_schema', (err, row) => { console.log(row); })
console.log(await dbGet('SELECT * FROM tt_schema_version'));
db.close();
interface TimeEntry {
  id: number;
  description: string;
  project: string;
  timeType: string;
  entryDate: string;
  minutes: number;
  insertTime: Date;
  usefulness: number;
}

interface Project {
  name: string;
  aliases: string[];
  archived: boolean;
}

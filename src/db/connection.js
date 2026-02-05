/* istanbul ignore file */
import Database from 'better-sqlite3';
import debug from 'debug';
import fs from 'node:fs';
import path from 'node:path';

import config from './config.js';

const LOG = debug('db');

let dbInstance = null;

function initializeTables(db) {
  // Create projects table
  db.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL COLLATE NOCASE
    )
  `);

  // Create timetype table
  db.exec(`
    CREATE TABLE IF NOT EXISTS timetype (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL COLLATE NOCASE
    )
  `);

  // Create timeEntry table
  db.exec(`
    CREATE TABLE IF NOT EXISTS timeEntry (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      entryDescription TEXT,
      project TEXT NOT NULL,
      timeType TEXT NOT NULL,
      minutes INTEGER NOT NULL,
      entryDate TEXT NOT NULL,
      insertTime TEXT NOT NULL,
      wasteOfTime INTEGER DEFAULT 0
    )
  `);

  // Create indexes for better performance
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_timeEntry_entryDate ON timeEntry(entryDate);
    CREATE INDEX IF NOT EXISTS idx_timeEntry_insertTime ON timeEntry(insertTime);
    CREATE INDEX IF NOT EXISTS idx_timeEntry_project ON timeEntry(project);
    CREATE INDEX IF NOT EXISTS idx_timeEntry_timeType ON timeEntry(timeType);
  `);
}

export function getConnection() {
  if (!dbInstance) {
    // Ensure directory exists
    const dbDir = path.dirname(config.db.path);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    LOG(`Connecting to SQLite database: ${config.db.path}`);
    dbInstance = new Database(config.db.path);

    // Initialize tables
    initializeTables(dbInstance);

    LOG('Connected to SQLite database');
  }
  return dbInstance;
}

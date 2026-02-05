import assert from 'node:assert';
import chalk from 'chalk';
import debug from 'debug';

import { getConnection } from './connection.js';

const LOG = debug('db:timetype');

/**
 * Get all timetype entries.
 */
export async function getAll() {
  const db = getConnection();

  const stmt = db.prepare('SELECT id as _id, name FROM timetype ORDER BY name');
  const timetypes = stmt.all();

  LOG(`Retrieved ${timetypes.length} time types`);
  return timetypes;
}

/**
 * Insert the given timetype into the database.  Return false if the timetype
 * already exists.  Comparison is case-insensitive.
 */
export async function insert(name) {
  const db = getConnection();

  try {
    const stmt = db.prepare('INSERT INTO timetype (name) VALUES (?)');
    const result = stmt.run(name);

    LOG(`Inserted timetype: ${name} with ID: ${result.lastInsertRowid}`);
    assert.equal(1, result.changes, chalk.bgRed('Unable to insert the timetype.'));

    return true;
  } catch (err) {
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      LOG(`Timetype already exists: ${name}`);
      return false;
    }
    throw err;
  }
}

export async function remove(name) {
  const db = getConnection();

  try {
    const stmt = db.prepare('DELETE FROM timetype WHERE name = ?');
    const result = stmt.run(name);

    LOG(`Remove result for ${name}: ${result.changes} rows affected`);

    if (result.changes === 0) {
      console.log(chalk.bgRed(`Error deleting record: timetype '${name}' not found`));
      return false;
    }

    return true;
  } catch (err) {
    console.log(chalk.bgRed(`Error deleting record: ${JSON.stringify(err)}`));
    return false;
  }
}

export default { getAll, insert, remove };

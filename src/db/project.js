import assert from 'node:assert';
import debug from 'debug';

import { getConnection } from './connection.js';

const LOG = debug('db:project');

/**
 * Get all project entries.
 */
export async function getAll() {
  const db = getConnection();

  const stmt = db.prepare('SELECT id as _id, name FROM projects ORDER BY name');
  const projects = stmt.all();

  LOG(`Retrieved ${projects.length} projects`);
  return projects;
}

/**
 * Insert the given project into the database.  Return false if the project
 * already exists.  Comparison is case-insensitive.
 */
export async function insert(name) {
  const db = getConnection();

  try {
    const stmt = db.prepare('INSERT INTO projects (name) VALUES (?)');
    const result = stmt.run(name);

    LOG(`Inserted project: ${name} with ID: ${result.lastInsertRowid}`);
    assert.equal(1, result.changes, 'Unable to insert the project.');

    return true;
  } catch (err) {
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      LOG(`Project already exists: ${name}`);
      return false;
    }
    throw err;
  }
}

export async function remove(name) {
  const db = getConnection();

  try {
    const stmt = db.prepare('DELETE FROM projects WHERE name = ?');
    const result = stmt.run(name);

    LOG(`Remove result for ${name}: ${result.changes} rows affected`);

    if (result.changes === 0) {
      LOG(`Project not found: ${name}`);
      return false;
    }

    return true;
  } catch (err) {
    LOG(`Remove Failed: ${JSON.stringify(err, null, 2)}`);
    return false;
  }
}

export default { getAll, insert, remove };

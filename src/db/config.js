/* istanbul ignore file */
import path from 'node:path';
import os from 'node:os';
import debug from 'debug';

const LOG = debug('db:config');

const dbPath = path.join(os.homedir(), '.tt', 'time-tracker.db');

LOG(`Using SQLite database at: ${dbPath}`);

export default {
  db: {
    path: dbPath,
  },
};

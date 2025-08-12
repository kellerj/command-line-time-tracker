/* istanbul ignore file */
const path = require('path');
const os = require('os');
const LOG = require('debug')('db:config');

const dbPath = path.join(os.homedir(), '.tt', 'time-tracker.db');

LOG(`Using SQLite database at: ${dbPath}`);

module.exports = {
  db: {
    path: dbPath,
  },
};

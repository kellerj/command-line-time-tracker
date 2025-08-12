import assert from 'assert';
import chalk from 'chalk';
import moment from 'moment'; // TODO: Convert to use date-fns
import debug from 'debug';
import { format } from 'date-fns';

import * as Constants from '../constants';

const LOG = debug('db:timeEntry');

function setDebug(enabled) {
  LOG.enabled = enabled;
}

/* istanbul ignore if */
if (LOG.enabled) {
  LOG('SQLite timeEntry module debugging enabled');
}

/**
 * Insert the given timeEntry into the database.
 */
async function insert(db, timeEntry) {
  // add the timing data to the object
  if (!timeEntry.entryDate) {
    // it's possible the date may be specified from the command line - if so, don't set
    timeEntry.entryDate = moment().startOf('day').format(Constants.DATE_FORMAT);
    LOG(`Defaulting entry date to ${timeEntry.entryDate}`);
  }

  LOG(`Inserting ${JSON.stringify(timeEntry, null, 2)} into SQLite`);

  const stmt = db.prepare(`
    INSERT INTO timeEntry (entryDescription, project, timeType, minutes, entryDate, insertTime, wasteOfTime) 
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const result = stmt.run(
    timeEntry.entryDescription,
    timeEntry.project,
    timeEntry.timeType,
    timeEntry.minutes,
    timeEntry.entryDate,
    timeEntry.insertTime.toISOString(),
    timeEntry.wasteOfTime ? 1 : 0,
  );

  LOG(`Result: Inserted with ID ${result.lastInsertRowid}`);
  assert.equal(1, result.changes, chalk.bgRed('Unable to insert the timeEntry.'));

  return true;
}

async function update(db, timeEntry) {
  LOG(`Updating ${JSON.stringify(timeEntry, null, 2)} into SQLite`);

  const stmt = db.prepare(`
    UPDATE timeEntry 
    SET entryDescription = ?, project = ?, timeType = ?, minutes = ?, entryDate = ?, wasteOfTime = ?
    WHERE id = ?
  `);

  const result = stmt.run(
    timeEntry.entryDescription,
    timeEntry.project,
    timeEntry.timeType,
    timeEntry.minutes,
    timeEntry.entryDate,
    timeEntry.wasteOfTime ? 1 : 0,
    timeEntry._id || timeEntry.id,
  );

  LOG(`Result: Updated ${result.changes} rows`);
  assert.equal(1, result.changes, `Unable to update the timeEntry: only ${result.changes} rows affected`);

  return true;
}

async function get(db, startDate, endDate) {
  LOG(`Get Time Entries: ${startDate} -- ${endDate}`);

  if (!startDate) {
    // eslint-disable-next-line no-param-reassign
    startDate = new Date();
  }
  if (!endDate) {
    // eslint-disable-next-line no-param-reassign
    endDate = startDate;
  }

  let stmt;
  let entries;
  if (startDate === endDate) {
    const entryDate = format(startDate, Constants.DATE_FORMAT);
    stmt = db.prepare(`
      SELECT id as _id, entryDescription, project, timeType, minutes, entryDate, insertTime, wasteOfTime
      FROM timeEntry 
      WHERE entryDate = ? 
      ORDER BY insertTime
    `);
    entries = stmt.all(entryDate);
  } else {
    const startDateStr = format(startDate, Constants.DATE_FORMAT);
    const endDateStr = format(endDate, Constants.DATE_FORMAT);
    stmt = db.prepare(`
      SELECT id as _id, entryDescription, project, timeType, minutes, entryDate, insertTime, wasteOfTime
      FROM timeEntry 
      WHERE entryDate >= ? AND entryDate <= ? 
      ORDER BY insertTime
    `);
    entries = stmt.all(startDateStr, endDateStr);
  }

  // Convert wasteOfTime from integer back to boolean and parse insertTime
  const processedEntries = entries.map(entry => ({
    ...entry,
    wasteOfTime: entry.wasteOfTime === 1,
    insertTime: new Date(entry.insertTime),
  }));

  LOG(`Retrieved ${processedEntries.length} entries`);
  return processedEntries;
}

async function remove(db, entryId) {
  // First get the entry to return it
  const selectStmt = db.prepare('SELECT id as _id, entryDescription, project, timeType, minutes, entryDate, insertTime, wasteOfTime FROM timeEntry WHERE id = ?');
  const entry = selectStmt.get(entryId);

  if (!entry) {
    throw new Error(`Error deleting record: entry with ID ${entryId} not found`);
  }

  // Now delete it
  const deleteStmt = db.prepare('DELETE FROM timeEntry WHERE id = ?');
  const result = deleteStmt.run(entryId);

  LOG(`Delete result: ${result.changes} rows affected`);

  if (result.changes === 0) {
    throw new Error(`Error deleting record: no rows affected for ID ${entryId}`);
  }

  // Process the entry to match expected format
  const processedEntry = {
    ...entry,
    wasteOfTime: entry.wasteOfTime === 1,
    insertTime: new Date(entry.insertTime),
  };

  return processedEntry;
}

async function getMostRecentEntry(db, entryDate, beforeTime) {
  if (!beforeTime) {
    // eslint-disable-next-line no-param-reassign
    beforeTime = new Date();
  }
  let entryDateString = entryDate;
  if (!entryDate) {
    // eslint-disable-next-line no-param-reassign
    entryDateString = format(beforeTime, Constants.DATE_FORMAT);
  } else if (entryDate instanceof Date) {
    entryDateString = format(entryDate, Constants.DATE_FORMAT);
  }

  const stmt = db.prepare(`
    SELECT id as _id, entryDescription, project, timeType, minutes, entryDate, insertTime, wasteOfTime
    FROM timeEntry 
    WHERE entryDate = ? AND insertTime < ?
    ORDER BY insertTime DESC 
    LIMIT 1
  `);

  const entry = stmt.get(entryDateString, beforeTime.toISOString());

  if (entry) {
    // Process the entry to match expected format
    return {
      ...entry,
      wasteOfTime: entry.wasteOfTime === 1,
      insertTime: new Date(entry.insertTime),
    };
  }
  return null;
}

async function summarizeByProjectAndTimeType(db, startDate, endDate) {
  LOG(`Summarize Time Entries: ${startDate} -- ${endDate}`);

  if (!startDate) {
    // eslint-disable-next-line no-param-reassign
    startDate = new Date();
  }

  if (!endDate) {
    // eslint-disable-next-line no-param-reassign
    endDate = startDate;
  }

  const startDateStr = format(startDate, Constants.DATE_FORMAT);
  const endDateStr = format(endDate, Constants.DATE_FORMAT);

  const stmt = db.prepare(`
    SELECT 
      project, 
      timeType, 
      SUM(minutes) as minutes
    FROM timeEntry 
    WHERE entryDate >= ? AND entryDate <= ?
    GROUP BY project, timeType
    ORDER BY project, timeType
  `);

  const results = stmt.all(startDateStr, endDateStr);

  LOG(`Summary Data: ${JSON.stringify(results, null, 2)}`);
  return results;
}

/*
 * The default export is a function which must be passed the DB connection, which will then be used
 * by all calls to this module in that code so simplify further use of the module.
 */
module.exports = getConnection => ({
  async insert(timeEntry) {
    return insert(getConnection(), timeEntry);
  },

  async update(timeEntry) {
    return update(getConnection(), timeEntry);
  },

  async get(startDate, endDate) {
    return get(getConnection(), startDate, endDate);
  },

  async remove(entryId) {
    return remove(getConnection(), entryId);
  },

  async getMostRecentEntry(entryDateString, beforeTime) {
    return getMostRecentEntry(getConnection(), entryDateString, beforeTime);
  },

  async summarizeByProjectAndTimeType(startDate, endDate) {
    return summarizeByProjectAndTimeType(getConnection(), startDate, endDate);
  },
  setDebug,
});

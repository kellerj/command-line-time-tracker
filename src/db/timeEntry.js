import assert from 'assert';
import chalk from 'chalk';
import moment from 'moment'; // TODO: Convert to use date-fns
import debug from 'debug';
import { format } from 'date-fns';

import { DATE_FORMAT } from '../constants';

const LOG = debug('db:timeEntry');

const collectionName = 'timeEntry';

function setMongoDBLoggingLevel(loggingLevel) {
  // eslint-disable-next-line global-require
  require('mongodb').Logger.setLevel(loggingLevel);
}

function setDebug(enabled) {
  LOG.enabled = enabled;
  if (enabled) {
    setMongoDBLoggingLevel('debug');
  } else {
    setMongoDBLoggingLevel('info');
  }
}

if (LOG.enabled) {
  setMongoDBLoggingLevel('debug');
}

/**
 * Insert the given project into the database.  Return false if the project
 * aready exists.  Comparison is case-insensitive.
 */
async function insert(db, timeEntry) {
  const collection = db.collection(collectionName);

  // add the timing data to the object
  if (!timeEntry.entryDate) {
    // it's possible the date may be specified from the command line - if so, don't set
    timeEntry.entryDate = moment().startOf('day').format(DATE_FORMAT);
    LOG(`Defaulting entry date to ${timeEntry.entryDate}`);
  }

  LOG(`Inserting ${JSON.stringify(timeEntry, null, 2)} into MongoDB`);

  const r = await collection.insertOne(timeEntry);
  db.close();
  LOG(`Result: ${JSON.stringify(r)}`);
  assert.equal(1, r.insertedCount, chalk.bgRed('Unable to insert the timeEntry.'));

  return true;
}

async function update(db, timeEntry) {
  const collection = db.collection(collectionName);

  LOG(`Updating ${JSON.stringify(timeEntry, null, 2)} into MongoDB`);

  const r = await collection.updateOne({ _id: timeEntry._id }, timeEntry);
  db.close();
  LOG(`Result: ${JSON.stringify(r.result)}`);
  assert.equal(1, r.result.nModified, `Unable to update the timeEntry: ${JSON.stringify(r.result)}`);

  return true;
}

async function get(db, startDate, endDate) {
  LOG(`Get Time Entries: ${startDate} -- ${endDate}`);
  const collection = db.collection(collectionName);
  if (!startDate) {
    // eslint-disable-next-line no-param-reassign
    startDate = new Date();
  }
  if (!endDate) {
    // eslint-disable-next-line no-param-reassign
    endDate = startDate;
  }
  let query = {};
  if (startDate === endDate) {
    query = { entryDate: format(startDate, DATE_FORMAT) };
  } else {
    query = {
      entryDate: {
        $gte: format(startDate, DATE_FORMAT),
        $lte: format(endDate, DATE_FORMAT),
      },
    };
  }
  const r = await collection.find(query).sort({ insertTime: 1 }).toArray();
  db.close();
  return r;
}

async function remove(db, entryId) {
  const collection = db.collection(collectionName);

  if (LOG.enabled) {
    // eslint-disable-next-line global-require
    require('mongodb').Logger.setLevel('debug');
  }

  const r = await collection.findAndRemove({ _id: entryId });
  LOG(JSON.stringify(r, null, 2));
  if (r && r.ok === 1 && r.value !== null) {
    db.close();
    return true;
  } else if (r && r.ok !== 1) {
    console.log(chalk.bgRed(`Error deleting record: ${JSON.stringify(r)}`));
  }

  db.close();
  return false;
}

async function getMostRecentEntry(db, entryDateString, beforeTime) {
  const collection = db.collection(collectionName);
  if (!beforeTime) {
    // eslint-disable-next-line no-param-reassign
    beforeTime = new Date();
  }
  if (!entryDateString) {
    // eslint-disable-next-line no-param-reassign
    entryDateString = format(beforeTime, DATE_FORMAT);
  }
  const r = await collection.find({
    entryDate: entryDateString,
    insertTime: { $lt: beforeTime },
  }).sort({ insertTime: -1 }).limit(1).toArray();
  db.close();
  if (r.length) {
    return r[0];
  }
  return null;
}

async function summarizeByProjectAndTimeType(db, startDate, endDate) {
  LOG(`Summarize Time Entries: ${startDate} -- ${endDate}`);
  const collection = db.collection(collectionName);

  if (!endDate) {
    // eslint-disable-next-line no-param-reassign
    endDate = startDate;
  }

  const cursor = collection.aggregate([
    {
      $match: {
        entryDate: {
          $gte: moment(startDate).format(DATE_FORMAT),
          $lte: moment(endDate).format(DATE_FORMAT),
        },
      },
    },
    {
      $group: {
        _id: { project: '$project', timeType: '$timeType' },
        minutes: { $sum: '$minutes' },
      },
    },
    {
      $project: {
        project: '$_id.project', timeType: '$_id.timeType', minutes: '$minutes', _id: 0,
      },
    },
    { $sort: { project: 1, timeType: 1 } },
  ]);
  const r = await cursor.toArray();
  db.close();
  LOG(`Summary Data: ${JSON.stringify(r, null, 2)}`);
  return r;
}

/*
 * The default export is a function which must be passed the DB connection, which will then be used
 * by all calls to this module in that code so simplify further use of the module.
 */
module.exports = getConnection => ({
  async insert(timeEntry) {
    return insert(await getConnection(), timeEntry);
  },

  async update(timeEntry) {
    return update(await getConnection(), timeEntry);
  },

  async get(startDate, endDate) {
    return get(await getConnection(), startDate, endDate);
  },

  async remove(entryId) {
    return remove(await getConnection(), entryId);
  },

  async getMostRecentEntry(entryDateString, beforeTime) {
    return getMostRecentEntry(await getConnection(), entryDateString, beforeTime);
  },

  async summarizeByProjectAndTimeType(startDate, endDate) {
    return summarizeByProjectAndTimeType(await getConnection(), startDate, endDate);
  },
  setDebug,
});

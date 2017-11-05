const assert = require('assert');
const chalk = require('chalk');
const moment = require('moment');
const debug = require('debug')('db:timeEntry');

const collectionName = 'timeEntry';

//    async Generator function - must be used with co module or next().value.

const ENTRY_DATE_FORMAT = 'YYYY-MM-DD';

module.exports = getConnection => ({
  /**
   async Insert the given project into the database.  Return false if the project
   async aready exists.  Comparison is case-insensitive.
   */
  insert: async function insert(timeEntry) {
    const db = await getConnection();
    const collection = db.collection(collectionName);

    if (debug.enabled) {
      // eslint-disable-next-line global-require
      require('mongodb').Logger.setLevel('debug');
    }

    // add the timing data to the object
    if (!timeEntry.entryDate) {
      // it's possible the date may be specified from the command line - if so, don't set
      timeEntry.entryDate = moment().startOf('day').format(ENTRY_DATE_FORMAT);
      debug(`Defaulting entry date to ${timeEntry.entryDate}`);
    }

    debug(`Inserting ${JSON.stringify(timeEntry, null, 2)} into MongoDB`);

    const r = await collection.insertOne(timeEntry);
    db.close();
    debug(`Result: ${JSON.stringify(r)}`);
    assert.equal(1, r.insertedCount, chalk.bgRed('Unable to insert the timeEntry.'));

    return true;
  },

  async update(timeEntry) {
    const db = await getConnection();
    const collection = db.collection(collectionName);

    if (debug.enabled) {
      // eslint-disable-next-line global-require
      require('mongodb').Logger.setLevel('debug');
    }
    debug(`Updating ${JSON.stringify(timeEntry, null, 2)} into MongoDB`);

    const r = await collection.updateOne({ _id: timeEntry._id }, timeEntry);
    db.close();
    debug(`Result: ${JSON.stringify(r.result)}`);
    assert.equal(1, r.result.nModified, chalk.bgRed(`Unable to update the timeEntry: ${JSON.stringify(r.result)}`));

    return true;
  },

  async get(startDate, endDate) {
    debug(`Get Time Entries: ${startDate} -- ${endDate}`);
    const db = await getConnection();
    const collection = db.collection(collectionName);

    if (!endDate) {
      // eslint-disable-next-line no-param-reassign
      endDate = startDate;
    }

    if (debug.enabled) {
      // eslint-disable-next-line global-require
      require('mongodb').Logger.setLevel('debug');
    }

    const r = await collection.find({
      entryDate: {
        $gte: moment(startDate).format(ENTRY_DATE_FORMAT),
        $lte: moment(endDate).format(ENTRY_DATE_FORMAT),
      },
    }).sort({ insertTime: 1 }).toArray();
    db.close();
    return r;
  },

  async remove(entryId) {
    const db = await getConnection();
    const collection = db.collection(collectionName);

    if (debug.enabled) {
      // eslint-disable-next-line global-require
      require('mongodb').Logger.setLevel('debug');
    }

    const r = await collection.findAndRemove({ _id: entryId });
    debug(JSON.stringify(r, null, 2));
    if (r && r.ok === 1 && r.value !== null) {
      db.close();
      return true;
    } else if (r && r.ok !== 1) {
      console.log(chalk.bgRed(`Error deleting record: ${JSON.stringify(r)}`));
    }

    db.close();
    return false;
  },

  getMostRecentEntry: async function getMostRecentEntry(entryDate) {
    // console.log(`Get Time Entries: ${startDate} -- ${endDate}`);
    const db = await getConnection();
    const collection = db.collection(collectionName);

    const r = await collection.find({
      entryDate: moment(entryDate).format(ENTRY_DATE_FORMAT),
    }).sort({ insertTime: -1 }).limit(1).toArray();
    db.close();
    if (r.length) {
      return r[0];
    }
    return null;
  },

  async summarizeByProjectAndTimeType(startDate, endDate) {
    debug(`Summarize Time Entries: ${startDate} -- ${endDate}`);
    const db = await getConnection();
    const collection = db.collection(collectionName);

    if (!endDate) {
      // eslint-disable-next-line no-param-reassign
      endDate = startDate;
    }

    if (debug.enabled) {
      // eslint-disable-next-line global-require
      require('mongodb').Logger.setLevel('debug');
    }

    const cursor = collection.aggregate(
      [
        { $match: {
          entryDate: {
            $gte: moment(startDate).format(ENTRY_DATE_FORMAT),
            $lte: moment(endDate).format(ENTRY_DATE_FORMAT),
          },
        } },
        { $group: {
          _id: { project: '$project', timeType: '$timeType' },
          minutes: { $sum: '$minutes' },
        } },
        { $project: { project: '$_id.project', timeType: '$_id.timeType', minutes: '$minutes', _id: 0 } },
        { $sort: { project: 1, timeType: 1 } },
      ]);
    const r = await cursor.toArray();
    db.close();
    debug(`Summary Data: ${JSON.stringify(r, null, 2)}`);
    return r;
  },
});

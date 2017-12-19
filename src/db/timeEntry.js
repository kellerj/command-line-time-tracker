import assert from 'assert';
import chalk from 'chalk';
import moment from 'moment'; // TODO: Convert to use date-fns
import debug from 'debug';

const LOG = debug('db:timeEntry');
const ENTRY_DATE_FORMAT = 'YYYY-MM-DD';

const collectionName = 'timeEntry';


module.exports = getConnection => ({
  /**
   async Insert the given project into the database.  Return false if the project
   async aready exists.  Comparison is case-insensitive.
   */
  async insert(timeEntry) {
    const db = await getConnection();
    const collection = db.collection(collectionName);

    if (LOG.enabled) {
      // eslint-disable-next-line global-require
      require('mongodb').Logger.setLevel('debug');
    }

    // add the timing data to the object
    if (!timeEntry.entryDate) {
      // it's possible the date may be specified from the command line - if so, don't set
      timeEntry.entryDate = moment().startOf('day').format(ENTRY_DATE_FORMAT);
      LOG(`Defaulting entry date to ${timeEntry.entryDate}`);
    }

    LOG(`Inserting ${JSON.stringify(timeEntry, null, 2)} into MongoDB`);

    const r = await collection.insertOne(timeEntry);
    db.close();
    LOG(`Result: ${JSON.stringify(r)}`);
    assert.equal(1, r.insertedCount, chalk.bgRed('Unable to insert the timeEntry.'));

    return true;
  },

  async update(timeEntry) {
    const db = await getConnection();
    const collection = db.collection(collectionName);

    if (LOG.enabled) {
      // eslint-disable-next-line global-require
      require('mongodb').Logger.setLevel('debug');
    }
    LOG(`Updating ${JSON.stringify(timeEntry, null, 2)} into MongoDB`);

    const r = await collection.updateOne({ _id: timeEntry._id }, timeEntry);
    db.close();
    LOG(`Result: ${JSON.stringify(r.result)}`);
    assert.equal(1, r.result.nModified, chalk.bgRed(`Unable to update the timeEntry: ${JSON.stringify(r.result)}`));

    return true;
  },

  async get(startDate, endDate) {
    LOG(`Get Time Entries: ${startDate} -- ${endDate}`);
    const db = await getConnection();
    const collection = db.collection(collectionName);

    if (!endDate) {
      // eslint-disable-next-line no-param-reassign
      endDate = startDate;
    }

    if (LOG.enabled) {
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
  },

  async getMostRecentEntry(entryDate, beforeTime = new Date()) {
    // console.log(`Get Time Entries: ${startDate} -- ${endDate}`);
    const db = await getConnection();
    const collection = db.collection(collectionName);

    const r = await collection.find({
      entryDate: moment(entryDate).format(ENTRY_DATE_FORMAT),
      insertTime: { $lt: beforeTime },
    }).sort({ insertTime: -1 }).limit(1).toArray();
    db.close();
    if (r.length) {
      return r[0];
    }
    return null;
  },

  async summarizeByProjectAndTimeType(startDate, endDate) {
    LOG(`Summarize Time Entries: ${startDate} -- ${endDate}`);
    const db = await getConnection();
    const collection = db.collection(collectionName);

    if (!endDate) {
      // eslint-disable-next-line no-param-reassign
      endDate = startDate;
    }

    if (LOG.enabled) {
      // eslint-disable-next-line global-require
      require('mongodb').Logger.setLevel('debug');
    }

    const cursor = collection.aggregate([
      {
        $match: {
          entryDate: {
            $gte: moment(startDate).format(ENTRY_DATE_FORMAT),
            $lte: moment(endDate).format(ENTRY_DATE_FORMAT),
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
  },
});

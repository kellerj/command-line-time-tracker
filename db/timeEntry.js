const MongoClient = require('mongodb').MongoClient;
const config = require('./config');
const assert = require('assert');
const chalk = require('chalk');
const moment = require('moment');

const collectionName = 'timeEntry';

//    * Generator function - must be used with co module or next().value.

module.exports = {
  /**
   * Insert the given project into the database.  Return false if the project
   * aready exists.  Comparison is case-insensitive.
   */
  * insert(timeEntry) {
    const db = yield MongoClient.connect(config.db.url);
    const collection = db.collection(collectionName);

    // add the timing data to the object
    if (!timeEntry.entryDate) {
      // it's possible the date may be specified from the command line - if so, don't set
      timeEntry.entryDate = moment().startOf('day').toDate();
    }
    timeEntry.insertTime = new Date();

    const r = yield collection.insertOne(timeEntry);
    db.close();
    assert.equal(1, r.insertedCount, chalk.bgRed('Unable to insert the timeEntry.'));

    return true;
  },
};

const MongoClient = require('mongodb').MongoClient;
const config = require('./config');
const assert = require('assert');
const chalk = require('chalk');

module.exports = {
  /**
   * Get all project entries.
   * Generator function - must be used with co module or next().value.
   */
  * getAll() {
    const db = yield MongoClient.connect(config.db.url);
    const collection = db.collection('projects');
    const r = yield collection.find({}).sort({ name: 1 }).toArray();
    // Close the connection
    db.close();

    return r;
  },

  /**
   * Insert the given project into the database.  Return false if the project
   * aready exists.  Comparison is case-insensitive.
   */
  * insert(projectName) {
    const db = yield MongoClient.connect(config.db.url);
    const collection = db.collection('projects');

    let r = yield collection.findOne({ name: { $regex: `^${projectName}$`, $options: 'i' } });
    // console.log(JSON.stringify(r));
    if (r) {
      db.close();
      return false;
    }
    r = yield collection.insertOne({ name: projectName });
    db.close();
    assert.equal(1, r.insertedCount, chalk.bgRed('Unable to insert the project.'));

    return true;
  },

  * remove(projectName) {
    const db = yield MongoClient.connect(config.db.url);
    const collection = db.collection('projects');

    const r = yield collection.findAndRemove({ name: projectName });
    // console.log(JSON.stringify(r));
    if (r && r.ok === 1 && r.value !== null) {
      db.close();
      return true;
    } else if (r && r.ok !== 1) {
      console.log(chalk.bgRed(`Error deleting record: ${JSON.stringify(r)}`));
    }

    db.close();
    return false;
  },
};

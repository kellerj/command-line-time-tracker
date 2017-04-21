const MongoClient = require('mongodb').MongoClient;
const config = require('./config');
const assert = require('assert');
const chalk = require('chalk');

module.exports = {
  project: {
    * getAll() {
      const db = yield MongoClient.connect(config.db.url);
      const collection = db.collection('projects');
      const r = yield collection.find({}).sort({ name: 1 }).toArray();
      // Close the connection
      db.close();

      return r;
    },
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
  },
};

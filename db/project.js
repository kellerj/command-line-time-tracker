const assert = require('assert');
const chalk = require('chalk');

const collectionName = 'projects';

module.exports = getConnection => ({
  /**
   * Get all project entries.
   * Generator function - must be used with co module or next().value.
   */
  * getAll() {
    const db = yield* getConnection();
    const collection = db.collection(collectionName);
    const r = yield collection.find({}).sort({ name: 1 }).toArray();
    // Close the connection
    db.close();

    return r;
  },

  /**
   * Insert the given project into the database.  Return false if the project
   * aready exists.  Comparison is case-insensitive.
   */
  * insert(name) {
    const db = yield* getConnection();
    const collection = db.collection(collectionName);

    let r = yield collection.findOne({ name: { $regex: `^${name}$`, $options: 'i' } });
    // console.log(JSON.stringify(r));
    if (r) {
      db.close();
      return false;
    }
    r = yield collection.insertOne({ name });
    db.close();
    assert.equal(1, r.insertedCount, chalk.bgRed('Unable to insert the project.'));

    return true;
  },

  * remove(name) {
    const db = yield* getConnection();
    const collection = db.collection(collectionName);

    const r = yield collection.findAndRemove({ name });
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
});

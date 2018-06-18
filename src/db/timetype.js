/**
 * @summary Module for interacting with the timetype collection in MongoDB.
 * @namespace Db.timetype
 * @memberof Db
 */
import assert from 'assert';
import chalk from 'chalk';

const collectionName = 'timetype';

module.exports = getConnection => ({
  /**
   * Get all time type entries.
   *
   * @memberof Db.timetype
   */
  async getAll() {
    const db = await getConnection();
    const collection = db.collection(collectionName);
    const r = await collection.find({}).sort({ name: 1 }).toArray();
    // Close the connection
    db.close();

    return r;
  },

  /**
   * Insert the given project into the database.  Return false if the project
   * already exists.  Comparison is case-insensitive.
   *
   * @param {string} name - Name of the time type to insert into the database.
   *
   * @memberof Db.timetype
   */
  async insert(name) {
    const db = await getConnection();
    const collection = db.collection(collectionName);

    let r = await collection.findOne({ name: { $regex: `^${name}$`, $options: 'i' } });
    // console.log(JSON.stringify(r));
    if (r) {
      db.close();
      return false;
    }
    r = await collection.insertOne({ name });
    db.close();
    assert.equal(1, r.insertedCount, chalk.bgRed('Unable to insert the project.'));

    return true;
  },

  /**
   * Remove the given time type from the database.  Return false if the project
   * does not exist.
   *
   * @param {string} name - Name of the time type to delete from the database.
   *
   * @memberof Db.timetype
   */
  async remove(name) {
    const db = await getConnection();
    const collection = db.collection(collectionName);

    const r = await collection.findAndRemove({ name });
    db.close();
    // console.log(JSON.stringify(r));
    if (r && r.ok === 1 && r.value !== null) {
      return true;
    } else if (r && r.ok !== 1) {
      throw new Error(`Error deleting record: ${JSON.stringify(r)}`);
    }

    db.close();
    return false;
  },
});

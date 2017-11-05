import assert from 'assert';
import debug from 'debug';

const LOG = debug('db:project');

const collectionName = 'projects';

module.exports = getConnection => ({
  /**
   * Get all project entries.
   * Generator function - must be used with co module or next().value.
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
   * aready exists.  Comparison is case-insensitive.
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
    assert.equal(1, r.insertedCount, 'Unable to insert the project.');

    return true;
  },

  async remove(name) {
    const db = await getConnection();
    const collection = db.collection(collectionName);

    const r = await collection.findAndRemove({ name });
    LOG(JSON.stringify(r, null, 2));
    try {
      assert.ok(r, 'Empty Result from Mongo findAndRemove command');
      assert.ok(r.ok === 1 && r.value !== null, `Unexpected result from MongoDB: ${JSON.stringify(r)}`);
    } catch (err) {
      db.close();
      LOG(`Remove Failed: ${JSON.stringify(err, null, 2)}`);
      return false;
    }
    db.close();
    return true;
  },
});

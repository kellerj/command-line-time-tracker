const expect = require('chai').expect;
const assert = require('chai').assert;
const spy = require('sinon').spy;
// const mock = require('sinon').mock;
const stub = require('sinon').stub;
const co = require('co');

const cursor = {
  // eslint-disable-next-line no-unused-vars
  sort: sortObj => cursor,
  // eslint-disable-next-line no-unused-vars
  toArray: () => [
    { _id: '1', name: 'Project 1' },
    { _id: '2', name: 'Project 2' },
    { _id: '3', name: 'Project 3' },
    { _id: '4', name: 'Project 4' },
  ],
};

const collection = {
  // eslint-disable-next-line no-unused-vars,require-yield
  find(queryObj) { return cursor; },
  // eslint-disable-next-line no-unused-vars,require-yield
  * findOne(queryObj) { return null; },
  // eslint-disable-next-line no-unused-vars,require-yield
  * insertOne(obj) { return { insertedCount: 1 }; },
  // eslint-disable-next-line no-unused-vars,require-yield
  * findAndRemove(queryObj) { return { ok: 1, value: {} }; },
};

spy(collection, 'findAndRemove');
spy(collection, 'insertOne');
// spy(collection, 'findOne');
spy(collection, 'find');

const db = {
  // eslint-disable-next-line no-unused-vars,arrow-body-style
  collection: (collectionName) => {
    // console.log('db.collection');
    return collection;
  },
  close: () => {
    // console.log('db.close');
  },
};

spy(db, 'collection');
spy(db, 'close');

// eslint-disable-next-line require-yield
function* getConnection() {
  return db;
}

const project = require('../../db/project')(getConnection);

describe('db/project', () => {
  describe('getAll', () => {
    it('returns a list of all project names returned from MongoDB', async () => {
      const result = await co(project.getAll());
      expect(collection.find.called).to.equal(true, 'did not call find on the collection');
      expect(result.length).to.equal(cursor.toArray().length);
      expect(JSON.stringify(result, null, 2)).to.equal(JSON.stringify(cursor.toArray(), null, 2));
    });
    // ES7 Version
    it('opens and closes the database connection', async () => {
      await co(project.getAll());
      // console.log(`Called: ${db.close.called}`);
      // console.log(result);
      expect(db.collection.called).to.equal(true, 'did not have db connection - did not obtain collection reference');
      expect(db.close.called).to.equal(true, 'db.close was not called');
    });
    // ES6 version of above function
    // it('opens and closes the database connection', () => {
    //   // co(project.getAll()).then(() => {
    //   //   try {
    //   //     console.log(`Called: ${db.close.called}`);
    //   //     assert(!closeSpy.called, 'db.close was not called');
    //   //     done();
    //   //   } catch (err) {
    //   //     done(err);
    //   //   }
    //   //   // assert.fail('', '', 'unimplemented test');
    //   // });
    // });
  });
  describe('insert', () => {
    it('opens and closes the database connection', async () => {
      await co(project.insert('A New Project'));
      expect(db.collection.called).to.equal(true, 'did not have db connection - did not obtain collection reference');
      expect(db.close.called).to.equal(true, 'db.close was not called');
    });
    it('calls MongoDB to insert the project', async () => {
      const result = await co(project.insert('A New Project'));
      expect(collection.insertOne.called).to.equal(true, 'did not call insertOne on the collection');

      expect(result).to.equal(true, 'Should have returned true after inserting record');
    });
    it('returns false when the project already exists', async () => {
      stub(collection, 'findOne').callsFake(() => ({ _id: '5', name: 'A New Project' }));
      const result = await co(project.insert('A New Project'));
      collection.findOne.restore();
      expect(result).to.equal(false, 'Should have returned false since record exists.');
      expect(db.close.called).to.equal(true, 'db.close was not called');
    });

    it('throws an AssertionError when mongo reports an insert failure', async () => {
      collection.insertOne.restore();
      stub(collection, 'insertOne').callsFake(() => ({ insertedCount: 0 }));
      await co(project.insert('A New Project')).then(() => {
        assert.fail('Should have thrown an exception');
      }).catch((err) => {
        // do nothing
        expect(err.name).to.equal('AssertionError');
      });
      collection.insertOne.restore();
      spy(collection, 'insertOne');
      expect(db.close.called).to.equal(true, 'db.close was not called');
    });
  });

  describe('remove', () => {
    it('opens and closes the database connection', async () => {
      await co(project.remove('Project 1'));
      expect(db.collection.called).to.equal(true, 'did not have db connection - did not obtain collection reference');
      expect(db.close.called).to.equal(true, 'db.close was not called');
    });
    it('calls MongoDB to remove the project', async () => {
      const result = await co(project.remove('Project 1'));
      expect(collection.findAndRemove.called).to.equal(true, 'did not call findAndRemove on the collection');

      expect(result).to.equal(true, 'Should have returned true after removing record');
    });
    it('returns false when the project doesn\'t exist', async () => {
      collection.findAndRemove.restore();
      stub(collection, 'findAndRemove').callsFake(() => ({ r: 0 }));
      const result = await co(project.remove('Project 1'));
      collection.findAndRemove.restore();
      expect(result).to.equal(false, 'Should have returned false since record does not exist.');
      expect(db.close.called).to.equal(true, 'db.close was not called');
    });
  });
});

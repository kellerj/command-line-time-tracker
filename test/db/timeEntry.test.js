import { expect, assert } from 'chai';
import sinon from 'sinon';
import { format } from 'date-fns';

/* eslint-disable no-unused-vars,require-yield,arrow-body-style */
const cursor = {
  sort: sortObj => cursor,
  limit: limitNum => cursor,
  async toArray() {
    return [
      { _id: '1', entryDate: '2018-02-11', insertTime: new Date() },
      { _id: '2', entryDate: '2018-02-11', insertTime: new Date() },
      { _id: '3', entryDate: '2018-02-11', insertTime: new Date() },
      { _id: '4', entryDate: '2018-02-11', insertTime: new Date() },
    ];
  },
};

const collection = {
  find(queryObj) { return cursor; },
  async findOne(queryObj) { return null; },
  async insertOne(obj) { return { insertedCount: 1 }; },
  async updateOne(obj) { return { result: { nModified: 1 } }; },
  async findAndRemove(queryObj) { return { ok: 1, value: {} }; },
};

const db = {
  collection: (collectionName) => {
    // console.log('db.collection');
    return collection;
  },
  close: () => {
    // console.log('db.close');
  },
};
/* eslint-enable no-unused-vars,require-yield */

// eslint-disable-next-line require-yield
async function getConnection() {
  return db;
}

const lib = require('../../src/db/timeEntry')(getConnection);

describe('db/timeEntry', () => {
  const sandbox = sinon.sandbox.create();

  beforeEach(() => {
    sandbox.spy(collection, 'findAndRemove');
    sandbox.spy(collection, 'insertOne');
    sandbox.spy(collection, 'updateOne');
    sandbox.spy(collection, 'find');
    sandbox.spy(cursor, 'sort');
    sandbox.spy(cursor, 'limit');

    sandbox.spy(db, 'collection');
    sandbox.spy(db, 'close');
  });

  afterEach(() => {
    // Restore all the things made through the sandbox
    sandbox.restore();
  });

  describe('#insert', () => {
    it('sets the entry date on the object if none present', async () => {
      const timeEntry = {};
      lib.setDebug(true);
      await lib.insert(timeEntry);
      lib.setDebug(false);
      expect(timeEntry, 'time Entry did not include today\'s date').to.include({ entryDate: format(new Date(), 'YYYY-MM-DD') });
    });
    it('calls insertOne on the collection with the passed in object', async () => {
      const timeEntry = { entryDate: '2018-02-11' };
      const result = await lib.insert(timeEntry);
      expect(collection.insertOne.calledWithExactly(timeEntry)).to.equal(true, 'did not call insertOne on the collection');

      expect(result).to.equal(true, 'Should have returned true after inserting record');
    });
    it('opens and closes the database connection', async () => {
      const timeEntry = {};
      await lib.insert(timeEntry);
      expect(db.collection.called).to.equal(true, 'did not have db connection - did not obtain collection reference');
      expect(db.close.called).to.equal(true, 'db.close was not called');
    });
    it('throws an error if unable to insert the entry', async () => {
      collection.insertOne.restore();
      sandbox.stub(collection, 'insertOne').callsFake(() => ({ insertedCount: 0 }));
      await lib.insert({}).then(() => {
        assert.fail('Should have thrown an exception');
      }).catch((err) => {
        expect(err.name).to.contain('AssertionError');
      });
      expect(db.close.called).to.equal(true, 'db.close was not called');
    });
  });
  describe('#update', () => {
    it('Calls updateOne on the collection with the passed in object using the _id of the object', async () => {
      const timeEntry = {
        _id: 'entryId',
        description: 'updatedDescription',
      };
      const result = await lib.update(timeEntry);
      expect(collection.updateOne.calledWithExactly({ _id: timeEntry._id }, timeEntry), 'did not pass expected parameters to update method');
      expect(result).to.equal(true, 'method should have returned true');
    });
    it('throws an error if unable to update the entry', async () => {
      collection.updateOne.restore();
      sandbox.stub(collection, 'updateOne').callsFake(() => ({ result: { nModified: 0 } }));
      try {
        await lib.update({});
        assert.fail('Should have thrown an exception');
      } catch (err) {
        expect(err.name).to.contain('AssertionError');
      }
      expect(db.close.called).to.equal(true, 'db.close was not called');
    });
    it('opens and closes the database connection', async () => {
      const timeEntry = {};
      await lib.update(timeEntry);
      expect(db.collection.called).to.equal(true, 'did not have db connection - did not obtain collection reference');
      expect(db.close.called).to.equal(true, 'db.close was not called');
    });
  });
  describe('#get', () => {
    it('queries the collection using the start and end date criteria');
    it('sets the end date to the start date if the end date is not passed');
    it('orders the results by their insert time');
    it('returns an array with the results');
    it('opens and closes the database connection');
  });
  describe('#remove', () => {
    it('opens and closes the database connection');
    it('calls findAndRemove using the entry ID passed in');
    it('returns true if able to delete the entry');
    it('returns false if unable to delete the entry and writes an error to stderr');
  });
  describe('#getMostRecentEntry', () => {
    it('uses the current date if no beforeDate passed');
    it('only returns first row from the cursor order by insert date', async () => {
      const result = await lib.getMostRecentEntry('2018-02-11');
      expect(collection.find.called).to.equal(true, 'collection.find not called');
      expect(cursor.limit.calledWithExactly(1)).to.equal(true, 'cursor.limit not called');
      expect(cursor.sort.firstCall.args[0]).to.include({ insertTime: -1 }, 'did not attempt to sort by insert descending');
      const dbResults = await cursor.toArray();
      expect(result._id).to.equal(dbResults[0]._id, 'did not return first row from cursor');
    });
    it('queries for entries on the given date and before the given time');
  });
  describe('#summarizeByProjectAndTimeType', () => {
    it('sets the end date to the start date if the end date is not passed');
    it('filters on the given start date and end date');
    it('groups by project and time type');
    it('summarizes minutes');
    it('projects properties into the results');
    it('returns the resultset');
  });

  // describe('remove', () => {
  //   it('opens and closes the database connection', async () => {
  //     await project.remove('Project 1');
  //     expect(db.collection.called).to.equal(true, 'did not have db connection - did not obtain collection reference');
  //     expect(db.close.called).to.equal(true, 'db.close was not called');
  //   });
  //   it('calls MongoDB to remove the project', async () => {
  //     const result = await project.remove('Project 1');
  //     expect(collection.findAndRemove.called).to.equal(true, 'did not call findAndRemove on the collection');
  //
  //     expect(result).to.equal(true, 'Should have returned true after removing record');
  //   });
  //   it('returns false when the project doesn\'t exist', async () => {
  //     collection.findAndRemove.restore();
  //     stub(collection, 'findAndRemove').callsFake(() => ({ r: 0 }));
  //     const result = await project.remove('Project 1');
  //     collection.findAndRemove.restore();
  //     expect(result).to.equal(false, 'Should have returned false since record does not exist.');
  //     expect(db.close.called).to.equal(true, 'db.close was not called');
  //   });
  // });
});

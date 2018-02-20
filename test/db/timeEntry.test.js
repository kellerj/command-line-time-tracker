import { expect, assert } from 'chai';
import sinon from 'sinon';
import { format, isSameMinute, parse as dateParse } from 'date-fns';
import { DATE_FORMAT } from '../../src/constants';

const NOW = new Date();

/* eslint-disable no-unused-vars,require-yield,arrow-body-style */
// Mock object to simulate a MongoDB Cursor
const cursor = {
  sort: sortObj => cursor,
  limit: limitNum => cursor,
  async toArray() {
    return [
      { _id: '1', entryDate: '2018-02-11', insertTime: NOW },
      { _id: '2', entryDate: '2018-02-11', insertTime: NOW },
      { _id: '3', entryDate: '2018-02-11', insertTime: NOW },
      { _id: '4', entryDate: '2018-02-11', insertTime: NOW },
    ];
  },
};

const aggregationCursor = {
  async toArray() {
    return [
    ];
  },
};

// Mock object to simulate the MongoDB Connection object
const collection = {
  // This one is *not* async since it returns a cursor.  It's the Cursor.toArray() method which is async
  find(queryObj) { return cursor; },
  async findOne(queryObj) { return null; },
  async insertOne(obj) { return { insertedCount: 1 }; },
  async updateOne(obj) { return { result: { nModified: 1 } }; },
  async findAndRemove(queryObj) { return { ok: 1, value: {} }; },
  aggregate(pipeline) { return aggregationCursor; },
};

// Mock object to simulate the MongoDB Database/connection object
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
    sandbox.spy(collection, 'aggregate');
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
      expect(timeEntry, 'time Entry did not include today\'s date').to.include({ entryDate: format(NOW, 'YYYY-MM-DD') });
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
    it('queries the collection using the start and end date criteria', async () => {
      const startDate = dateParse('2018-02-11');
      const endDate = NOW;
      await lib.get(startDate, endDate);
      expect(collection.find.callCount).to.equal(1, 'find should only have been called once');
      const findCall = collection.find.firstCall;
      expect(findCall.args[0]).to.deep.include({
        entryDate: { $gte: '2018-02-11', $lte: format(endDate, DATE_FORMAT) },
      }, 'did not call the MongoDB find with the correct arguments');
    });
    it('optimizes the query when start and end dates are the same', async () => {
      const startDate = dateParse('2018-02-11');
      const endDate = startDate;
      await lib.get(startDate, endDate);
      expect(collection.find.callCount).to.equal(1, 'find should only have been called once');
      const findCall = collection.find.firstCall;
      expect(findCall.args[0]).to.deep.include({
        entryDate: '2018-02-11',
      }, 'did not call the MongoDB find with the correct arguments');
    });
    it('sets the end date to the start date if the end date is not passed', async () => {
      const startDate = dateParse('2018-02-11');
      await lib.get(startDate);
      expect(collection.find.callCount).to.equal(1, 'find should only have been called once');
      const findCall = collection.find.firstCall;
      expect(findCall.args[0]).to.deep.include({
        entryDate: '2018-02-11',
      }, 'did not call the MongoDB find with the correct arguments');
    });
    it('uses today\'s date if the start date and end date are not passed', async () => {
      const today = NOW;
      await lib.get();
      expect(collection.find.callCount).to.equal(1, 'find should only have been called once');
      const findCall = collection.find.firstCall;
      expect(findCall.args[0]).to.deep.include({
        entryDate: format(today, DATE_FORMAT),
      }, 'did not call the MongoDB find with the correct arguments');
    });
    it('orders the results by their insert time', async () => {
      await lib.get();
      expect(cursor.sort.callCount).to.equal(1, 'sort should have been called');
      const findCall = cursor.sort.firstCall;
      expect(findCall.args[0]).to.deep.include({
        insertTime: 1,
      }, 'did not call sort with the expected arguments');
    });
    it('returns an array with the results', async () => {
      const result = await lib.get();
      expect(result).to.be.an('array', 'should have returned an array data type');
      const dbResults = await cursor.toArray();
      expect(result).to.deep.equal(dbResults, 'did not return result array from MongoDB');
    });
    it('opens and closes the database connection', async () => {
      await lib.get();
      expect(db.collection.called).to.equal(true, 'did not have db connection - did not obtain collection reference');
      expect(db.close.called).to.equal(true, 'db.close was not called');
    });
  });
  describe('#remove', () => {
    it('opens and closes the database connection', async () => {
      await lib.remove('123');
      expect(db.collection.called).to.equal(true, 'did not have db connection - did not obtain collection reference');
      expect(db.close.called).to.equal(true, 'db.close was not called');
    });
    it('calls findAndRemove using the entry ID passed in');
    it('returns true if able to delete the entry');
    it('returns false if unable to delete the entry and writes an error to stderr');
  });
  describe('#getMostRecentEntry', () => {
    it('queries for entries on the given date and before the given time', async () => {
      const now = NOW;
      await lib.getMostRecentEntry('2018-02-11', now);
      expect(collection.find.callCount).to.equal(1, 'find should only have been called once');
      const findCall = collection.find.firstCall;
      expect(findCall.args[0]).to.deep.include({
        entryDate: '2018-02-11',
        insertTime: { $lt: now },
      }, 'did not call the MongoDB find with the correct arguments');
    });
    it('uses the current time if no beforeDate passed', async () => {
      const now = new Date();
      await lib.getMostRecentEntry('2018-02-11');
      expect(collection.find.callCount).to.equal(1, 'find should only have been called once');
      const findCall = collection.find.firstCall;
      const mongoQuery = findCall.args[0];
      expect(mongoQuery.insertTime.$lt).to.satisfy(insertTime => isSameMinute(insertTime, now));
    });
    it('uses the date from the before date for the entry date is null', async () => {
      const now = NOW;
      await lib.getMostRecentEntry(null, now);
      expect(collection.find.callCount).to.equal(1, 'find should only have been called once');
      expect(collection.find.firstCall.args[0]).to.deep.include({
        entryDate: format(now, DATE_FORMAT),
        insertTime: { $lt: now },
      }, 'did not set date when entry date was null');
    });
    it('uses the date from the before date for the entry date is undefined', async () => {
      const now = NOW;
      await lib.getMostRecentEntry(undefined, now);
      expect(collection.find.callCount).to.equal(1, 'find should only have been called once');
      expect(collection.find.firstCall.args[0]).to.deep.include({
        entryDate: format(now, DATE_FORMAT),
        insertTime: { $lt: now },
      }, 'did not set date when entry date was undefined');
    });
    it('uses the date from the before date for the entry date is empty', async () => {
      const now = NOW;
      await lib.getMostRecentEntry('', now);
      expect(collection.find.callCount).to.equal(1, 'find should only have been called once');
      expect(collection.find.firstCall.args[0]).to.deep.include({
        entryDate: format(now, DATE_FORMAT),
        insertTime: { $lt: now },
      }, 'did not set date when entry date was blank');
    });
    it('returns null when no entries found', async () => {
      sandbox.stub(cursor, 'toArray').callsFake(async () => ({ result: { nModified: 0 } }));
      const result = await lib.getMostRecentEntry();
      expect(result).to.equal(null, 'should have returned null');
    });
    it('resets to the current date if the user explicitly sends a null or undefined before time', async () => {
      const now = new Date();
      await lib.getMostRecentEntry(null, null);
      expect(collection.find.callCount).to.equal(1, 'find should only have been called once');
      const findCall = collection.find.firstCall;
      const mongoQuery = findCall.args[0];
      expect(mongoQuery.insertTime.$lt).to.satisfy(insertTime => isSameMinute(insertTime, now));
    });
    it('only returns first row from the cursor order by insert date', async () => {
      const result = await lib.getMostRecentEntry('2018-02-11');
      expect(collection.find.called).to.equal(true, 'collection.find not called');
      expect(cursor.limit.calledWithExactly(1)).to.equal(true, 'cursor.limit not called');
      expect(cursor.sort.firstCall.args[0]).to.include({ insertTime: -1 }, 'did not attempt to sort by insert descending');
      const dbResults = await cursor.toArray();
      expect(result._id).to.equal(dbResults[0]._id, 'did not return first row from cursor');
    });
  });
  describe('#summarizeByProjectAndTimeType', () => {
    it('filters on the given start date and end date', async () => {
      await lib.summarizeByProjectAndTimeType('2018-02-11', '2018-02-12');
      expect(collection.aggregate.called).to.equal(true, 'collection.aggregate not called');
      const call = collection.aggregate.firstCall;
      const pipeline = call.args[0];
      const matchEntry = pipeline.find(e => (e.$match));
      expect(matchEntry).to.be.an('object', 'no $match entry present in the pipeline');
      expect(matchEntry.$match).to.deep.include({
        entryDate: {
          $gte: '2018-02-11',
          $lte: '2018-02-12',
        },
      });
    });
    it('sets the end date to the start date if the end date is not passed', async () => {
      await lib.summarizeByProjectAndTimeType('2018-02-11');
      const call = collection.aggregate.firstCall;
      const pipeline = call.args[0];
      const matchEntry = pipeline.find(e => (e.$match));
      expect(matchEntry.$match).to.deep.include({
        entryDate: {
          $gte: '2018-02-11',
          $lte: '2018-02-11',
        },
      });
    });
    it('uses today\'s date if no date passed in', async () => {
      await lib.summarizeByProjectAndTimeType();
      const call = collection.aggregate.firstCall;
      const pipeline = call.args[0];
      const matchEntry = pipeline.find(e => (e.$match));
      expect(matchEntry.$match).to.deep.include({
        entryDate: {
          $gte: format(NOW, DATE_FORMAT),
          $lte: format(NOW, DATE_FORMAT),
        },
      });
    });
    it('groups by project and time type', async () => {
      await lib.summarizeByProjectAndTimeType('2018-02-11', '2018-02-12');
      expect(collection.aggregate.called).to.equal(true, 'collection.aggregate not called');
      const call = collection.aggregate.firstCall;
      const pipeline = call.args[0];
      const groupEntry = pipeline.find(e => (e.$group));
      expect(groupEntry).to.be.an('object', 'no $group entry present in the pipeline');
      const groupFields = groupEntry.$group._id;
      let groupsByProject = false;
      let groupsByTimeType = false;
      Object.keys(groupFields).forEach((key) => {
        if (groupFields[key] === '$project') {
          groupsByProject = true;
        }
        if (groupFields[key] === '$timeType') {
          groupsByTimeType = true;
        }
      });
      expect(groupsByProject).to.equal(true, 'aggregation is not grouping by project');
      expect(groupsByTimeType).to.equal(true, 'aggregation is not grouping by time type');
    });
    it('summarizes minutes', async () => {
      await lib.summarizeByProjectAndTimeType('2018-02-11', '2018-02-12');
      expect(collection.aggregate.called).to.equal(true, 'collection.aggregate not called');
      const call = collection.aggregate.firstCall;
      const pipeline = call.args[0];
      const groupEntry = pipeline.find(e => (e.$group));
      expect(groupEntry).to.be.an('object', 'no $group entry present in the pipeline');
      const sumCommand = groupEntry.$group[Object.keys(groupEntry.$group)
        .find(key => groupEntry.$group[key].$sum)];
      expect(sumCommand).to.be.an('object', 'no $sum present in the group');
      expect(sumCommand.$sum).to.equal('$minutes');
    });
    it('projects properties into the results');
    it('returns the resultset');
    it('opens and closes the database connection', async () => {
      await lib.summarizeByProjectAndTimeType();
      expect(db.collection.called).to.equal(true, 'did not have db connection - did not obtain collection reference');
      expect(db.close.called).to.equal(true, 'db.close was not called');
    });
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

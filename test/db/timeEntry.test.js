import { expect, assert } from 'chai';
import { spy, stub } from 'sinon';

const cursor = {
  // eslint-disable-next-line no-unused-vars
  sort: sortObj => cursor,
  // eslint-disable-next-line no-unused-vars
  toArray: () => [
    // { _id: '1', name: 'Project 1' },
    // { _id: '2', name: 'Project 2' },
    // { _id: '3', name: 'Project 3' },
    // { _id: '4', name: 'Project 4' },
  ],
};

const collection = {
  // eslint-disable-next-line no-unused-vars,require-yield
  find(queryObj) { return cursor; },
  // eslint-disable-next-line no-unused-vars,require-yield
  async findOne(queryObj) { return null; },
  // eslint-disable-next-line no-unused-vars,require-yield
  async insertOne(obj) { return { insertedCount: 1 }; },
  // eslint-disable-next-line no-unused-vars,require-yield
  async findAndRemove(queryObj) { return { ok: 1, value: {} }; },
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
async function getConnection() {
  return db;
}

const timeEntry = require('../../src/db/timeEntry')(getConnection);

describe('db/timeEntry', () => {
  describe('#insert', () => {
    it('sets the entry date on the object if none present');
    // const result = await project.insert('A New Project');
    // expect(collection.insertOne.called).to.equal(true, 'did not call insertOne on the collection');
    //
    // expect(result).to.equal(true, 'Should have returned true after inserting record');
    it('calls insertOne on the collection with the passed in object');
    it('opens and closes the database connection');
    it('throws an error if unable to insert the entry');
  });
  describe('#update', () => {
    it('Calls updateOne on the collection with the passed in object using the _id of the object');
    it('throws an error if unable to update the entry');
    it('opens and closes the database connection');
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

  });
  describe('#summarizeByProjectAndTimeType', () => {

  });
  // expect(db.collection.called).to.equal(true, 'did not have db connection - did not obtain collection reference');
  // expect(db.close.called).to.equal(true, 'db.close was not called');


  // it('throws an AssertionError when mongo reports an insert failure', async () => {
  //   collection.insertOne.restore();
  //   stub(collection, 'insertOne').callsFake(() => ({ insertedCount: 0 }));
  //   await project.insert('A New Project').then(() => {
  //     assert.fail('Should have thrown an exception');
  //   }).catch((err) => {
  //     // do nothing
  //     expect(err.name).to.contain('AssertionError');
  //   });
  //   collection.insertOne.restore();
  //   spy(collection, 'insertOne');
  //   expect(db.close.called).to.equal(true, 'db.close was not called');
  // });

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

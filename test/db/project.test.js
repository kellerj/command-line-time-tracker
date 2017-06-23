const expect = require('chai').expect;
const assert = require('chai').assert;
// const moment = require('moment');
// const sinon = require('sinon');
const spy = require('sinon').spy;
const mock = require('sinon').mock;
const stub = require('sinon').stub;
const co = require('co');

const cursor = {
  // eslint-disable-next-line no-unused-vars
  sort: sortObj => cursor,
  // eslint-disable-next-line no-unused-vars
  toArray: () => [],
};

const collection = {
  // eslint-disable-next-line no-unused-vars
  find: queryObj => cursor,
};

const db = {
  // eslint-disable-next-line no-unused-vars
  collection: (collectionName) => {
    console.log('db.collection');
    return collection;
  },
  close: () => {
    console.log('db.close');
  },
};

const closeSpy = spy(db, 'close');

// eslint-disable-next-line require-yield
function* getConnection() {
  return db;
}

const project = require('../../db/project')(getConnection);

describe('db/project', () => {
  describe('getAll', () => {
    // it('returns a list of all project names returned from MongoDB', () => {
    //   co(project.getAll());
    // });
    it('opens and closes the database connection', () => {
      co(project.getAll()).then((result) => {
        console.log(`Called: ${db.close.called}`);
        assert(closeSpy.called, 'db.close was not called');
        assert.fail('', '', 'unimplemented test');
      });
    });
    // it('sorts the projects by name', () => {
    //   assert.fail('', '', 'unimplemented test');
    // });
  });
});

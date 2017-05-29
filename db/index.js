const MongoClient = require('mongodb').MongoClient;
const config = require('./config');
const debug = require('debug')('db');

function* getConnection() {
  debug(`Connecting to ${config.db.url}`);
  const db = yield MongoClient.connect(config.db.url, {
    autoReconnect: false,
    poolSize: 1,
  });
  debug('Connected to MongoDB');
  return db;
}

/* eslint-disable global-require */
module.exports = {
  project: require('./project')(getConnection),
  timetype: require('./timetype')(getConnection),
  timeEntry: require('./timeEntry')(getConnection),
};

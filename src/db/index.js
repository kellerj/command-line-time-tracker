import { MongoClient } from 'mongodb';
import debug from 'debug';

import config from './config';

const LOG = debug('db');

async function getConnection() {
  LOG(`Connecting to ${config.db.url}`);
  const db = await MongoClient.connect(config.db.url, {
    autoReconnect: false,
    poolSize: 1,
  });
  LOG('Connected to MongoDB');
  return db;
}

/* eslint-disable global-require */
module.exports = {
  project: require('./project')(getConnection),
  timetype: require('./timetype')(getConnection),
  timeEntry: require('./timeEntry')(getConnection),
};

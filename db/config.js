const host = 'localhost';
const port = 27017;
const database = 'tt-dev';
const debug = require('debug')('db:config');

debug(`Using ${database} on ${host}:${port}`);

module.exports = {
  db: {
    baseUrl: `mongodb://${host}:${port}`,
    url: `mongodb://${host}:${port}/${database}`,
  },
};

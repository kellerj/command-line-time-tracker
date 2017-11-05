const host = 'localhost';
const port = 27017;
const database = 'tt';
const LOG = require('debug')('db:config');

LOG(`Using ${database} on ${host}:${port}`);

module.exports = {
  db: {
    baseUrl: `mongodb://${host}:${port}`,
    url: `mongodb://${host}:${port}/${database}`,
  },
};

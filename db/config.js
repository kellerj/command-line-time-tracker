const host = 'localhost';
const port = 27017;
const database = 'tt';

module.exports = {
  db: {
    baseUrl: `mongodb://${host}:${port}`,
    url: `mongodb://${host}:${port}/${database}`,
  },
};

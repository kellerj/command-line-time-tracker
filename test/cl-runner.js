process.argv[2] = '-d';
process.argv[3] = '2017-05-07';
console.log(process.argv);

const tool = require('../commands/tt-list');

console.log(tool);

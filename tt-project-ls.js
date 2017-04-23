#!/usr/bin/env node

const commander = require('commander');
const co = require('co');
const chalk = require('chalk');
const Table = require('easy-table');
const db = require('./db');

commander
    .version('1.0.0')
    .description('List all current projects in alphabetical order.')
    .parse(process.argv);

co(function* run() {
  const r = yield* db.project.getAll();

  if (r) {
    // console.log(JSON.stringify(r));
    // eslint-disable-next-line no-param-reassign
    console.log(chalk.yellow(Table.print(r.map((item) => { delete item._id; return item; }),
      { name: { name: chalk.white.bold('Project Name') } })));
  } else {
    console.log(chalk.yellow('No Projects Defined'));
  }
}).catch((err) => {
  console.log(chalk.bgRed(err.stack));
});

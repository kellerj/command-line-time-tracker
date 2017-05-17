#!/usr/bin/env node

const commander = require('commander');
const co = require('co');
const chalk = require('chalk');
const Table = require('easy-table');
const moment = require('moment');
const db = require('./db');
const tableUtils = require('./table-utils');
const debug = require('debug')('tt:ls');

commander
    .version('1.0.0')
    .description('List time entries in a tabular format.')
    //.option('--csv', 'Output in a CSV format instead of ASCII table.')
    .option('-d, --date <YYYY-MM-DD>', 'Specify the date to output, otherwise use today\'s date.')
    .option('--nodate', 'Suppress the date in the first column')
    .parse(process.argv);

let entryDate = commander.date;
const noDateOutput = commander.nodate;

// if not set, use today.  In either case set to start of day
if (!entryDate) {
  entryDate = moment().startOf('day').toDate();
} else {
  if (!moment(entryDate, 'YYYY-MM-DD').isValid()) {
    console.log(chalk.red(`Date ${entryDate} is not a valid date.`));
    process.exit(-1);
  }
  entryDate = moment(entryDate).startOf('day').toDate();
}

co(function* run() {
  const r = yield* db.timeEntry.get(entryDate);

  if (r && r.length) {
    debug(JSON.stringify(r, null, 2));
    const t = new Table();
    r.forEach((item) => {
      if (!noDateOutput) {
        t.cell('Date', item.entryDate, tableUtils.entryDatePrinter);
      }
      t.cell('Logged', item.insertTime, tableUtils.insertTimePrinter);
      t.cell('Project', item.project ? item.project : '');
      t.cell('Type', item.timeType ? item.timeType : '');
      t.cell('Time', item.minutes ? item.minutes : 0, tableUtils.timePrinter);
      t.cell('Description', item.entryDescription);
      t.cell(' ', item.wasteOfTime ? '💩' : '');
      t.newRow();
    });
    t.total('Time', {
      printer: tableUtils.timePrinter,
    });
    console.log(t.toString());
  } else {
    console.log(chalk.yellow(`No Time Entries Defined for ${moment(entryDate).format('YYYY-MM-DD')}`));
  }
}).catch((err) => {
  console.log(chalk.bgRed(err.stack));
});

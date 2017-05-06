#!/usr/bin/env node

const commander = require('commander');
const co = require('co');
const chalk = require('chalk');
const Table = require('easy-table');
const moment = require('moment');
const db = require('./db');

commander
    .version('1.0.0')
    .description('List time entries in a tabular format.')
    .option('--csv', 'Output in a CSV format instead of ASCII table.')
    .option('-d, --date', 'Specify the date to output, otherwise use today\'s date.')
    .parse(process.argv);

let entryDate = commander.date;

// if not set, use today.  In either case set to start of day
if (!entryDate) {
  entryDate = moment().startOf('day').toDate();
} else {
  entryDate = moment(entryDate).startOf('day').toDate();
}


// eslint-disable-next-line no-unused-vars
function entryDatePrinter(val, width) {
  const str = moment(val).format('ddd, MMM Do');
  return str;
}

// eslint-disable-next-line no-unused-vars
function insertTimePrinter(val, width) {
  const str = moment(val).format('h:mm a');
  return str;
}

function timePrinter(val, width) {
  const duration = moment.duration(val, 'minutes');
  let str = '';
  if (duration.get('hours')) {
    str += `${duration.get('hours')}h `;
  }
  if (duration.get('minutes')) {
    str += `${duration.get('minutes')}m`;
  }
  str = str.trim();
  return width ? Table.padLeft(str, width) : str;
}

co(function* run() {
  const r = yield* db.timeEntry.get(entryDate);

  if (r) {
    console.log(JSON.stringify(r));
    const t = new Table();
    r.forEach((item) => {
      t.cell('Date', item.entryDate, entryDatePrinter);
      t.cell('Logged', item.insertTime, insertTimePrinter);
      t.cell('Project', item.project);
      t.cell('Type', item.timeType);
      t.cell('Time', item.minutes, timePrinter);
      t.cell('Description', item.entryDescription);
      t.newRow();
    });
    t.total('Time', { printer: timePrinter });
    console.log(t.toString());
  } else {
    console.log(chalk.yellow('No Time Entries Defined'));
  }
}).catch((err) => {
  console.log(chalk.bgRed(err.stack));
});

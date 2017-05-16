#!/usr/bin/env node

const commander = require('commander');
const co = require('co');
const chalk = require('chalk');
const Table = require('easy-table');
const moment = require('moment');
const db = require('./db');
const debug = require('debug')('tt:summary');

commander
    .version('1.0.0')
    .description('Summarize time entry data in various formats.')
    //.option('--csv', 'Output in a CSV format instead of ASCII table.')
    .option('-d, --date <YYYY-MM-DD>', 'Specify the date to output, otherwise use today\'s date.')
    .parse(process.argv);

let entryDate = commander.date;

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
  const r = yield* db.timeEntry.summarizeByProjectAndTimeType(entryDate);
  debug(JSON.stringify(r, null, 2));

  // need to transform the structure into a new grid format - group by project
  // and build a record with keys for each time type
  const headings = r.reduce((acc, item) => {
    if (acc.indexOf(item.timeType) === -1) {
      acc.push(item.timeType);
    }
    return acc;
  }, []);
  const grid = r.reduce((acc, item) => {
    let projectRow = acc.find(i => (i.project === item.project));
    if (!projectRow) {
      projectRow = { project: item.project };
      acc.push(projectRow);
    }
    if (!projectRow[item.timeType]) {
      projectRow[item.timeType] = 0;
    }
    projectRow[item.timeType] += item.minutes;
    return acc;
  }, []);

  const t = new Table();
  grid.forEach((item) => {
    t.cell('Project', item.project ? item.project : '');
    let projectTotal = 0;
    headings.forEach((heading) => {
      t.cell(heading, item[heading] ? item[heading] : 0, timePrinter);
      projectTotal += item[heading] ? item[heading] : 0;
    });
    t.cell('Project Total', projectTotal, timePrinter);
    t.newRow();
  });
  headings.forEach((heading) => {
    t.total(heading, {
      printer: timePrinter,
    });
  });
  t.total('Project Total', {
    printer: timePrinter,
  });
  console.log(t.toString());
}).catch((err) => {
  console.log(chalk.bgRed(err.stack));
});

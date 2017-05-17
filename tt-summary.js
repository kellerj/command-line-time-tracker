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
    .option('-s, --startDate <YYYY-MM-DD>')
    .option('-e, --endDate <YYYY-MM-DD>')
    .parse(process.argv);

// Initialize to string values: will be converted to date objects later
let entryDate = commander.date;
let startDate = commander.startDate;
let endDate = commander.endDate;

// debug(commander);

function validateAndDefaultInputDateString(dateString) {
  if (!dateString) {
    return moment().startOf('day');
  }
  if (!moment(dateString, 'YYYY-MM-DD').isValid()) {
    console.log(chalk.red(`Date ${dateString} is not a valid date.`));
    process.exit(-1);
  }
  return moment(dateString).startOf('day');
}

// if not set, use today.  In either case set to start of day
if (entryDate || (!startDate && !endDate)) {
  debug(`Start and end date not set, using entryDate: ${entryDate}`);
  entryDate = validateAndDefaultInputDateString(entryDate);
  startDate = entryDate;
  endDate = entryDate;
} else {
  debug(`Using start and end dates: ${startDate} -- ${endDate}`);
  // we have a start date and/or end date
  startDate = validateAndDefaultInputDateString(startDate);
  endDate = validateAndDefaultInputDateString(endDate);
  if (startDate.isAfter(endDate)) {
    debug(`${startDate} is after ${endDate}`);
    startDate = endDate;
  }
}
// done with the moment objects - convert to dates for later use
startDate = startDate.toDate();
endDate = endDate.toDate();

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
  if (duration.asHours() >= 1) {
    str += `${Math.floor(duration.asHours())}h `;
  }
  if (duration.minutes()) {
    str += Table.padLeft(`${duration.minutes()}m`, 3);
  } else {
    str += '   ';
  }
  return width ? Table.padLeft(str, width) : str;
}

co(function* run() {
  const r = yield* db.timeEntry.summarizeByProjectAndTimeType(startDate, endDate);
  debug(JSON.stringify(r, null, 2));
  // eslint-disable-next-line no-param-reassign
  const totalTime = r.reduce((acc, item) => (acc += item.minutes), 0);
  console.log(totalTime);
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
    t.cell('Totals', projectTotal, timePrinter);
    t.cell('   %', Table.padLeft(`${Math.round(100 * (projectTotal / totalTime), 0)}%`, 4));
    t.newRow();
  });
  headings.forEach((heading) => {
    t.total(heading, {
      printer: timePrinter,
    });
  });
  t.total('Totals', {
    printer: timePrinter,
  });
  console.log(t.toString());
}).catch((err) => {
  console.log(chalk.bgRed(err.stack));
});

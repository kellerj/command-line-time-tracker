#!/usr/bin/env node

const commander = require('commander');
const co = require('co');
const chalk = require('chalk');
const Table = require('easy-table');
const db = require('./db');
const validations = require('./validations');
const displayUtils = require('./display-utils');
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

// if not set, use today.  In either case set to start of day
if (entryDate || (!startDate && !endDate)) {
  debug(`Start and end date not set, using entryDate: ${entryDate}`);
  entryDate = validations.validateAndDefaultInputDateString(entryDate);
  startDate = entryDate;
  endDate = entryDate;
} else {
  debug(`Using start and end dates: ${startDate} -- ${endDate}`);
  // we have a start date and/or end date
  startDate = validations.validateAndDefaultInputDateString(startDate);
  endDate = validations.validateAndDefaultInputDateString(endDate);
  if (startDate.isAfter(endDate)) {
    debug(`${startDate} is after ${endDate}`);
    startDate = endDate;
  }
}
// done with the moment objects - convert to dates for later use
startDate = startDate.toDate();
endDate = endDate.toDate();

co(function* run() {
  const r = yield* db.timeEntry.summarizeByProjectAndTimeType(startDate, endDate);
  if (!r.length) {
    console.log(chalk.yellow('There are no time entries to summarize for the given period.'));
    return;
  }
  debug(JSON.stringify(r, null, 2));
  // eslint-disable-next-line no-param-reassign
  const totalTime = r.reduce((acc, item) => (acc += item.minutes), 0);
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
      t.cell(heading, item[heading] ? item[heading] : 0, displayUtils.timePrinter);
      projectTotal += item[heading] ? item[heading] : 0;
    });
    t.cell('Totals', projectTotal, displayUtils.timePrinter);
    t.cell('   %', Table.padLeft(`${Math.round(100 * (projectTotal / totalTime), 0)}%`, 4));
    t.newRow();
  });
  headings.forEach((heading) => {
    t.total(heading, {
      printer: displayUtils.timePrinter,
    });
  });
  t.total('Totals', {
    printer: displayUtils.timePrinter,
  });
  console.log(t.toString());
}).catch((err) => {
  console.log(chalk.bgRed(err.stack));
});

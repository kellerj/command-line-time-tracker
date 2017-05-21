#!/usr/bin/env node

const commander = require('commander');
const co = require('co');
const chalk = require('chalk');
const Table = require('easy-table');
const db = require('./db');
const debug = require('debug')('tt:summary');
const validations = require('./validations');
const displayUtils = require('./display-utils');
const moment = require('moment');

commander
    .version('1.0.0')
    .description('Summarize time entry data in various formats.')
    //.option('--csv', 'Output in a CSV format instead of ASCII table.')
    .option('-d, --date <YYYY-MM-DD>', 'Specify the date to output, otherwise use today\'s date.')
    .option('-s, --startDate <YYYY-MM-DD>')
    .option('-e, --endDate <YYYY-MM-DD>')
    .option('--week', 'Report for the current week (starting Monday).')
    .option('--month', 'Report for the current month.')
    .option('--last', 'Change the week or month criteria to the prior week or month.')
    .parse(process.argv);

// Initialize to string values: will be converted to date objects later
let entryDate = commander.date;
let startDate = commander.startDate;
let endDate = commander.endDate;

if (commander.week || commander.month) {
  const reportDate = moment();
  if (commander.week) {
    if (commander.last) {
      reportDate.subtract(1, 'week');
    }
    debug(`Setting to week containing: ${reportDate}`);
    startDate = moment(reportDate.startOf('isoWeek'));
    endDate = moment(reportDate.endOf('isoWeek'));
  } else if (commander.month) {
    if (commander.last) {
      reportDate.subtract(1, 'month');
    }
    debug(`Setting to month containing: ${reportDate}`);
    startDate = moment(reportDate.startOf('month'));
    endDate = moment(reportDate.endOf('month'));
  }
}

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
  }, []).sort((a, b) => {
    if (a !== 'Other' && b === 'Other') {
      return -1;
    } else if (a === 'Other' && b !== 'Other') {
      return 1;
    }
    return a.localeCompare(b);
  });
  let grid = r.reduce((acc, item) => {
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
  grid = grid.sort((a, b) => {
    if (a.project !== 'Other' && b.project === 'Other') {
      return -1;
    } else if (a.project === 'Other' && b.project !== 'Other') {
      return 1;
    }
    return a.project.localeCompare(b.project);
  });
  const t = new Table();
  grid.forEach((item) => {
    t.cell('Project', item.project ? item.project : '');
    let projectTotal = 0;
    headings.forEach((heading) => {
      t.cell(heading, item[heading] ? item[heading] : 0, displayUtils.timePrinter);
      projectTotal += item[heading] ? item[heading] : 0;
    });
    t.cell('Totals', projectTotal, displayUtils.timeAndPercentPrinter(totalTime));
    // t.cell('   %', Table.padLeft(`${Math.round(100 * (projectTotal / totalTime), 0)}%`, 4));
    t.newRow();
  });
  headings.forEach((heading) => {
    t.total(heading, {
      printer: displayUtils.timeAndPercentPrinter(totalTime),
    });
  });
  t.total('Totals', {
    printer: displayUtils.timePrinter,
  });

  let reportHeader = '';
  if (startDate.getTime() === endDate.getTime()) {
    reportHeader = `Time Summary Report for ${displayUtils.entryDatePrinter(startDate)}`;
  } else {
    reportHeader = `Time Summary Report for ${displayUtils.entryDatePrinter(startDate)} through ${displayUtils.entryDatePrinter(endDate)}`;
  }
  console.log(chalk.yellow('-'.repeat(reportHeader.length)));
  console.log(chalk.yellow(reportHeader));
  console.log(chalk.yellow('-'.repeat(reportHeader.length)));

  console.log(t.toString());
}).catch((err) => {
  console.log(chalk.bgRed(err.stack));
});

#!/usr/bin/env node

const commander = require('commander');
const co = require('co');
const chalk = require('chalk');
const Table = require('easy-table');
const moment = require('moment');
const db = require('../db');
const validations = require('../utils/validations');
const displayUtils = require('../utils/display-utils');
const debug = require('debug')('tt:list');

try {
  commander
    .description('List time entries in a tabular format.')
    //.option('--csv', 'Output in a CSV format instead of ASCII table.')
    .option('-d, --date <YYYY-MM-DD>', 'Specify the date to output, otherwise use today\'s date.')
    .option('-s, --startDate <YYYY-MM-DD>')
    .option('-e, --endDate <YYYY-MM-DD>')
    .option('--last', 'When no date is specified, use yesterday\'s date')
    .option('-y, --yesterday', 'When no date is specified, use yesterday\'s date')
    .parse(process.argv);

  const { startDate, endDate, errorMessage } = validations.getStartAndEndDates(commander);
  debug(`Running for Dates: ${startDate} through ${endDate}`);
  if (errorMessage) {
    throw new Error(errorMessage);
  }

  co(function* run() {
    const r = yield* db.timeEntry.get(startDate, endDate);

    if (r && r.length) {
      debug(JSON.stringify(r, null, 2));
      const t = new Table();
      r.forEach((item) => {
        if (startDate.getTime() !== endDate.getTime()) {
          t.cell('Date', item.entryDate, displayUtils.entryDatePrinter);
        }
        t.cell('Logged', item.insertTime, displayUtils.insertTimePrinter);
        t.cell('Project', item.project ? item.project : '');
        t.cell('Type', item.timeType ? item.timeType : '');
        t.cell('Time', item.minutes ? item.minutes : 0, displayUtils.timePrinter);
        t.cell('Description', item.entryDescription);
        t.cell(' ', item.wasteOfTime ? '💩' : '');
        t.newRow();
      });
      t.total('Time', {
        printer: displayUtils.timePrinter,
      });
      console.log(t.toString());
    } else {
      console.log(chalk.yellow(`No Time Entries Defined for ${moment(startDate).format('YYYY-MM-DD')}`));
    }
  }).catch((err) => {
    console.log(chalk.bgRed(err.stack));
  });
} catch (err) {
  // do nothing - just suppress the error trace
  console.log(chalk.red(err.message));
  debug(err);
}

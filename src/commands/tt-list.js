#!/usr/bin/env node -r babel-register

import commander from 'commander';
import chalk from 'chalk';
import Table from 'easy-table';
import moment from 'moment'; // TODO: Convert to use date-fns
import debug from 'debug';

import db from '../db';
import validations from '../utils/validations';
import displayUtils from '../utils/display-utils';

const LOG = debug('tt:list');

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
LOG(`Running for Dates: ${startDate} through ${endDate}`);
if (errorMessage) {
  throw new Error(errorMessage);
}

async function run() {
  const r = await db.timeEntry.get(startDate, endDate);

  if (r && r.length) {
    LOG(JSON.stringify(r, null, 2));
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
}

try {
  run().catch((err) => {
    console.log(chalk.red(err.message));
    LOG(err);
    process.exitCode = 1;
  });
} catch (err) {
  console.log(chalk.red(err.message));
  LOG(err);
  process.exitCode = 1;
}

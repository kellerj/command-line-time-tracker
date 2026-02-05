import { program } from 'commander';
import chalk from 'chalk';
import debug from 'debug';

import db from '../db/index.js';
import { Table } from '../utils/table/index.js';
import validations from '../utils/validations.js';
import displayUtils from '../utils/display-utils.js';
import {
  buildTimeTypeHeadingsList,
  buildProjectByTimeTypeDataGrid,
  buildColumnInfo,
  addTotalColumn,
} from '../lib/summarize.js';

const LOG = debug('tt:summary');

program
  .description('Summarize time entry data in various formats.')
//.option('--csv', 'Output in a CSV format instead of ASCII table.')
  .option('-d, --date <YYYY-MM-DD>', 'Specify the date to output, otherwise use today\'s date.')
  .option('-s, --startDate <YYYY-MM-DD>')
  .option('-e, --endDate <YYYY-MM-DD>')
  .option('--week', 'Report for the current week (starting Monday).')
  .option('--month', 'Report for the current month.')
  .option('--last', 'Change the day, week, or month criteria to the prior week or month.')
  .option('-y, --yesterday', 'When no date is specified, use yesterday\'s date')
  .option('--noHeader', 'Don\'t print the header with the dates above the summary')
  .option('-m, --markdown', 'Output the table using markdown formatting')
  .parse(process.argv);

const opts = program.opts();

const { startDate, endDate, errorMessage } = validations.getStartAndEndDates(opts);
if (errorMessage) {
  throw new Error(errorMessage);
}

async function run() {
  let reportHeader = '';
  if (!opts.noHeader) {
    if (startDate.getTime() === endDate.getTime()) {
      reportHeader = `Time Summary for ${displayUtils.datePrinter(startDate)}`;
    } else {
      reportHeader = `Time Summary for ${displayUtils.datePrinter(startDate)} through ${displayUtils.datePrinter(endDate)}`;
    }
    if (opts.markdown) {
      process.stdout.write(`## ${reportHeader}\n\n`);
    } else {
      displayUtils.writeHeader(reportHeader);
    }
  }

  const r = await db.timeEntry.summarizeByProjectAndTimeType(startDate, endDate);
  if (!r.length) {
    displayUtils.writeMessage('There are no time entries to summarize for the given period.');
    return;
  }
  LOG(JSON.stringify(r, null, 2));
  // and build a record with keys for each time type
  const headings = buildTimeTypeHeadingsList(r);
  // need to transform the structure into a new grid format - group by project
  const grid = buildProjectByTimeTypeDataGrid(r);
  const totalTime = r.reduce((acc, item) => (acc + item.minutes), 0);
  const columnInfo = buildColumnInfo(headings, totalTime, opts.markdown);
  // Calculate per-project totals for last column
  addTotalColumn(grid);
  const tableConfig = {};
  if (opts.markdown) {
    tableConfig.markdown = true;
  } else {
    tableConfig.dividerColorizer = chalk.dim;
    tableConfig.headerColorizer = chalk.bold.yellowBright;
    tableConfig.rowColorizer = (row, i) => ((i % 2) === 0 ? row : chalk.bgHex('#222222')(row));
  }
  const t = new Table(tableConfig);
  t.setData(grid, columnInfo);
  t.write(process.stdout);
}

try {
  run().catch((err) => {
    displayUtils.writeError(err.message);
    LOG(err);
    process.exitCode = 1;
  });
} catch (err) {
  displayUtils.writeError(err.message);
  LOG(err);
  process.exitCode = 1;
}

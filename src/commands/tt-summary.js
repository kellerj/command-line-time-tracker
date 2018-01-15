import commander from 'commander';
import chalk from 'chalk';
import debug from 'debug';

import db from '../db';
import Table from '../utils/table';
import validations from '../utils/validations';
import displayUtils from '../utils/display-utils';

const LOG = debug('tt:summary');

commander
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

// LOG(commander);

const { startDate, endDate, errorMessage } = validations.getStartAndEndDates(commander);
if (errorMessage) {
  throw new Error(errorMessage);
}

async function run() {
  let reportHeader = '';
  if (!commander.noHeader) {
    if (startDate.getTime() === endDate.getTime()) {
      reportHeader = `Time Summary Report for ${displayUtils.datePrinter(startDate)}`;
    } else {
      reportHeader = `Time Summary Report for ${displayUtils.datePrinter(startDate)} through ${displayUtils.datePrinter(endDate)}`;
    }
    if (commander.markdown) {
      process.stdout.write(`## ${reportHeader}\n\n`);
    } else {
      process.stdout.write(chalk.yellowBright('-'.repeat(reportHeader.length)));
      process.stdout.write('\n');
      process.stdout.write(chalk.yellowBright(reportHeader));
      process.stdout.write('\n');
      process.stdout.write(chalk.yellowBright('-'.repeat(reportHeader.length)));
      process.stdout.write('\n');
    }
  }

  const r = await db.timeEntry.summarizeByProjectAndTimeType(startDate, endDate);
  if (!r.length) {
    process.stdout.write(chalk.yellow('There are no time entries to summarize for the given period.'));
    process.stdout.write('\n');
    return;
  }
  LOG(JSON.stringify(r, null, 2));
  const totalTime = r.reduce((acc, item) => (acc + item.minutes), 0);
  // need to transform the structure into a new grid format - group by project
  // and build a record with keys for each time type
  const headings = r.reduce((acc, item) => {
    if (acc.indexOf(item.timeType) === -1) {
      acc.push(item.timeType);
    }
    return acc;
  }, []).sort(displayUtils.sortOtherLast);
  let grid = r.reduce((acc, item) => {
    let projectRow = acc.find(i => (i.Project === item.project));
    if (!projectRow) {
      projectRow = { Project: item.project };
      acc.push(projectRow);
    }
    if (!projectRow[item.timeType]) {
      projectRow[item.timeType] = 0;
    }
    projectRow[item.timeType] += item.minutes;
    return acc;
  }, []);
  grid = grid.sort(displayUtils.sortOtherLast);
  const columnInfo = [];
  columnInfo.push({
    columnHeading: 'Project',
    colorizer: commander.markdown ? null : chalk.bold.blueBright,
    footerType: 'Totals',
    footerColorizer: commander.markdown ? null : chalk.bold.yellowBright,
  });
  headings.forEach((columnHeading) => {
    columnInfo.push({
      columnHeading,
      align: 'right',
      footerType: 'sum',
      printer: displayUtils.durationPrinter,
      footerPrinter: displayUtils.timeAndPercentPrinter(totalTime),
      footerColorizer: commander.markdown ? null : chalk.bold.yellowBright,
    });
  });
  columnInfo.push({
    columnHeading: 'Totals',
    align: 'right',
    footerType: 'sum',
    printer: displayUtils.timeAndPercentPrinter(totalTime),
    colorizer: commander.markdown ? null : chalk.bold.yellowBright,
    footerPrinter: displayUtils.durationPrinter,
    footerColorizer: commander.markdown ? null : chalk.bold.yellowBright,
  });
  // Calculate per-project totals for last column
  grid.forEach((item) => {
    let projectTotal = 0;
    headings.forEach((heading) => {
      projectTotal += item[heading] ? item[heading] : 0;
    });
    item.Totals = projectTotal;
  });
  const tableConfig = {
  };
  if (commander.markdown) {
    tableConfig.columnDelimiter = '|';
    tableConfig.columnPadding = 1;
    tableConfig.alignmentMarkerInHeader = true;
  } else {
    tableConfig.dividerColorizer = chalk.dim;
    tableConfig.headerColorizer = chalk.bold.yellowBright;
  }
  const t = new Table(tableConfig);
  t.setData(grid, columnInfo);
  t.write(process.stdout);
}

try {
  run().catch((err) => {
    process.stderr.write(chalk.red(err.message));
    process.stderr.write('\n');
    process.exitCode = 1;
    LOG(err);
  });
} catch (err) {
  process.stderr.write(chalk.red(err.message));
  process.stderr.write('\n');
  process.exitCode = 1;
  LOG(err);
}

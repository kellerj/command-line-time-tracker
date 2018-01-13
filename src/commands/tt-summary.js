#!/usr/bin/env node -r babel-register

import commander from 'commander';
import chalk from 'chalk';
// import Table from 'easy-table';
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
      reportHeader = `Time Summary Report for ${displayUtils.entryDatePrinter(startDate)}`;
    } else {
      reportHeader = `Time Summary Report for ${displayUtils.entryDatePrinter(startDate)} through ${displayUtils.entryDatePrinter(endDate)}`;
    }
    if (commander.markdown) {
      process.stdout.write(`## ${reportHeader}\n\n`);
    } else {
      process.stdout.write(chalk.yellow('-'.repeat(reportHeader.length)));
      process.stdout.write('\n');
      process.stdout.write(chalk.yellow(reportHeader));
      process.stdout.write('\n');
      process.stdout.write(chalk.yellow('-'.repeat(reportHeader.length)));
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
  if (!commander.markdown) {
    const columnInfo = [];
    columnInfo.push({
      columnHeading: 'Project',
    });
    headings.forEach((columnHeading) => {
      columnInfo.push({
        columnHeading,
        align: 'right',
        footerType: 'sum',
        printer: displayUtils.timePrinter,
        footerPrinter: displayUtils.timeAndPercentPrinter(totalTime),
      });
    });
    columnInfo.push({
      columnHeading: 'Totals',
      align: 'right',
      footerType: 'sum',
      printer: displayUtils.timeAndPercentPrinter(totalTime),
      footerPrinter: displayUtils.timePrinter,
    });
    // Calculate per-project totals for last column
    grid.forEach((item) => {
      let projectTotal = 0;
      headings.forEach((heading) => {
        projectTotal += item[heading] ? item[heading] : 0;
      });
      item.Totals = projectTotal;
    });
    const t = new Table({
      footerLines: 1,
    });
    // headings.forEach((heading) => {
    //   t.total(heading, {
    //     printer: displayUtils.timeAndPercentPrinter(totalTime),
    //   });
    // });
    // t.total('Totals', {
    //   printer: displayUtils.timePrinter,
    // });
    t.setData(grid, columnInfo);
    t.write(process.stdout);
  } else {
    // LOG(`Data Grid: ${JSON.stringify(grid, null, 2)}`);
    // // prepare the data for display
    // const projectTotals = {};
    // grid.forEach((row) => {
    //   // LOG(row);
    //   let rowTotal = 0;
    //   headings.forEach((heading) => {
    //     const value = row[heading];
    //     // LOG(value);
    //     // total amounts in row
    //     if (typeof value === 'number') {
    //       rowTotal += value;
    //       if (!projectTotals[heading]) {
    //         projectTotals[heading] = 0;
    //       }
    //       projectTotals[heading] += value;
    //     }
    //     if (!value) { // handle missing data
    //       row[heading] = '';
    //     } else {
    //       row[heading] = displayUtils.timePrinter(value);
    //     }
    //   });
    //   // LOG(row);
    //   // add total column to row
    //   row.Totals = displayUtils.timeAndPercentPrinter(rowTotal)(totalTime);
    // });
    // headings.push('Totals');
    // Object.keys(projectTotals).forEach((project) => {
    //   projectTotals[project] = displayUtils.timePrinter(projectTotals[project]);
    // });
    // // LOG(projectTotals);
    // projectTotals.project = 'Totals';
    // projectTotals.Totals = displayUtils.timePrinter(totalTime);
    // grid.push(projectTotals);
    // // TODO: import table helper
    // // TODO: accept grid object
    // // TODO: accept formatting information object
    // // TODO: clone and merge objects into a single structure
    // // TODO: calculate needed column widths
    // // TODO: run over grid object and format the durations
    // // TODO: add the totals column
    // LOG(`Table Grid: ${JSON.stringify(grid, null, 2)}`);
    // const colInfo = [];
    // const projectColumnWidth = grid.reduce((maxWidth, gridRow) =>
    //   (gridRow.project.length > maxWidth ? gridRow.project.length : maxWidth), 0);
    // colInfo.push({
    //   align: 'left', width: projectColumnWidth, heading: 'project', dataType: 'string',
    // });
    // // headers
    // process.stdout.write('| ');
    // process.stdout.write('Project'.padEnd(projectColumnWidth));
    // process.stdout.write(' | ');
    // headings.forEach((heading) => {
    //   const columnWidth = grid.reduce((maxWidth, gridRow) =>
    //     (gridRow[heading].length > maxWidth ? gridRow[heading].length : maxWidth), heading.length);
    //   process.stdout.write(heading.padStart(columnWidth));
    //   process.stdout.write(' | ');
    //   colInfo.push({
    //     align: 'right', width: columnWidth, heading, dataType: 'string',
    //   });
    // });
    // process.stdout.write('\n');
    // // dividing line
    // process.stdout.write('| ');
    // colInfo.forEach((info) => {
    //   if (info.align === 'left') {
    //     process.stdout.write(':');
    //   }
    //   process.stdout.write('-'.repeat(info.width - 1));
    //   if (info.align === 'right') {
    //     process.stdout.write(':');
    //   }
    //   process.stdout.write(' | ');
    // });
    // process.stdout.write('\n');
    // // summary data
    // grid.forEach((row) => {
    //   // LOG(row);
    //   process.stdout.write('| ');
    //   colInfo.forEach((col) => {
    //     if (!row[col.heading]) { // handle missing data
    //       process.stdout.write(' '.repeat(col.width));
    //     } else if (col.dataType === 'duration') {
    //       process.stdout.write(displayUtils.timePrinter(row[col.heading], col.width));
    //     } else if (col.align === 'left') {
    //       process.stdout.write(row[col.heading].toString().padEnd(col.width));
    //     } else {
    //       process.stdout.write(row[col.heading].toString().padStart(col.width));
    //     }
    //     process.stdout.write(' | ');
    //   });
    //   process.stdout.write('\n');
    // });
    // process.stdout.write('\n');
    // add totals row
    // colInfo.forEach((info) => {
    //   if (!projectTotals[info.heading]) {
    //
    //   }
    //   process.stdout.write('-'.repeat(info.width - 1));
    //   if (info.align === 'right') {
    //     process.stdout.write(':');
    //   }
    //   process.stdout.write(' | ');
    // });
  }
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

import { program } from 'commander';
import chalk from 'chalk';
import { format, parseISO } from 'date-fns';
import debug from 'debug';
import * as d3ScaleChromatic from 'd3-scale-chromatic';

import db from '../db/index.js';
import { Table, ColumnInfo } from '../utils/table/index.js';
import validations from '../utils/validations.js';
import displayUtils from '../utils/display-utils.js';

const LOG = debug('tt:list');

program
  .description('List time entries in a tabular format.')
  //.option('--csv', 'Output in a CSV format instead of ASCII table.')
  .option('-d, --date <YYYY-MM-DD>', 'Specify the date to output, otherwise use today\'s date.')
  .option('-s, --startDate <YYYY-MM-DD>')
  .option('-e, --endDate <YYYY-MM-DD>')
  .option('--last', 'When no date is specified, use yesterday\'s date')
  .option('-y, --yesterday', 'When no date is specified, use yesterday\'s date')
  .parse(process.argv);

const { startDate, endDate, errorMessage } = validations.getStartAndEndDates(program.opts());
LOG(`Running for Dates: ${startDate} through ${endDate}`);
if (errorMessage) {
  throw new Error(errorMessage);
}

async function run() {
  const r = await db.timeEntry.get(startDate, endDate);

  if (r && r.length) {
    LOG(JSON.stringify(r, null, 2));
    const grid = r.map((item) => ({
      Date: parseISO(item.entryDate),
      Logged: item.insertTime,
      Project: item.project,
      Type: item.timeType,
      Time: item.minutes,
      Description: item.entryDescription,
      '💩': item.wasteOfTime ? '💩' : '',
    }));
    const columnInfo = [];
    if (startDate.getTime() !== endDate.getTime()) {
      columnInfo.push(new ColumnInfo('Date', 'left', displayUtils.datePrinter));
    }
    // get distinct list of projects, will use indexof to colorize them
    const projectList = [...grid.reduce((acc, row) => acc.add(row.Project), new Set())];
    const projectColorList = d3ScaleChromatic.schemeSet1;
    // LOG(`Project List: ${JSON.stringify(projectList)}`);
    const projectColorizer = (value) => {
      const colorIndex = projectList.indexOf(value.trim());
      //LOG(`Project ${value} : ${colorIndex} : ${projectList}`);
      if (colorIndex >= 0) {
        return chalk.hex(projectColorList[colorIndex % projectColorList.length])(value);
      }
      return value;
    };

    const typeList = [...grid.reduce((acc, row) => acc.add(row.Type), new Set())];
    const typeColorList = d3ScaleChromatic.schemeDark2;
    // LOG(`Project List: ${JSON.stringify(projectList)}`);
    const typeColorizer = (value) => {
      const colorIndex = typeList.indexOf(value.trim());
      //LOG(`Project ${value} : ${colorIndex} : ${projectList}`);
      if (colorIndex >= 0) {
        return chalk.hex(typeColorList[colorIndex % typeColorList.length])(value);
      }
      return value;
    };
    columnInfo.push(new ColumnInfo('Logged', 'right', displayUtils.timePrinter));
    columnInfo.push(new ColumnInfo('Project', 'left', null, projectColorizer));
    columnInfo.push(new ColumnInfo('Type', 'left', null, typeColorizer));
    columnInfo.push(new ColumnInfo('Time', 'right', displayUtils.durationPrinter, null, 'sum'));
    columnInfo.push(new ColumnInfo('Description'));
    columnInfo.push(new ColumnInfo('💩'));
    const tableConfig = {};
    tableConfig.dividerColorizer = chalk.dim;
    tableConfig.headerColorizer = chalk.bold.yellowBright;
    const t = new Table(tableConfig);
    t.setData(grid, columnInfo);
    t.write(process.stdout);
  } else {
    throw new Error(chalk.yellow(`No Time Entries Defined for ${format(startDate, 'yyyy-MM-dd')}`));
  }
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

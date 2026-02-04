import chalk from 'chalk';

import displayUtils from '../utils/display-utils';
import { ColumnInfo } from '../utils/table';

export function buildTimeTypeHeadingsList(data) {
  return data.reduce((acc, item) => {
    if (acc.indexOf(item.timeType) === -1) {
      acc.push(item.timeType);
    }
    return acc;
  }, []).sort(displayUtils.sortOtherLast);
}

export function buildProjectByTimeTypeDataGrid(data) {
  const grid = data.reduce((acc, item) => {
    let projectRow = acc.find((i) => (i.Project === item.project));
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
  return grid.sort(displayUtils.sortOtherLast);
}

export function buildColumnInfo(headings, totalTime, markdown) {
  const columnInfo = [];
  let tempCol = new ColumnInfo('Project', 'left');
  tempCol.footerType = 'Totals';
  if (!markdown) {
    tempCol.colorizer = chalk.bold.blueBright;
    tempCol.footerColorizer = chalk.bold.yellowBright;
  }
  columnInfo.push(tempCol);
  headings.forEach((columnHeading) => {
    tempCol = new ColumnInfo(columnHeading, 'right');
    tempCol.footerType = 'sum';
    tempCol.printer = displayUtils.durationPrinter;
    tempCol.footerPrinter = displayUtils.timeAndPercentPrinter(totalTime);
    tempCol.footerColorizer = markdown ? null : chalk.bold.yellowBright;
    columnInfo.push(tempCol);
  });
  tempCol = new ColumnInfo('Totals', 'right');
  tempCol.footerType = 'sum';
  tempCol.printer = displayUtils.timeAndPercentPrinter(totalTime);
  tempCol.footerPrinter = displayUtils.durationPrinter;
  tempCol.footerColorizer = markdown ? null : chalk.bold.yellowBright;
  columnInfo.push(tempCol);
  return columnInfo;
}

export function addTotalColumn(grid) {
  grid.forEach((row) => {
    let rowTotal = 0;
    Object.keys(row).forEach((col) => {
      if (typeof row[col] === 'number') {
        rowTotal += row[col];
      }
    });
    row.Totals = rowTotal;
  });
}

#!/usr/bin/env node -r babel-register

import commander from 'commander';
import chalk from 'chalk';
import debug from 'debug';
import moment from 'moment'; // TODO: Convert to use date-fns

import db from '../db';
import validations from '../utils/validations';
import displayUtils from '../utils/display-utils';
import { Table, ColumnInfo } from '../utils/table';
import { buildTimeTypeHeadingsList,
  buildProjectByTimeTypeDataGrid,
  buildColumnInfo,
  addTotalColumn } from '../lib/summarize';

const LOG = debug('tt:report');

commander
  .description('Generate report of time entries')
  .option('-d, --date <YYYY-MM-DD>', 'Specify the date to output, otherwise use today\'s date.')
  .option('-s, --startDate <YYYY-MM-DD>')
  .option('-e, --endDate <YYYY-MM-DD>')
  .option('--week', 'Report for the current week (starting Monday).')
  .option('--month', 'Report for the current month.')
  .option('--last', 'Change the day, week, or month criteria to the prior week or month.')
  .option('-y, --yesterday', 'When no date is specified, use yesterday\'s date')
  .option('-ns, --noSummary', 'Suppress the summary section of the report.')
  .option('-bd, --noDetails', 'Suppress the details section of the report.')
  .option('--fullSummary', 'Include the full summary table in the output.')
  .parse(process.argv);

LOG(JSON.stringify(commander, null, 2));

async function run() {
  const { startDate, endDate, errorMessage } = validations.getStartAndEndDates(commander);
  if (errorMessage) {
    throw new Error(errorMessage);
  }

  const r = await db.timeEntry.summarizeByProjectAndTimeType(startDate, endDate);
  if (!r.length) {
    console.log(chalk.yellow('There are no time entries to summarize for the given period.'));
    return;
  }

  LOG(JSON.stringify(r, null, 2));
  let reportOutput = '# Work Log:';
  if (commander.week) {
    reportOutput = `# Weekly Summary: Week starting ${moment(startDate).format('MMMM Do, YYYY')}`;
  } else if (commander.month) {
    reportOutput = `# Monthly Summary: ${moment(startDate).format('MMMM, YYYY')}`;
  } else if (startDate.getTime() === endDate.getTime()) {
    reportOutput = `${reportOutput} ${displayUtils.datePrinter(startDate)}`;
  } else { // arbitrary date range
    reportOutput = `${reportOutput} ${displayUtils.datePrinter(startDate)} through ${displayUtils.datePrinter(endDate)}`;
  }
  reportOutput += '\n\n';
  // Get total time for calculating percentages
  // eslint-disable-next-line no-param-reassign
  const totalTime = r.reduce((acc, item) => (acc + item.minutes), 0);
  // build list of project totals
  const projects = r.reduce((p, item) => {
    if (!p[item.project]) {
      p[item.project] = 0;
    }
    p[item.project] += item.minutes;
    return p;
  }, {});

  const projectNames = Object.getOwnPropertyNames(projects).sort(displayUtils.sortOtherLast);
  LOG(`Project Summary: ${JSON.stringify(projects, null, 2)}`);
  LOG(projectNames);

  // list of time type totals
  const timeTypes = r.reduce((p, item) => {
    if (!p[item.timeType]) {
      p[item.timeType] = 0;
    }
    p[item.timeType] += item.minutes;
    return p;
  }, {});
  LOG(`Time Type Summary: ${JSON.stringify(timeTypes, null, 2)}`);
  const timeTypeNames = Object.getOwnPropertyNames(timeTypes).sort(displayUtils.sortOtherLast);

  LOG(timeTypeNames);

  const lpad = (str, padString, length) => {
    // eslint-disable-next-line no-param-reassign
    while (str.length < length) { str = padString + str; }
    return str;
  };

  const rpad = (str, padString, length) => {
    // eslint-disable-next-line no-param-reassign
    while (str.length < length) { str += padString; }
    return str;
  };

  if (!commander.noSummary) {
    reportOutput += '## Projects\n\n';
    const projectNameMaxLength = projectNames
      .reduce((len, name) => ((name.length > len) ? name.length : len), 0);
    reportOutput += `| ${rpad('Name', ' ', projectNameMaxLength)} |    Time | Percent |\n`;
    reportOutput += `| :${'-'.repeat(projectNameMaxLength - 1)} | ------: | ------: |\n`;
    for (let i = 0; i < projectNames.length; i++) {
      reportOutput += `| ${rpad(projectNames[i], ' ', projectNameMaxLength)} | ${lpad(displayUtils.durationPrinter(projects[projectNames[i]]), ' ', 7)} | ${lpad(Math.round(100 * (projects[projectNames[i]] / totalTime), 0).toString(10), ' ', 6)}% |\n`;
    }
    reportOutput += '\n';

    // build list of project totals
    const projectGrid = r.reduce((p, item) => {
      const projectRow = p.find(e => (e.Name === item.project));
      if (!projectRow) {
        p.push({ Name: item.project, Time: item.minutes, Percent: item.minutes / totalTime });
      } else {
        projectRow.Time += item.minutes;
        projectRow.Percent = projectRow.Time / totalTime;
      }
      return p;
    }, []);
    projectGrid.sort(displayUtils.sortOtherLast);

    const projectTable = new Table({ markdown: true });
    projectTable.setData(projectGrid, [
      new ColumnInfo('Name'),
      new ColumnInfo('Time', 'right', displayUtils.durationPrinter),
      new ColumnInfo('Percent', 'right', displayUtils.percentPrinter),
    ]);
    reportOutput += projectTable.toString();

    reportOutput += '## Time Types\n\n';

    const timeTypeMaxLength = timeTypeNames
      .reduce((len, name) => ((name.length > len) ? name.length : len), 0);
    reportOutput += `| ${rpad('Name', ' ', timeTypeMaxLength)} |    Time | Percent |\n`;
    reportOutput += `| :${'-'.repeat(timeTypeMaxLength - 1)} | ------: | ------: |\n`;
    for (let i = 0; i < timeTypeNames.length; i++) {
      reportOutput += `| ${rpad(timeTypeNames[i], ' ', timeTypeMaxLength)} | ${lpad(displayUtils.durationPrinter(timeTypes[timeTypeNames[i]]), ' ', 7)} | ${lpad(Math.round(100 * (timeTypes[timeTypeNames[i]] / totalTime), 0).toString(10), ' ', 6)}% |\n`;
    }
    reportOutput += '\n';
  }

  if (commander.fullSummary) {
    // and build a record with keys for each time type
    const headings = buildTimeTypeHeadingsList(r);
    // need to transform the structure into a new grid format - group by project
    const grid = buildProjectByTimeTypeDataGrid(r);
    // const totalTime = r.reduce((acc, item) => (acc + item.minutes), 0);
    const columnInfo = buildColumnInfo(headings, totalTime, true);
    // Calculate per-project totals for last column
    addTotalColumn(grid);
    const t = new Table({ markdown: true });
    t.setData(grid, columnInfo);
    reportOutput += t.toString();
  }

  if (!commander.noDetails) {
    if (!commander.noSummary) {
      reportOutput += '## Details\n\n';
    }

    const entries = await db.timeEntry.get(startDate, endDate);
    // LOG(JSON.stringify(entries, null, 2));
    for (let i = 0; i < projectNames.length; i++) {
      reportOutput += `### ${projectNames[i]} (${displayUtils.durationPrinter(projects[projectNames[i]]).trim()})\n\n`;

      for (let j = 0; j < timeTypeNames.length; j++) {
        const detailEntries = entries
          // get only details for the current project and time type
          .filter(entry => (entry.project === projectNames[i]
            && entry.timeType === timeTypeNames[j]))
          // convert to descriptions
          .map(entry => (entry.entryDescription + (entry.wasteOfTime ? ' 💩' : '')))
          .sort()
          // eliminate dupes
          .filter((entry, k, array) => (k === 0 || entry !== array[k - 1]));
        LOG(`Detail Entries for ${projectNames[i]} / ${timeTypeNames[j]}`);
        LOG(detailEntries);
        if (detailEntries.length) {
          reportOutput += `* **${timeTypeNames[j]}**\n`;
          for (let k = 0; k < detailEntries.length; k++) {
            reportOutput += `\t* ${detailEntries[k]}\n`;
          }
        }
      }
      reportOutput += '\n';
    }
  }

  process.stdout.write(reportOutput);
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

/* Demo Output

# Work Log: Date
# Weekly Summary: Week Dates
# Monthly Summary: Month, Year

## Projects

* Project Name (time)
* Project Name (time)
* Project Name (time)
* Project Name (time)

## Time Types

* Time Type (time)

## Details

### **Project Name (time)**

* type
  * detail
  * detail
* type
  * detail
  * detail
*/

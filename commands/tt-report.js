#!/usr/bin/env node
/*eslint-env es6*/

const commander = require('commander');
const co = require('co');
const chalk = require('chalk');
const db = require('../db');
const debug = require('debug')('tt:report');
const validations = require('../utils/validations');
const displayUtils = require('../utils/display-utils');
const moment = require('moment');

commander
  .description('Generate report of time entries')
//.option('--csv', 'Output in a CSV format instead of ASCII table.')
  .option('-d, --date <YYYY-MM-DD>', 'Specify the date to output, otherwise use today\'s date.')
  .option('-s, --startDate <YYYY-MM-DD>')
  .option('-e, --endDate <YYYY-MM-DD>')
  .option('--week', 'Report for the current week (starting Monday).')
  .option('--month', 'Report for the current month.')
  .option('--last', 'Change the day, week, or month criteria to the prior week or month.')
  .option('-y, --yesterday', 'When no date is specified, use yesterday\'s date')
  .option('-ns, --noSummary', 'Suppress the summary section of the report.')
  .option('-bd, --noDetails', 'Suppress the details section of the report.')
  .parse(process.argv);

debug(JSON.stringify(commander, null, 2));
const { startDate, endDate, errorMessage } = validations.getStartAndEndDates(commander);
if (errorMessage) {
  throw new Error(errorMessage);
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

co(function* run() {
  const r = yield* db.timeEntry.summarizeByProjectAndTimeType(startDate, endDate);
  if (!r.length) {
    console.log(chalk.yellow('There are no time entries to summarize for the given period.'));
    return;
  }

  debug(JSON.stringify(r, null, 2));
  let reportOutput = '# Work Log:';
  if (commander.week) {
    reportOutput = `# Weekly Summary: Week starting ${moment(startDate).format('MMMM Do, YYYY')}`;
  } else if (commander.month) {
    reportOutput = `# Monthly Summary: ${moment(startDate).format('MMMM, YYYY')}`;
  } else if (startDate.getTime() === endDate.getTime()) {
    reportOutput = `${reportOutput} ${displayUtils.entryDatePrinter(startDate)}`;
  } else { // arbitrary date range
    reportOutput = `${reportOutput} ${displayUtils.entryDatePrinter(startDate)} through ${displayUtils.entryDatePrinter(endDate)}`;
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
  debug(`Project Summary: ${JSON.stringify(projects, null, 2)}`);
  debug(projectNames);

  // list of time type totals
  const timeTypes = r.reduce((p, item) => {
    if (!p[item.timeType]) {
      p[item.timeType] = 0;
    }
    p[item.timeType] += item.minutes;
    return p;
  }, {});
  debug(`Time Type Summary: ${JSON.stringify(timeTypes, null, 2)}`);
  const timeTypeNames = Object.getOwnPropertyNames(timeTypes).sort(displayUtils.sortOtherLast);

  debug(timeTypeNames);

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
      reportOutput += `| ${rpad(projectNames[i], ' ', projectNameMaxLength)} | ${lpad(displayUtils.timePrinter(projects[projectNames[i]]), ' ', 7)} | ${lpad(Math.round(100 * (projects[projectNames[i]] / totalTime), 0).toString(10), ' ', 6)}% |\n`;
    }
    reportOutput += '\n';

    reportOutput += '## Time Types\n\n';

    const timeTypeMaxLength = timeTypeNames
      .reduce((len, name) => ((name.length > len) ? name.length : len), 0);
    reportOutput += `| ${rpad('Name', ' ', timeTypeMaxLength)} |    Time | Percent |\n`;
    reportOutput += `| :${'-'.repeat(timeTypeMaxLength - 1)} | ------: | ------: |\n`;
    for (let i = 0; i < timeTypeNames.length; i++) {
      reportOutput += `| ${rpad(timeTypeNames[i], ' ', timeTypeMaxLength)} | ${lpad(displayUtils.timePrinter(timeTypes[timeTypeNames[i]]), ' ', 7)} | ${lpad(Math.round(100 * (timeTypes[timeTypeNames[i]] / totalTime), 0).toString(10), ' ', 6)}% |\n`;
    }
    reportOutput += '\n';
  }

  if (!commander.noDetails) {
    if (!commander.noSummary) {
      reportOutput += '## Details\n\n';
    }

    const entries = yield* db.timeEntry.get(startDate, endDate);
    // debug(JSON.stringify(entries, null, 2));
    for (let i = 0; i < projectNames.length; i++) {
      reportOutput += `### ${projectNames[i]} (${displayUtils.timePrinter(projects[projectNames[i]]).trim()})\n\n`;

      for (let j = 0; j < timeTypeNames.length; j++) {
        const detailEntries = entries
          .filter( // get only details for the current project and time type
            entry => (entry.project === projectNames[i] && entry.timeType === timeTypeNames[j]))
          .map( // convert to descriptions
            entry => (entry.entryDescription + (entry.wasteOfTime ? ' 💩' : '')))
          .sort()
          .filter( // eliminate dupes
            (entry, k, array) => (k === 0 || entry !== array[k - 1]));
        debug(`Detail Entries for ${projectNames[i]} / ${timeTypeNames[j]}`);
        debug(detailEntries);
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

  // debug(reportOutput);
  console.log(reportOutput);
}).catch((err) => {
  console.log(chalk.bgRed(err.stack));
});

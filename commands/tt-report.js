#!/usr/bin/env node
/*eslint-env es6*/

const commander = require('commander');
const co = require('co');
const chalk = require('chalk');
const db = require('../db');
const debug = require('debug')('tt:report');
const validations = require('../utils/validations');
const displayUtils = require('../utils/display-utils');

commander
    .version('1.0.0')
    .description('Generate report of time entries')
    //.option('--csv', 'Output in a CSV format instead of ASCII table.')
    .option('-d, --date <YYYY-MM-DD>', 'Specify the date to output, otherwise use today\'s date.')
    .option('-s, --startDate <YYYY-MM-DD>')
    .option('-e, --endDate <YYYY-MM-DD>')
    .option('--week', 'Report for the current week (starting Monday).')
    .option('--month', 'Report for the current month.')
    .option('--last', 'Change the week or month criteria to the prior week or month.')
    .parse(process.argv);

const { startDate, endDate } = validations.getStartAndEndDates(commander);

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
    reportOutput = '# Weekly Summary:';
  } else if (commander.month) {
    reportOutput = '# Monthly Summary:';
  }
  if (startDate.getTime() === endDate.getTime()) {
    reportOutput = `${reportOutput} ${displayUtils.entryDatePrinter(startDate)}`;
  } else {
    reportOutput = `${reportOutput} ${displayUtils.entryDatePrinter(startDate)} through ${displayUtils.entryDatePrinter(endDate)}`;
  }
  reportOutput += '\n\n';
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
  reportOutput += '## Projects\n\n';
  for (let i = 0; i < projectNames.length; i++) {
    reportOutput += `* ${projectNames[i]} (${displayUtils.timePrinter(projects[projectNames[i]])})\n`;
  }
  reportOutput += '\n';

  // list of time type totals
  const timeTypes = r.reduce((p, item) => {
    if (!p[item.timeType]) {
      p[item.timeType] = 0;
    }
    p[item.timeType] += item.minutes;
    return p;
  }, {});
  const timeTypeNames = Object.getOwnPropertyNames(timeTypes).sort(displayUtils.sortOtherLast);
  debug(`Project Summary: ${JSON.stringify(timeTypes, null, 2)}`);
  debug(timeTypeNames);
  reportOutput += '## Time Types\n\n';
  for (let i = 0; i < timeTypeNames.length; i++) {
    reportOutput += `* ${timeTypeNames[i]} (${displayUtils.timePrinter(timeTypes[timeTypeNames[i]])})\n`;
  }
  reportOutput += '\n';

  reportOutput += '## Details\n\n';

  const entries = yield* db.timeEntry.get(startDate, endDate);
  // debug(JSON.stringify(entries, null, 2));
  for (let i = 0; i < projectNames.length; i++) {
    reportOutput += `### ${projectNames[i]} (${displayUtils.timePrinter(projects[projectNames[i]])})\n\n`;

    for (let j = 0; j < timeTypeNames.length; j++) {
      const detailEntries = entries.filter(
        entry => (entry.project === projectNames[i] && entry.timeType === timeTypeNames[j]));
      if (detailEntries.length) {
        reportOutput += `* ${timeTypeNames[j]}\n`;
        for (let k = 0; k < detailEntries.length; k++) {
          reportOutput += `\t* ${detailEntries[k].entryDescription}${detailEntries[k].wasteOfTime ? ' 💩' : ''}\n`;
        }
      }
    }
    reportOutput += '\n';
  }

  debug(reportOutput);
  console.log(reportOutput);
}).catch((err) => {
  console.log(chalk.bgRed(err.stack));
});

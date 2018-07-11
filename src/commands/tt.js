#!/usr/bin/env node

import Vorpal from 'vorpal';

import { version } from '../../package.json';


const vorpal = Vorpal();
vorpal.version(version);
// todo - add module - configure command passing in vorpal
vorpal
  .command('add [entryDescription...]')
  .alias('a')
  .description('Record a time entry')
  .option('-t, --time <minutes>', 'Minutes spent on the activity.')
  .option('-e, --type <timeType>', 'Name of the time type - must be existing.')
  .option('-p, --project <projectName>', 'Project to assign to the time entry - must already exist.')
  .option('-d, --date <YYYY-MM-DD>', 'Date to which to assign the entry, defaults to today.')
  .option('-b, --backTime <backMinutes>', 'Number of minutes by which to back date the entry.')
  .option('-l, --logTime <loggingTime>', 'The time (in hh:mm format) at which to report the entry as having been logged.')
  .option('--fill', 'Set the log time to fill time since the previous entry.')
  .option('-y, --yesterday', 'Set the logging date to yesterday.')
  .action(function (args, callback) {
    this.log(JSON.stringify(args, null, 2));
    callback();
  });
vorpal.command('list', 'List time entries').alias('ls');
vorpal.command('edit', 'Edit Time entries').alias('e');
vorpal.command('delete', 'Delete time entries').alias('del');
vorpal.command('summary', 'Summarize time entries').alias('s');
vorpal.command('report', 'Generate time entry report').alias('r');
vorpal.command('project <subCommand> [otherArguments]', 'Work with project definitions.').alias('p');
vorpal.command('timetype <subCommand> [otherArguments]', 'Work with type type definitions.').alias('t');

// console.log(JSON.stringify(vorpal, (key, value) => {
//   if (key === 'parent') { return value._name; } return value;
// }, 2));
// const result = vorpal.parse(process.argv);
// if a proper subcommand is run, then the above returns undefined
// So, if the user gives an incorrect subcommand, we want to display help
// console.log(JSON.stringify(result, (key, value) => {
//   if (key === 'parent') { return value._name; } return value;
// }, 2));
// if (result !== undefined) {
//   // console.log(JSON.stringify(result, (key, value) => {
//   //   if (key === 'parent') { return value._name; } return value;
//   // }, 2));
//   vorpal.help();
// }
// console.log(JSON.stringify(process.argv));
if (process.argv.length < 3) {
  vorpal
    .delimiter('tt$')
    .show();
} else {
  const result = vorpal.parse(process.argv);
}

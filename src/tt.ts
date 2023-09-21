#!/usr/bin/env node

import { Command } from '@commander-js/extra-typings';

const { version } = require('../package.json');

const tt = new Command()
  .version(version)
  .command('add', 'Add a new time entry').alias('a')
  .command('config', 'Configure the time tracker settings')
  // tt.command('list', 'List time entries').alias('ls');
  // tt.command('edit', 'Edit Time entries').alias('e');
  // tt.command('delete', 'Delete time entries').alias('del');
  // tt.command('summary', 'Summarize time entries').alias('s');
  // tt.command('report', 'Generate time entry report').alias('r');
  // tt.command('project <subCommand> [otherArguments]', 'Work with project definitions.').alias('p');
  // tt.command('timetype <subCommand> [otherArguments]', 'Work with type type definitions.').alias('t');
  .parse();
// console.log(JSON.stringify(tt, (key, value) => {
//   if (key === 'parent') { return value._name; } return value;
// }, 2));

// if a proper subcommand is run, then the above returns undefined
// So, if the user gives an incorrect subcommand, we want to display help
if (tt !== undefined) {
  console.log(JSON.stringify(tt, (key, value) => {
    if (key === 'parent') { return value?._name; } return value;
  }, 2));
  tt.help();
}

#!/usr/bin/env node

import { Command } from 'commander';
const tt = new Command();

const { version } = require('../package.json');

tt.version(version);
tt.command('add', 'Add a new time entry').alias('a');
tt.command('list', 'List time entries').alias('ls');
tt.command('edit', 'Edit Time entries').alias('e');
tt.command('delete', 'Delete time entries').alias('del');
tt.command('summary', 'Summarize time entries').alias('s');
tt.command('report', 'Generate time entry report').alias('r');
tt.command('project <subCommand> [otherArguments]', 'Work with project definitions.').alias('p');
tt.command('timetype <subCommand> [otherArguments]', 'Work with type type definitions.').alias('t');

// console.log(JSON.stringify(tt, (key, value) => {
//   if (key === 'parent') { return value._name; } return value;
// }, 2));
const result = tt.parse();
// if a proper subcommand is run, then the above returns undefined
// So, if the user gives an incorrect subcommand, we want to display help
if (result !== undefined) {
  console.log(JSON.stringify(result, (key, value) => {
    if (key === 'parent') { return value?._name; } return value;
  }, 2));
  tt.help();
}

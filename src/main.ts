#!/usr/bin/env node

import { program } from 'commander';

const { version } = require('../package.json');

program.version(version);
program.command('add', 'Add a new time entry').alias('a');
program.command('list', 'List time entries').alias('ls');
program.command('edit', 'Edit Time entries').alias('e');
program.command('delete', 'Delete time entries').alias('del');
program.command('summary', 'Summarize time entries').alias('s');
program.command('report', 'Generate time entry report').alias('r');
program.command('project <subCommand> [otherArguments]', 'Work with project definitions.').alias('p');
program.command('timetype <subCommand> [otherArguments]', 'Work with type type definitions.').alias('t');

// console.log(JSON.stringify(program, (key, value) => {
//   if (key === 'parent') { return value._name; } return value;
// }, 2));
const result = program.parse(process.argv);
// if a proper subcommand is run, then the above returns undefined
// So, if the user gives an incorrect subcommand, we want to display help
if (result !== undefined) {
  // console.log(JSON.stringify(result, (key, value) => {
  //   if (key === 'parent') { return value._name; } return value;
  // }, 2));
  program.help();
}

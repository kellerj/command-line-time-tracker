#!/usr/bin/env node

import commander from 'commander';

import { version } from '../../package.json';

commander.version(version);
commander.command('add', 'Add a new time entry').alias('a');
commander.command('list', 'List time entries').alias('ls');
commander.command('edit', 'Edit Time entries').alias('e');
commander.command('delete', 'Delete time entries').alias('del');
commander.command('summary', 'Summarize time entries').alias('s');
commander.command('report', 'Generate time entry report').alias('r');
commander.command('project <subCommand> [otherArguments]', 'Work with project definitions.').alias('p');
commander.command('timetype <subCommand> [otherArguments]', 'Work with type type definitions.').alias('t');

// console.log(JSON.stringify(commander, (key, value) => {
//   if (key === 'parent') { return value._name; } return value;
// }, 2));
const result = commander.parse(process.argv);
// if a proper subcommand is run, then the above returns undefined
// So, if the user gives an incorrect subcommand, we want to display help
if (result !== undefined) {
  // console.log(JSON.stringify(result, (key, value) => {
  //   if (key === 'parent') { return value._name; } return value;
  // }, 2));
  commander.help();
}

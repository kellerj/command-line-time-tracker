#!/usr/bin/env node

import Vorpal from 'vorpal';
import inquirerAutoCompletePrompt from 'inquirer-autocomplete-prompt';

import * as addCommand from './tt-add';

import { version } from '../../package.json';

const vorpal = Vorpal();

vorpal.ui.inquirer.registerPrompt('autocomplete', inquirerAutoCompletePrompt);

vorpal.version(version);
// todo - add module - configure command passing in vorpal
addCommand.addVorpalCommand(vorpal);
// vorpal.command('list', 'List time entries').alias('ls');
// vorpal.command('edit', 'Edit Time entries').alias('e');
// vorpal.command('delete', 'Delete time entries').alias('del');
// vorpal.command('summary', 'Summarize time entries').alias('s');
// vorpal.command('report', 'Generate time entry report').alias('r');
// vorpal.command('project <subCommand> [otherArguments]', 'Work with project definitions.').alias('p');
// vorpal.command('timetype <subCommand> [otherArguments]', 'Work with type type definitions.').alias('t');

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
    .delimiter('tt>')
    .show();
} else {
  const result = vorpal.show().parse(process.argv);
}

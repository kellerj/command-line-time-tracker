#!/usr/bin/env node

const commander = require('commander');

commander.version('1.0.0');
commander.command('add', 'Add a new time entry').alias('a');
commander.command('list', 'List time entries').alias('ls');
commander.command('edit', 'Edit Time entries').alias('e');
commander.command('delete', 'Delete time entries').alias('del');
commander.command('summary', 'Summarize time entries').alias('s');
commander.command('project <subCommand> [otherArguments]', 'Work with project definition.').alias('p');
commander.command('timetype <subCommand> [otherArguments]', 'Work with type type definitions.').alias('t');

// console.log(JSON.stringify(commander, (key, value) => {
//   if (key === 'parent') { return value._name; } return value;
// }, 2));

commander.parse(process.argv);

// commander.help();

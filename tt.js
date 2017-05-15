#!/usr/bin/env node

const commander = require('commander');

commander.version('1.0.0');
commander.command('add', 'Add a new time entry').alias('a');
commander.command('ls', 'List time entries');//, { isDefault: true })
commander.command('edit', 'Edit Time entries');
commander.command('remove', 'Delete time entries');
commander.command('summary', 'Summarize time entries');
commander.command('project <subCommand> [otherArguments]', 'Work with project definition.');
commander.command('timetype <subCommand> [otherArguments]', 'Work with type type definitions.');

// console.log(JSON.stringify(commander, (key, value) => {
//   if (key === 'parent') { return value._name; } return value;
// }, 2));

commander.parse(process.argv);

// commander.help();

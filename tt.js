#!/usr/bin/env node

const commander = require('commander');

commander
    .version('1.0.0')
    .command('add', 'Add a new time entry')
    .command('ls', 'List time entries')
    .command('project <subCommand> [otherArguments]', 'Work with project definition.')
    .command('timetype <subCommand> [otherArguments]', 'Work with type type definitions.')
    .parse(process.argv);

#!/usr/bin/env node

const commander = require('commander');

commander
    .version('1.0.0')
    .description('Manage time types (meeting, email, development) for time tracking.')
    .command('add', 'Add a time type to the database')
    .command('ls', 'List existing types.', { isDefault: true })
    .command('remove', 'Remove a time type from the database')
    // .command('rename', 'Rename an existing project throughout the database.')
    .parse(process.argv);

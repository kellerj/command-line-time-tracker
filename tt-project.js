#!/usr/bin/env node

const commander = require('commander');

commander
    .version('1.0.0')
    .command('add', 'Add a time tracking project to the database')
    .command('ls', 'List existing projects.')
    .command('remove', 'Remove a time tracking project from the database')
    .command('rename', 'Rename an existing project throughout the database.')
    .parse(process.argv);

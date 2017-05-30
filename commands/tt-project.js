#!/usr/bin/env node --harmony

const commander = require('commander');

commander
    .version('1.0.0')
    .description('Manage current projects for time tracking.')
    .command('add', 'Add a time tracking project to the database')
      .alias('a')
    .command('list', 'List existing projects.', { isDefault: true })
      .alias('ls')
    .command('delete', 'Remove a time tracking project from the database')
      .alias('del')
    // .command('rename', 'Rename an existing project throughout the database.').alias('r')
    .parse(process.argv);
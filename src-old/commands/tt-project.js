#!/usr/bin/env node --harmony

import commander from 'commander';

commander
  .description('Manage current projects for time tracking.')
  .command('add', 'Add a time tracking project to the database')
  .alias('a')
  .command('list', 'List existing projects.', { isDefault: true })
  .alias('ls')
  .command('delete', 'Remove a time tracking project from the database')
  .alias('del')
  // .command('rename', 'Rename an existing project throughout the database.').alias('r')
  // .command('merge', 'Merge two projects.').alias('m')
  .parse(process.argv);

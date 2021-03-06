#!/usr/bin/env node

import commander from 'commander';

commander
  .description('Manage time types (meeting, email, development) for time tracking.')
  .command('add', 'Add a time type to the database')
  .alias('a')
  .command('list', 'List existing types.', { isDefault: true })
  .alias('ls')
  .command('delete', 'Remove a time type from the database')
  .alias('del')
// .command('rename', 'Rename an existing project throughout the database.')
  .parse(process.argv);

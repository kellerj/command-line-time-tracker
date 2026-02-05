#!/usr/bin/env node

import { program } from 'commander';

program
  .description('Manage time types (meeting, email, development) for time tracking.')
  .command('add', 'Add a time type to the database', { executableFile: 'tt-timetype-add.js' })
  .alias('a')
  .command('list', 'List existing types.', { isDefault: true, executableFile: 'tt-timetype-list.js' })
  .alias('ls')
  .command('delete', 'Remove a time type from the database', { executableFile: 'tt-timetype-delete.js' })
  .alias('del')
// .command('rename', 'Rename an existing project throughout the database.')
  .parse(process.argv);

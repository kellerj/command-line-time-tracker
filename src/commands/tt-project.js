#!/usr/bin/env node

import { program } from 'commander';

program
  .description('Manage current projects for time tracking.')
  .command('add', 'Add a time tracking project to the database', { executableFile: 'tt-project-add.js' })
  .alias('a')
  .command('list', 'List existing projects.', { isDefault: true, executableFile: 'tt-project-list.js' })
  .alias('ls')
  .command('delete', 'Remove a time tracking project from the database', { executableFile: 'tt-project-delete.js' })
  .alias('del')
  // .command('rename', 'Rename an existing project throughout the database.').alias('r')
  // .command('merge', 'Merge two projects.').alias('m')
  .parse(process.argv);

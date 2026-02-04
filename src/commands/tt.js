#!/usr/bin/env node

import { program } from 'commander';

import { version } from '../../package.json';

program.version(version);
program.command('add', 'Add a new time entry').alias('a');
program.command('list', 'List time entries').alias('ls');
program.command('edit', 'Edit Time entries').alias('e');
program.command('delete', 'Delete time entries').alias('del');
program.command('summary', 'Summarize time entries').alias('s');
program.command('report', 'Generate time entry report').alias('r');
program.command('project <subCommand> [otherArguments]', 'Work with project definitions.').alias('p');
program.command('timetype <subCommand> [otherArguments]', 'Work with type type definitions.').alias('t');

program.parse(process.argv);

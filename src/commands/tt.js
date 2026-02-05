#!/usr/bin/env node

import { program } from 'commander';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { version } = require('../../package.json');

program.version(version);
program.command('add', 'Add a new time entry', { executableFile: 'tt-add.js' }).alias('a');
program.command('list', 'List time entries', { executableFile: 'tt-list.js' }).alias('ls');
program.command('edit', 'Edit Time entries', { executableFile: 'tt-edit.js' }).alias('e');
program.command('delete', 'Delete time entries', { executableFile: 'tt-delete.js' }).alias('del');
program.command('summary', 'Summarize time entries', { executableFile: 'tt-summary.js' }).alias('s');
program.command('report', 'Generate time entry report', { executableFile: 'tt-report.js' }).alias('r');
program.command('project <subCommand> [otherArguments]', 'Work with project definitions.', { executableFile: 'tt-project.js' }).alias('p');
program.command('timetype <subCommand> [otherArguments]', 'Work with type type definitions.', { executableFile: 'tt-timetype.js' }).alias('t');

program.parse(process.argv);

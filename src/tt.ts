#!/usr/bin/env node

import { Command } from '@commander-js/extra-typings';

import fs from 'fs';
// import path from 'path';


import { URL } from 'url';

// const __filename = new URL('', import.meta.url).pathname;
// Will contain trailing slash
// const __dirname = new URL('.', import.meta.url).pathname;
const packageJsonFile = new URL('../package.json', import.meta.url).pathname;
const { version } = JSON.parse(fs.readFileSync(packageJsonFile, 'utf8'));

const tt = new Command()
  .version(version)
  // .command('add', 'Add a new time entry').alias('a')
  .command('config', 'Configure the time tracker settings')
// tt.command('list', 'List time entries').alias('ls');
// tt.command('edit', 'Edit Time entries').alias('e');
// tt.command('delete', 'Delete time entries').alias('del');
// tt.command('summary', 'Summarize time entries').alias('s');
// tt.command('report', 'Generate time entry report').alias('r');
tt.command('project <subCommand> [otherArguments]', 'Work with project definitions.').alias('p')
  // tt.command('timetype <subCommand> [otherArguments]', 'Work with type type definitions.').alias('t');
  .parse();
// console.dir(tt);

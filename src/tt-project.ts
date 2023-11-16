#!/usr/bin/env node

import fs from 'fs';
import { Command } from '@commander-js/extra-typings';
import inquirer from 'inquirer';
import debug from 'debug';
// import inquirerAutoCompletePrompt from 'inquirer-autocomplete-prompt';
// import chalk from 'chalk';
// import { sprintf } from 'sprintf-js';
// import Rx from 'rx';
// import dateFns from 'date-fns';

import { configOptions, getCurrentConfig, updateConfigValue } from './lib/config.js';

const LOG = debug('tt:project');
LOG('Starting tt-project');
const cmd = new Command()
  .description('Configure projects for the time tracker tool')
  .command('add', 'Add a new project').alias('a')
  .command('list').alias('ls').description('List projects').action(listProjects)
  .command('edit', 'Edit projects').alias('e')
  .command('delete', 'Delete projects').alias('del')
  .parse();
// const options = ttConfig.opts();
// LOG(`Parsed ttConfig Object: ${JSON.stringify(ttConfig, null, 2)}`);

async function listProjects(args: object, cmd: Command) {
  LOG('List Projects');
}

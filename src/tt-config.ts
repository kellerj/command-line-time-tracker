#!/usr/bin/env node

import fs from 'fs';
import { Command } from '@commander-js/extra-typings';
import inquirer from 'inquirer';
// import inquirerAutoCompletePrompt from 'inquirer-autocomplete-prompt';
// import chalk from 'chalk';
// import { sprintf } from 'sprintf-js';
// import Rx from 'rx';
import debug from 'debug';
// import dateFns from 'date-fns';

import { CONFIG_DIR, CONFIG_FILE_LOCATION, DEFAULT_DB_LOCATION } from './constants.js';
import { ConfigOption } from './types/config.js';
import { configOptions, getCurrentConfig } from './lib/config.js';

const LOG = debug('tt:config');

const ttConfig = new Command()
  .description('Configure options for the time tracker tool')
  .parse();
// const options = ttConfig.opts();
// LOG(`Parsed ttConfig Object: ${JSON.stringify(ttConfig, null, 2)}`);

const currentConfig = getCurrentConfig();
LOG(currentConfig);

const entryList = configOptions.map(item => ({
  value: item.configId,
  name: item.name,
}));
entryList.push({ value: '', name: '(Exit)' });

async function askMenuPrompt() {
  const answer = await inquirer.prompt([
    {
      name: 'configItem',
      type: 'list',
      message: 'Which Configuration Option would you like to change?',
      // pageSize: Constants.LIST_DISPLAY_SIZE,
      choices: entryList,
      loop: false,
    },
  ]);
  LOG(answer);
  return answer;
}

// TODO: validate entered path
// TODO: validate not existing non-directory path
// TODO: Replace ~ with $HOME
async function handleDbPath() {
  const dbPath = await inquirer.prompt([
    {
      name: 'dbPath',
      type: 'input',
      message: 'Enter the path to the database file:',
      default: currentConfig.dbPath,
      // validate: (value) => {
      //   if (value.startsWith('~')) {
      //     return 'Path cannot start with ~';
      //   }
      //   return true;
      // },
    },
  ]);
  // console.dir(dbPath);
}

while (true) {
  const selectedItem = await askMenuPrompt();
  // blank means exit
  if (selectedItem.configItem === '') {
    process.exit(0);
  }
  switch (selectedItem.configItem) {
    case 'dbPath':
      await handleDbPath();
      break;
    default:
      console.error(`Unknown config item: ${selectedItem.configItem}`);
      break;
  }
}

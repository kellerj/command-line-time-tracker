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

async function handleDbPath() {
  const dbPath = await inquirer.prompt([
    {
      name: 'dbPath',
      type: 'input',
      message: 'Enter the path to the database file:',
      default: currentConfig.dbPath,
      validate: (value) => {
        value = value.trim();
        // Node paths do not support ~, replace with $HOME
        if (value.startsWith('~')) {
          value = value.replace('~', process.env.HOME);
        }
        // no relative paths
        if (value.startsWith('.')) {
          return 'Relative paths are not allowed';
        }
        // check that given path does not exist or is a directory
        if (fs.existsSync(value)) {
          const stat = fs.statSync(value);
          console.dir(stat);
          if (!stat.isDirectory()) {
            return 'Path is an existing file, must be a directory.';
          }
        }

        return true;
      },
    },
  ]);
  // console.dir(dbPath);
  let dbPathValue = dbPath.dbPath.trim();
  if (dbPathValue.startsWith('~')) {
    dbPathValue = dbPathValue.replace('~', process.env.HOME);
  }
  if (dbPathValue === currentConfig.dbPath) {
    return; // skip making updates to configuration file
  }
  fs.mkdirSync(dbPathValue, { recursive: true });
  // update the configuration file
  updateConfigValue('dbPath', dbPathValue);
}

// Loop until the user selects the exit option
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

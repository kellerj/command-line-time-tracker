#!/usr/bin/env node

import { Command } from '@commander-js/extra-typings';
import inquirer from 'inquirer';
// import inquirerAutoCompletePrompt from 'inquirer-autocomplete-prompt';
// import chalk from 'chalk';
// import { sprintf } from 'sprintf-js';
// import Rx from 'rx';
import debug from 'debug';
// import dateFns from 'date-fns';

import { CONFIG_FILE_LOCATION } from './constants.js';
import { ConfigOption } from './types/config.js';

const LOG = debug('tt:config');

const ttConfig = new Command()
  .description('Configure options for the time tracker tool')
  .parse();
// const options = ttConfig.opts();
// LOG(`Parsed ttConfig Object: ${JSON.stringify(ttConfig, null, 2)}`);


const configOptions: ConfigOption[] = [
  {
    name: 'Database Path',
    description: 'Location that the database file will be stored.',
    configId: 'dbPath',
    valueType: 'path',
  },
  {
    name: 'Projects',
    description: 'Configure project options',
    configId: 'projects',
    valueType: 'array',
  },
  {
    name: 'Time Types',
    description: 'Configure time type options',
    configId: 'timetypes',
    valueType: 'array',
  },
];
// start of day
// end of day
// default length of time entry
// include waste of time
// default to length since last entry
// TODO: Read the current configuration file
// TODO: Go to subroutine to handle DB path setup
const entryList = configOptions.map(item => ({
  value: item.configId,
  name: item.name,
}));
entryList.push({ value: null, name: '(Exit)' });

while (true) {

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
  console.dir(answer);
  if (answer.configItem === null) {
    process.exit(0);
  }
  if (answer.configItem === 'dbPath') {
    const dbPath = await inquirer.prompt([
      {
        name: 'dbPath',
        type: 'input',
        message: 'Enter the path to the database file:',
        default: CONFIG_FILE_LOCATION,
        // validate: (value) => {
        //   if (value.startsWith('~')) {
        //     return 'Path cannot start with ~';
        //   }
        //   return true;
        // },
      },
    ]);
    console.dir(dbPath);
    process.exit(0);
  }
}

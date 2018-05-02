#!/usr/bin/env node

import commander from 'commander';
import inquirer from 'inquirer';
import debug from 'debug';

import displayUtils from '../utils/display-utils';
import { addNewProject } from '../lib/project';

const LOG = debug('tt:commands:project:add');

commander
  .description('Add a time tracking project to the database')
  .arguments('<projectName>')
  .parse(process.argv);

const inputProjectName = commander.args.join(' ');

async function run() {
  if (inputProjectName) {
    addNewProject(inputProjectName);
  } else {
    const answer = await inquirer.prompt([
      {
        name: 'projectName',
        type: 'input',
        message: 'Please enter the new project name:',
      },
    ]);
    addNewProject(answer.projectName);
  }
}

try {
  run().catch((err) => {
    displayUtils.writeError(err.message);
    LOG(err);
    process.exitCode = 1;
  });
} catch (err) {
  displayUtils.writeError(err.message);
  LOG(err);
  process.exitCode = 1;
}

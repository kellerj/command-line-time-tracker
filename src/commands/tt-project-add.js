#!/usr/bin/env node

import { program } from 'commander';
import { input } from '@inquirer/prompts';
import debug from 'debug';

import displayUtils from '../utils/display-utils.js';
import { addNewProject } from '../lib/project.js';

const LOG = debug('tt:commands:project:add');

program
  .description('Add a time tracking project to the database')
  .arguments('<projectName>')
  .parse(process.argv);

const inputProjectName = program.args.join(' ');

async function run() {
  if (inputProjectName) {
    addNewProject(inputProjectName);
  } else {
    const projectName = await input({
      message: 'Please enter the new project name:',
    });
    addNewProject(projectName);
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

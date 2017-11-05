#!/usr/bin/env node

import commander from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import debug from 'debug';

import db from '../db';

const LOG = debug('tt:project:add');

commander
  .description('Add a time tracking project to the database')
  .arguments('<projectName>')
  .parse(process.argv);

const inputProjectName = commander.args.join(' ');

function performProjectUpdate(projectName) {
  co(function* run() {
    LOG(`Request to add project "${projectName}"`);
    const insertSuceeded = yield* db.project.insert(projectName);
    if (insertSuceeded) {
      console.log(chalk.green(`Project ${chalk.white.bold(projectName)} added`));
    } else {
      console.log(chalk.bgRed(`Project ${chalk.yellow.bold(projectName)} already exists.`));
    }
  }).catch((err) => {
    console.log(chalk.bgRed(err.stack));
  });
}

if (inputProjectName) {
  performProjectUpdate(inputProjectName);
} else {
  inquirer.prompt([
    {
      name: 'projectName',
      type: 'input',
      message: 'Please enter the new project name:',
    },
  ]).then((answer) => {
    LOG(JSON.stringify(answer, null, 2));
    performProjectUpdate(answer.projectName);
  });
}

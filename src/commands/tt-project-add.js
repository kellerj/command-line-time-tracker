#!/usr/bin/env node -r babel-register

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

async function performProjectUpdate(projectName) {
  LOG(`Request to add project "${projectName}"`);
  const insertSuceeded = await db.project.insert(projectName);
  if (insertSuceeded) {
    console.log(chalk.green(`Project ${chalk.white.bold(projectName)} added`));
  } else {
    console.log(chalk.bgRed(`Project ${chalk.yellow.bold(projectName)} already exists.`));
  }
}

async function run() {
  if (inputProjectName) {
    performProjectUpdate(inputProjectName);
  } else {
    const answer = await inquirer.prompt([
      {
        name: 'projectName',
        type: 'input',
        message: 'Please enter the new project name:',
      },
    ]);
    performProjectUpdate(answer.projectName);
  }
}

try {
  run().catch((err) => {
    console.log(chalk.red(err.message));
    LOG(err);
    process.exitCode = 1;
  });
} catch (err) {
  console.log(chalk.red(err.message));
  LOG(err);
  process.exitCode = 1;
}

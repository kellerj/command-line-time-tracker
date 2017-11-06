#!/usr/bin/env node -r babel-register

import commander from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import debug from 'debug';

import db from '../db';

const LOG = debug('tt:timetype:add');

commander
  .description('Add a time type to the database')
  .arguments('<timeType>')
  .parse(process.argv);

const inputName = commander.args.join(' ');

async function performUpdate(timeTypeName) {
  // console.log(`Request to add timeType "${timeTypeName}"`)
  const insertSuceeded = await db.timetype.insert(timeTypeName);
  if (insertSuceeded) {
    console.log(chalk.green(`Time Type ${chalk.white.bold(timeTypeName)} added`));
  } else {
    console.log(chalk.bgRed(`Time Type ${chalk.yellow.bold(timeTypeName)} already exists.`));
  }
}

async function run() {
  if (inputName) {
    performUpdate(inputName);
  } else {
    const answer = await inquirer.prompt([
      {
        name: 'timeTypeName',
        type: 'input',
        message: 'Please enter the new time type name:',
      },
    ]);
    // console.log(JSON.stringify(answer,null,'  '));
    performUpdate(answer.timeTypeName);
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

#!/usr/bin/env node

import { program } from 'commander';
import { input } from '@inquirer/prompts';
import chalk from 'chalk';
import debug from 'debug';

import db from '../db/index.js';

const LOG = debug('tt:timetype:add');

program
  .description('Add a time type to the database')
  .arguments('<timeType>')
  .parse(process.argv);

const inputName = program.args.join(' ');

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
    const timeTypeName = await input({
      message: 'Please enter the new time type name:',
    });
    // console.log(JSON.stringify(answer,null,'  '));
    performUpdate(timeTypeName);
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

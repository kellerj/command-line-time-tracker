#!/usr/bin/env node -r babel-register

import commander from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import debug from 'debug';

import db from '../db';

const LOG = debug('tt:timetype:delete');

commander
  .arguments('[timeType]', 'Remove time types from the database')
  .parse(process.argv);

const inputName = commander.args.join(' ');

function* performUpdate(names) {
  LOG(JSON.stringify(names, null, 2));
  for (let i = 0; i < names.length; i += 1) {
    LOG(`Deleting ${names[i]}`);
    const wasDeleted = yield db.timetype.remove(names[i]);
    if (wasDeleted) {
      console.log(chalk.green(`Time Type ${chalk.white(names[i])} Removed`));
    } else {
      console.log(chalk.red(`Time Type ${chalk.white(names[i])} Not Present In database`));
    }
  }
}

async function run() {
  const r = await db.timetype.getAll();
  if (r) {
    LOG(JSON.stringify(r, null, 2));
    const answer = await inquirer.prompt([
      {
        name: 'names',
        type: 'checkbox',
        message: 'Select Time Types to Remove',
        choices: r.map(item => (item.name)),
        pageSize: 15,
        when: () => (inputName === ''),
      },
      {
        name: 'confirm',
        type: 'confirm',
        message: 'Are you sure you want to delete this time type?',
        default: false,
        when: answers => ((answers.names && answers.names.length) || inputName),
      },
    ]);
    if (answer.confirm) {
      // If we got a name on the command line, use that
      if (inputName !== '') {
        answer.names = [inputName];
      }
      await performUpdate(answer.names);
    }
  } else {
    console.log(chalk.yellow('No Time Types Defined'));
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

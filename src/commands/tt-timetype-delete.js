#!/usr/bin/env node

import { program } from 'commander';
import { checkbox, confirm } from '@inquirer/prompts';
import chalk from 'chalk';
import debug from 'debug';

import db from '../db/index.js';

const LOG = debug('tt:timetype:delete');

program
  .arguments('[timeType]', 'Remove time types from the database')
  .parse(process.argv);

const inputName = program.args.join(' ');

async function performUpdate(names) {
  LOG(JSON.stringify(names, null, 2));
  for (let i = 0; i < names.length; i += 1) {
    LOG(`Deleting ${names[i]}`);
    // eslint-disable-next-line no-await-in-loop
    const wasDeleted = await db.timetype.remove(names[i]);
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

    let names = [];

    // If no input name, show checkbox selection
    if (inputName === '') {
      names = await checkbox({
        message: 'Select Time Types to Remove',
        choices: r.map((item) => ({ value: item.name, name: item.name })),
        pageSize: 15,
      });
    } else {
      names = [inputName];
    }

    // Only prompt for confirmation if we have selections
    if (names && names.length) {
      const confirmed = await confirm({
        message: 'Are you sure you want to delete this time type?',
        default: false,
      });

      if (confirmed) {
        await performUpdate(names);
      }
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

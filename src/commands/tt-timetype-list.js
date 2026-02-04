#!/usr/bin/env node

import { program } from 'commander';
import chalk from 'chalk';
import Table from 'easy-table';
import debug from 'debug';

import db from '../db';

const LOG = debug('tt:timetype:list');

program
  .description('List all current time types in alphabetical order.')
  .parse(process.argv);

async function run() {
  const r = await db.timetype.getAll();

  if (r) {
    // console.log(JSON.stringify(r));
    // eslint-disable-next-line no-param-reassign
    console.log(chalk.yellow(Table.print(
      r.map((item) => { delete item._id; return item; }),
      { name: { name: chalk.white.bold('Time Type') } },
    )));
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

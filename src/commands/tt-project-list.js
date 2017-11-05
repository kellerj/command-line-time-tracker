#!/usr/bin/env node -r babel-register

import commander from 'commander';
import chalk from 'chalk';
import Table from 'easy-table';
import debug from 'debug';

import db from '../db';

const LOG = debug('tt:project:list');

commander
  .description('List all current projects in alphabetical order.')
  .parse(process.argv);

async function run() {
  const r = await db.project.getAll();

  if (r) {
    LOG(JSON.stringify(r));
    // eslint-disable-next-line no-param-reassign
    console.log(chalk.yellow(Table.print(
      r.map((item) => { delete item._id; return item; }),
      { name: { name: chalk.white.bold('Project Name') } },
    )));
  } else {
    console.log(chalk.yellow('No Projects Defined'));
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

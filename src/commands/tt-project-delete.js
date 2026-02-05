import { program } from 'commander';
import { checkbox, confirm } from '@inquirer/prompts';
import chalk from 'chalk';
import debug from 'debug';

import displayUtils from '../utils/display-utils.js';
import db from '../db/index.js';

const LOG = debug('tt:project:delete');

program
  .arguments('[projectName]', 'Remove time tracking projects from the database')
  .parse(process.argv);

const inputName = program.args.join(' ');

async function performUpdate(names) {
  LOG(JSON.stringify(names, null, 2));
  for (let i = 0; i < names.length; i += 1) {
    LOG(`Deleting ${names[i]}`);
    // eslint-disable-next-line no-await-in-loop
    const wasDeleted = await db.project.remove(names[i]);
    if (wasDeleted) {
      process.stdout.write(chalk.green(`Project ${chalk.white(names[i])} Removed\n`));
    } else {
      process.stdout.write(chalk.red(`Project ${chalk.white(names[i])} Not Present In database\n`));
    }
  }
}

async function run() {
  const r = await db.project.getAll();
  if (r) {
    LOG(JSON.stringify(r, null, 2));

    let names = [];

    // If no input name, show checkbox selection
    if (inputName === '') {
      names = await checkbox({
        message: 'Select Projects to Remove',
        choices: r.map((item) => ({ value: item.name, name: item.name })),
        pageSize: 15,
      });
    } else {
      names = [inputName];
    }

    // Only prompt for confirmation if we have selections
    if (names && names.length) {
      const confirmed = await confirm({
        message: 'Are you sure you want to delete this project?',
        default: false,
      });

      if (confirmed) {
        await performUpdate(names);
      }
    }
  } else {
    process.stdout.write(chalk.yellow('No Projects Defined\n'));
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

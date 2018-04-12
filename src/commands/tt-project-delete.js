import commander from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import debug from 'debug';

import displayUtils from '../utils/display-utils';
import db from '../db';

const LOG = debug('tt:project:delete');

commander
  .arguments('[projectName]', 'Remove time tracking projects from the database')
  .parse(process.argv);

const inputName = commander.args.join(' ');

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
    const answer = await inquirer.prompt([
      {
        name: 'names',
        type: 'checkbox',
        message: 'Select Projects to Remove',
        choices: r.map(item => (item.name)),
        pageSize: 15,
        when: () => (inputName === ''),
      },
      {
        name: 'confirm',
        type: 'confirm',
        message: 'Are you sure you want to delete this project?',
        default: false,
        when: answers => ((answers.names && answers.names.length) || inputName),
      },
    ]);
    if (answer.confirm) {
      // If we got a project name on the command line, use that
      if (inputName !== '') {
        answer.names = [inputName];
      }
      await performUpdate(answer.names);
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

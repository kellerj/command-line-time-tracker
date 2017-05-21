#!/usr/bin/env node

const commander = require('commander');
const inquirer = require('inquirer');
const co = require('co');
const db = require('./db');
const chalk = require('chalk');
const debug = require('debug')('tt:timetype:delete');

commander
    .version('1.0.0')
    .arguments('[timeType]', 'Remove time types from the database')
    .parse(process.argv);

const inputName = commander.args.join(' ');

function* performUpdate(names) {
  debug(JSON.stringify(names, null, 2));
  for (let i = 0; i < names.length; i += 1) {
    debug(`Deleting ${names[i]}`);
    const wasDeleted = yield db.timetype.remove(names[i]);
    if (wasDeleted) {
      console.log(chalk.green(`Time Type ${chalk.white(names[i])} Removed`));
    } else {
      console.log(chalk.red(`Time Type ${chalk.white(names[i])} Not Present In database`));
    }
  }
}

co(function* run() {
  const r = yield db.timetype.getAll();
  if (r) {
    debug(JSON.stringify(r, null, 2));
    const answer = yield inquirer.prompt([
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
      yield* performUpdate(answer.names);
    }
  } else {
    console.log(chalk.yellow('No Time Types Defined'));
  }
});

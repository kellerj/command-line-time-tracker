#!/usr/bin/env node

const commander = require('commander');
const inquirer = require('inquirer');
const co = require('co');
const db = require('./db');
const chalk = require('chalk');

commander
    .version('1.0.0')
    .arguments('[timeType]', 'Remove time types from the database')
    .parse(process.argv);

const inputName = commander.args.join(' ');

function* performUpdate(names) {
  // console.log(JSON.stringify(names));
  for (let i = 0; i < names.length; i += 1) {
    // console.log(`Deleting ${names[i]}`);
    const wasDeleted = yield db.timetype.remove(names[i]);
    if (wasDeleted) {
      console.log(chalk.green(`Time Type ${chalk.white(names[i])} Removed`));
    } else {
      // console.log(chalk.red(JSON.stringify(r2)));
      console.log(chalk.red(`Time Type ${chalk.white(names[i])} Not Present In database`));
    }
  }
}

if (inputName === '') {
  co(function* run() {
    const r = yield db.timetype.getAll();
    if (r) {
      // console.log(JSON.stringify(r));
      const answer = yield inquirer.prompt([
        {
          name: 'names',
          type: 'checkbox',
          message: 'Select Time Types to Remove',
          choices: r.map(item => (item.name)),
        },
      ]);
      yield* performUpdate(answer.names);
    } else {
      console.log(chalk.yellow('No Time Types Defined'));
    }
  });
} else {
  co(performUpdate([inputName]));
}

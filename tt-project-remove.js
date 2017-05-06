#!/usr/bin/env node

const commander = require('commander');
const inquirer = require('inquirer');
const co = require('co');
const db = require('./db');
const chalk = require('chalk');

commander
    .version('1.0.0')
    .arguments('[projectName]', 'Remove time tracking projects from the database')
    .parse(process.argv);

const inputName = commander.args.join(' ');

function* performUpdate(names) {
  // console.log(JSON.stringify(names));
  for (let i = 0; i < names.length; i += 1) {
    // console.log(`Deleting ${names[i]}`);
    const wasDeleted = yield db.project.remove(names[i]);
    if (wasDeleted) {
      console.log(chalk.green(`Project ${chalk.white(names[i])} Removed`));
    } else {
      // console.log(chalk.red(JSON.stringify(r2)));
      console.log(chalk.red(`Project ${chalk.white(names[i])} Not Present In database`));
    }
  }
}

co(function* run() {
  const r = yield db.project.getAll();
  if (r) {
    // console.log(JSON.stringify(r));
    const answer = yield inquirer.prompt([
      {
        name: 'names',
        type: 'checkbox',
        message: 'Select Projects to Remove',
        choices: r.map(item => (item.name)),
        when: () => (inputName === ''),
      },
      {
        name: 'confirm',
        type: 'confirm',
        message: 'Are you sure you want to delete this project?',
        default: false,
      },
    ]);
    if (answer.confirm) {
      // If we got a project name on the command line, use that
      if (inputName !== '') {
        answer.names = [inputName];
      }
      yield* performUpdate(answer.names);
    }
  } else {
    console.log(chalk.yellow('No Projects Defined'));
  }
});

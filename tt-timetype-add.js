#!/usr/bin/env node

const commander = require('commander');
const inquirer = require('inquirer');
const co = require('co');
const db = require('./db');
const chalk = require('chalk');

commander
    .version('1.0.0')
    .description('Add a time type to the database')
    .arguments('<timeType>')
    .parse(process.argv);

const inputName = commander.args.join(' ');

function performUpdate(timeTypeName) {
  co(function* run() {
    // console.log(`Request to add timeType "${timeTypeName}"`)
    const insertSuceeded = yield* db.timetype.insert(timeTypeName);
    if (insertSuceeded) {
      console.log(chalk.green(`Time Type ${chalk.white.bold(timeTypeName)} added`));
    } else {
      console.log(chalk.bgRed(`Time Type ${chalk.yellow.bold(timeTypeName)} already exists.`));
    }
  }).catch((err) => {
    console.log(chalk.bgRed(err.stack));
  });
}

if (inputName) {
  performUpdate(inputName);
} else {
  inquirer.prompt([
    {
      name: 'timeTypeName',
      type: 'input',
      message: 'Please enter the new time type name:',
    },
  ]).then((answer) => {
    // console.log(JSON.stringify(answer,null,'  '));
    performUpdate(answer.timeTypeName);
  });
}

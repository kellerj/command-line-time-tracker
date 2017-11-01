#!/usr/bin/env node -r babel-register

import commander from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';

import db from '../db';

commander
  .description('Add a time type to the database')
  .arguments('<timeType>')
  .parse(process.argv);

const inputName = commander.args.join(' ');

async function performUpdate(timeTypeName) {
  // console.log(`Request to add timeType "${timeTypeName}"`)
  const insertSuceeded = await db.timetype.insert(timeTypeName);
  if (insertSuceeded) {
    console.log(chalk.green(`Time Type ${chalk.white.bold(timeTypeName)} added`));
  } else {
    console.log(chalk.bgRed(`Time Type ${chalk.yellow.bold(timeTypeName)} already exists.`));
  }
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

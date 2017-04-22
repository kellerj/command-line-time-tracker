#!/usr/bin/env node

const commander = require('commander');
const inquirer = require('inquirer');
const co = require('co');
const db = require('./db');
const chalk = require('chalk');

commander
    .version('1.0.0')
    .description('Add a time tracking project to the database')
    .arguments('<projectName>')
    .parse(process.argv);

const inputProjectName = commander.args.join(' ');

function performProjectUpdate(projectName) {
  co(function* run() {
    // console.log(`Request to add project "${projectName}"`)
    const insertSuceeded = yield* db.project.insert(projectName);
    if (insertSuceeded) {
      console.log(chalk.green(`Project ${chalk.white.bold(projectName)} added`));
    } else {
      console.log(chalk.bgRed(`Project ${chalk.yellow.bold(projectName)} already exists.`));
    }
  }).catch((err) => {
    console.log(chalk.bgRed(err.stack));
  });
}

if (inputProjectName) {
  performProjectUpdate(inputProjectName);
} else {
  inquirer.prompt([
    {
      name: 'projectName',
      type: 'input',
      message: 'Please enter the new project name:',
    },
  ]).then((answer) => {
    // console.log(JSON.stringify(answer,null,'  '));
    performProjectUpdate(answer.projectName);
  });
}

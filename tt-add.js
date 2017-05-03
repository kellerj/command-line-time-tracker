#!/usr/bin/env node

const commander = require('commander');
const inquirer = require('inquirer');
const co = require('co');
const db = require('./db');
const chalk = require('chalk');

commander
    .version('1.0.0')
    .description('Record a time entry')
    .usage('[options] [entryDescription]')
    .option('-t, --time <min>', 'Minutes spent', parseInt)
    .option('-y, --type <timeType>')
    .option('-p, --project <projectName>')
    .parse(process.argv);

const entryDescription = commander.args.join(' ');

// TODO: save option values

function performUpdate(timeEntry) {
  co(function* runUpdate() {
    console.log(`Request to add timeEntry "${JSON.stringify(timeEntry)}"`);
    const insertSuceeded = yield* db.timeEntry.insert(timeEntry);
    if (insertSuceeded) {
      console.log(chalk.green(`Time Entry ${chalk.white.bold(JSON.stringify(timeEntry))} added`));
    } else {
      console.log(chalk.bgRed(`Failed to insert ${chalk.yellow.bold(JSON.stringify(timeEntry))}.`));
    }
  }).catch((err) => {
    console.log(chalk.bgRed(err.stack));
  });
}

function* run() {
  const projects = yield* db.project.getAll();
  const timeTypes = yield* db.timetype.getAll();

  // TODO: If project option is not a valid project, reject with list of project names
  // TODO: If time type option is not a valid project, reject with list of type names
  // TODO: If time number is not valid project, reject
  // TODO: extract validation functions so can be used here and in the inquirer code below

  inquirer.prompt([
    {
      name: 'entryDescription',
      type: 'input',
      message: 'Entry Description:',
      filter: input => (input.trim()),
      validate: (input) => {
        if (!input) {
          return 'description is required';
        }
        return true;
      },
      when: () => (entryDescription === ''),
    },
    {
      name: 'project',
      type: 'list',
      message: 'Project:',
      choices: projects.map(item => (item.name)),
    },
    {
      name: 'timeType',
      type: 'list',
      message: 'Type of Type:',
      choices: timeTypes.map(item => (item.name)),
    },
    {
      name: 'minutes',
      type: 'input',
      message: 'Minutes:',
      default: 60,
      validate: (val) => {
        if (Number.isNaN(val)) {
          return 'Invalid Integer';
        } else if (Number.parseInt(val, 10) < 1) {
          return 'Time must be positive';
        } else if (Number.parseInt(val, 10) > 8 * 60) {
          return 'Time must be <= 8 hours';
        }
        return true;
      },
      filter: val => (Number.parseInt(val, 10)),
    },
    {
      name: 'wasteOfTime',
      type: 'confirm',
      message: 'Waste of Time?',
      default: false,
    },
  ]).then((answer) => {
    if (!answer.entryDescription) {
      answer.entryDescription = entryDescription.trim();
    }
    console.log(JSON.stringify(answer, null, '  '));
    performUpdate(answer);
  });
}

co(run);

#!/usr/bin/env node

const commander = require('commander');
const inquirer = require('inquirer');
const co = require('co');
const db = require('./db');
// const chalk = require('chalk');

commander
    .version('1.0.0')
    .description('Record a time entry')
    .usage('[options] [entryDescription]')
    .option('-t, --time <min>', 'Minutes spent', parseInt)
    .option('-y, --type <timeType>')
    .option('-p, --project <projectName>')
    .parse(process.argv);

const entryDescription = commander.args.join(' ');

// function performProjectUpdate(projectName) {
  // co(function* run() {
  //   // console.log(`Request to add project "${projectName}"`)
  //   const insertSuceeded = yield* db.timeentry.insert(projectName);
  //   if (insertSuceeded) {
  //     console.log(chalk.green(`Project ${chalk.white.bold(projectName)} added`));
  //   } else {
  //     console.log(chalk.bgRed(`Project ${chalk.yellow.bold(projectName)} already exists.`));
  //   }
  // }).catch((err) => {
  //   console.log(chalk.bgRed(err.stack));
  // });
// }

function* run() {
  const projects = yield* db.project.getAll();
  const timeTypes = yield* db.timetype.getAll();

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
    //performProjectUpdate(answer.projectName);
  });
}

co(run);

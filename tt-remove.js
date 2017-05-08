#!/usr/bin/env node

const commander = require('commander');
const inquirer = require('inquirer');
const co = require('co');
const db = require('./db');
const chalk = require('chalk');
const moment = require('moment');
const debug = require('debug')('tt:remove');

commander
    .version('1.0.0')
    .option('-d, --date <YYYY-MM-DD>', 'Date from which to remove items.')
    .parse(process.argv);

const entryDate = commander.date;

function* performUpdate(entries) {
  debug(JSON.stringify(entries, null, 2));
  // for (let i = 0; i < names.length; i += 1) {
  //   debug(`Deleting ${names[i]}`);
  //   const wasDeleted = yield db.project.remove(names[i]);
  //   if (wasDeleted) {
  //     console.log(chalk.green(`Project ${chalk.white(names[i])} Removed`));
  //   } else {
  //     console.log(chalk.red(`Project ${chalk.white(names[i])} Not Present In database`));
  //   }
  // }
}

co(function* run() {
  const r = yield* db.timeEntry.get(entryDate);

  if (r && r.length) {
    debug(JSON.stringify(r, null, 2));
  } else {
    console.log(chalk.yellow(`No Time Entries Defined for ${moment(entryDate).format('YYYY-MM-DD')}`));
  }
  if (r) {
    debug(JSON.stringify(r, null, 2));
    const answer = yield inquirer.prompt([
      {
        name: 'entries',
        type: 'checkbox',
        message: 'Select Time Types to Remove',
        choices: r.map(item => ({ _id: item._id, name: item.entryDescription })),
      },
      {
        name: 'confirm',
        type: 'confirm',
        message: 'Are you sure you want to delete these time entries?',
        default: false,
        when: answers => (answers.entries.length),
      },
    ]);
    if (answer.confirm) {
      yield* performUpdate(answer.names);
    }
  } else {
    console.log(chalk.yellow(`No Time Entries Entered for ${entryDate}`));
  }
});

#!/usr/bin/env node

const commander = require('commander');
const inquirer = require('inquirer');
const co = require('co');
const db = require('./db');
const chalk = require('chalk');
const moment = require('moment');
const debug = require('debug')('tt:remove');
const sprintf = require('sprintf-js').sprintf;

commander
    .version('1.0.0')
    .option('-d, --date <YYYY-MM-DD>', 'Date from which to remove items.')
    .parse(process.argv);

const entryDate = commander.date;

function* performUpdate(entries) {
  for (let i = 0; i < entries.length; i += 1) {
    debug(`Deleting ${JSON.stringify(entries[i], null, 2)}`);
    const wasDeleted = yield db.timeEntry.remove(entries[i]);
    if (wasDeleted) {
      console.log(chalk.green(`Time Entry ${chalk.white(entries[i])} Removed`));
    } else {
      console.log(chalk.red(`Time Entry ${chalk.white(entries[i])} Not Present In database`));
    }
  }
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
        message: 'Select Time Entries to Remove',
        choices: r.map(item => ({
          value: item._id,
          name: sprintf('%-8.8s : %-20.20s : %4i : %-15.15s : %-15.15s',
            moment(item.insertTime).format('h:mm a'),
            item.entryDescription,
            item.minutes,
            item.project,
            item.timeType) })),
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
      yield* performUpdate(answer.entries);
    }
  } else {
    console.log(chalk.yellow(`No Time Entries Entered for ${entryDate}`));
  }
});

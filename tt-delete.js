#!/usr/bin/env node

const commander = require('commander');
const inquirer = require('inquirer');
const co = require('co');
const db = require('./db');
const chalk = require('chalk');
const moment = require('moment');
const debug = require('debug')('tt:delete');
const displayUtils = require('./display-utils');

commander
    .version('1.0.0')
    .option('-d, --date <YYYY-MM-DD>', 'Date from which to remove items.')
    .option('--last', 'Remove the most recent entry.')
    .parse(process.argv);

const entryDate = commander.date;
const deleteLast = commander.last;
debug(JSON.stringify(commander, null, 2));

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
  let entries = [];
  if (deleteLast) {
    debug('Getting last entry');
    const entry = yield* db.timeEntry.getMostRecentEntry();
    debug('Got Last Entry');
    console.log(chalk.yellow(displayUtils.formatEntryChoice(entry)));
    entries.push(entry);
  } else {
    entries = yield* db.timeEntry.get(entryDate);
  }

  if (entries && entries.length) {
    debug(JSON.stringify(entries, null, 2));
  } else {
    console.log(chalk.yellow(`No Time Entries Defined for ${moment(entryDate).format('YYYY-MM-DD')}`));
  }
  if (entries) {
    const answer = yield inquirer.prompt([
      {
        name: 'entries',
        type: 'checkbox',
        message: 'Select Time Entries to Remove',
        pageSize: 15,
        when: () => (!deleteLast),
        choices: entries.map(item => ({
          value: item._id,
          name: displayUtils.formatEntryChoice(item),
        })),
      },
      {
        name: 'confirm',
        type: 'confirm',
        message: 'Are you sure you want to delete these time entries?',
        default: false,
        when: answers => (deleteLast || (answers.entries && answers.entries.length)),
      },
    ]);
    if (answer.confirm) {
      if (deleteLast) {
        answer.entries = [entries[0]._id];
      }
      yield* performUpdate(answer.entries);
    }
  } else {
    console.log(chalk.yellow(`No Time Entries Entered for ${entryDate}`));
  }
});
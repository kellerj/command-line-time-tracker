#!/usr/bin/env node

const commander = require('commander');
const inquirer = require('inquirer');
const co = require('co');
const db = require('./db');
const chalk = require('chalk');
const moment = require('moment');
const debug = require('debug')('tt:edit');
const sprintf = require('sprintf-js').sprintf;

commander
    .version('1.0.0')
    .option('-d, --date <YYYY-MM-DD>', 'Date for which to edit an entry.')
    .option('--last', 'Edit the last entry added without displaying a list first.')
    .parse(process.argv);

const entryDate = commander.date;
const editLast = commander.last;
debug(JSON.stringify(commander, null, 2));

function* performUpdate(entry) {
  //   debug(`Deleting ${JSON.stringify(entries[i], null, 2)}`);
  //   const wasDeleted = yield db.timeEntry.remove(entries[i]);
  //   if (wasDeleted) {
  //     console.log(chalk.green(`Time Entry ${chalk.white(entries[i])} Removed`));
  //   } else {
  //     console.log(chalk.red(`Time Entry ${chalk.white(entries[i])} Not Present In database`));
  //   }
}

function* getEntryToEdit() {
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
        name: 'entry',
        type: 'list',
        message: 'Select the Time Entry to Edit',
        choices: r.map(item => ({
          value: item._id,
          name: sprintf('%-8.8s : %-20.20s : %4i : %-15.15s : %-15.15s',
            moment(item.insertTime).format('h:mm a'),
            item.entryDescription,
            item.minutes,
            item.project,
            item.timeType) })),
      },
    ]);
    return r.find(e => (e._id === answer.entry));
  }
  console.log(chalk.yellow(`No Time Entries Entered for ${entryDate}`));
  return null;
}

function* handleEntryChanges(entry) {

}

co(function* run() {
  let entry = null;
  if (!editLast) {
    entry = yield* getEntryToEdit();
  } else {
    entry = yield* db.timeEntry.getMostRecentEntry();
  }
  debug(`Entry Selected: ${JSON.stringify(entry)}`);

  // TODO: implement the edit UI
  entry = yield* handleEntryChanges(entry);
  // TODO: Update the record in the database - new db API method
  yield* performUpdate(entry);
});


// if (answer.confirm) {
//   yield* performUpdate(answer.entries);
// }

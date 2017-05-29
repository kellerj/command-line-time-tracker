#!/usr/bin/env node

const commander = require('commander');
const inquirer = require('inquirer');
const co = require('co');
const db = require('./db');
const chalk = require('chalk');
const moment = require('moment');
const debug = require('debug')('tt:edit');
const sprintf = require('sprintf-js').sprintf;
const validations = require('./validations');
const displayUtils = require('./display-utils');

commander
    .version('1.0.0')
    .option('-d, --date <YYYY-MM-DD>', 'Date for which to edit an entry.')
    .option('--last', 'Edit the last entry added without displaying a list first.')
    .parse(process.argv);

const entryDate = commander.date;
const editLast = commander.last;
debug(JSON.stringify(commander, null, 2));

function* performUpdate(entry) {
  debug(`Updating ${JSON.stringify(entry, null, 2)}`);
  const wasUpdated = yield db.timeEntry.update(entry);
  if (wasUpdated) {
    const timeEntrySummary = sprintf('%s : %s : %s',
      entry.entryDescription,
      entry.project,
      entry.timeType);
    console.log(chalk.green(`Time Entry ${chalk.white.bold(timeEntrySummary)} Updated`));
  } else {
    console.log(chalk.red(`Time Entry ${chalk.white(JSON.stringify(entry))} failed to update`));
  }
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
        pageSize: 15,
        choices: r.map(item => ({
          value: item._id,
          name: displayUtils.formatEntryChoice(item) })),
      },
    ]);
    return r.find(e => (e._id === answer.entry));
  }
  console.log(chalk.yellow(`No Time Entries Entered for ${entryDate}`));
  return null;
}

function* handleEntryChanges(entry) {
  debug(`Starting Edit for Entry: ${JSON.stringify(entry)}`);
  const projects = (yield* db.project.getAll()).map(item => (item.name));
  const timeTypes = (yield* db.timetype.getAll()).map(item => (item.name));

  return yield inquirer.prompt([
    {
      name: 'entryDescription',
      type: 'input',
      message: 'Entry Description:',
      default: entry.entryDescription,
      filter: input => (input.trim()),
      validate: validations.validateEntryDescription,
    },
    {
      name: 'minutes',
      type: 'input',
      message: 'Minutes:',
      default: entry.minutes,
      validate: validations.validateMinutes,
      filter: val => (Number.parseInt(val, 10)),
    },
    {
      name: 'project',
      type: 'list',
      message: 'Project:',
      choices: projects,
      default: entry.project,
      pageSize: 15,
    },
    {
      name: 'timeType',
      type: 'list',
      message: 'Type of Type:',
      choices: timeTypes,
      default: entry.timeType,
      pageSize: 15,
    },
    {
      name: 'wasteOfTime',
      type: 'confirm',
      message: 'Waste of Time?',
      default: entry.wasteOfTime,
    },
  ]).then((answer) => {
    answer._id = entry._id;
    answer.entryDate = entry.entryDate;
    answer.insertTime = entry.insertTime;
    debug(`Updated Entry: ${JSON.stringify(answer, null, 2)}`);
    return answer;
  });
}

co(function* run() {
  let entry = null;
  if (!editLast) {
    entry = yield* getEntryToEdit();
  } else {
    entry = yield* db.timeEntry.getMostRecentEntry();
  }
  debug(`Entry Selected: ${JSON.stringify(entry)}`);

  // implement the edit UI
  entry = yield* handleEntryChanges(entry);
  // TODO: Update the record in the database - new db API method
  yield* performUpdate(entry);
});

#!/usr/bin/env node -r babel-register

import commander from 'commander';
import inquirer from 'inquirer';
import inquirerAutoCompletePrompt from 'inquirer-autocomplete-prompt';
import chalk from 'chalk';
import moment from 'moment'; // TODO: Convert to use date-fns
import debug from 'debug';
import { sprintf } from 'sprintf-js';

import db from '../db';
import validations from '../utils/validations';
import displayUtils from '../utils/display-utils';

const LOG = debug('tt:edit');

commander
  .description('Edit an existing time entry from the current day.')
  .usage('[options]')
  .option('-d, --date <YYYY-MM-DD>', 'Date for which to edit an entry.')
  .option('-y, --yesterday', 'List entries from yesterday to delete.')
  .option('--last', 'Edit the last entry added without displaying a list first.')
  .parse(process.argv);

let entryDate = commander.date;
const editLast = commander.last;
LOG(JSON.stringify(commander, null, 2));

async function performUpdate(entry) {
  LOG(`Updating ${JSON.stringify(entry, null, 2)}`);
  const wasUpdated = await db.timeEntry.update(entry);
  if (wasUpdated) {
    const timeEntrySummary = sprintf(
      '%s : %s : %s',
      entry.entryDescription,
      entry.project,
      entry.timeType,
    );
    console.log(chalk.green(`Time Entry ${chalk.white.bold(timeEntrySummary)} Updated`));
  } else {
    console.log(chalk.red(`Time Entry ${chalk.white(JSON.stringify(entry))} failed to update`));
  }
}

async function getEntryToEdit(date) {
  const r = await db.timeEntry.get(date);

  if (r && r.length) {
    LOG(JSON.stringify(r, null, 2));
  } else {
    console.log(chalk.yellow(`No Time Entries Defined for ${moment(date).format('YYYY-MM-DD')}`));
  }
  if (r) {
    LOG(JSON.stringify(r, null, 2));
    const answer = await inquirer.prompt([
      {
        name: 'entry',
        type: 'list',
        message: 'Select the Time Entry to Edit',
        pageSize: 15,
        choices: r.map(item => ({
          value: item._id,
          name: displayUtils.formatEntryChoice(item),
        })),
      },
    ]);
    return r.find(e => (e._id === answer.entry));
  }
  console.log(chalk.yellow(`No Time Entries Entered for ${moment(date).format('YYYY-MM-DD')}`));
  return null;
}

async function handleEntryChanges(entry) {
  LOG(`Starting Edit for Entry: ${JSON.stringify(entry, null, 2)}`);
  const projects = (await db.project.getAll()).map(item => (item.name));
  const timeTypes = (await db.timetype.getAll()).map(item => (item.name));

  inquirer.registerPrompt('autocomplete', inquirerAutoCompletePrompt);
  return inquirer.prompt([
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
      name: 'insertTime',
      type: 'input',
      message: 'Entry Time:',
      default: moment(entry.insertTime).format('h:mm a'),
      filter: input => (moment(input, 'h:mm a')),
      validate: validations.validateTime,
    },
    {
      name: 'project',
      type: 'autocomplete',
      message: 'Project:',
      source: (answers, input) =>
        (displayUtils.autocompleteListSearch(projects, input, entry.project)),
      pageSize: 10,
    },
    {
      name: 'timeType',
      type: 'autocomplete',
      message: 'Type of Type:',
      source: (answers, input) =>
        (displayUtils.autocompleteListSearch(timeTypes, input, entry.timeType)),
      pageSize: 10,
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
    // reset the date on the record and convert back to a date
    const entryMoment = moment(answer.entryDate);
    answer.insertTime.year(entryMoment.year());
    answer.insertTime.month(entryMoment.month());
    answer.insertTime.date(entryMoment.date());
    answer.insertTime = answer.insertTime.toDate();
    LOG(`Updated Entry: ${JSON.stringify(answer, null, 2)}`);
    return answer;
  });
}

async function run() {
  try {
    let entry = null;
    if (entryDate) {
      const temp = moment(entryDate, 'YYYY-MM-DD');
      if (!temp.isValid()) {
        throw new Error(`-d, --date: Invalid Date: ${entryDate}`);
      }
      entryDate = temp;
    } else if (commander.yesterday) {
      entryDate = moment().subtract(1, 'day');
    } else {
      entryDate = moment();
    }
    if (!editLast) {
      entry = await getEntryToEdit(entryDate);
    } else {
      entry = await db.timeEntry.getMostRecentEntry(entryDate);
      if (!entry) {
        throw new Error(chalk.yellow(`No Time Entries Defined for ${moment(entryDate).format('YYYY-MM-DD')}`));
      }
    }
    LOG(`Entry Selected: ${JSON.stringify(entry)}`);

    // implement the edit UI
    entry = await handleEntryChanges(entry);
    // TODO: Update the record in the database - new db API method
    await performUpdate(entry);
  } catch (err) {
    // do nothing - just suppress the error trace
    console.log(chalk.red(err.message));
    LOG(err);
  }
}

try {
  run().catch((err) => {
    console.log(chalk.red(err.message));
    LOG(err);
    process.exitCode = 1;
  });
} catch (err) {
  console.log(chalk.red(err.message));
  LOG(err);
  process.exitCode = 1;
}

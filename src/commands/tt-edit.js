#!/usr/bin/env node -r babel-register

import commander from 'commander';
import inquirer from 'inquirer';
import inquirerAutoCompletePrompt from 'inquirer-autocomplete-prompt';
import chalk from 'chalk';
import { format, parse, subDays, isValid, setHours, setMinutes } from 'date-fns';
import parseTime from 'parse-loose-time';
import debug from 'debug';

import { DATE_FORMAT } from '../constants';
import db from '../db';
import validations from '../utils/validations';
import displayUtils from '../utils/display-utils';
import { updateTimeEntry } from '../lib/timeEntry';

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

async function getEntryToEdit(date) {
  const r = await db.timeEntry.get(date);

  if (r && r.length) {
    LOG(JSON.stringify(r, null, 2));
  } else {
    console.log(chalk.yellow(`No Time Entries Defined for ${format(date, DATE_FORMAT)}`));
    return null;
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
  console.log(chalk.yellow(`No Time Entries Entered for ${format(date, DATE_FORMAT)}`));
  return null;
}

async function handleEntryChanges(entry) {
  LOG(`Starting Edit for Entry: ${JSON.stringify(entry, null, 2)}`);
  const projects = (await db.project.getAll()).map(item => (item.name));
  const timeTypes = (await db.timetype.getAll()).map(item => (item.name));

  inquirer.registerPrompt('autocomplete', inquirerAutoCompletePrompt);
  const answer = await inquirer.prompt([
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
      default: format(entry.insertTime, 'h:mm a'),
      // filter: input => (format(parseTime(input), 'h:mm a')),
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
  ]);
  LOG(`Answer Object: ${JSON.stringify(answer, null, 2)}`);
  answer._id = entry._id;
  answer.entryDate = entry.entryDate;
  const parsedTime = parseTime(answer.insertTime);
  answer.insertTime = setHours(answer.entryDate, parsedTime.hour);
  answer.insertTime = setMinutes(answer.insertTime, parsedTime.minute);
  LOG(`Adjusted Entry: ${JSON.stringify(answer, null, 2)}`);
  return answer;
}

async function run() {
  let entry = null;
  if (entryDate) {
    const temp = parse(entryDate);
    if (!isValid(temp)) {
      throw new Error(`-d, --date: Invalid Date: ${entryDate}`);
    }
    entryDate = temp;
  } else if (commander.yesterday) {
    entryDate = subDays(new Date(), 1);
  } else {
    entryDate = new Date();
  }
  if (!editLast) {
    entry = await getEntryToEdit(entryDate);
  } else {
    entry = await db.timeEntry.getMostRecentEntry(entryDate);
    if (!entry) {
      throw new Error(chalk.yellow(`No Time Entries Defined for ${format(entryDate, DATE_FORMAT)}`));
    }
  }
  LOG(`Entry Selected: ${JSON.stringify(entry)}`);
  if (entry) {
    // implement the edit UI
    entry = await handleEntryChanges(entry);
    // Update the record in the database - new db API method
    await updateTimeEntry(entry);
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

#!/usr/bin/env node

import { program } from 'commander';
import { input, select, confirm } from '@inquirer/prompts';
import autocomplete from 'inquirer-autocomplete-standalone';
import chalk from 'chalk';
import { format, setHours, setMinutes } from 'date-fns';
import parseTime from 'parse-loose-time';
import debug from 'debug';

import * as Constants from '../constants.js';
import db from '../db/index.js';
import validations from '../utils/validations.js';
import displayUtils from '../utils/display-utils.js';
import { updateTimeEntry } from '../lib/timeEntry.js';
import dateUtils from '../utils/date-utils.js';

const LOG = debug('tt:edit');

program
  .description('Edit an existing time entry from the current day.')
  .usage('[options]')
  .option('-d, --date <YYYY-MM-DD>', 'Date for which to edit an entry.')
  .option('-y, --yesterday', 'List entries from yesterday to delete.')
  .option('--last', 'Edit the last entry added without displaying a list first.')
  .parse(process.argv);

const opts = program.opts();
let entryDate = opts.date;
const editLast = opts.last;
LOG(JSON.stringify(opts, null, 2));

async function getEntryToEdit(date) {
  const entries = await db.timeEntry.get(date);

  if (entries && entries.length) {
    LOG(JSON.stringify(entries, null, 2));
  } else {
    throw new Error(chalk.yellow(`No Time Entries Entered for ${format(date, Constants.DATE_FORMAT)}\n`));
  }
  const entryChoices = entries.map((item) => ({
    value: item._id,
    name: displayUtils.formatEntryChoice(item),
  }));
  entryChoices.push({ value: null, name: '(Cancel)' });

  const selectedId = await select({
    message: 'Select the Time Entry to Edit',
    pageSize: Constants.LIST_DISPLAY_SIZE,
    choices: entryChoices,
  });

  return entries.find((e) => (e._id === selectedId));
}

async function handleEntryChanges(entry) {
  LOG(`Starting Edit for Entry: ${JSON.stringify(entry, null, 2)}`);
  const projects = (await db.project.getAll()).map((item) => (item.name));
  const timeTypes = (await db.timetype.getAll()).map((item) => (item.name));

  // Ask questions sequentially
  const entryDescription = await input({
    message: 'Entry Description:',
    default: entry.entryDescription,
    validate: validations.validateEntryDescription,
  });

  const minutes = await input({
    message: 'Minutes:',
    default: String(entry.minutes),
    validate: validations.validateMinutes,
  });

  const insertTimeStr = await input({
    message: 'Entry Time:',
    default: format(entry.insertTime, 'h:mm a'),
    validate: validations.validateTime,
  });

  const project = await autocomplete({
    message: 'Project:',
    source: async (input) => {
      const filtered = displayUtils.autocompleteListSearch(projects, input, entry.project);
      return filtered.map((p) => (typeof p === 'string' ? { value: p, name: p } : p));
    },
  });

  const timeType = await autocomplete({
    message: 'Type of Time:',
    source: async (input) => {
      const filtered = displayUtils.autocompleteListSearch(timeTypes, input, entry.timeType);
      return filtered.map((t) => (typeof t === 'string' ? { value: t, name: t } : t));
    },
  });

  const wasteOfTime = await confirm({
    message: 'Waste of Time?',
    default: entry.wasteOfTime,
  });

  const answer = {
    entryDescription: entryDescription.trim(),
    minutes: Number.parseInt(minutes, 10),
    insertTime: insertTimeStr,
    project,
    timeType,
    wasteOfTime,
  };

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

  entryDate = dateUtils.getEntryDate(entryDate, opts.yesterday);
  LOG(`Using Entry Date: ${entryDate}`);
  if (!editLast) {
    entry = await getEntryToEdit(entryDate);
  } else {
    entry = await db.timeEntry.getMostRecentEntry(entryDate);
    if (!entry) {
      throw new Error(chalk.yellow(`No Time Entries Defined for ${format(entryDate, Constants.DATE_FORMAT)}`));
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
    displayUtils.writeError(err.message);
    LOG(err);
    process.exitCode = 1;
  });
} catch (err) {
  displayUtils.writeError(err.message);
  LOG(err);
  process.exitCode = 1;
}

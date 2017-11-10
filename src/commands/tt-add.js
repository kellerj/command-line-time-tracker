#!/usr/bin/env node -r babel-register

import commander from 'commander';
import inquirer from 'inquirer';
import inquirerAutoCompletePrompt from 'inquirer-autocomplete-prompt';
import chalk from 'chalk';
import moment from 'moment'; // TODO: Convert to use date-fns
import { sprintf } from 'sprintf-js';
import Rx from 'rx';
import debug from 'debug';

import validations from '../utils/validations';
import displayUtils from '../utils/display-utils';
import db from '../db';
import { getEntryDate, getEntryMinutes, getInsertTime,
  getTimeType, getProjectName, getMinutesSinceLastEntry,
  addTimeEntry, addNewProject } from '../lib/timeEntry';

const LOG = debug('tt:add');

commander
  .description('Record a time entry')
  .usage('[options] [entryDescription]')
  .option('-t, --time <minutes>', 'Minutes spent on the activity.')
  .option('-e, --type <timeType>', 'Name of the time type - must be existing.')
  .option('-p, --project <projectName>', 'Project to assign to the time entry - must already exist.')
  .option('-d, --date <YYYY-MM-DD>', 'Date to which to assign the entry, defaults to today.')
  .option('-b, --backTime <backMinutes>', 'Number of minutes by which to back date the entry.')
  .option('-l, --logTime <loggingTime>', 'The time (in hh:mm format) at which to report the entry as having been logged.')
  .option('-y, --yesterday', 'Set the logging date to yesterday.')
  .parse(process.argv);

// Build the new entry object with command line arguments
const newEntry = {
  entryDescription: commander.args.join(' ').trim(),
  project: commander.projectName,
  timeType: commander.type,
  minutes: commander.time,
  insertTime: moment().toDate(),
  entryDate: commander.date,
  wasteOfTime: false,
};

LOG(`New Entry from Command Line: ${JSON.stringify(newEntry, null, 2)}`);

newEntry.entryDate = getEntryDate(commander);
newEntry.minutes = getEntryMinutes(commander);


async function run() {
  // pull the lists of projects and time types from MongoDB
  const projects = (await db.project.getAll()).map(item => (item.name));
  const timeTypes = (await db.timetype.getAll()).map(item => (item.name));

  const lastEntry = await db.timeEntry.getMostRecentEntry(newEntry.entryDate);
  LOG(`Last Entry: ${JSON.stringify(lastEntry, null, 2)}`);

  newEntry.insertTime = getInsertTime(commander, newEntry);
  const minutesSinceLastEntry = getMinutesSinceLastEntry(newEntry, lastEntry);

  newEntry.project = getProjectName(newEntry, projects);
  const projectDefaulted = newEntry.projectName !== commander.project;

  newEntry.timeType = getTimeType(newEntry, timeTypes);
  const timeTypeDefaulted = newEntry.timeType !== commander.timeType;

  // Add the new project option to the end of the list
  projects.push(new inquirer.Separator());
  projects.push('(New Project)');
  projects.push(new inquirer.Separator());

  const ui = new inquirer.ui.BottomBar();
  const prompts = new Rx.Subject();

  inquirer.registerPrompt('autocomplete', inquirerAutoCompletePrompt);
  inquirer.prompt(prompts).ui.process.subscribe(
    // handle each answer
    (lastAnswer) => {
      LOG(JSON.stringify(lastAnswer));
      // for each answer, update the newEntry object
      newEntry[lastAnswer.name] = lastAnswer.answer;
      if (lastAnswer.name === 'wasteOfTime') {
        prompts.onCompleted();
      }
    },
    (err) => {
      console.log(chalk.bgRed(JSON.stringify(err)));
    },
    async () => {
      LOG(`Preparing to Add Entry:\n${JSON.stringify(newEntry, null, 2)}`);
      // if they answered the newProject question, create that project first
      if (newEntry.newProject) {
        await addNewProject(newEntry.newProject);
        newEntry.project = newEntry.newProject;
        delete newEntry.newProject;
      }
      // write the time entry to the database
      await addTimeEntry(newEntry);
      LOG('TimeEntry added');
    },
  );

  // Initialize all the prompts
  prompts.onNext({
    name: 'entryDescription',
    type: 'input',
    message: 'Entry Description:',
    filter: input => (input.trim()),
    validate: validations.validateEntryDescription,
    when: () => (newEntry.entryDescription === ''),
  });
  prompts.onNext({
    name: 'minutes',
    type: 'input',
    message: 'Minutes:',
    default: minutesSinceLastEntry,
    validate: validations.validateMinutes,
    filter: val => (Number.parseInt(val, 10)),
    when: () => (newEntry.minutes === undefined || newEntry.minutes === null),
  });
  prompts.onNext({
    name: 'project',
    type: 'autocomplete',
    message: 'Project:',
    source: (answers, input) =>
      (displayUtils.autocompleteListSearch(projects, input, newEntry.projectName)),
    when: () => (newEntry.projectName === undefined || projectDefaulted),
    pageSize: 10,
  });
  prompts.onNext({
    name: 'newProject',
    type: 'input',
    message: 'New Project Name:',
    validate: validations.validateProjectName,
    filter: input => (input.trim()),
    when: () => (newEntry.project === '(New Project)'),
  });
  prompts.onNext({
    name: 'timeType',
    type: 'autocomplete',
    message: 'Type of Type:',
    source: (answers, input) =>
      (displayUtils.autocompleteListSearch(timeTypes, input, newEntry.timeType)),
    when: () => (newEntry.timeType === undefined || timeTypeDefaulted),
    pageSize: 10,
  });
  prompts.onNext({
    name: 'wasteOfTime',
    type: 'confirm',
    message: 'Waste of Time?',
    default: false,
  });
  ui.log.write(chalk.black.bgWhite(sprintf('Log Time:                 %-8s', moment(newEntry.insertTime).format('h:mm a'))));
  ui.log.write(chalk.black.bgWhite(sprintf('Minutes Since Last Entry: %-8s', minutesSinceLastEntry)));
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

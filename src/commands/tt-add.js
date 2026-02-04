#!/usr/bin/env node

import { program } from 'commander';
import inquirer from 'inquirer';
import inquirerAutoCompletePrompt from 'inquirer-autocomplete-prompt';
import chalk from 'chalk';
import { sprintf } from 'sprintf-js';
import debug from 'debug';
import { addMinutes } from 'date-fns';

import validations from '../utils/validations';
import displayUtils from '../utils/display-utils';
import db from '../db';
import {
  getEntryDate, getEntryMinutes, getInsertTime,
  getTimeType, getProjectName, getMinutesSinceLastEntry,
  addTimeEntry,
} from '../lib/timeEntry';
import { addNewProject } from '../lib/project';

const LOG = debug('tt:add');

program
  .description('Record a time entry')
  .usage('[options] [entryDescription]')
  .option('-t, --time <minutes>', 'Minutes spent on the activity.')
  .option('-e, --type <timeType>', 'Name of the time type - must be existing.')
  .option('-p, --project <projectName>', 'Project to assign to the time entry - must already exist.')
  .option('-d, --date <YYYY-MM-DD>', 'Date to which to assign the entry, defaults to today.')
  .option('-b, --backTime <backMinutes>', 'Number of minutes by which to back date the entry.')
  .option('-l, --logTime <loggingTime>', 'The time (in hh:mm format) at which to report the entry as having been logged.')
  .option('--fill', 'Set the log time to fill time since the previous entry.')
  .option('-y, --yesterday', 'Set the logging date to yesterday.')
  .parse(process.argv);

const opts = program.opts();

LOG(`Parsed Commander Object: ${JSON.stringify(opts, null, 2)}`);

// Build the new entry object with command line arguments
const newEntry = {
  entryDescription: program.args.join(' ').trim(),
  project: opts.project,
  timeType: opts.type,
  minutes: opts.time,
  insertTime: new Date(),
  entryDate: opts.date,
  wasteOfTime: false,
};

LOG(`New Entry from Command Line: ${JSON.stringify(newEntry, null, 2)}`);

newEntry.entryDate = getEntryDate(opts);
newEntry.minutes = getEntryMinutes(opts);

async function run() {
  // pull the lists of projects and time types from the database
  const projects = (await db.project.getAll()).map((item) => (item.name));
  const timeTypes = (await db.timetype.getAll()).map((item) => (item.name));

  newEntry.insertTime = getInsertTime(opts, newEntry);
  const lastEntry = await db.timeEntry.getMostRecentEntry(newEntry.entryDate, newEntry.insertTime);
  LOG(`Last Entry: ${JSON.stringify(lastEntry, null, 2)}`);
  if (opts.fill && !lastEntry) {
    displayUtils.writeError('There are no prior entries today, the --fill option may not be used.');
    throw new Error();
  }

  const minutesSinceLastEntry = getMinutesSinceLastEntry(newEntry, lastEntry);

  newEntry.project = getProjectName(newEntry, projects);
  if (opts.project && !newEntry.project) {
    // If project option is not a valid project, reject with list of project names
    displayUtils.writeError(`Project ${chalk.yellow(opts.project)} does not exist.  Known Projects:`);
    displayUtils.writeSimpleTable(projects, null, 'Project Name');
    throw new Error();
  }
  const projectDefaulted = newEntry.project !== opts.project;

  newEntry.timeType = getTimeType(newEntry, timeTypes);
  if (opts.type && !newEntry.timeType) {
    // If time type option is not a valid project, reject with list of type names
    displayUtils.writeError(`Time Type ${chalk.yellow(opts.type)} does not exist.  Known Time Types:`);
    displayUtils.writeSimpleTable(timeTypes, null, 'Time Type');
    throw new Error();
  }
  const timeTypeDefaulted = newEntry.timeType !== opts.type;

  // Add the new project option to the end of the list
  projects.push(new inquirer.Separator());
  projects.push('(New Project)');
  projects.push(new inquirer.Separator());

  const ui = new inquirer.ui.BottomBar();
  const writeHeaderLine = (label, value) => {
    const columns = process.stdout.columns || 80; // Default to 80 if columns is undefined
    ui.log.write(chalk.black.bgWhite(sprintf(`%-25s : %-${columns - 29}s`, label, value)));
  };

  inquirer.registerPrompt('autocomplete', inquirerAutoCompletePrompt);

  // Display initial status information
  if (lastEntry) {
    const lastEntryInfo = `${displayUtils.timePrinter(lastEntry.insertTime)} : ${lastEntry.entryDescription}`;
    writeHeaderLine('Last Entry', lastEntryInfo);
  }
  if (newEntry.entryDescription !== '') {
    writeHeaderLine('Description', newEntry.entryDescription);
  }
  writeHeaderLine('Log Time', displayUtils.timePrinter(newEntry.insertTime));
  if (!newEntry.minutes) {
    writeHeaderLine('Minutes Since Last Entry', minutesSinceLastEntry);
  } else {
    writeHeaderLine('Minutes', newEntry.minutes);
  }
  if (newEntry.project && !projectDefaulted) {
    writeHeaderLine('Project Name', newEntry.project);
  }
  if (newEntry.timeType && !timeTypeDefaulted) {
    writeHeaderLine('Time Type', newEntry.timeType);
  }

  // Build questions array based on what's needed
  const questions = [];

  if (newEntry.entryDescription === '') {
    questions.push({
      name: 'entryDescription',
      type: 'input',
      message: 'Entry Description:',
      filter: (input) => (input.trim()),
      validate: validations.validateEntryDescription,
    });
  }

  if (newEntry.minutes === undefined || newEntry.minutes === null) {
    questions.push({
      name: 'minutes',
      type: 'input',
      message: 'Minutes:',
      default: minutesSinceLastEntry,
      validate: validations.validateMinutes,
      filter: (val) => (Number.parseInt(val, 10)),
    });
  }

  if (newEntry.project === undefined || projectDefaulted) {
    questions.push({
      name: 'project',
      type: 'autocomplete',
      message: 'Project:',
      source: (answers, input) => (displayUtils.autocompleteListSearch(projects, input, newEntry.project)),
      pageSize: 10,
    });
  }

  // Ask all the initial questions
  const initialAnswers = await inquirer.prompt(questions);

  // Update newEntry with answers
  Object.assign(newEntry, initialAnswers);

  // Handle fill option - update insert time after we know minutes
  if (initialAnswers.minutes && opts.fill) {
    newEntry.insertTime = addMinutes(lastEntry.insertTime, newEntry.minutes);
    writeHeaderLine('Updated Log Time', displayUtils.timePrinter(newEntry.insertTime));
  }

  // If they selected (New Project), ask for new project name
  if (newEntry.project === '(New Project)') {
    const newProjectAnswer = await inquirer.prompt([{
      name: 'newProject',
      type: 'input',
      message: 'New Project Name:',
      validate: validations.validateProjectName,
      filter: (input) => (input.trim()),
    }]);
    newEntry.newProject = newProjectAnswer.newProject;
  }

  // Ask for time type if needed
  if (newEntry.timeType === undefined || timeTypeDefaulted) {
    const timeTypeAnswer = await inquirer.prompt([{
      name: 'timeType',
      type: 'autocomplete',
      message: 'Type of Time:',
      source: (answers, input) => (displayUtils.autocompleteListSearch(timeTypes, input, newEntry.timeType)),
      pageSize: 10,
    }]);
    newEntry.timeType = timeTypeAnswer.timeType;
  }

  // Always ask waste of time question
  const wasteAnswer = await inquirer.prompt([{
    name: 'wasteOfTime',
    type: 'confirm',
    message: 'Waste of Time?',
    default: false,
  }]);
  newEntry.wasteOfTime = wasteAnswer.wasteOfTime;

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

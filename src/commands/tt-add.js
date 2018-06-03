#!/usr/bin/env node
/**
 * Handles the tt-add command.
 * @module commands/tt-add
 * @author Jonathan Keller <keller.jonathan@gmail.com>
 */
import commander from 'commander';
import inquirer from 'inquirer';
import inquirerAutoCompletePrompt from 'inquirer-autocomplete-prompt';
import chalk from 'chalk';
import { sprintf } from 'sprintf-js';
import debug from 'debug';
import dateFns from 'date-fns';

import validations from '../utils/validations';
import displayUtils from '../utils/display-utils';
import db from '../db';
import * as entryLib from '../lib/timeEntry';
import * as projectLib from '../lib/project';

const LOG = debug('tt:commands:add');

inquirer.registerPrompt('autocomplete', inquirerAutoCompletePrompt);
const ui = new inquirer.ui.BottomBar();

commander
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

LOG(`Parsed Commander Object: ${JSON.stringify(commander, null, 2)}`);

/**
 * Arguments passed into the tt-add command
 * @typedef {Object} AddCommandArguments
 * @property {string} description - Description of the new time entry
 * @property {string} project - project name of the new time entry
 * @property {string} type - time type of the new time entry
 * @property {number} time - Time in minutes of the new time entry
 * @property {string} date - Entry date in YYYY-MM-DD of the new time entry
 * @property {number} backTime - number of minutes back from the current time for the entry
 * @property {string} logTime - time of day for the new entry in HH:MM format
 * @property {boolean} fill - whether to push the insert time back to fill available time
 * @property {boolean} yesterday - whether to log the entry to yesterday instead of today
 */
const commandArgs = {
  description: commander.args.join(' ').trim(),
  project: commander.project,
  type: commander.type,
  time: commander.time,
  date: commander.date,
  backTime: commander.backTime,
  logTime: commander.logTime,
  fill: commander.fill,
  yesterday: commander.yesterday,
};


/**
 * @summary Return the project name based on the input values.
 * @param {string} inputProject     Project name from the command line
 * @param {string} inputDescription Entry description from the command line
 * @param {string[]} projects       List of the project names from the database
 *
 * @returns {string} The project name, adjusted to match the case of the database if needed.
 * @throws Throws an error if the input project did not match an existing project.
 */
function handleProjectInput(inputProject, inputDescription, projects) {
  const projectName = entryLib.getProjectName(inputProject, inputDescription, projects);
  if (inputProject && !projectName) {
    // If project option is not a valid project, reject with list of project names
    displayUtils.writeError(`Project ${chalk.yellow(inputProject)} does not exist.  Known Projects:`);
    displayUtils.writeSimpleTable(projects, null, 'Project Name');
    throw new Error();
  }
  return projectName;
}

/**
 * @summary Return the type type based on the input values.
 * @param {string} inputTimeType     Time type from the command line
 * @param {string} inputDescription Entry description from the command line
 * @param {string[]} timeTypes       List of the time types from the database
 *
 * @returns {string} The time type, adjusted to match the case of the database if needed.
 * @throws Throws an error if the input time type did not match an existing project.
 */
function handleTimeTypeInput(inputTimeType, inputDescription, timeTypes) {
  const timeType = entryLib.getTimeType(inputTimeType, inputDescription, timeTypes);
  if (inputTimeType && !timeType) {
    // If time type option is not a valid project, reject with list of type names
    displayUtils.writeError(`Time Type ${chalk.yellow(inputTimeType)} does not exist.  Known Time Types:`);
    displayUtils.writeSimpleTable(timeTypes, null, 'Time Type');
    throw new Error();
  }
  return timeType;
}


function writeHeaderLine(label, value) {
  ui.log.write(chalk.black.bgWhite(sprintf(`%-25s : %-${process.stdout.columns - 29}s`, label, value)));
}

/**
 * Wrapper block for the tt-add logic.
 *
 * @param {AddCommandArguments} args - Input arguments from the command line
 */
async function run(args) {
  // Build the new entry object with command line arguments
  // simple copy logic only - derivations happen below
  const newEntry = entryLib.createEntryFromArguments(args);

  newEntry.entryDate = entryLib.getEntryDate(args);
  newEntry.minutes = entryLib.getEntryMinutes(args);
  newEntry.insertTime = entryLib.getInsertTime(args, newEntry);

  const lastEntry = await db.timeEntry.getMostRecentEntry(newEntry.entryDate, newEntry.insertTime);
  LOG(`Last Entry: ${JSON.stringify(lastEntry, null, 2)}`);
  if (args.fill && !lastEntry) {
    displayUtils.writeError('There are no prior entries today, the --fill option may not be used.');
    throw new Error();
  }

  const minutesSinceLastEntry = entryLib.getMinutesSinceLastEntry(newEntry, lastEntry);

  // pull the lists of projects and time types from MongoDB
  const projects = (await db.project.getAll()).map(item => (item.name));
  const timeTypes = (await db.timetype.getAll()).map(item => (item.name));

  newEntry.project = handleProjectInput(args.project, args.description, projects);
  const projectDefaulted = newEntry.project !== commander.project;

  newEntry.timeType = handleTimeTypeInput(args.type, args.description, timeTypes);
  const timeTypeDefaulted = newEntry.timeType !== commander.type;

  // Add the new project option to the end of the list
  projects.push(new inquirer.Separator());
  projects.push('(New Project)');
  projects.push(new inquirer.Separator());

  if (lastEntry) {
    writeHeaderLine('Last Entry', `${displayUtils.timePrinter(lastEntry.insertTime)} : ${lastEntry.entryDescription}`);
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

  // console.dir(inquirer.prompt(prompts).ui.process.subscribe(onEachAnswer, onError, onComplete));
  // console.dir(prompts);
  // Initialize all the prompts
  const prompts = [];
  if (newEntry.entryDescription === '') {
    prompts.push({
      name: 'entryDescription',
      type: 'input',
      message: 'Entry Description:',
      filter: input => (input.trim()),
      validate: validations.validateEntryDescription,
    });
  }
  if (newEntry.minutes === undefined || newEntry.minutes === null) {
    const timeValidate = (val) => {
      const valInt = Number.parseInt(val, 10);
      if (commander.fill) {
        newEntry.insertTime = dateFns.addMinutes(lastEntry.insertTime, newEntry.minutes);
        writeHeaderLine('Updated Log Time', displayUtils.timePrinter(newEntry.insertTime));
      }
      return valInt;
    };
    prompts.push({
      name: 'minutes',
      type: 'input',
      message: 'Minutes:',
      default: minutesSinceLastEntry,
      validate: validations.validateMinutes,
      filter: timeValidate,
    });
  }
  if (newEntry.project === undefined || projectDefaulted) {
    prompts.push({
      name: 'project',
      type: 'autocomplete',
      message: 'Project:',
      source: (answers, input) =>
        (displayUtils.autocompleteListSearch(projects, input, newEntry.project)),
      pageSize: 10,
    });
    prompts.push({
      name: 'newProject',
      type: 'input',
      message: 'New Project Name:',
      validate: validations.validateProjectName,
      filter: input => (input.trim()),
      when: () => (newEntry.project === '(New Project)'),
    });
  }
  if (newEntry.timeType === undefined || timeTypeDefaulted) {
    prompts.push({
      name: 'timeType',
      type: 'autocomplete',
      message: 'Type of Type:',
      source: (answers, input) =>
        (displayUtils.autocompleteListSearch(timeTypes, input, newEntry.timeType)),
      pageSize: 10,
    });
  }
  prompts.push({
    name: 'wasteOfTime',
    type: 'confirm',
    message: 'Waste of Time?',
    default: false,
  });
  const answer = await inquirer.prompt(prompts);
  // console.dir(answer);
  // copy all values from the answer object to the newEntry
  Object.assign(newEntry, answer);
  // console.dir(newEntry);
  LOG(`Preparing to Add Entry:\n${JSON.stringify(newEntry, null, 2)}`);
  // if they answered the newProject question, create that project first
  if (newEntry.newProject) {
    await projectLib.addNewProject(newEntry.newProject);
    newEntry.project = newEntry.newProject;
    delete newEntry.newProject;
  }
  // write the time entry to the database
  await entryLib.addTimeEntry(newEntry);
}

// try {
run(commandArgs).then(() => {
  LOG('TimeEntry added');
}).catch((err) => {
  displayUtils.writeError(err.message);
  LOG(err);
  process.exit(1);
});

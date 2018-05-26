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
import Rx from 'rx';
import debug from 'debug';
import dateFns from 'date-fns';

import validations from '../utils/validations';
import displayUtils from '../utils/display-utils';
import db from '../db';
import * as entryLib from '../lib/timeEntry';
import * as projectLib from '../lib/project';

const LOG = debug('tt:add');

inquirer.registerPrompt('autocomplete', inquirerAutoCompletePrompt);

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

function handleTimeTypeInput(args, timeTypes, newEntry) {
  newEntry.timeType = entryLib.getTimeType(newEntry, timeTypes);
  if (args.type && !newEntry.timeType) {
    // If time type option is not a valid project, reject with list of type names
    displayUtils.writeError(`Time Type ${chalk.yellow(args.type)} does not exist.  Known Time Types:`);
    displayUtils.writeSimpleTable(timeTypes, null, 'Time Type');
    throw new Error();
  }
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

  newEntry.project = handleProjectInput(args.project, projects);
  const projectDefaulted = newEntry.project !== commander.project;

  handleTimeTypeInput(args.type, timeTypes, newEntry);
  const timeTypeDefaulted = newEntry.timeType !== commander.type;

  // Add the new project option to the end of the list
  projects.push(new inquirer.Separator());
  projects.push('(New Project)');
  projects.push(new inquirer.Separator());

  // TODO: eliminate the Rx method of using tool - deprecated/changed in 5.x release
  // TODO: just skip inclusion of elements in the array if not needed - don't need when clause


  const ui = new inquirer.ui.BottomBar();
  const prompts = new Rx.Subject();
  const writeHeaderLine = (label, value) => {
    ui.log.write(chalk.black.bgWhite(sprintf(`%-25s : %-${process.stdout.columns - 29}s`, label, value)));
  };

  const onEachAnswer = (lastAnswer) => {
    LOG(JSON.stringify(lastAnswer));
    // for each answer, update the newEntry object
    newEntry[lastAnswer.name] = lastAnswer.answer;
    if (lastAnswer.name === 'minutes' && commander.fill) {
      newEntry.insertTime = dateFns.addMinutes(lastEntry.insertTime, newEntry.minutes);
      writeHeaderLine('Updated Log Time', displayUtils.timePrinter(newEntry.insertTime));
    }
    if (lastAnswer.name === 'wasteOfTime') {
      prompts.onCompleted();
    }
  };
  const onError = (err) => {
    //console.log(chalk.bgRed(JSON.stringify(err)));
    throw err;
  };
  const onComplete = async () => {
    LOG(`Preparing to Add Entry:\n${JSON.stringify(newEntry, null, 2)}`);
    // if they answered the newProject question, create that project first
    if (newEntry.newProject) {
      await addNewProject(newEntry.newProject);
      newEntry.project = newEntry.newProject;
      delete newEntry.newProject;
    }
    // write the time entry to the database
    await entryLib.addTimeEntry(newEntry);
    LOG('TimeEntry added');
  };

  inquirer.registerPrompt('autocomplete', inquirerAutoCompletePrompt);
  inquirer.prompt(prompts).ui.process.subscribe(onEachAnswer, onError, onComplete);

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
      (displayUtils.autocompleteListSearch(projects, input, newEntry.project)),
    when: () => (newEntry.project === undefined || projectDefaulted),
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
}

try {
  run(commandArgs).catch((err) => {
    displayUtils.writeError(err.message);
    LOG(err);
    process.exitCode = 1;
  });
  LOG('Completed run method');
} catch (err) {
  displayUtils.writeError(err.message);
  LOG(err);
  process.exitCode = 1;
}

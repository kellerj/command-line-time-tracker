#!/usr/bin/env node

import { program } from 'commander';
import { input, confirm } from '@inquirer/prompts';
import autocomplete from 'inquirer-autocomplete-standalone';
import chalk from 'chalk';
import { sprintf } from 'sprintf-js';
import debug from 'debug';
import { addMinutes } from 'date-fns';

import validations from '../utils/validations.js';
import displayUtils from '../utils/display-utils.js';
import db from '../db/index.js';
import {
  getEntryDate, getEntryMinutes, getInsertTime,
  getTimeType, getProjectName, getMinutesSinceLastEntry,
  addTimeEntry,
} from '../lib/timeEntry.js';
import { addNewProject } from '../lib/project.js';

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

// Helper to write header lines (replaces BottomBar functionality)
function writeHeaderLine(label, value) {
  const columns = process.stdout.columns || 80; // Default to 80 if columns is undefined
  console.log(chalk.black.bgWhite(sprintf(`%-25s : %-${columns - 29}s`, label, value)));
}

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

  // Build project choices with separator and new project option
  const projectChoices = projects.map((p) => ({ value: p, name: p }));
  projectChoices.push({ type: 'separator' });
  projectChoices.push({ value: '(New Project)', name: '(New Project)' });
  projectChoices.push({ type: 'separator' });

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

  // Ask questions based on what's needed
  if (newEntry.entryDescription === '') {
    const entryDescription = await input({
      message: 'Entry Description:',
      validate: validations.validateEntryDescription,
    });
    newEntry.entryDescription = entryDescription.trim();
  }

  if (newEntry.minutes === undefined || newEntry.minutes === null) {
    const minutes = await input({
      message: 'Minutes:',
      default: String(minutesSinceLastEntry),
      validate: validations.validateMinutes,
    });
    newEntry.minutes = Number.parseInt(minutes, 10);
  }

  if (newEntry.project === undefined || projectDefaulted) {
    const project = await autocomplete({
      message: 'Project:',
      source: async (inputValue) => {
        const filtered = await displayUtils.autocompleteListSearch(
          projectChoices.map((c) => (c.type === 'separator' ? c : c.value)),
          inputValue,
          newEntry.project,
        );
        return filtered.map((p) => {
          if (typeof p === 'object' && p.type === 'separator') {
            return p;
          }
          return typeof p === 'string' ? { value: p, name: p } : p;
        });
      },
    });
    newEntry.project = project;
  }

  // Handle fill option - update insert time after we know minutes
  if (newEntry.minutes && opts.fill) {
    newEntry.insertTime = addMinutes(lastEntry.insertTime, newEntry.minutes);
    writeHeaderLine('Updated Log Time', displayUtils.timePrinter(newEntry.insertTime));
  }

  // If they selected (New Project), ask for new project name
  if (newEntry.project === '(New Project)') {
    const newProjectName = await input({
      message: 'New Project Name:',
      validate: validations.validateProjectName,
    });
    newEntry.newProject = newProjectName.trim();
  }

  // Ask for time type if needed
  if (newEntry.timeType === undefined || timeTypeDefaulted) {
    const timeType = await autocomplete({
      message: 'Type of Time:',
      source: async (inputValue) => {
        const filtered = await displayUtils.autocompleteListSearch(timeTypes, inputValue, newEntry.timeType);
        return filtered.map((t) => (typeof t === 'string' ? { value: t, name: t } : t));
      },
    });
    newEntry.timeType = timeType;
  }

  // Always ask waste of time question
  const wasteOfTime = await confirm({
    message: 'Waste of Time?',
    default: false,
  });
  newEntry.wasteOfTime = wasteOfTime;

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

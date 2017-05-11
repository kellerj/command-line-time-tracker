#!/usr/bin/env node

const commander = require('commander');
const inquirer = require('inquirer');
const co = require('co');
const db = require('./db');
const chalk = require('chalk');
const debug = require('debug')('tt:add');
const Table = require('easy-table');
const moment = require('moment');
const sprintf = require('sprintf-js').sprintf;
const validations = require('./validations');

commander
    .version('1.0.0')
    .description('Record a time entry')
    .usage('[options] [entryDescription]')
    .option('-t, --time <minutes>', 'Minutes spent on the activity.')
    .option('-y, --type <timeType>', 'Name of the time type - must be existing.')
    .option('-p, --project <projectName>', 'Project to assign to the time entry - must already exist.')
    .option('-d, --date <YYYY-MM-DD>', 'Date to which to assign the entry, defaults to today.')
    .parse(process.argv);

const entryDescription = commander.args.join(' ').trim();
let projectName = commander.project;
let timeType = commander.type;
let minutes = commander.time;
let entryDate = commander.date;

if (entryDate) {
  const temp = moment(entryDate, 'YYYY-MM-DD');
  if (!temp.isValid()) {
    console.log(chalk.red('-d, --date: Invalid Time'));
    process.exit(1);
  }
  entryDate = temp.format('YYYY-MM-DD');
}

// debug(JSON.stringify(commander, null, 2));
debug(`Input Project Name: ${projectName}`);
debug(`Input Time Type: ${timeType}`);
debug(`Input Minutes: ${minutes} : ${Number.isInteger(minutes)}`);

if (minutes) {
  minutes = Number.parseInt(minutes, 10);
  const validationMessage = validations.validateMinutes(minutes);
  debug(validationMessage);
  if (validationMessage !== true) {
    console.log(chalk.red(`-t, --time: ${validationMessage}`));
    process.exit(1);
  }
}

function performUpdate(timeEntry) {
  co(function* runUpdate() {
    debug(`Request to add timeEntry "${JSON.stringify(timeEntry, null, 2)}"`);
    const insertSuceeded = yield* db.timeEntry.insert(timeEntry);
    if (insertSuceeded) {
      const timeEntrySummary = sprintf('%s : %s : %s',
        timeEntry.entryDescription,
        timeEntry.project,
        timeEntry.timeType);
      console.log(chalk.green(`Time Entry ${chalk.white.bold(timeEntrySummary)} added`));
    } else {
      console.log(chalk.bgRed(`Failed to insert ${chalk.yellow.bold(JSON.stringify(timeEntry))}.`));
    }
  }).catch((err) => {
    console.log(chalk.bgRed(err.stack));
  });
}

function addProject(newProject) {
  co(function* runProjectAdd() {
    debug(`Request to add project "${newProject}"`);
    const insertSuceeded = yield* db.project.insert(newProject);
    if (insertSuceeded) {
      console.log(chalk.green(`Project ${chalk.white.bold(newProject)} added`));
    } else {
      console.log(chalk.bgRed(`Project ${chalk.yellow.bold(newProject)} already exists.`));
    }
  }).catch((err) => {
    console.log(chalk.bgRed(err.stack));
  });
}

function* run() {
  // pull the lists of projects and time types from MongoDB
  const projects = (yield* db.project.getAll()).map(item => (item.name));
  projects.push(new inquirer.Separator());
  projects.push('(New Project)');
  projects.push(new inquirer.Separator());
  const timeTypes = (yield* db.timetype.getAll()).map(item => (item.name));
  const lastEntry = yield* db.timeEntry.getMostRecentEntry();
  // use the minutes since the last entry was added as the default time
  // default to 60 in the case there is no entry yet today
  let minutesSinceLastEntry = 60;
  if (!entryDate && lastEntry && moment(lastEntry.insertTime).isSame(moment(), 'day')) {
    minutesSinceLastEntry = moment().diff(lastEntry.insertTime, 'minutes');
  }

  debug(JSON.stringify(lastEntry, null, 2));
  // If project option is not a valid project, reject with list of project names
  if (projectName) {
    projectName = projectName.trim();
    if (projects.findIndex(e => (e === projectName)) === -1) {
      console.log(chalk.red(`Project ${chalk.yellow(projectName)} does not exist.  Known Projects:`));
      console.log(chalk.yellow(Table.print(projects.map(e => ({ name: e })),
        { name: { name: chalk.white.bold('Project Name') } })));
      process.exit(1);
    }
  }
  // If time type option is not a valid project, reject with list of type names
  if (timeType) {
    timeType = timeType.trim();
    if (timeTypes.findIndex(e => (e === timeType)) === -1) {
      console.log(chalk.red(`Project ${chalk.yellow(timeType)} does not exist.  Known Time Types:`));
      console.log(chalk.yellow(Table.print(timeTypes.map(e => ({ name: e })),
        { name: { name: chalk.white.bold('Time Type') } })));
      process.exit(1);
    }
  }

  inquirer.prompt([
    {
      name: 'entryDescription',
      type: 'input',
      message: 'Entry Description:',
      filter: input => (input.trim()),
      validate: validations.validateEntryDescription,
      when: () => (entryDescription === ''),
    },
    {
      name: 'project',
      type: 'list',
      message: 'Project:',
      choices: projects,
      when: () => (projectName === undefined),
      pageSize: 15,
    },
    {
      name: 'newProject',
      type: 'input',
      message: 'New Project Name:',
      filter: input => (input.trim()),
      when: answers => (answers.project === '(New Project)'),
    },
    {
      name: 'timeType',
      type: 'list',
      message: 'Type of Type:',
      choices: timeTypes,
      when: () => (timeType === undefined),
      pageSize: 15,
    },
    {
      name: 'minutes',
      type: 'input',
      message: 'Minutes:',
      default: minutesSinceLastEntry,
      validate: validations.validateMinutes,
      filter: val => (Number.parseInt(val, 10)),
      when: () => (minutes === undefined || minutes === null),
    },
    {
      name: 'wasteOfTime',
      type: 'confirm',
      message: 'Waste of Time?',
      default: false,
      when: answer => (answer.minutes !== undefined),
    },
  ]).then((answer) => {
    // fill in for questions which were skipped because they were on the command line
    if (!answer.entryDescription) {
      answer.entryDescription = entryDescription.trim();
    }
    if (answer.newProject) {
      addProject(answer.newProject);
      answer.project = answer.newProject;
      delete answer.newProject;
    }
    if (!answer.project) {
      answer.project = projectName;
    }
    if (!answer.timeType) {
      answer.timeType = timeType;
    }
    if (!answer.minutes) {
      answer.minutes = Number.parseInt(minutes, 10);
    }
    if (answer.wasteOfTime === undefined) {
      answer.wasteOfTime = false;
    }
    if (entryDate) {
      answer.entryDate = entryDate;
    }
    debug(JSON.stringify(answer, null, 2));
    performUpdate(answer);
  });
}

co(run);

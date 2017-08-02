#!/usr/bin/env node

const commander = require('commander');
const inquirer = require('inquirer');
const co = require('co');
const db = require('../db');
const chalk = require('chalk');
const debug = require('debug')('tt:add');
const Table = require('easy-table');
const moment = require('moment');
const sprintf = require('sprintf-js').sprintf;
const validations = require('../utils/validations');
const Rx = require('rx');

commander
    .version('1.0.0')
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

const entryDescription = commander.args.join(' ').trim();
let projectName = commander.project;
let timeType = commander.type;
let minutes = commander.time;
let entryDate = commander.date;
let insertTime = moment();

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

  // debug(JSON.stringify(commander, null, 2));
  debug(`Input Project Name: ${projectName}`);
  debug(`Input Time Type: ${timeType}`);
  debug(`Input Minutes: ${minutes} : ${Number.isInteger(minutes)}`);

  if (minutes) {
    minutes = Number.parseInt(minutes, 10);
    const validationMessage = validations.validateMinutes(minutes);
    debug(validationMessage);
    if (validationMessage !== true) {
      throw new Error(`-t, --time: "${commander.time}" ${validationMessage}`);
    }
  }

  // pull the lists of projects and time types from MongoDB
  const projects = (yield* db.project.getAll()).map(item => (item.name));
  const timeTypes = (yield* db.timetype.getAll()).map(item => (item.name));

  const lastEntry = yield* db.timeEntry.getMostRecentEntry(entryDate);
  debug(`Last Entry: ${JSON.stringify(lastEntry, null, 2)}`);

  if (commander.backTime) {
    if (commander.logTime) {
      throw new Error('You may not set both --backTime and --logTime.');
    }
    const validationMessage = validations.validateMinutes(
      Number.parseInt(commander.backTime, 10), -1);
    debug(validationMessage);
    if (validationMessage !== true) {
      throw new Error(`-b, --backTime: "${commander.backTime}" ${validationMessage}`);
    }
    insertTime = moment().subtract(commander.backTime, 'minute');
  }

  if (commander.logTime) {
    debug(`Processing LogTime: ${commander.logTime}`);
    const validationMessage = validations.validateTime(commander.logTime);
    if (validationMessage !== true) {
      throw new Error(`-l, --logTime: "${commander.logTime}" ${validationMessage}`);
    }
    insertTime = moment(commander.logTime, 'h:mm a');

    // now, ensure the date matches the entry date since it's assumed the time should be on that day
    insertTime.year(entryDate.year());
    insertTime.month(entryDate.month());
    insertTime.date(entryDate.date());
  }

  // use the minutes since the last entry was added as the default time
  // default to 60 in the case there is no entry yet today
  let minutesSinceLastEntry = 60;
  if (lastEntry && moment(lastEntry.insertTime).isSame(insertTime, 'day')) {
    minutesSinceLastEntry = insertTime.diff(lastEntry.insertTime, 'minutes');
    if (minutesSinceLastEntry < 0) {
      minutesSinceLastEntry = 0;
    }
  } else {
    debug('Skipping minutes calculation since no prior entry found today.');
  }

  // If project option is not a valid project, reject with list of project names
  let projectDefaulted = false;
  if (projectName) {
    debug(`Input Project Name: ${projectName}, checking project list.`);
      // perform a case insensitive match on the name - and use the name
      // from the official list which matches
    projectName = projects.find(p => (p.match(new RegExp(`^${projectName.trim()}$`, 'i'))));
    if (projectName === undefined) {
      console.log(chalk.red(`Project ${chalk.yellow(commander.project)} does not exist.  Known Projects:`));
      console.log(chalk.yellow(Table.print(projects.map(e => ({ name: e })),
          { name: { name: chalk.white.bold('Project Name') } })));
      throw new Error();
    }
  } else {
      // see if we can find a name in the description
    const tempProjectName = projects.find(p => (entryDescription.match(new RegExp(p, 'i'))));
    if (tempProjectName !== undefined) {
      projectName = tempProjectName;
      projectDefaulted = true;
    }
  }
    // If time type option is not a valid project, reject with list of type names
  let timeTypeDefaulted = false;
  if (timeType) {
      // perform a case insensitive match on the name - and use the name
      // from the official list which matches
    timeType = timeTypes.find(t => (t.match(new RegExp(`^${timeType.trim()}$`, 'i'))));
    if (timeType === undefined) {
      console.log(chalk.red(`Project ${chalk.yellow(timeType)} does not exist.  Known Time Types:`));
      console.log(chalk.yellow(Table.print(timeTypes.map(e => ({ name: e })),
          { name: { name: chalk.white.bold('Time Type') } })));
      throw new Error();
    }
  } else {
      // see if we can find a name in the description
    const tempTimeType = timeTypes.find(t => (entryDescription.match(new RegExp(t, 'i'))));
    if (tempTimeType !== undefined) {
      timeType = tempTimeType;
      timeTypeDefaulted = true;
    }
  }

    // Add the new project option to the end of the list
  projects.push(new inquirer.Separator());
  projects.push('(New Project)');
  projects.push(new inquirer.Separator());

    // Build the new entry object with command line arguments
  const newEntry = {
    entryDescription,
    timeType,
    minutes,
    insertTime: insertTime.toDate(),
    entryDate: entryDate.format('YYYY-MM-DD'),
    project: projectName,
    wasteOfTime: false,
  };

  const ui = new inquirer.ui.BottomBar();
  const prompts = new Rx.Subject();

  inquirer.prompt(prompts).ui.process.subscribe(
      // handle each answer
      (lastAnswer) => {
        debug(JSON.stringify(lastAnswer));
        // for each answer, update the newEntry object
        newEntry[lastAnswer.name] = lastAnswer.answer;
        if (lastAnswer.name === 'wasteOfTime') {
          prompts.onCompleted();
        }
      },
      (err) => {
        console.log(chalk.bgRed(JSON.stringify(err)));
      },
      () => {
        debug(JSON.stringify(newEntry, null, 2));
        // if they answered the newProject question, create that project first
        if (newEntry.newProject) {
          addProject(newEntry.newProject);
          newEntry.project = newEntry.newProject;
          delete newEntry.newProject;
        }
        // write the time entry to the database
        performUpdate(newEntry);
      });

    // Initialize all the prompts
  prompts.onNext({
    name: 'entryDescription',
    type: 'input',
    message: 'Entry Description:',
    filter: input => (input.trim()),
    validate: validations.validateEntryDescription,
    when: () => (entryDescription === ''),
  });
  prompts.onNext({
    name: 'minutes',
    type: 'input',
    message: 'Minutes:',
    default: minutesSinceLastEntry,
    validate: validations.validateMinutes,
    filter: val => (Number.parseInt(val, 10)),
    when: () => (minutes === undefined || minutes === null),
  });
  prompts.onNext({
    name: 'project',
    type: 'list',
    message: 'Project:',
    choices: projects,
    default: projectName,
    when: () => (projectName === undefined || projectDefaulted),
    pageSize: 15,
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
    type: 'list',
    message: 'Type of Type:',
    choices: timeTypes,
    default: timeType,
    when: () => (timeType === undefined || timeTypeDefaulted),
    pageSize: 15,
  });
  prompts.onNext({
    name: 'wasteOfTime',
    type: 'confirm',
    message: 'Waste of Time?',
    default: false,
  });
  ui.log.write(chalk.black.bgWhite(sprintf('Log Time:                 %-8s', insertTime.format('h:mm a'))));
  ui.log.write(chalk.black.bgWhite(sprintf('Minutes Since Last Entry: %-8s', minutesSinceLastEntry)));
}

try {
  co(run).catch((err) => {
    console.log(chalk.red(err.message));
    debug(err);
  });
} catch (err) {
  console.log(chalk.red(err.message));
  debug(err);
}

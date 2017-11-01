import co from 'co';
import { sprintf } from 'sprintf-js';
import chalk from 'chalk';
import moment from 'moment';
import Table from 'easy-table';

import db from '../db';
import validations from '../utils/validations';

const debug = require('debug')('timeEntry');


export function getEntryDate(inputParameters) {
  if (inputParameters.date) {
    const parsedDate = moment(inputParameters.date, 'YYYY-MM-DD');
    if (!parsedDate.isValid()) {
      throw new Error(`-d, --date: Invalid Date: ${inputParameters.date}`);
    }
    return parsedDate.format('YYYY-MM-DD');
  } else if (inputParameters.yesterday) {
    return moment().subtract(1, 'day').format('YYYY-MM-DD');
  }
  return moment().format('YYYY-MM-DD');
}

export function getEntryMinutes(inputParameters) {
  if (inputParameters.time) {
    const minutes = Number.parseInt(inputParameters, 10);
    const validationMessage = validations.validateMinutes(minutes);
    debug(validationMessage);
    if (validationMessage !== true) {
      throw new Error(`-t, --time: "${inputParameters.time}" ${validationMessage}`);
    }
    return minutes;
  }
  return null;
}

export function getInsertTime(inputParameters, lastEntry, newEntry) {
  let insertTime = moment(newEntry.insertTime);
  if (inputParameters.backTime) {
    if (inputParameters.logTime) {
      throw new Error('You may not set both --backTime and --logTime.');
    }
    const validationMessage = validations.validateMinutes(
      Number.parseInt(inputParameters.backTime, 10), -1);
    debug(`GetInsertTime Error: ${validationMessage}`);
    if (validationMessage !== true) {
      throw new Error(`-b, --backTime: "${inputParameters.backTime}" ${validationMessage}`);
    }
    insertTime = moment().subtract(inputParameters.backTime, 'minute');
  }

  if (inputParameters.logTime) {
    debug(`Processing LogTime: ${inputParameters.logTime}`);
    const validationMessage = validations.validateTime(inputParameters.logTime);
    debug(`GetInsertTime Error: ${validationMessage}`);
    if (validationMessage !== true) {
      throw new Error(`-l, --logTime: "${inputParameters.logTime}" ${validationMessage}`);
    }
    insertTime = moment(inputParameters.logTime, 'h:mm a');

    // now, ensure the date matches the entry date since it's assumed the time should be on that day
    const entryDate = moment(newEntry.entryDate);
    insertTime.year(entryDate.year());
    insertTime.month(entryDate.month());
    insertTime.date(entryDate.date());
  }
  return insertTime.toDate();
}

export function getProjectName(newEntry, projects) {
  // If project option is not a valid project, reject with list of project names
  if (newEntry.project) {
    debug(`Input Project Name: ${newEntry.project}, checking project list.`);
    // perform a case insensitive match on the name - and use the name
    // from the official list which matches
    const savedProjectName = newEntry.project;
    newEntry.projectName = projects.find(p => (p.match(new RegExp(`^${newEntry.project.trim()}$`, 'i'))));
    if (newEntry.project === undefined) {
      console.log(chalk.red(`Project ${chalk.yellow(savedProjectName)} does not exist.  Known Projects:`));
      console.log(chalk.yellow(Table.print(projects.map(e => ({ name: e })),
        { name: { name: chalk.white.bold('Project Name') } })));
      throw new Error();
    }
  } else {
    // see if we can find a name in the description
    const tempProjectName = projects.find(p => (newEntry.entryDescription.match(new RegExp(p, 'i'))));
    if (tempProjectName !== undefined) {
      newEntry.project = tempProjectName;
    }
  }
}

export function performUpdate(timeEntry) {
  debug(`Request to add timeEntry "${JSON.stringify(timeEntry, null, 2)}"`);
  co(function* runUpdate() {
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

export function addProject(newProject) {
  debug(`Request to add project "${newProject}"`);
  co(function* runProjectAdd() {
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

export default {
  performUpdate,
  addProject,
  getEntryDate,
  getInsertTime,
  getProjectName,
  getEntryMinutes,
};

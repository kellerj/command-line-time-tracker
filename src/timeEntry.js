import co from 'co';
import { sprintf } from 'sprintf-js';
import chalk from 'chalk';
import moment from 'moment';

import db from '../db';

const debug = require('debug')('timeEntry');


export function getEntryDate(inputParameters) {
  if (inputParameters.date) {
    const parsedDate = moment(inputParameters.date, 'YYYY-MM-DD');
    if (!parsedDate.isValid()) {
      throw new Error(`-d, --date: Invalid Date: ${inputParameters.date}`);
    }
    return parsedDate;
  } else if (inputParameters.yesterday) {
    return moment().subtract(1, 'day');
  }
  return moment();
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
};

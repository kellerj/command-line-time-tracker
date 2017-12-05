import { sprintf } from 'sprintf-js';
import chalk from 'chalk';
import parseTime from 'parse-loose-time';
import { format, parse, subDays, isValid, subMinutes, setHours, setMinutes, differenceInMinutes,
  getYear, getMonth, getDate, setYear, setMonth, setDate } from 'date-fns';

import db from '../db';
import { DATE_FORMAT, DEFAULT_MINUTES } from '../constants';
import validations from '../utils/validations';

const LOG = require('debug')('tt:lib:timeEntry');


export function getEntryDate({ date, yesterday }) {
  if (date) {
    const parsedDate = parse(date);
    if (!isValid(parsedDate)) {
      throw new Error(`-d, --date: Invalid Date: ${date}`);
    }
    return format(parsedDate, DATE_FORMAT);
  } else if (yesterday) {
    return format(subDays(new Date(), 1), DATE_FORMAT);
  }
  return format(new Date(), DATE_FORMAT);
}

export function getEntryMinutes({ time }) {
  if (time) {
    const minutes = Number.parseInt(time, 10);
    const validationMessage = validations.validateMinutes(minutes);
    LOG(validationMessage);
    if (validationMessage !== true) {
      throw new Error(`-t, --time: "${time}" ${validationMessage}`);
    }
    return minutes;
  }
  return null;
}

export function getInsertTime({ backTime, logTime }, newEntry) {
  let { insertTime } = newEntry;
  const entryDate = parse(newEntry.entryDate);
  insertTime = setYear(insertTime, getYear(entryDate));
  insertTime = setMonth(insertTime, getMonth(entryDate));
  insertTime = setDate(insertTime, getDate(entryDate));

  if (backTime) {
    if (logTime) {
      throw new Error('You may not set both --backTime and --logTime.');
    }
    const validationMessage = validations
      .validateMinutes(Number.parseInt(backTime, 10), -1);
    LOG(`GetInsertTime Error: ${validationMessage}`);
    if (validationMessage !== true) {
      throw new Error(`-b, --backTime: "${backTime}" ${validationMessage}`);
    }
    insertTime = subMinutes(insertTime, backTime);
  }

  if (logTime) {
    LOG(`Processing LogTime: ${logTime}`);
    const validationMessage = validations.validateTime(logTime);
    LOG(`GetInsertTime Error: ${validationMessage}`);
    if (validationMessage !== true) {
      throw new Error(`-l, --logTime: "${logTime}" ${validationMessage}`);
    }
    const parsedTime = parseTime(logTime);
    insertTime = setHours(entryDate, parsedTime.hour);
    insertTime = setMinutes(insertTime, parsedTime.minute);
  }
  return insertTime;
}

export function getTimeType({ timeType: inputTimeType, entryDescription }, timeTypes) {
  if (inputTimeType) {
    // perform a case insensitive match on the name - and use the name
    // from the official list which matches
    const timeType = timeTypes.find(t => (t.match(new RegExp(`^${inputTimeType.trim()}$`, 'i'))));
    return timeType || null;
  }
  // see if we can find a name in the description
  const timeType = timeTypes.find(t => (entryDescription.match(new RegExp(t, 'i'))));
  return timeType || null;
}

export function getProjectName({ project: inputProjectName, entryDescription }, projects) {
  if (inputProjectName) {
    LOG(`Input Project Name: ${inputProjectName}, checking project list.`);
    // perform a case insensitive match on the name - and use the name
    // from the official list which matches
    const projectName = projects.find(p => (p.match(new RegExp(`^${inputProjectName.trim()}$`, 'i'))));
    return projectName || null;
  }
  // see if we can find a name in the description
  const projectName = projects.find(p => (entryDescription.match(new RegExp(p, 'i'))));
  return projectName || null;
}

export function getMinutesSinceLastEntry(newEntry, lastEntry) {
  // use the minutes since the last entry was added as the default time
  // default to 60 in the case there is no entry yet today
  let minutesSinceLastEntry = DEFAULT_MINUTES;
  if (lastEntry && lastEntry.entryDate === newEntry.entryDate) {
    minutesSinceLastEntry = differenceInMinutes(newEntry.insertTime, lastEntry.insertTime);
    if (minutesSinceLastEntry < 0) {
      minutesSinceLastEntry = 0;
    }
  } else {
    LOG('Skipping minutes calculation since no prior entry found today.');
  }
  return minutesSinceLastEntry;
}

export async function addTimeEntry(timeEntry) {
  LOG(`Request to add timeEntry "${JSON.stringify(timeEntry, null, 2)}"`);
  const insertSuceeded = await db.timeEntry.insert(timeEntry);
  if (insertSuceeded) {
    const timeEntrySummary = sprintf(
      '%s : %s : %s',
      timeEntry.entryDescription,
      timeEntry.project,
      timeEntry.timeType,
    );
    console.log(chalk.green(`Time Entry ${chalk.white.bold(timeEntrySummary)} added`));
  } else {
    console.log(chalk.bgRed(`Failed to insert ${chalk.yellow.bold(JSON.stringify(timeEntry))}.`));
  }
  return insertSuceeded;
}

export async function deleteTimeEntries(entries) {
  for (let i = 0; i < entries.length; i += 1) {
    LOG(`Deleting ${JSON.stringify(entries[i], null, 2)}`);
    // eslint-disable-next-line no-await-in-loop
    const wasDeleted = await db.timeEntry.remove(entries[i]);
    if (wasDeleted) {
      console.log(chalk.green(`Time Entry ${chalk.white(entries[i])} Removed`));
    } else {
      console.log(chalk.red(`Time Entry ${chalk.white(entries[i])} Not Present In database`));
    }
  }
}

export async function updateTimeEntry(entry) {
  LOG(`Updating ${JSON.stringify(entry, null, 2)}`);
  const wasUpdated = await db.timeEntry.update(entry);
  if (wasUpdated) {
    const timeEntrySummary = sprintf(
      '%s : %s : %s',
      entry.entryDescription,
      entry.project,
      entry.timeType,
    );
    console.log(chalk.green(`Time Entry ${chalk.white.bold(timeEntrySummary)} Updated`));
  } else {
    console.log(chalk.red(`Time Entry ${chalk.white(JSON.stringify(entry))} failed to update`));
  }
}

import commander from 'commander';

import inquirer from 'inquirer';
import chalk from 'chalk';
import debug from 'debug';
import { format } from 'date-fns';

import db from '../db';
import dateUtils from '../utils/date-utils';
import displayUtils from '../utils/display-utils';
import { deleteTimeEntries } from '../lib/timeEntry';
import * as Constants from '../constants';

const LOG = debug('tt:delete');

commander
  .option('-d, --date <YYYY-MM-DD>', 'Date from which to remove items.')
  .option('--last', 'Remove the most recent entry.')
  .option('-y, --yesterday', 'List entries from yesterday to delete.')
  .parse(process.argv);

let entryDate = commander.date;
const deleteLast = commander.last;
LOG(JSON.stringify(commander, null, 2));

async function run() {
  entryDate = dateUtils.getEntryDate(entryDate, commander.yesterday);

  let entries = [];
  if (deleteLast) {
    LOG('Getting last entry');
    const entry = await db.timeEntry.getMostRecentEntry(entryDate);
    LOG('Got Last Entry');
    process.stdout.write(chalk.yellow(displayUtils.formatEntryChoice(entry)));
    process.stdout.write('\n');
    entries.push(entry);
  } else {
    entries = await db.timeEntry.get(entryDate);
  }

  if (entries && entries.length) {
    const answer = await inquirer.prompt([
      {
        name: 'entries',
        type: 'checkbox',
        message: 'Select Time Entries to Remove',
        pageSize: Constants.LIST_DISPLAY_SIZE,
        when: () => (!deleteLast),
        choices: entries.map(item => ({
          value: item._id,
          name: displayUtils.formatEntryChoice(item),
        })),
      },
      {
        name: 'confirm',
        type: 'confirm',
        message: 'Are you sure you want to delete these time entries?',
        default: false,
        when: answers => (deleteLast || (answers.entries && answers.entries.length)),
      },
    ]);
    if (answer.confirm) {
      if (deleteLast) {
        answer.entries = [entries[0]._id];
      }
      await deleteTimeEntries(answer.entries);
    }
  } else {
    throw new Error(chalk.yellow(`No Time Entries Entered for ${format(entryDate, Constants.DATE_FORMAT)}\n`));
  }
}

try {
  run().catch((err) => {
    process.stderr.write(chalk.red(err.message));
    process.stderr.write('\n');
    LOG(err);
    process.exitCode = 1;
  });
} catch (err) {
  process.stderr.write(chalk.red(err.message));
  process.stderr.write('\n');
  LOG(err);
  process.exitCode = 1;
}

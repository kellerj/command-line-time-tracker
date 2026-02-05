import { program } from 'commander';

import { checkbox, confirm } from '@inquirer/prompts';
import chalk from 'chalk';
import debug from 'debug';
import { format } from 'date-fns';

import db from '../db/index.js';
import dateUtils from '../utils/date-utils.js';
import displayUtils from '../utils/display-utils.js';
import { deleteTimeEntries } from '../lib/timeEntry.js';
import * as Constants from '../constants.js';

const LOG = debug('tt:delete');

program
  .option('-d, --date <YYYY-MM-DD>', 'Date from which to remove items.')
  .option('--last', 'Remove the most recent entry.')
  .option('-y, --yesterday', 'List entries from yesterday to delete.')
  .parse(process.argv);

const opts = program.opts();
let entryDate = opts.date;
const deleteLast = opts.last;
LOG(JSON.stringify(opts, null, 2));

async function run() {
  entryDate = dateUtils.getEntryDate(entryDate, opts.yesterday);

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
    LOG(JSON.stringify(entries, null, 2));
  } else {
    throw new Error(chalk.yellow(`No Time Entries Entered for ${format(entryDate, Constants.DATE_FORMAT)}\n`));
  }

  let selectedEntryIds = [];

  if (!deleteLast) {
    const entryChoices = entries.map((item) => ({
      value: item._id,
      name: displayUtils.formatEntryChoice(item),
    }));
    entryChoices.push({ value: null, name: '(Cancel)' });

    selectedEntryIds = await checkbox({
      message: 'Select Time Entries to Remove',
      pageSize: Constants.LIST_DISPLAY_SIZE,
      choices: entryChoices,
    });

    // Filter out null (Cancel) selections
    selectedEntryIds = selectedEntryIds.filter((id) => id !== null);
  } else {
    selectedEntryIds = [entries[0]._id];
  }

  // Only confirm if there are entries to delete
  if (selectedEntryIds && selectedEntryIds.length) {
    const confirmed = await confirm({
      message: 'Are you sure you want to delete these time entries?',
      default: false,
    });

    if (confirmed) {
      const results = await deleteTimeEntries(selectedEntryIds);
      results.forEach((result) => {
        if (result.deleted) {
          process.stdout.write(chalk.green(`Time Entry ${chalk.white(result.entry)} Removed\n`));
        } else {
          process.stdout.write(chalk.red(`Time Entry ${chalk.white(result.entry)} Not Present In database\n`));
        }
      });
    }
  }
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

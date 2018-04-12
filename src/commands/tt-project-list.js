import commander from 'commander';
import chalk from 'chalk';
import Table from 'easy-table';
import debug from 'debug';

import displayUtils from '../utils/display-utils';
import db from '../db';

const LOG = debug('tt:project:list');

commander
  .description('List all current projects in alphabetical order.')
  .parse(process.argv);

async function run() {
  const r = await db.project.getAll();

  if (r) {
    LOG(JSON.stringify(r, null, 2));
    process.stdout.write(chalk.yellow(Table.print(
      r.map((item) => { delete item._id; return item; }),
      { name: { name: chalk.white.bold('Project Name') } },
    )));
  } else {
    process.stdout.write(chalk.yellow('No Projects Defined\n'));
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

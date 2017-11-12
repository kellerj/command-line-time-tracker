import chalk from 'chalk';

import db from '../db';

const LOG = require('debug')('tt:lib:project');

export async function addNewProject(projectName) {
  LOG(`Adding project "${projectName}"`);
  if (!projectName || !projectName.trim()) {
    console.log(chalk.bgRed('Missing Project Name'));
    return false;
  }
  try {
    if (await db.project.insert(projectName.trim())) {
      console.log(chalk.green(`Project ${chalk.white.bold(projectName.trim())} added`));
      return true;
    }
    console.log(chalk.bgRed(`Project ${chalk.yellow.bold(projectName.trim())} already exists.`));
    return false;
  } catch (e) {
    console.log(chalk.bgRed(`Database Error adding project: ${chalk.yellow.bold(projectName.trim())}: ${e}.`));
    return false;
  }
}

export default {};

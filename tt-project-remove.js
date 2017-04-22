#!/usr/bin/env node

const commander = require('commander');
const inquirer = require('inquirer');
const co = require('co');
const db = require('./db');
const chalk = require('chalk');

commander
    .version('1.0.0')
    .arguments('[projectName]', 'Remove time tracking projects from the database')
    .parse(process.argv);

const inputProjectName = commander.args.join(' ');

function* removeProjects(projectNames) {
  // console.log(JSON.stringify(projectNames));
  for (let i = 0; i < projectNames.length; i += 1) {
    // console.log(`Deleting ${projectNames[i]}`);
    const wasDeleted = yield db.project.remove(projectNames[i]);
    if (wasDeleted) {
      console.log(chalk.green(`Project ${chalk.white(projectNames[i])} Removed`));
    } else {
      // console.log(chalk.red(JSON.stringify(r2)));
      console.log(chalk.red(`Project ${chalk.white(projectNames[i])} Not Present In database`));
    }
  }
}

if (inputProjectName === '') {
  co(function* run() {
    const r = yield db.project.getAll();
    if (r) {
      // console.log(JSON.stringify(r));
      const answer = yield inquirer.prompt([
        {
          name: 'projectNames',
          type: 'checkbox',
          message: 'Select Projects to Remove',
          choices: r.map(item => (item.name)),
        },
      ]);
      yield* removeProjects(answer.projectNames);
    } else {
      console.log(chalk.yellow('No Projects Defined'));
    }
  });
} else {
  co(removeProjects([inputProjectName]));
}

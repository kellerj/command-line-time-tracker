#!/usr/bin/env node

const MongoClient = require('mongodb').MongoClient;
const commander = require('commander');
const inquirer = require('inquirer');
const co = require('co');
// const assert = require('assert');
const config = require('./config');
const chalk = require('chalk');

commander
    .version('1.0.0')
    .arguments('[projectName...]', 'Remove time tracking projects from the database')
    .parse(process.argv);

const inputProjectNames = commander.args;

function* removeProjects(projectNames) {
  const db = yield MongoClient.connect(config.db.url);
  const collection = db.collection('projects');

  // console.log(JSON.stringify(projectNames));
  for (let i = 0; i < projectNames.length; i += 1) {
    // console.log(`Deleting ${projectNames[i]}`);
    const r2 = yield collection.findAndRemove({ name: projectNames[i] });
    // console.log(JSON.stringify(r2));
    if (r2 && r2.ok === 1 && r2.value !== null) {
      console.log(chalk.green(`Project ${chalk.white(projectNames[i])} Removed`));
    } else {
      // console.log(chalk.red(JSON.stringify(r2)));
      console.log(chalk.red(`Project ${chalk.white(projectNames[i])} Not Present In database`));
    }
  }
  db.close();
}

if (inputProjectNames.length === 0) {
  co(function* run() {
    const db = yield MongoClient.connect(config.db.url);
    const collection = db.collection('projects');
    const r = yield collection.find({}, { _id: 0 }).sort({ name: 1 }).toArray();
    db.close();
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
  co(removeProjects(inputProjectNames));
}


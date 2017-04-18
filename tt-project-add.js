#!/usr/bin/env node

const MongoClient = require('mongodb').MongoClient;
const commander = require('commander');
const inquirer = require('inquirer');
const co = require('co');
const assert = require('assert');
const config = require('./config');
const chalk = require('chalk');

let inputProjectName = '';

commander
    .version('1.0.0')
    .arguments('<projectName>', 'Add a time tracking project to the database')
    .action((pn) => {
      inputProjectName = pn;
    })
    .parse(process.argv);

function performProjectUpdate(projectName) {
  // console.log(`Request to add project "${projectName}"`)
  co(function* run() {
    const db = yield MongoClient.connect(config.db.url);
    // console.log('Connection opened to: ' + url);

    const collection = db.collection('projects');
    let r = yield collection.findOne({ name: { $regex: `^${projectName}$`, $options: 'i' } });
    // console.log(JSON.stringify(r));
    if (r) {
      console.log(chalk.bgRed(`Project ${chalk.yellow.bold(projectName)} already exists.`));
    } else {
      r = yield collection.insertOne({ name: projectName });
      assert.equal(1, r.insertedCount, chalk.bgRed('Unable to insert the project.'));
      console.log(chalk.green(`Project ${chalk.white.bold(projectName)} added`));
    }

    // Close the connection
    db.close();
  }).catch((err) => {
    console.log(chalk.bgRed(err.stack));
  });
}

if (inputProjectName) {
  performProjectUpdate(inputProjectName);
} else {
  inquirer.prompt([
    {
      name: 'projectName',
      type: 'String',
      message: 'Please enter the new project name:',
    },
  ]).then((answer) => {
    // console.log(JSON.stringify(answer,null,'  '));
    performProjectUpdate(answer.projectName);
  });
}

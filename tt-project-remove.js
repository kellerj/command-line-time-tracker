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
    .parse(process.argv);

co(function* run() {
  const db = yield MongoClient.connect(config.db.url);
  const collection = db.collection('projects');
  const r = yield collection.find({}, { _id: 0 }).sort({ name: 1 }).toArray();
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
    console.log(JSON.stringify(answer.projectNames));
    for (let i = 0; i < answer.projectNames.length; i += 1) {
      console.log(`Deleting ${answer.projectNames[i]}`);
      const r2 = yield collection.findAndRemove({ name: answer.projectNames[i] });
      console.log(JSON.stringify(r2));
    }
  } else {
    console.log(chalk.yellow('No Projects Defined'));
  }
  db.close();
});

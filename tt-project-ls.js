#!/usr/bin/env node

const MongoClient = require('mongodb').MongoClient;
const commander = require('commander');
const inquirer = require('inquirer');
const co = require('co');
const assert = require('assert');
const config = require('./config');
const chalk = require('chalk');
const Table = require('easy-table');

commander
    .version('1.0.0')
    .parse(process.argv);

co(function*() {
  const db = yield MongoClient.connect(config.db.url);
  // console.log('Connection opened to: ' + url);

  const collection = db.collection('projects');

  let r = yield collection.find({},{_id:0}).sort({name:1}).toArray();
  if ( r ) {
    // console.log(JSON.stringify(r));
    console.log(chalk.yellow(Table.print(r,
      { name: { name: chalk.white.bold('Project Name') } } )));
  } else {
    console.log(chalk.yellow('No Projects Defined'));
  }

  // Close the connection
  db.close();
}).catch(function(err) {
  console.log(chalk.bgRed(err.stack));
});

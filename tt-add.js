#!/usr/bin/env node

const commander = require('commander');
const inquirer = require('inquirer');
// const co = require('co');
// const db = require('./db');
// const chalk = require('chalk');

commander
    .version('1.0.0')
    .description('Record a time entry')
    .usage('[options] [entryDescription]')
    .option('-t, --time <min>', 'Minutes spent', parseInt)
    .option('-y, --type <timeType>')
    .arguments('<projectName>')
    .parse(process.argv);

const entryDescription = commander.args.join(' ');

// function performProjectUpdate(projectName) {
  // co(function* run() {
  //   // console.log(`Request to add project "${projectName}"`)
  //   const insertSuceeded = yield* db.timeentry.insert(projectName);
  //   if (insertSuceeded) {
  //     console.log(chalk.green(`Project ${chalk.white.bold(projectName)} added`));
  //   } else {
  //     console.log(chalk.bgRed(`Project ${chalk.yellow.bold(projectName)} already exists.`));
  //   }
  // }).catch((err) => {
  //   console.log(chalk.bgRed(err.stack));
  // });
// }

inquirer.prompt([
  {
    name: 'entryDescription',
    type: 'input',
    message: 'Entry Description:',
    default: entryDescription,
    when: () => (entryDescription === ''),
  },
  {
    name: 'minutes',
    type: 'input',
    message: 'Minutes:',
    default: 60,
    validate: (val) => {
      if (Number.isNaN(val)) {
        return 'Invalid Integer';
      }
      return true;
    },
  },
]).then((answer) => {
  console.log(JSON.stringify(answer, null, '  '));
  //performProjectUpdate(answer.projectName);
});

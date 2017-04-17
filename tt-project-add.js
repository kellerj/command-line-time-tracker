#!/usr/bin/env node

const commander = require('commander');
const inquirer = require('inquirer');

let projectName = '';

commander
    .version('1.0.0')
    .arguments('<projectName>', 'Add a time tracking project to the database')
    .action((pn) => {
      projectName = pn;
    })
    .parse(process.argv);

if ( projectName ) {
  performProjectUpdate(projectName);  
} else {
  inquirer.prompt([
    {
      name:'projectName',
      type:'String',
      message:'Please enter the new project name:',
    }
  ]).then((answer) => {
    // console.log(JSON.stringify(answer,null,'  '));
    projectName = answer.projectName;
    performProjectUpdate(projectName);  
  });
}

function performProjectUpdate(projectName) {
  console.log(`Request to add project "${projectName}"`)
}
